<?php

namespace App\Services;

use App\Models\GameRun;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UpgradePool
{
    /** Generated from the actual TypeScript definitions by scripts/export-upgrade-catalog.mjs.
     * @return array<string,mixed>
     */
    public function catalog(): array
    {
        $json = file_get_contents(resource_path('game/upgrade-catalog.json'));
        if ($json === false) {
            throw new \LogicException('Upgrade catalog is unavailable.');
        }

        return json_decode($json, true, 64, JSON_THROW_ON_ERROR);
    }

    /** @param array<string,mixed> $input
     * @return array<string,mixed>
     */
    public function context(GameRun $run, array $input): array
    {
        $catalog = $this->catalog();
        $v = Validator::make($input, ['level' => 'required|integer:strict|between:2,1000', 'hero_level' => 'required|integer:strict|between:2,1000',
            'elapsed' => 'required|numeric|between:0,86400', 'upgrades' => 'present|array|max:100', 'upgrades.*' => 'integer:strict|between:1,1000',
            'ultimate' => ['present', 'nullable', Rule::in(array_column($catalog['ultimates'][$run->character_id], 'id'))],
            'choices' => 'prohibited', 'pool' => 'prohibited', 'price' => 'prohibited', 'user_id' => 'prohibited'])->validate();
        abort_unless($v['hero_level'] >= $v['level'] && array_sum($v['upgrades']) + ($v['ultimate'] ? 1 : 0) === $v['level'] - 2, 422, 'Upgrade build does not match the reported level.');
        $entries = array_column($catalog['entries'], null, 'id');
        $mobility = [];
        foreach ($v['upgrades'] as $id => $rank) {
            $entry = $entries[$id] ?? null;
            abort_unless($entry && (! $entry['character'] || $entry['character'] === $run->character_id) && $rank <= $entry['max'], 422, 'Invalid upgrade in reported build.');
            if ($entry['rule'] === 'mobility') {
                $mobility[] = $id;
            }
            if (in_array($entry['rule'], ['rank', 'evolve'], true)) {
                $ability = $entry['ability'];
                $unlocked = in_array($ability, ['fireball', 'cleave'], true) ? 1 : ($v['upgrades']['unlock-'.$ability] ?? 0);
                abort_unless($unlocked && ($entry['rule'] !== 'evolve' || $unlocked + ($v['upgrades']['rank-'.$ability] ?? 0) >= 3), 422, 'Upgrade requires an unlocked ability.');
            }
        }
        abort_unless(count($mobility) <= 1 && (! $mobility || $v['level'] > $catalog['mobilityLevel']), 422, 'Invalid mobility specialization.');
        abort_unless(! $v['ultimate'] || $v['level'] > $catalog['ultimateLevel'] && $v['elapsed'] >= $catalog['ultimateTime'], 422, 'Ultimate is unavailable.');
        ksort($v['upgrades']);
        $v['elapsed'] = round((float) $v['elapsed'], 3);

        return $v;
    }

    /** @param array<string,mixed> $context
     * @return list<string>
     */
    public function eligible(GameRun $run, array $context): array
    {
        $catalog = $this->catalog();
        if (! $context['ultimate'] && $context['level'] >= $catalog['ultimateLevel'] && $context['elapsed'] >= $catalog['ultimateTime']) {
            return array_values(array_map(fn ($u) => 'ultimate-'.$u['id'], $catalog['ultimates'][$run->character_id]));
        }
        $upgrades = $context['upgrades'];
        $mobility = array_values(array_filter(array_keys($upgrades), fn ($id) => is_string($id) && str_starts_with($id, 'mobility-')));
        $result = $supplies = [];
        foreach ($catalog['entries'] as $entry) {
            $id = $entry['id'];
            if ($entry['character'] && $entry['character'] !== $run->character_id || ($upgrades[$id] ?? 0) >= $entry['max']) {
                continue;
            }
            $level = $entry['ability'] ? (in_array($entry['ability'], ['fireball', 'cleave'], true) ? 1 : ($upgrades['unlock-'.$entry['ability']] ?? 0)) + ($upgrades['rank-'.$entry['ability']] ?? 0) : 0;
            $eligible = match ($entry['rule']) {
                'unlock' => $level === 0, 'rank' => $level > 0 && $level < 5, 'evolve' => $level >= 3,
                'mobility' => $context['hero_level'] >= $catalog['mobilityLevel'] && (! $mobility || $mobility[0] === $id),
                default => true,
            };
            if ($eligible) {
                if ($entry['rule'] === 'supply') {
                    $supplies[] = $id;
                } else {
                    $result[] = $id;
                }
            }
        }
        if (! $mobility && $context['level'] >= $catalog['mobilityLevel']) {
            return array_values(array_filter($result, fn ($id) => str_starts_with($id, 'mobility-')));
        }

        return count($result) >= 3 ? $result : [...$result, ...$supplies];
    }

    /** @param list<string> $pool
     * @param  list<string>  $previous
     * @return list<string>
     */
    public function choose(array $pool, array $previous = []): array
    {
        $fresh = array_values(array_diff($pool, $previous));
        $old = array_values(array_intersect($pool, $previous));
        $result = [];
        foreach ([$fresh, $old] as $group) {
            while (count($result) < 3 && $group) {
                $index = random_int(0, count($group) - 1);
                $result[] = array_splice($group, $index, 1)[0];
            }
        }

        return $result;
    }
}
