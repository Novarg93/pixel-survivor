<?php

namespace App\Services;

use App\Models\GameplaySetting;
use App\Models\ItemDefinition;
use App\Models\ShopProduct;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PremiumConfiguration
{
    /** @return array<string,mixed> */
    public function current(): array
    {
        $settings = [...array_diff_key(config()->array('premium'), ['consumables' => true, 'max_actions' => true]), ...(GameplaySetting::find(1)?->getAttribute('settings') ?? [])];
        $settings['resurrection_price'] = ShopProduct::whereKey('revive')->value('price') ?? config('shop.products.revive.price');
        $settings['consumables'] = [];
        $definitions = ItemDefinition::whereIn('id', array_keys(config('premium.consumables')))->get()->keyBy('id');
        foreach (config('premium.consumables') as $id => $defaults) {
            $definition = $definitions->get($id);
            $settings['consumables'][$id] = [...$defaults, ...($definition?->getAttribute('effect')['consumable'] ?? []),
                'name' => $definition?->getAttribute('name') ?? $id, 'icon' => $definition?->getAttribute('icon') ?? 'potion'];
        }

        return $settings;
    }

    /** @param array<string,mixed> $input */
    public function update(array $input): void
    {
        $rules = ['enabled' => 'required|boolean', 'reroll_enabled' => 'required|boolean', 'resurrection_enabled' => 'required|boolean',
            'reroll_price' => 'required|integer|between:1,1000000', 'resurrection_price' => 'required|integer|between:1,1000000',
            'revive_limit' => 'required|integer|between:0,3', 'revive_health_basis_points' => 'required|integer|between:1,10000',
            'revive_protection_ms' => 'required|integer|between:0,10000'];
        foreach (config('premium.consumables') as $id => $defaults) {
            foreach ($defaults as $key => $value) {
                $rules["consumables.$id.$key"] = $key === 'enabled' ? 'required|boolean' : 'required|integer|between:1,'.($key === 'duration_ms' ? 120000 : ($key === 'heal_basis_points' ? 10000 : 30000));
            }
        }
        $v = Validator::make($input, $rules)->validate();
        DB::transaction(function () use ($v): void {
            $row = GameplaySetting::whereKey(1)->lockForUpdate()->firstOrFail();
            $settings = array_diff_key($v, ['consumables' => true, 'resurrection_price' => true]);
            foreach ($settings as $key => &$value) {
                $value = in_array($key, ['enabled', 'reroll_enabled', 'resurrection_enabled'], true) ? (bool) $value : (int) $value;
            }
            unset($value);
            $row->setAttribute('settings', $settings)->save();
            ShopProduct::whereKey('revive')->update(['price' => (int) $v['resurrection_price']]);
            foreach ($v['consumables'] as $id => $effect) {
                $item = ItemDefinition::whereKey($id)->lockForUpdate()->firstOrFail();
                $effect = array_map(fn ($value) => (int) $value, $effect);
                $effect['enabled'] = (bool) $effect['enabled'];
                $item->setAttribute('effect', [...$item->getAttribute('effect'), 'consumable' => $effect])->save();
            }
        }, 5);
    }
}
