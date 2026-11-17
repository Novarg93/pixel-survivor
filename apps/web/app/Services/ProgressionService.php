<?php

namespace App\Services;

use App\Models\AccountProgress;
use App\Models\CharacterProgress;
use App\Models\GameRun;
use App\Models\LevelReward;
use App\Models\RewardGrant;
use App\Runs\RunRecordValidator;
use App\Support\CanonicalJson;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProgressionService
{
    public function syncCatalog(): void
    {
        foreach (['account', ...array_map(fn (int|string $id) => 'character:'.$id, array_keys(config('progression.characters')))] as $track) {
            for ($level = 1; $level <= 10; $level++) {
                LevelReward::firstOrCreate(['track' => $track, 'level' => $level, 'config_version' => config('progression.version')], ['rewards' => $this->rewardItems($track, $level)]);
            }
        }
    }

    /** @return array<int, array<string, mixed>> */
    private function rewardItems(string $track, int $level): array
    {
        $items = $track === 'account' ? config("progression.account_rewards.{$level}", []) : config("progression.character_rewards.{$level}", []);
        if ($track !== 'account') {
            foreach (config("progression.bonuses.{$level}", []) as $stat => $value) {
                $items[] = ['type' => 'permanent_stat_modifier', 'stat' => $stat, 'basis_points' => $value];
            }
        }

        return $items;
    }

    /** Serialize writes before reading: row lock on MySQL/PG, reserved write lock on SQLite. */
    private function lockUser(int $userId): void
    {
        AccountLock::acquire($userId);
    }

    public function initialize(int $userId): void
    {
        DB::transaction(function () use ($userId): void {
            $this->lockUser($userId);
            if (LevelReward::where('config_version', config('progression.version'))->count() < (count(config('progression.characters')) + 1) * 10) {
                $this->syncCatalog();
            }
            if (Schema::hasTable('wallets')) {
                app(WalletService::class)->create($userId);
            }
            if (Schema::hasTable('public_profiles')) {
                app(PublicProfileService::class)->ensure($userId);
            }
            AccountProgress::firstOrCreate(['user_id' => $userId]);
            $this->grantLevel($userId, 'account', 1, null);
            foreach (array_keys(config('progression.characters')) as $id) {
                CharacterProgress::firstOrCreate(['user_id' => $userId, 'character_id' => $id]);
                $this->grantLevel($userId, 'character:'.$id, 1, null);
            }
        }, 5);
    }

    /** @return array<string, int> */
    public function bonuses(int $level): array
    {
        $values = array_fill_keys(config('progression.stats'), 0);
        foreach (config('progression.bonuses') as $at => $stats) {
            if ($at <= $level) {
                foreach ($stats as $stat => $amount) {
                    $values[$stat] += $amount;
                }
            }
        }

        return $values;
    }

    private function grantLevel(int $userId, string $track, int $level, ?string $runId): void
    {
        $reward = LevelReward::where(['track' => $track, 'level' => $level, 'config_version' => config('progression.version')])->firstOrFail();
        $grant = RewardGrant::firstOrCreate(['user_id' => $userId, 'track' => $track, 'level' => $level], [
            'level_reward_id' => $reward->id, 'game_run_id' => $runId, 'created_at' => now(),
            'fulfillment' => array_map(fn (array $item) => [...$item, 'status' => $item['type'] === 'permanent_stat_modifier' ? 'active_next_run' : 'pending_fulfillment'], $reward->rewards),
        ]);
        // Phase02 migration also calls this service before inventory tables exist.
        if (Schema::hasTable('inventory_transactions') && Schema::hasColumn('reward_grants', 'fulfillment_status')) {
            app(InventoryService::class)->fulfillLocked($grant);
            if (Schema::hasTable('credit_transactions') && array_filter($grant->fulfillment, fn ($item) => ($item['type'] ?? '') === 'credits' && ($item['status'] ?? '') === 'pending_fulfillment')) {
                app(WalletService::class)->fulfillLocked($grant);
            }
        }
    }

    /** @return array{level: int, xp: int, xp_to_next: int, bonuses?: array<string, int>} */
    private function progressDto(AccountProgress|CharacterProgress $progress): array
    {
        return ['level' => $progress->level, 'xp' => $progress->xp, 'xp_to_next' => $progress->level === 10 ? 0 : 100 - $progress->xp,
            ...($progress instanceof CharacterProgress ? ['bonuses' => $this->bonuses($progress->level)] : [])];
    }

    /** @return array<string, mixed> */
    public function snapshot(int $userId): array
    {
        $this->initialize($userId);

        // The same user lock keeps all snapshot queries consistent on every supported driver.
        return DB::transaction(function () use ($userId): array {
            $this->lockUser($userId);
            $characters = CharacterProgress::where('user_id', $userId)->get()->mapWithKeys(fn (CharacterProgress $p) => [$p->character_id => $this->progressDto($p)])->all();
            $catalog = [];
            foreach (['account', ...array_map(fn (int|string $id) => 'character:'.$id, array_keys(config('progression.characters')))] as $track) {
                for ($level = 1; $level <= 10; $level++) {
                    $items = $track === 'account' ? config("progression.account_rewards.{$level}", []) : config("progression.character_rewards.{$level}", []);
                    if ($track !== 'account') {
                        foreach (config("progression.bonuses.{$level}", []) as $stat => $value) {
                            $items[] = ['type' => 'permanent_stat_modifier', 'stat' => $stat, 'basis_points' => $value];
                        }
                    }
                    $catalog[] = ['track' => $track, 'level' => $level, 'rewards' => $items];
                }
            }
            $stats = ['wins' => 0, 'defeats' => 0, 'seconds' => 0.0, 'best_score' => 0];
            // Stream aggregates instead of loading an unbounded history into memory.
            foreach (GameRun::where('user_id', $userId)->where('status', 'accepted')->where('mode', 'normal')->cursor() as $run) {
                $record = $run->record ?? [];
                $stats[$record['outcome'] === 'victory' ? 'wins' : 'defeats']++;
                $stats['seconds'] += (float) $record['elapsed'];
                $stats['best_score'] = max($stats['best_score'], (int) $record['score']);
            }

            return ['config_version' => config('progression.version'), 'account' => $this->progressDto(AccountProgress::where('user_id', $userId)->firstOrFail()),
                'characters' => $characters, 'catalog' => $catalog, 'stats' => $stats,
                'grants' => RewardGrant::where('user_id', $userId)->orderByDesc('id')->limit(30)->get(['track', 'level', 'fulfillment', 'fulfillment_status', 'created_at'])->toArray(),
                'runs' => GameRun::where('user_id', $userId)->orderByDesc('started_at')->limit(15)->get(['id', 'character_id', 'mode', 'status', 'record', 'started_at', 'finished_at', 'lifecycle_state', 'revive_count', 'item_sequence', 'public_id', 'ranking_eligible'])->toArray()];
        });
    }

    /** @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function start(int $userId, array $input): array
    {
        $data = Validator::make($input, [
            'operation_id' => 'required|uuid', 'client_run_id' => 'required|uuid',
            'character_id' => ['required', Rule::in(array_keys(config('progression.characters')))],
            'biome_id' => ['required', Rule::in(config('progression.maps'))],
            'mode' => ['required', Rule::in(['normal', 'practice'])],
        ])->validate();
        $hash = $this->hash($data);
        $this->initialize($userId);

        return DB::transaction(function () use ($userId, $data, $hash): array {
            $this->lockUser($userId);
            $existing = GameRun::where('user_id', $userId)->where('operation_id', $data['operation_id'])->first();
            if ($existing) {
                abort_unless($existing->start_hash === $hash, 409, 'Idempotency key reused with different input.');

                return $existing->start_snapshot;
            }
            abort_if(GameRun::where('user_id', $userId)->where('client_run_id', $data['client_run_id'])->exists(), 409, 'Client run already registered.');
            $hero = CharacterProgress::where('user_id', $userId)->where('character_id', $data['character_id'])->firstOrFail();
            $id = (string) Str::uuid();
            $startedAt = now();
            $snapshot = ['server_run_id' => $id, 'client_run_id' => $data['client_run_id'], 'seed' => random_int(1, 2147483647),
                'bonuses' => $this->bonuses($data['mode'] === 'practice' ? 1 : $hero->level), 'character' => $this->progressDto($hero),
                'account' => $this->progressDto(AccountProgress::where('user_id', $userId)->firstOrFail()), 'config_version' => config('progression.version'),
                'character_xp_boost' => app(InventoryService::class)->runBoostSnapshot($userId, $data['mode'] === 'normal', $startedAt),
                'economy' => app(RunItemService::class)->settings($data['mode'] === 'normal')];
            $run = GameRun::create(['id' => $id, 'user_id' => $userId, ...$data, 'start_hash' => $hash, 'started_at' => $startedAt,
                'config_version' => config('progression.version'), 'start_snapshot' => $snapshot, 'session_expires_at' => $startedAt->addSeconds(config('run_items.session_ttl_seconds'))]);

            return $run->refresh()->start_snapshot;
        }, 5);
    }

    /** @param array<string, mixed> $record
     * @return array<string, mixed>
     */
    public function finish(int $userId, string $runId, array $record): array
    {
        $data = app(RunRecordValidator::class)->validate($record);
        $hash = $this->hash($data);

        return DB::transaction(function () use ($userId, $runId, $data, $hash): array {
            $this->lockUser($userId);
            $run = GameRun::where('user_id', $userId)->whereKey($runId)->firstOrFail();
            if ($run->status !== 'active') {
                abort_unless($run->finish_hash === $hash && $run->receipt !== null, 409, 'Run already finalized with another result.');

                return $run->receipt;
            }
            app(RunItemService::class)->assertOpen($run);
            abort_if($run->lifecycle_state === 'awaiting_revive' && $data['outcome'] === 'victory', 409, 'Cannot confirm victory while awaiting revive.');
            abort_unless($data['id'] === $run->client_run_id && $data['details']['character'] === $run->character_id && $data['details']['biome'] === $run->biome_id, 422, 'Run identity mismatch.');
            $run->record = $data;
            $run->finished_at = now();
            $run->finish_hash = $hash;
            $assessment = app(RunAssessmentService::class)->assess($run, $data, $run->finished_at);
            $run->status = $assessment->pending() ? 'pending_review' : 'accepted';
            app(LeaderboardService::class)->setFacts($run, $assessment);
            $run->save();
            $award = $this->awardAcceptedLocked($run);
            $receipt = ['run_id' => $run->id, 'status' => $run->status, 'review_reason' => $assessment->pending() ? 'time_stats_or_config_inconsistency' : null,
                'trust' => 'client_report_checked', ...$award, 'items_used' => $assessment->items,
                'premium_actions' => app(RunPaidActionService::class)->evidence($run, (float) $data['elapsed'])['counts']];
            $run->record = $data;
            $run->finish_hash = $hash;
            $run->receipt = $receipt;
            app(RunItemService::class)->closeLocked($run);
            $run->save();
            app(LeaderboardService::class)->syncUserLocked($userId);

            return $run->refresh()->receipt ?? throw new \LogicException('Run receipt was not persisted.');
        }, 5);
    }

    /** Caller holds AccountLock, inside the original finish/review transaction.
     * @return array<string,mixed>
     */
    public function awardAcceptedLocked(GameRun $run): array
    {
        $userId = (int) $run->user_id;
        $zero = fn () => ['account_xp' => 0, 'character_xp' => 0,
            'account' => $this->progressDto(AccountProgress::where('user_id', $userId)->firstOrFail()),
            'character' => $this->progressDto(CharacterProgress::where('user_id', $userId)->where('character_id', $run->character_id)->firstOrFail())];
        if ($run->status !== 'accepted') {
            return $zero();
        }
        if ($run->rewards_awarded_at) {
            return $run->reward_receipt ?? $zero();
        }
        $accountXp = $heroXp = 0;
        if ($run->mode === 'normal') {
            $victory = ($run->record['outcome'] ?? '') === 'victory';
            $elapsed = (float) ($run->record['elapsed'] ?? 0);
            $accountXp = $victory ? 50 : 0;
            $heroXp = $victory ? 50 : ($elapsed < 180 ? 0 : ($elapsed < 600 ? 20 : 30));
            $multiplier = (int) ($run->start_snapshot['character_xp_boost']['multiplier_basis_points'] ?? 10000);
            $heroXp = intdiv($heroXp * $multiplier, 10000);
            $accountXp = $this->advance(AccountProgress::where('user_id', $userId)->firstOrFail(), $accountXp, 'account', $run->id);
            $heroXp = $this->advance(CharacterProgress::where('user_id', $userId)->where('character_id', $run->character_id)->firstOrFail(), $heroXp, 'character:'.$run->character_id, $run->id);
        }
        $award = [...$zero(), 'account_xp' => $accountXp, 'character_xp' => $heroXp];
        $run->reward_receipt = $award;
        $run->rewards_awarded_at = now();
        $run->save();

        return $run->refresh()->reward_receipt ?? throw new \LogicException('Reward receipt missing.');
    }

    private function advance(AccountProgress|CharacterProgress $progress, int $xp, string $track, string $runId): int
    {
        $result = ProgressionMath::add($progress->level, $progress->xp, $xp);
        // The confirmed level is visible to fulfillment, but rolls back with the run on error.
        $progress->level = $result['level'];
        $progress->xp = $result['xp'];
        $progress->save();
        foreach ($result['levels'] as $level) {
            $this->grantLevel($progress->user_id, $track, $level, $runId);
        }

        return $result['gained'];
    }

    /** @param array<string, mixed> $value */
    private function hash(array $value): string
    {
        return CanonicalJson::hash($value);
    }
}
