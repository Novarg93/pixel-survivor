<?php

namespace App\Services;

use App\Models\ActiveAccountEffect;
use App\Models\InventoryBalance;
use App\Models\InventoryTransaction;
use App\Models\ItemDefinition;
use App\Models\RewardGrant;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class InventoryService
{
    /** Caller holds AccountLock in the same transaction as the run usage receipt.
     * @param  array<string, mixed>  $receipt
     */
    public function consumeRunItemLocked(int $userId, string $itemId, string $operationId, string $usageId, array $receipt): InventoryTransaction
    {
        $receipt['item_snapshot'] = ItemDefinition::whereKey($itemId)->firstOrFail()->only(['id', 'name', 'version']);
        abort_unless(ItemDefinition::whereKey($itemId)->where('type', 'consumable')->exists(), 409, 'This item cannot be used during a run.');
        abort_if(InventoryTransaction::where('user_id', $userId)->where('operation_id', $operationId)->exists(), 409, 'Operation ID already belongs to another inventory operation.');
        $updated = InventoryBalance::where('user_id', $userId)->where('item_id', $itemId)->where('quantity', '>=', 1)->decrement('quantity');
        abort_unless($updated === 1, 409, 'No items remaining. You can purchase more with credits.');

        return InventoryTransaction::create(['id' => (string) Str::uuid(), 'user_id' => $userId, 'item_id' => $itemId, 'delta' => -1,
            'balance_after' => InventoryBalance::where('user_id', $userId)->where('item_id', $itemId)->firstOrFail()->quantity,
            'source_type' => 'future_in_game_consumption', 'source_reference' => 'run_usage:'.$usageId, 'operation_id' => $operationId, 'receipt' => $receipt, 'created_at' => now()]);
    }

    public function syncCatalog(): void
    {
        foreach (config('inventory.items') as $id => $definition) {
            Validator::make([...$definition, 'id' => $id], [
                'id' => 'required|string|regex:/^[a-z][a-z0-9_]{0,59}$/', 'name' => 'required|string|max:120', 'type' => 'required|string|max:40',
                'description' => 'required|string', 'icon' => 'required|string|max:40', 'effect' => 'required|array', 'effect.kind' => 'required|string|max:60', 'activation_enabled' => 'required|boolean',
            ])->validate();
            $existing = ItemDefinition::whereKey($id)->first();
            if (isset($existing?->getAttribute('effect')['consumable'])) {
                $definition['effect']['consumable'] = $existing->getAttribute('effect')['consumable'];
            }
            ItemDefinition::updateOrCreate(['id' => $id], [...$definition, 'version' => config('inventory.version')]);
        }
    }

    /** Caller already holds AccountLock inside the progression/reconciliation transaction. */
    public function fulfillLocked(RewardGrant $grant): void
    {
        if ($grant->fulfillment_status === 'fulfilled') {
            return;
        }
        $items = $grant->fulfillment;
        foreach ($items as $index => &$item) {
            if (($item['status'] ?? '') !== 'pending_fulfillment') {
                continue;
            }
            $type = $item['type'] ?? null;
            if (! is_string($type)) {
                throw new \DomainException('Invalid reward item identifier.');
            }
            $definition = ItemDefinition::whereKey($type)->first();
            if (! $definition) {
                continue;
            } // Credits/cosmetics/unknown future rewards stay pending.
            $quantity = $item['quantity'] ?? null;
            if (! is_int($quantity) || $quantity < 1 || $quantity > config('inventory.max_quantity')) {
                throw new \DomainException('Invalid reward quantity; source snapshot retained.');
            }
            $reference = 'reward_grant:'.$grant->id.':'.$index;
            $source = str_starts_with($grant->track, 'character:') ? 'character_level_reward' : 'account_level_reward';
            $transaction = $this->creditLocked($grant->user_id, $definition->id, $quantity, $source, $reference, $grant->id);
            $item['status'] = 'fulfilled';
            $item['inventory_transaction_id'] = $transaction->id;
            $item['fulfilled_at'] = now()->toISOString();
        }
        unset($item);
        $grant->recordFulfillment($items);
    }

    /** Existing inventory ledger writer, also used by atomic Shop purchases.
     * Caller holds AccountLock inside a DB transaction.
     */
    public function creditPurchaseLocked(int $userId, string $itemId, int $quantity, string $purchaseId): InventoryTransaction
    {
        return $this->creditLocked($userId, $itemId, $quantity, 'future_shop_purchase', 'purchase:'.$purchaseId);
    }

    private function creditLocked(int $userId, string $itemId, int $quantity, string $source, string $reference, ?int $grantId = null): InventoryTransaction
    {
        if ($quantity < 1 || $quantity > config('inventory.max_quantity')) {
            throw new \DomainException('Invalid inventory credit.');
        }
        $definition = ItemDefinition::whereKey($itemId)->firstOrFail();
        $existing = InventoryTransaction::where('user_id', $userId)->where('source_type', $source)->where('source_reference', $reference)->first();
        if ($existing) {
            if ($existing->item_id !== $itemId || $existing->delta !== $quantity) {
                throw new \DomainException('Inventory source conflicts with journal.');
            }

            return $existing;
        }
        InventoryBalance::firstOrCreate(['user_id' => $userId, 'item_id' => $itemId]);
        $updated = InventoryBalance::where('user_id', $userId)->where('item_id', $itemId)->where('quantity', '<=', config('inventory.max_quantity') - $quantity)->increment('quantity', $quantity);
        if ($updated !== 1) {
            throw new \DomainException('Inventory stack limit reached; transaction rolled back.');
        }
        $balance = InventoryBalance::where('user_id', $userId)->where('item_id', $itemId)->firstOrFail();

        return InventoryTransaction::create(['id' => (string) Str::uuid(), 'user_id' => $userId, 'item_id' => $itemId, 'delta' => $quantity, 'balance_after' => $balance->quantity,
            'source_type' => $source, 'source_reference' => $reference, 'reward_grant_id' => $grantId, 'created_at' => now(),
            'receipt' => ['definition_version' => $definition->version, 'quantity' => $quantity, 'source' => $reference]]);
    }

    public function fulfillGrant(int $userId, int $grantId): void
    {
        DB::transaction(function () use ($userId, $grantId): void {
            AccountLock::acquire($userId);
            $grant = RewardGrant::where('user_id', $userId)->whereKey($grantId)->firstOrFail();
            $this->fulfillLocked($grant);
        }, 5);
    }

    /** @return array{processed: int, failed: int} */
    public function reconcile(?int $userId = null): array
    {
        $result = ['processed' => 0, 'failed' => 0];
        RewardGrant::where('fulfillment_status', '!=', 'fulfilled')->when($userId !== null, fn ($query) => $query->where('user_id', $userId))
            ->chunkById(100, function ($grants) use (&$result): void {
                foreach ($grants as $grant) {
                    try {
                        $this->fulfillGrant($grant->user_id, $grant->id);
                        $result['processed']++;
                    } catch (\Throwable $error) {
                        $result['failed']++;
                        DB::transaction(function () use ($grant, $error): void {
                            AccountLock::acquire($grant->user_id);
                            RewardGrant::whereKey($grant->id)->where('fulfillment_status', '!=', 'fulfilled')->update([
                                'last_fulfillment_error' => class_basename($error).': fulfillment failed; retry required', 'fulfillment_attempted_at' => now(),
                            ]);
                        }, 5);
                    }
                }
            });

        return $result;
    }

    /** @return array<string, mixed> */
    public function runBoostSnapshot(int $userId, bool $normal, ?CarbonInterface $at = null): array
    {
        $at ??= now();
        $effect = $normal ? ActiveAccountEffect::where('user_id', $userId)->where('effect_key', 'character_xp_multiplier')->where('activated_at', '<=', $at)->where('expires_at', '>', $at)->orderByDesc('activated_at')->first() : null;

        return ['effect_id' => $effect?->id, 'multiplier_basis_points' => $effect ? (int) $effect->parameters['multiplier_basis_points'] : 10000,
            'expires_at' => $effect?->expires_at->toISOString()];
    }

    /** @return array<string, mixed> */
    public function snapshot(int $userId): array
    {
        return DB::transaction(function () use ($userId): array {
            AccountLock::acquire($userId);

            return ['server_now' => now()->toISOString(), 'catalog' => ItemDefinition::orderBy('id')->get()->toArray(),
                'balances' => InventoryBalance::where('user_id', $userId)->orderBy('item_id')->get(['item_id', 'quantity'])->toArray(),
                'effects' => ActiveAccountEffect::where('user_id', $userId)->where('activated_at', '<=', now())->where('expires_at', '>', now())->orderBy('expires_at')->get(['id', 'item_id', 'effect_key', 'parameters', 'activated_at', 'expires_at'])->toArray(),
                'transactions' => InventoryTransaction::where('user_id', $userId)->orderByDesc('created_at')->orderByDesc('id')->limit(30)->get(['id', 'item_id', 'delta', 'balance_after', 'source_type', 'source_reference', 'created_at'])->toArray()];
        }, 5);
    }

    /** @return array<string, mixed> */
    public function activateXpBoost(int $userId, string $operationId): array
    {
        $receipt = DB::transaction(function () use ($userId, $operationId): array {
            AccountLock::acquire($userId);
            $existing = InventoryTransaction::where('user_id', $userId)->where('operation_id', $operationId)->first();
            if ($existing) {
                abort_unless($existing->source_type === 'xp_boost_activation', 409, 'Operation ID belongs to another operation.');

                return $existing->receipt;
            }
            $definition = ItemDefinition::findOrFail('xp_boost_24h');
            abort_unless($definition->activation_enabled && $definition->type === 'activatable_boost' && $definition->effect['kind'] === 'character_xp_multiplier', 409, 'Activation unavailable.');
            $parameters = Validator::make($definition->effect, ['multiplier_basis_points' => 'required|integer|between:10000,50000', 'duration_seconds' => 'required|integer|between:1,604800'])->validate();
            abort_if(ActiveAccountEffect::where('user_id', $userId)->where('effect_key', 'character_xp_multiplier')->where('expires_at', '>', now())->exists(), 409, 'XP boost is already active.');
            $updated = InventoryBalance::where('user_id', $userId)->where('item_id', $definition->id)->where('quantity', '>=', 1)->decrement('quantity');
            abort_unless($updated === 1, 409, 'No XP boost in inventory.');
            $balance = InventoryBalance::where('user_id', $userId)->where('item_id', $definition->id)->firstOrFail();
            $activated = now()->startOfSecond();
            $expires = $activated->addSeconds($parameters['duration_seconds']);
            $transactionId = (string) Str::uuid();
            $effectId = (string) Str::uuid();
            $receipt = ['operation_id' => $operationId, 'effect_id' => $effectId, 'item_id' => $definition->id, 'item_snapshot' => $definition->only(['id', 'name', 'version']), 'activated_at' => $activated->toISOString(), 'expires_at' => $expires->toISOString(), 'multiplier_basis_points' => $parameters['multiplier_basis_points']];
            InventoryTransaction::create(['id' => $transactionId, 'user_id' => $userId, 'item_id' => $definition->id, 'delta' => -1, 'balance_after' => $balance->quantity,
                'source_type' => 'xp_boost_activation', 'source_reference' => 'activation:'.$operationId, 'operation_id' => $operationId, 'receipt' => $receipt, 'created_at' => now()]);
            ActiveAccountEffect::create(['id' => $effectId, 'user_id' => $userId, 'item_id' => $definition->id, 'effect_key' => 'character_xp_multiplier', 'inventory_transaction_id' => $transactionId,
                'parameters' => $parameters, 'definition_version' => $definition->version, 'activated_at' => $activated, 'expires_at' => $expires]);

            return InventoryTransaction::whereKey($transactionId)->firstOrFail()->receipt;
        }, 5);

        return ['receipt' => $receipt, 'inventory' => $this->snapshot($userId)];
    }
}
