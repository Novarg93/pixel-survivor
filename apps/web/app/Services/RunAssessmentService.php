<?php

namespace App\Services;

use App\Models\GameRun;
use App\Models\InventoryTransaction;
use App\Models\RunDeath;
use App\Models\RunItemUsage;
use App\Runs\RunAssessment;
use App\Runs\RunRecordValidator;
use App\Support\CanonicalJson;
use Carbon\CarbonInterface;
use Illuminate\Validation\ValidationException;

class RunAssessmentService
{
    /** Stored, bounded telemetry only; never evidence of an honest browser simulation.
     * @param  array<string,mixed>  $r
     */
    public function assess(GameRun $run, array $r, CarbonInterface $submittedAt): RunAssessment
    {
        $hard = $soft = $items = [];
        $points = config('run_review.enemy_points');
        $regular = config('run_review.regular_kinds');
        $hash = CanonicalJson::recordHash($r);
        try {
            app(RunRecordValidator::class)->validate($r);
        } catch (ValidationException) {
            return new RunAssessment(['invalid_stored_record'], [], [], 0, 0, 0, 'unavailable', $hash);
        }

        if (! isset($r['byKind'], $r['details'], $r['finalEncounter'], $r['score'], $r['kills'], $r['elapsed'], $r['outcome'], $r['abilities'])
            || ! is_array($r['byKind']) || ! is_array($r['details']) || ! is_array($r['finalEncounter'])
            || array_diff(array_keys($points), array_keys($r['byKind'])) !== []
            || ! isset($r['details']['character'], $r['details']['biome'], $r['details']['regularKills'], $r['details']['eliteKills'], $r['details']['bossKills'], $r['details']['damage'])) {
            return new RunAssessment(['incomplete_stored_record'], [], [], 0, 0, 0, 'unavailable', $hash);
        }
        $elapsed = (float) $r['elapsed'];
        $wall = $run->started_at->diffInMilliseconds($submittedAt, false) / 1000;
        if (($r['id'] ?? null) !== $run->client_run_id || $r['details']['character'] !== $run->character_id || $r['details']['biome'] !== $run->biome_id) {
            $hard[] = 'run_identity_mismatch';
        }
        if (isset($run->validation_evidence['record_hash']) && ! hash_equals($run->validation_evidence['record_hash'], $hash)) {
            $hard[] = 'stored_record_hash_mismatch';
        }
        if ($run->config_version !== config('progression.version')) {
            $hard[] = 'unsupported_run_configuration';
        }
        if ($elapsed < 0 || $elapsed > $wall + 2 || $wall < 0 || $wall > 86400 || (float) ($r['finalEncounter']['duration'] ?? -1) > $elapsed + 2) {
            $hard[] = 'submitted_time_inconsistency';
        }
        $bosses = $r['byKind']['ashGuard'] + $r['byKind']['charger'] + $r['byKind']['sorcerer'] + $r['byKind']['eclipse'];
        if (array_sum($r['byKind']) !== $r['kills'] || $bosses !== $r['details']['bossKills']
            || $r['details']['regularKills'] + $r['details']['eliteKills'] + $bosses + $r['byKind']['guardian'] !== $r['kills']) {
            $hard[] = 'kill_counters_inconsistent';
        }
        $allowed = config('progression.character_abilities.'.$run->character_id, []);
        if (array_diff($r['abilities'], $allowed) !== [] || array_diff(array_column($r['details']['damage'], 'id'), $allowed) !== []) {
            $hard[] = 'character_abilities_mismatch';
        }
        if ($r['kills'] > $elapsed * 500 + 150) {
            $hard[] = 'existing_kill_rate_bound';
        }
        $won = $r['outcome'] === 'victory';
        if ($run->mode === 'normal' && (($won && ($elapsed < 1200 || ! $r['finalEncounter']['killed'] || ! $r['finalEncounter']['reached'] || $r['byKind']['ashGuard'] !== 1 || ($r['completionKind'] ?? '') !== 'final-boss'))
            || (! $won && ($r['finalEncounter']['killed'] || $r['byKind']['ashGuard'] !== 0 || ($r['completionKind'] ?? '') !== 'defeat'))
            || ($r['finalEncounter']['reached'] && $elapsed < 1200))) {
            $hard[] = 'final_encounter_inconsistent';
        }
        $base = 0;
        foreach ($points as $kind => $value) {
            $base += $r['byKind'][$kind] * $value;
        }
        $elite = (int) $r['details']['eliteKills'];
        $capacity = [];
        foreach ($regular as $kind) {
            $capacity[] = ['points' => $points[$kind], 'count' => (int) $r['byKind'][$kind]];
        }
        usort($capacity, fn (array $a, array $b) => $a['points'] <=> $b['points']);
        $extra = function (array $rows) use ($elite): int {
            $left = $elite;
            $score = 0;
            foreach ($rows as $row) {
                $take = min($left, $row['count']);
                $score += 2 * $take * $row['points'];
                $left -= $take;
            }

            return $score;
        };
        $minimum = $base + $extra($capacity);
        $maximum = $base + $extra(array_reverse($capacity));
        $scoreEvidence = isset($r['eliteByKind']) ? 'per_kind_elites' : 'aggregate_only';
        if (isset($r['eliteByKind']) && is_array($r['eliteByKind'])) {
            $expected = $base;
            $eliteTotal = 0;
            foreach ($points as $kind => $value) {
                $number = $r['eliteByKind'][$kind] ?? -1;
                if (! is_int($number) || $number < 0 || $number > $r['byKind'][$kind] || (! in_array($kind, $regular, true) && $number > 0)) {
                    $hard[] = 'elite_kind_counters_inconsistent';

                    continue;
                }
                $eliteTotal += $number;
                $expected += 2 * $number * $value;
            }
            $minimum = $maximum = $expected;
            if ($eliteTotal !== $elite) {
                $hard[] = 'elite_total_mismatch';
            }
        } elseif ($elite > 0) {
            $soft[] = 'legacy_elite_distribution_missing';
        }
        if ($elite > array_sum(array_column($capacity, 'count')) || $r['score'] < $minimum || $r['score'] > $maximum || ($r['score'] - $base) % 10 !== 0) {
            $hard[] = 'game_score_inconsistent';
        }
        if ($r['score'] >= config('run_review.soft_score_threshold') || config('run_review.soft_kills_per_second') < $r['kills'] / max(1, $elapsed)) {
            $soft[] = 'score_or_kill_rate_requires_review';
        }

        $usages = RunItemUsage::where('game_run_id', $run->id)->orderBy('sequence')->limit(129)->get();
        $transactions = InventoryTransaction::whereIn('id', $usages->pluck('inventory_transaction_id'))->get()->keyBy('id');
        $deaths = RunDeath::whereIn('id', $usages->pluck('death_id')->filter())->get()->keyBy('id');
        $revives = 0;
        foreach ($usages as $index => $usage) {
            $tx = $transactions->get($usage->getAttribute('inventory_transaction_id'));
            $effect = $usage->getAttribute('effect_snapshot');
            $receipt = $usage->receipt;
            $expected = config('run_items.items.'.$usage->item_id);
            $valid = is_array($effect) && is_array($expected) && $tx && $usage->user_id === (int) $run->user_id
                && (int) $tx->getAttribute('user_id') === (int) $run->user_id && $tx->item_id === $usage->item_id && $tx->delta === -1
                && $tx->getAttribute('operation_id') === $usage->operation_id && $tx->source_type === 'future_in_game_consumption'
                && $tx->getAttribute('source_reference') === 'run_usage:'.$usage->id && (int) $usage->getAttribute('sequence') === $index + 1
                && (float) $usage->getAttribute('elapsed') <= $elapsed + .01
                && ($receipt['id'] ?? '') === $usage->id && ($receipt['item_id'] ?? '') === $usage->item_id
                && ($receipt['sequence'] ?? 0) === $index + 1 && ($receipt['death_id'] ?? null) === $usage->getAttribute('death_id')
                && ($receipt['server_run_id'] ?? '') === $run->id && ($receipt['client_run_id'] ?? '') === $run->client_run_id
                && ($receipt['operation_id'] ?? '') === $usage->operation_id && ($receipt['remaining_quantity'] ?? -1) === $tx->balance_after
                && ($effect['kind'] ?? '') === ($expected['kind'] ?? null) && ($effect['version'] ?? '') === ($expected['version'] ?? null)
                && CanonicalJson::hash($effect) === CanonicalJson::hash($receipt['effect'] ?? [])
                && ($tx->receipt['id'] ?? '') === $usage->id && ($tx->receipt['item_id'] ?? '') === $usage->item_id
                && CanonicalJson::hash($effect) === CanonicalJson::hash($tx->receipt['effect'] ?? []);
            if ($usage->item_id === 'revive') {
                $revives++;
                $death = $deaths->get($usage->getAttribute('death_id'));
                $valid = $valid && $death && $death->status === 'revived' && $death->game_run_id === $run->id && $death->user_id === (int) $run->user_id
                    && ($effect['health_basis_points'] ?? 0) === ($run->start_snapshot['economy']['revive_health_basis_points'] ?? -1)
                    && ($effect['protection_ms'] ?? -1) === ($run->start_snapshot['economy']['revive_protection_ms'] ?? -2);
            } else {
                $valid = $valid && ($effect['loot_kind'] ?? '') === ($expected['loot_kind'] ?? null) && $usage->getAttribute('death_id') === null;
            }
            if (! $valid) {
                $hard[] = 'inventory_usage_evidence_mismatch';
            }
            $items[$usage->item_id] = ($items[$usage->item_id] ?? 0) + 1;
        }
        $paid = app(RunPaidActionService::class)->evidence($run, $elapsed);
        if (! $paid['valid']) {
            $hard[] = 'paid_action_evidence_mismatch';
        }
        $revives += $paid['resurrections'];
        $ledgerUses = InventoryTransaction::where('source_type', 'future_in_game_consumption')->where('receipt->server_run_id', $run->id)->count();
        if ($usages->count() !== $run->item_sequence || $ledgerUses !== $usages->count() || $usages->count() > 128 || $revives !== $run->revive_count
            || $revives > ($run->start_snapshot['economy']['revive_limit'] ?? 0) || ($run->mode !== 'normal' && $usages->isNotEmpty())) {
            $hard[] = 'run_item_totals_inconsistent';
        }

        return new RunAssessment(array_values(array_unique($hard)), array_values(array_unique($soft)), $items, $revives, $minimum, $maximum, $scoreEvidence, $hash);
    }
}
