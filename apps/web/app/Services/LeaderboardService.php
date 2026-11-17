<?php

namespace App\Services;

use App\Models\GameRun;
use App\Models\PlatformAuditEntry;
use App\Models\PublicProfile;
use App\Models\RunItemUsage;
use App\Models\RunPaidAction;
use App\Runs\RunAssessment;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LeaderboardService
{
    /** Only this derived read model is rebuilt; no XP or journals are changed. */
    public function syncUserLocked(int $userId): void
    {
        $run = GameRun::where('user_id', $userId)->where('status', 'accepted')->where('mode', 'normal')->where('ranking_eligible', true)
            ->whereNotNull('public_id')->whereNotNull('ranking_score')->whereNotNull('ranking_elapsed_us')->whereNotNull('finished_at')
            ->orderByDesc('ranking_score')->orderByDesc('ranking_elapsed_us')->orderByDesc('finished_at')->orderBy('id')->first();
        if (! $run) {
            DB::table('leaderboard_entries')->where('user_id', $userId)->delete();

            return;
        }
        app(PublicProfileService::class)->ensure($userId);
        DB::table('leaderboard_entries')->updateOrInsert(['user_id' => $userId], ['game_run_id' => $run->id,
            'score' => $run->ranking_score, 'elapsed_us' => $run->ranking_elapsed_us, 'completed_at' => $run->finished_at]);
    }

    public function setFacts(GameRun $run, RunAssessment $assessment, bool $manual = false): void
    {
        $originalHash = $run->validation_evidence['record_hash'] ?? $assessment->recordHash;
        $run->public_id ??= (string) Str::uuid();
        $run->ranking_score = (int) ($run->record['score'] ?? 0);
        $run->ranking_elapsed_us = (int) round((float) ($run->record['elapsed'] ?? 0) * 1000000);
        $run->validation_evidence = [...$assessment->evidence(), 'record_hash' => $originalHash, 'assessed_record_hash' => $assessment->recordHash, 'manual_acceptance' => $manual];
        $run->ranking_eligible = $run->status === 'accepted' && $run->mode === 'normal' && $assessment->hardFlags === [] && ($assessment->reviewFlags === [] || $manual);
    }

    public function refreshFactsLocked(GameRun $run): void
    {
        if (! $run->record || ! $run->finished_at) {
            return;
        }
        $assessment = app(RunAssessmentService::class)->assess($run, $run->record, $run->finished_at);
        $manual = (bool) ($run->validation_evidence['manual_acceptance'] ?? false)
            && PlatformAuditEntry::where('subject_type', 'game_run')->where('subject_id', $run->public_id)->where('action', 'review_approve')
                ->where('result->review_version', $run->review_version)->where('result->record_hash', $assessment->recordHash)->exists();
        $this->setFacts($run, $assessment, $manual);
        $run->save();
    }

    public function rankedQuery(): Builder
    {
        $query = DB::table('leaderboard_entries as e');
        if (DB::getDriverName() === 'mysql') {
            $query->straightJoin('game_runs as r', 'r.id', '=', 'e.game_run_id')->straightJoin('public_profiles as p', 'p.user_id', '=', 'e.user_id');
        } else {
            $query->join('game_runs as r', 'r.id', '=', 'e.game_run_id')->join('public_profiles as p', 'p.user_id', '=', 'e.user_id');
        }

        return $query
            ->where('r.status', 'accepted')->where('r.mode', 'normal')->where('r.ranking_eligible', true)->whereNotNull('r.public_id')
            ->whereColumn('r.user_id', 'e.user_id')->whereColumn('r.ranking_score', 'e.score')->whereColumn('r.ranking_elapsed_us', 'e.elapsed_us')->whereColumn('r.finished_at', 'e.completed_at');
    }

    private function ordered(Builder $query): Builder
    {
        if (DB::getDriverName() === 'mysql') {
            // Drive bounded ranking reads from the ordered projection, not a sort of all source runs.
            $query->forceIndex('leaderboard_rank_idx');
        }

        return $query->orderByDesc('e.score')->orderByDesc('e.elapsed_us')->orderByDesc('e.completed_at')->orderBy('e.game_run_id');
    }

    /** @param array<string,mixed> $row
     * @return array<string,mixed>
     */
    private function row(array $row, int $rank): array
    {
        $record = json_decode((string) $row['record'], true, flags: JSON_THROW_ON_ERROR);

        return ['rank' => $rank, 'profile_id' => $row['profile_id'], 'nickname' => $row['nickname'], 'run_id' => $row['public_id'],
            'score' => (int) $row['score'], 'character' => $row['character_id'], 'kills' => (int) $record['kills'],
            'elapsed' => (int) $row['elapsed_us'] / 1000000, 'outcome' => $record['outcome'], 'completed_at' => Carbon::parse($row['completed_at'], 'UTC')->toISOString()];
    }

    /** @return array<string,mixed> */
    public function page(int $page, ?int $userId): array
    {
        return DB::transaction(function () use ($page, $userId): array {
            $base = $this->rankedQuery();
            $columns = ['p.id as profile_id', 'p.nickname', 'r.public_id', 'r.character_id', 'r.record', 'e.score', 'e.elapsed_us', 'e.completed_at', 'e.game_run_id'];
            $count = (clone $base)->count();
            $top = $this->ordered(clone $base)->limit(10)->get($columns)->map(fn (object $r, int $i) => $this->row((array) $r, $i + 1))->all();
            $offset = 10 + ($page - 1) * 20;
            $others = $this->ordered(clone $base)->offset($offset)->limit(20)->get($columns)->map(fn (object $r, int $i) => $this->row((array) $r, $offset + $i + 1))->all();
            $own = null;
            if ($userId && $entry = (clone $base)->where('e.user_id', $userId)->first($columns)) {
                $e = (array) $entry;
                $ahead = (clone $base)->where(function (Builder $q) use ($e): void {
                    $q->where('e.score', '>', $e['score'])
                        ->orWhere(fn (Builder $s) => $s->where('e.score', $e['score'])->where('e.elapsed_us', '>', $e['elapsed_us']))
                        ->orWhere(fn (Builder $s) => $s->where('e.score', $e['score'])->where('e.elapsed_us', $e['elapsed_us'])->where('e.completed_at', '>', $e['completed_at']))
                        ->orWhere(fn (Builder $s) => $s->where('e.score', $e['score'])->where('e.elapsed_us', $e['elapsed_us'])->where('e.completed_at', $e['completed_at'])->where('e.game_run_id', '<', $e['game_run_id']));
                })->count();
                $own = $this->row($e, $ahead + 1);
            }
            $profile = $userId ? PublicProfile::where('user_id', $userId)->first() : null;

            return ['top' => $top, 'others' => ['data' => $others, 'current_page' => $page, 'last_page' => max(1, (int) ceil(max(0, $count - 10) / 20)), 'total' => max(0, $count - 10)],
                'total_players' => $count, 'own' => $own, 'profile' => $profile ? ['id' => $profile->id, 'nickname' => $profile->nickname] : null];
        });
    }

    /** @return array<string,mixed> */
    public function publicRun(string $publicId): array
    {
        $run = GameRun::where('public_id', $publicId)->where('status', 'accepted')->where('mode', 'normal')->where('ranking_eligible', true)->firstOrFail();
        $profile = PublicProfile::where('user_id', $run->user_id)->firstOrFail();

        return $this->detail($run) + ['nickname' => $profile->nickname, 'profile_id' => $profile->id];
    }

    /** Bounded public facts, never the raw start snapshot, user IDs or receipts.
     * @return array<string,mixed>
     */
    public function detail(GameRun $run): array
    {
        $items = RunItemUsage::where('game_run_id', $run->id)->selectRaw('item_id, COUNT(*) as quantity, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as acknowledged', ['applied'])
            ->groupBy('item_id')->get()->map(fn ($u) => ['item_id' => $u->item_id, 'quantity' => (int) $u->getAttribute('quantity'), 'acknowledged' => (int) $u->getAttribute('acknowledged')])->all();

        return ['id' => $run->public_id, 'character' => $run->character_id, 'mode' => $run->mode, 'status' => $run->status,
            'score' => (int) ($run->record['score'] ?? 0), 'kills' => (int) ($run->record['kills'] ?? 0), 'elapsed' => (float) ($run->record['elapsed'] ?? 0),
            'outcome' => $run->record['outcome'] ?? null, 'completed_at' => $run->finished_at?->toISOString(), 'items' => $items, 'revives' => $run->revive_count,
            'abilities' => $run->record['abilities'] ?? [], 'by_kind' => $run->record['byKind'] ?? [],
            'start_bonuses' => $run->start_snapshot['bonuses'] ?? [], 'character_xp_multiplier' => (int) ($run->start_snapshot['character_xp_boost']['multiplier_basis_points'] ?? 10000) / 10000,
            'premium_actions' => RunPaidAction::where('game_run_id', $run->id)->selectRaw('action, COUNT(*) AS quantity')->groupBy('action')->get()->mapWithKeys(fn ($a) => [$a->action => (int) $a->getAttribute('quantity')])->all(),
            'manual_review' => (bool) ($run->validation_evidence['manual_acceptance'] ?? false), 'trust' => 'client_report_checked'];
    }
}
