<?php

namespace App\Services;

use App\Models\CreditTransaction;
use App\Models\GameRun;
use App\Models\RunDeath;
use App\Models\RunPaidAction;
use App\Models\RunUpgradeOffer;
use App\Support\CanonicalJson;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class RunPaidActionService
{
    /** @param array<string,mixed> $input
     * @return array<string,mixed>
     */
    public function offer(int $userId, string $runId, array $input): array
    {
        return DB::transaction(function () use ($userId, $runId, $input): array {
            $items = app(RunItemService::class);
            $run = $items->owned($userId, $runId);
            $this->assertEligibleRun($run);
            abort_unless(($input['client_run_id'] ?? '') === $run->client_run_id && $run->lifecycle_state === 'active', 409);
            $context = app(UpgradePool::class)->context($run, $input);
            $this->assertElapsed($run, $context['elapsed']);
            $hash = CanonicalJson::hash($context);
            $offer = RunUpgradeOffer::where('game_run_id', $runId)->where('level', $context['level'])->first();
            if ($offer) {
                abort_unless(hash_equals($offer->context_hash, $hash), 409, 'Build changed for an existing upgrade offer.');
            } else {
                $pool = app(UpgradePool::class)->eligible($run, $context);
                $offer = RunUpgradeOffer::create(['id' => (string) Str::uuid(), 'user_id' => $userId, 'game_run_id' => $runId,
                    'level' => $context['level'], 'context_hash' => $hash, 'context' => $context, 'generation' => 0, 'choices' => app(UpgradePool::class)->choose($pool)]);
            }

            return $this->offerDto($run, $offer);
        }, 5);
    }

    private function assertEligibleRun(GameRun $run): void
    {
        app(RunItemService::class)->assertOpen($run);
        abort_unless($run->mode === 'normal' && ($run->start_snapshot['economy']['premium']['enabled'] ?? false), 409, 'Premium actions are unavailable in this run.');
    }

    private function assertElapsed(GameRun $run, float $elapsed): void
    {
        abort_unless($elapsed <= $run->started_at->diffInSeconds(now()) + 2, 422, 'Elapsed exceeds server wall time.');
    }

    /** @return array<string,mixed> */
    private function offerDto(GameRun $run, RunUpgradeOffer $offer): array
    {
        $pool = app(UpgradePool::class)->eligible($run, $offer->context);

        return ['id' => $offer->id, 'level' => $offer->level, 'generation' => $offer->generation, 'choices' => $offer->choices,
            'can_reroll' => ($run->start_snapshot['economy']['premium']['reroll_enabled'] ?? false) && count(array_diff($pool, $offer->choices)) > 0];
    }

    /** @param array<string,mixed> $input
     * @return array<string,mixed>
     */
    public function execute(int $userId, string $runId, array $input): array
    {
        $v = Validator::make($input, ['operation_id' => 'required|uuid', 'client_run_id' => 'required|uuid', 'action' => 'required|in:skill_reroll,resurrection',
            'confirmed' => 'required|accepted', 'elapsed' => 'required|numeric|between:0,86400',
            'offer_id' => 'required_if:action,skill_reroll|prohibited_unless:action,skill_reroll|uuid',
            'generation' => 'required_if:action,skill_reroll|prohibited_unless:action,skill_reroll|integer:strict|between:0,128',
            'death_id' => 'required_if:action,resurrection|prohibited_unless:action,resurrection|uuid',
            'price' => 'prohibited', 'amount' => 'prohibited', 'user_id' => 'prohibited', 'choices' => 'prohibited', 'effect' => 'prohibited'])->validate();
        $v['operation_id'] = strtolower($v['operation_id']);
        $v['client_run_id'] = strtolower($v['client_run_id']);
        $v['elapsed'] = round((float) $v['elapsed'], 3);
        foreach (['offer_id', 'death_id'] as $key) {
            if (isset($v[$key])) {
                $v[$key] = strtolower($v[$key]);
            }
        }
        $hash = CanonicalJson::hash([$runId, $v]);

        return DB::transaction(function () use ($userId, $runId, $v, $hash): array {
            $items = app(RunItemService::class);
            $run = $items->owned($userId, $runId);
            $existing = RunPaidAction::where('user_id', $userId)->where('operation_id', $v['operation_id'])->first();
            if ($existing) {
                abort_unless(hash_equals($existing->request_hash, $hash), 409, 'Paid action idempotency conflict.');

                return $existing->receipt;
            }
            $this->assertEligibleRun($run);
            abort_unless($v['client_run_id'] === $run->client_run_id, 409);
            $this->assertElapsed($run, $v['elapsed']);
            $settings = $run->start_snapshot['economy']['premium'];
            $sequence = (int) $run->getAttribute('premium_sequence') + 1;
            abort_if($sequence > config('premium.max_actions'), 409, 'Paid action limit reached.');
            $death = $offer = null;
            if ($v['action'] === 'skill_reroll') {
                abort_unless($settings['reroll_enabled'] && $run->lifecycle_state === 'active', 409);
                $offer = RunUpgradeOffer::where('game_run_id', $runId)->where('user_id', $userId)->whereKey($v['offer_id'])->firstOrFail();
                abort_unless($offer->generation === $v['generation'] && abs($offer->context['elapsed'] - $v['elapsed']) < .001, 409, 'Upgrade offer changed.');
                $pool = app(UpgradePool::class)->eligible($run, $offer->context);
                abort_unless(array_diff($pool, $offer->choices) !== [], 409, 'No alternative upgrades are available.');
                $price = $settings['reroll_price'];
                $effect = ['kind' => 'reroll', 'offer_id' => $offer->id, 'level' => $offer->level, 'generation' => $offer->generation + 1, 'choices' => app(UpgradePool::class)->choose($pool, $offer->choices)];
            } else {
                abort_unless($settings['resurrection_enabled'], 409);
                $death = $items->resurrectionDeathLocked($run, ['death_id' => $v['death_id'], 'hp' => 0.0, 'elapsed' => $v['elapsed']]);
                $price = $settings['resurrection_price'];
                $effect = ['kind' => 'revive', 'health_basis_points' => $run->start_snapshot['economy']['revive_health_basis_points'],
                    'protection_ms' => $run->start_snapshot['economy']['revive_protection_ms'], 'version' => 'revive-v1'];
            }
            $id = (string) Str::uuid();
            $ledger = app(WalletService::class)->debit($userId, $price, 'run_action:'.$id, 'run_action:'.$v['operation_id'],
                ['premium_action' => $v['action'], 'server_run_id' => $runId, 'action_id' => $id, 'price_tokens' => $price]);
            $receipt = ['id' => $id, 'operation_id' => $v['operation_id'], 'action' => $v['action'], 'server_run_id' => $runId, 'client_run_id' => $run->client_run_id,
                'sequence' => $sequence, 'price_tokens' => $price, 'balance_after' => $ledger->balance_after, 'death_id' => $death?->id,
                'accepted_at' => now()->toISOString(), 'effect' => $effect];
            $record = RunPaidAction::create(['id' => $id, 'user_id' => $userId, 'game_run_id' => $runId, 'operation_id' => $v['operation_id'], 'request_hash' => $hash,
                'action' => $v['action'], 'sequence' => $sequence, 'elapsed' => $v['elapsed'], 'price_tokens' => $price, 'credit_transaction_id' => $ledger->id,
                'death_id' => $death?->id, 'status' => 'accepted', 'effect_snapshot' => $effect, 'receipt' => $receipt, 'accepted_at' => now()]);
            if ($offer) {
                $offer->forceFill(['generation' => $effect['generation'], 'choices' => $effect['choices']])->save();
            }
            if ($death) {
                $items->completeReviveLocked($run, $death);
            }
            $run->setAttribute('premium_sequence', $sequence)->save();

            return $record->refresh()->receipt;
        }, 5);
    }

    /** @return array<string,mixed> */
    public function recover(int $userId, string $runId, string $operation): array
    {
        GameRun::where('user_id', $userId)->whereKey($runId)->firstOrFail();
        $record = RunPaidAction::where('user_id', $userId)->where('game_run_id', $runId)->where('operation_id', strtolower($operation))->firstOrFail();

        return ['receipt' => $record->receipt, 'status' => $record->status];
    }

    public function acknowledge(int $userId, string $runId, string $operation): void
    {
        DB::transaction(function () use ($userId, $runId, $operation): void {
            app(RunItemService::class)->owned($userId, $runId);
            $record = RunPaidAction::where('user_id', $userId)->where('game_run_id', $runId)->where('operation_id', strtolower($operation))->firstOrFail();
            if ($record->status === 'accepted') {
                $record->forceFill(['status' => 'applied', 'applied_at' => now()])->save();
            }
        }, 5);
    }

    /** @return array{valid:bool,resurrections:int,counts:array<string,int>} */
    public function evidence(GameRun $run, float $elapsed): array
    {
        $rows = RunPaidAction::where('game_run_id', $run->id)->orderBy('sequence')->get();
        $ledger = CreditTransaction::whereIn('id', $rows->pluck('credit_transaction_id'))->get()->keyBy('id');
        $deaths = RunDeath::whereIn('id', $rows->pluck('death_id')->filter())->get()->keyBy('id');
        $offers = RunUpgradeOffer::where('game_run_id', $run->id)->get()->keyBy('id');
        $settings = $run->start_snapshot['economy']['premium'] ?? [];
        $valid = $rows->count() === (int) $run->getAttribute('premium_sequence');
        $counts = ['skill_reroll' => 0, 'resurrection' => 0];
        foreach ($rows as $index => $row) {
            $tx = $ledger->get($row->getAttribute('credit_transaction_id'));
            $receipt = $row->receipt;
            $effect = $row->getAttribute('effect_snapshot');
            $valid = $valid && $row->user_id === (int) $run->user_id && (int) $row->getAttribute('sequence') === $index + 1
                && (float) $row->getAttribute('elapsed') <= $elapsed + .01 && $tx && $tx->user_id === (int) $run->user_id
                && $tx->amount === -(int) $row->getAttribute('price_tokens') && $tx->source_id === 'run_action:'.$row->id
                && ($tx->metadata['premium_action'] ?? '') === $row->action
                && $tx->type === 'shop_purchase' && $tx->idempotency_reference === 'run_action:'.$row->operation_id
                && ($tx->metadata['server_run_id'] ?? '') === $run->id && ($tx->metadata['action_id'] ?? '') === $row->id
                && ($receipt['id'] ?? '') === $row->id && ($receipt['operation_id'] ?? '') === $row->operation_id
                && ($receipt['action'] ?? '') === $row->action && ($receipt['sequence'] ?? 0) === $index + 1
                && ($receipt['price_tokens'] ?? 0) === (int) $row->getAttribute('price_tokens')
                && ($receipt['balance_after'] ?? -1) === $tx->balance_after
                && ($receipt['server_run_id'] ?? '') === $run->id && ($receipt['client_run_id'] ?? '') === $run->client_run_id
                && CanonicalJson::hash($receipt['effect'] ?? []) === CanonicalJson::hash($effect)
                && ($settings['enabled'] ?? false);
            if ($row->action === 'resurrection') {
                $death = $deaths->get($row->getAttribute('death_id'));
                $valid = $valid && ($settings['resurrection_enabled'] ?? false) && $death && $death->status === 'revived'
                    && $death->game_run_id === $run->id && $death->user_id === (int) $run->user_id
                    && abs((float) $death->elapsed - (float) $row->getAttribute('elapsed')) < .001
                    && ($effect['kind'] ?? '') === 'revive' && ($effect['health_basis_points'] ?? 0) === ($settings['revive_health_basis_points'] ?? -1)
                    && ($effect['protection_ms'] ?? -1) === ($settings['revive_protection_ms'] ?? -2)
                    && (int) $row->getAttribute('price_tokens') === ($settings['resurrection_price'] ?? -1);
            } else {
                $offer = $offers->get($effect['offer_id'] ?? '');
                $valid = $valid && ($settings['reroll_enabled'] ?? false) && $offer && $offer->user_id === (int) $run->user_id
                    && ($effect['kind'] ?? '') === 'reroll' && ($effect['level'] ?? 0) === $offer->level
                    && ($effect['generation'] ?? 0) > 0 && ($effect['generation'] ?? 129) <= $offer->generation
                    && count(array_unique($effect['choices'] ?? [])) === count($effect['choices'] ?? [])
                    && count($effect['choices'] ?? []) === 3
                    && array_diff($effect['choices'] ?? [], app(UpgradePool::class)->eligible($run, $offer->context)) === []
                    && (int) $row->getAttribute('price_tokens') === ($settings['reroll_price'] ?? -1);
            }
            $counts[$row->action]++;
        }

        $valid = $valid && $counts['resurrection'] <= ($settings['revive_limit'] ?? 0);

        return ['valid' => $valid, 'resurrections' => $counts['resurrection'], 'counts' => $counts];
    }
}
