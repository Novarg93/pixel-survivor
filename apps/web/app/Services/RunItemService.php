<?php

namespace App\Services;

use App\Models\GameRun;
use App\Models\RunDeath;
use App\Models\RunItemUsage;
use App\Models\RunPaidAction;
use App\Models\ShopProduct;
use App\Models\Wallet;
use App\Payments\PaymentProviderRegistry;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RunItemService
{
    /** @return array<string, mixed> */
    public function settings(bool $normal): array
    {
        $premium = app(PremiumConfiguration::class)->current();

        return ['enabled' => $normal, 'version' => config('run_items.version'), 'revive_limit' => $premium['revive_limit'],
            'revive_health_basis_points' => $premium['revive_health_basis_points'], 'revive_protection_ms' => $premium['revive_protection_ms'],
            'premium' => [...$premium, 'enabled' => $normal && $premium['enabled']]];
    }

    public function owned(int $userId, string $id): GameRun
    {
        AccountLock::acquire($userId);

        return GameRun::where('user_id', $userId)->whereKey($id)->firstOrFail();
    }

    public function assertOpen(GameRun $run): void
    {
        abort_unless($run->status === 'active' && in_array($run->lifecycle_state, ['active', 'awaiting_revive'], true)
            && ($run->session_expires_at ?? $run->started_at->addSeconds(config('run_items.session_ttl_seconds')))->isFuture(), 409, 'This run is already closed or expired.');
    }

    private function assertElapsed(GameRun $run, float $elapsed): void
    {
        abort_unless($elapsed <= $run->started_at->diffInSeconds(now()) + 2, 422, 'Elapsed exceeds server wall time.');
    }

    /** @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function death(int $userId, string $runId, array $input): array
    {
        $data = Validator::make($input, ['death_id' => 'required|uuid', 'client_run_id' => 'required|uuid', 'elapsed' => 'required|numeric|between:0,86400'])->validate();

        return DB::transaction(function () use ($userId, $runId, $data): array {
            $run = $this->owned($userId, $runId);
            $id = strtolower($data['death_id']);
            $existing = RunDeath::find($id);
            if ($existing) {
                abort_unless($existing->user_id === $userId && $existing->game_run_id === $runId && $run->client_run_id === $data['client_run_id']
                    && abs((float) $existing->elapsed - (float) $data['elapsed']) < .001, 409, 'Death ID conflict.');

                return ['death_id' => $id, 'status' => $existing->status, 'expires_at' => $existing->expires_at->toISOString()];
            }
            $this->assertOpen($run);
            abort_unless($run->mode === 'normal' && $run->lifecycle_state === 'active' && $run->client_run_id === $data['client_run_id'], 409, 'Revive is unavailable in this run.');
            abort_unless($run->revive_count < ($run->start_snapshot['economy']['revive_limit'] ?? 0), 409, 'Revive limit reached.');
            $this->assertElapsed($run, (float) $data['elapsed']);
            $expires = now()->addSeconds(config('run_items.revive_wait_seconds'))->min($run->session_expires_at ?? now()->addSeconds(config('run_items.session_ttl_seconds')))->startOfSecond();
            RunDeath::create(['id' => $id, 'user_id' => $userId, 'game_run_id' => $runId, 'elapsed' => $data['elapsed'], 'status' => 'awaiting_revive', 'requested_at' => now(), 'expires_at' => $expires]);
            $run->lifecycle_state = 'awaiting_revive';
            $run->death_id = $id;
            $run->save();

            return ['death_id' => $id, 'status' => 'awaiting_revive', 'expires_at' => $expires->toISOString()];
        }, 5);
    }

    /** @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function consume(int $userId, string $runId, array $input): array
    {
        $data = Validator::make($input, ['operation_id' => 'required|uuid', 'client_run_id' => 'required|uuid', 'item_id' => ['required', Rule::in(array_keys(config('run_items.items')))],
            'elapsed' => 'required|numeric|between:0,86400', 'hp' => 'required|numeric|between:0,5000', 'max_hp' => 'required|numeric|between:1,5000', 'death_id' => 'nullable|uuid',
            'user_id' => 'prohibited', 'effect' => 'prohibited', 'quantity' => 'prohibited', 'price' => 'prohibited'])->validate();
        $data = ['operation_id' => strtolower($data['operation_id']), 'client_run_id' => strtolower($data['client_run_id']), 'item_id' => $data['item_id'],
            'elapsed' => round((float) $data['elapsed'], 3), 'hp' => (float) $data['hp'], 'max_hp' => (float) $data['max_hp'], 'death_id' => isset($data['death_id']) ? strtolower($data['death_id']) : null];
        $hash = hash('sha256', json_encode([$runId, $data], JSON_THROW_ON_ERROR | JSON_PRESERVE_ZERO_FRACTION));

        return DB::transaction(function () use ($userId, $runId, $data, $hash): array {
            $run = $this->owned($userId, $runId);
            $existing = RunItemUsage::where('user_id', $userId)->where('operation_id', $data['operation_id'])->first();
            if ($existing) {
                abort_unless(hash_equals($existing->request_hash, $hash), 409, 'Item usage idempotency conflict.');

                return $existing->receipt;
            }
            $this->assertOpen($run);
            abort_unless($run->mode === 'normal' && ($run->start_snapshot['economy']['enabled'] ?? false) && $run->client_run_id === $data['client_run_id'], 409, 'Server inventory is unavailable in this run.');
            abort_unless($run->item_sequence < config('run_items.max_usages'), 409, 'Run item usage limit reached.');
            $this->assertElapsed($run, $data['elapsed']);
            $effect = config('run_items.items.'.$data['item_id']);
            $parameters = $run->start_snapshot['economy']['premium']['consumables'][$data['item_id']] ?? null;
            if (is_array($parameters)) {
                abort_unless($parameters['enabled'], 409, 'This consumable is disabled for the run.');
                $effect['parameters'] = $parameters;
            }
            $death = null;
            if ($data['item_id'] === 'revive') {
                $death = $this->resurrectionDeathLocked($run, $data);
                $effect += ['health_basis_points' => $run->start_snapshot['economy']['revive_health_basis_points'], 'protection_ms' => $run->start_snapshot['economy']['revive_protection_ms']];
            } else {
                abort_unless($run->lifecycle_state === 'active' && $data['hp'] > 0 && $data['hp'] <= $data['max_hp'] && $data['death_id'] === null, 409, 'Item requires a living active run.');
                abort_if($data['item_id'] === 'healing_potion' && $data['hp'] >= $data['max_hp'], 409, 'Health is already full.');
            }
            $id = (string) Str::uuid();
            $sequence = $run->item_sequence + 1;
            $receipt = ['id' => $id, 'operation_id' => $data['operation_id'], 'server_run_id' => $runId, 'client_run_id' => $run->client_run_id,
                'item_id' => $data['item_id'], 'sequence' => $sequence, 'death_id' => $data['death_id'], 'effect' => $effect, 'accepted_at' => now()->toISOString()];
            $transaction = app(InventoryService::class)->consumeRunItemLocked($userId, $data['item_id'], $data['operation_id'], $id, $receipt);
            $receipt['remaining_quantity'] = $transaction->balance_after;
            $usage = RunItemUsage::create(['id' => $id, 'user_id' => $userId, 'game_run_id' => $runId, 'item_id' => $data['item_id'], 'inventory_transaction_id' => $transaction->id,
                'death_id' => $data['death_id'], 'operation_id' => $data['operation_id'], 'request_hash' => $hash, 'sequence' => $sequence, 'elapsed' => $data['elapsed'],
                'accepted_at' => now(), 'effect_snapshot' => $effect, 'receipt' => $receipt, 'metadata' => ['context_trust' => 'client_report_checked', 'reported_hp' => $data['hp'], 'reported_max_hp' => $data['max_hp']]]);
            $run->item_sequence = $sequence;
            if ($death) {
                $this->completeReviveLocked($run, $death);
            }
            $run->save();

            return $usage->refresh()->receipt;
        }, 5);
    }

    /** Caller holds AccountLock.
     * @param  array<string,mixed>  $context
     */
    public function resurrectionDeathLocked(GameRun $run, array $context): RunDeath
    {
        $death = RunDeath::whereKey($context['death_id'])->where('user_id', $run->user_id)->where('game_run_id', $run->id)->firstOrFail();
        abort_unless($run->lifecycle_state === 'awaiting_revive' && $run->death_id === $death->id && $death->status === 'awaiting_revive'
            && $death->expires_at->isFuture() && $context['hp'] === 0.0 && abs((float) $death->elapsed - $context['elapsed']) < .001
            && $run->revive_count < ($run->start_snapshot['economy']['revive_limit'] ?? 0), 409, 'Revive is no longer available.');

        return $death;
    }

    public function completeReviveLocked(GameRun $run, RunDeath $death): void
    {
        $run->revive_count++;
        $run->lifecycle_state = 'active';
        $run->death_id = null;
        $death->status = 'revived';
        $death->setAttribute('revived_at', now())->save();
    }

    public function acknowledge(int $userId, string $runId, string $usageId): void
    {
        DB::transaction(function () use ($userId, $runId, $usageId): void {
            $this->owned($userId, $runId);
            RunItemUsage::where('user_id', $userId)->where('game_run_id', $runId)->whereKey($usageId)->firstOrFail();
            RunItemUsage::whereKey($usageId)->where('status', 'accepted')->update(['status' => 'applied', 'applied_at' => now()]);
        }, 5);
    }

    /** @return array<string, mixed> */
    public function snapshot(int $userId, string $runId): array
    {
        return DB::transaction(function () use ($userId, $runId): array {
            $run = $this->owned($userId, $runId);

            return ['server_run_id' => $run->id, 'client_run_id' => $run->client_run_id, 'lifecycle_state' => $run->lifecycle_state, 'revive_count' => $run->revive_count,
                'inventory' => app(InventoryService::class)->snapshot($userId), 'wallet_balance' => Wallet::findOrFail($userId)->balance,
                'products' => ShopProduct::whereIn('key', array_keys(config('run_items.items')))->where('active', true)->orderBy('sort_order')->get(['key', 'name', 'price'])->toArray(),
                'usages' => RunItemUsage::where('game_run_id', $runId)->orderBy('sequence')->get(['id', 'item_id', 'sequence', 'status', 'accepted_at', 'receipt'])->toArray(),
                'premium' => $run->start_snapshot['economy']['premium'] ?? null,
                'paid_actions' => RunPaidAction::where('game_run_id', $runId)->orderBy('sequence')->get(['operation_id', 'action', 'status', 'receipt'])->toArray(),
                'top_up_available' => app(PaymentProviderRegistry::class)->available()];
        }, 5);
    }

    public function closeLocked(GameRun $run): void
    {
        $run->lifecycle_state = 'closed';
        RunDeath::where('game_run_id', $run->id)->where('status', 'awaiting_revive')->update(['status' => 'declined']);
    }

    public function expireSessions(?int $userId = null): int
    {
        $count = 0;
        GameRun::where('status', 'active')->whereIn('lifecycle_state', ['active', 'awaiting_revive'])->when($userId !== null, fn ($q) => $q->where('user_id', $userId))->orderBy('id')->each(function (GameRun $candidate) use (&$count): void {
            DB::transaction(function () use ($candidate, &$count): void {
                $run = $this->owned($candidate->user_id, $candidate->id);
                $death = $run->death_id ? RunDeath::find($run->death_id) : null;
                if ($run->status === 'active' && in_array($run->lifecycle_state, ['active', 'awaiting_revive'], true)
                    && (($run->session_expires_at ?? $run->started_at->addSeconds(config('run_items.session_ttl_seconds')))->isPast() || ($death && $death->expires_at->isPast()))) {
                    $run->lifecycle_state = 'expired';
                    $run->finished_at = now();
                    $run->save();
                    if ($death && $death->status === 'awaiting_revive') {
                        $death->status = 'expired';
                        $death->save();
                    }
                    $count++;
                }
            }, 5);
        });

        return $count;
    }
}
