<?php

namespace App\Services;

use App\Models\ItemDefinition;
use App\Models\Purchase;
use App\Models\ShopProduct;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PurchaseService
{
    public function syncCatalog(): void
    {
        foreach (config('shop.products') as $key => $config) {
            $item = ItemDefinition::whereKey($config['item_id'])->firstOrFail();
            $definition = ['key' => $key, 'name' => $item->name, 'description' => $item->description, 'icon' => $item->icon, 'active' => true, 'per_user_limit' => null, ...$config];
            // Resurrection shares this price; catalog maintenance must preserve Filament edits.
            if ($key === 'revive' && ($existing = ShopProduct::whereKey($key)->first())) {
                $definition['price'] = $existing->price;
            }
            Validator::make($definition, ['key' => 'required|string|max:60', 'price' => 'required|integer:strict|between:1,1000000', 'per_user_limit' => 'nullable|integer:strict|min:1'])->validate();
            ShopProduct::updateOrCreate(['key' => $key], $definition);
        }
    }

    /** @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function purchase(int $userId, array $input): array
    {
        $data = Validator::make($input, ['operation_id' => 'required|uuid', 'product_key' => 'required|string|max:60', 'quantity' => 'required|integer:strict|between:1,20', 'expected_unit_price' => 'required|integer:strict|between:1,1000000',
            'price' => 'prohibited', 'total' => 'prohibited', 'balance' => 'prohibited', 'user_id' => 'prohibited', 'item_id' => 'prohibited'])->validate();
        $data['operation_id'] = strtolower($data['operation_id']);
        $hash = hash('sha256', json_encode([$data['product_key'], $data['quantity'], $data['expected_unit_price']], JSON_THROW_ON_ERROR));
        $receipt = DB::transaction(function () use ($userId, $data, $hash): array {
            AccountLock::acquire($userId);
            $existing = Purchase::where('user_id', $userId)->where('operation_id', $data['operation_id'])->first();
            if ($existing) {
                abort_unless(hash_equals($existing->request_hash, $hash), 409, 'Purchase idempotency conflict.');

                return $existing->receipt;
            }
            $product = ShopProduct::whereKey($data['product_key'])->lockForUpdate()->firstOrFail();
            abort_unless($product->active, 409, 'This item is currently unavailable.');
            abort_unless($product->price === $data['expected_unit_price'], 409, 'The price changed. Refresh the shop and confirm the purchase again.');
            abort_unless($data['quantity'] <= config('shop.max_quantity'), 422, 'Invalid quantity.');
            $purchased = (int) Purchase::where('user_id', $userId)->where('product_key', $product->key)->sum('quantity');
            abort_if($product->per_user_limit !== null && $purchased + $data['quantity'] > $product->per_user_limit, 409, 'The purchase limit for this item has been reached.');
            $id = (string) Str::uuid();
            $total = $product->price * $data['quantity'];
            $ledger = app(WalletService::class)->debit($userId, $total, 'purchase:'.$id, 'purchase:'.$data['operation_id'], ['purchase_id' => $id, 'product_key' => $product->key, 'quantity' => $data['quantity'], 'unit_price' => $product->price]);
            $inventory = app(InventoryService::class)->creditPurchaseLocked($userId, $product->item_id, $data['quantity'], $id);
            $snapshot = ['key' => $product->key, 'name' => $product->name, 'description' => $product->description, 'item_id' => $product->item_id, 'icon' => $product->icon];
            $receipt = ['id' => $id, 'operation_id' => $data['operation_id'], 'product' => $snapshot, 'quantity' => $data['quantity'], 'unit_price' => $product->price, 'total' => $total, 'status' => 'completed',
                'credit_transaction_id' => $ledger->id, 'inventory_transaction_id' => $inventory->id, 'created_at' => now()->toISOString()];
            Purchase::create(['id' => $id, 'user_id' => $userId, 'operation_id' => $data['operation_id'], 'request_hash' => $hash, 'product_key' => $product->key,
                'quantity' => $data['quantity'], 'unit_price' => $product->price, 'total' => $total, 'status' => 'completed', 'product_snapshot' => $snapshot, 'receipt' => $receipt,
                'credit_transaction_id' => $ledger->id, 'inventory_transaction_id' => $inventory->id, 'created_at' => now()]);

            // Read the persisted receipt: MySQL normalizes native JSON object key order.
            return Purchase::whereKey($id)->firstOrFail()->receipt;
        }, 5);

        return ['receipt' => $receipt, 'shop' => $this->snapshot($userId)];
    }

    /** @return array<string, mixed> */
    public function snapshot(int $userId, int $page = 1): array
    {
        return DB::transaction(function () use ($userId, $page): array {
            AccountLock::acquire($userId);

            return ['server_now' => now()->toISOString(), 'wallet' => app(WalletService::class)->snapshot($userId), 'inventory' => app(InventoryService::class)->snapshot($userId),
                'products' => ShopProduct::orderBy('sort_order')->orderBy('key')->get()->toArray(),
                'purchases' => Purchase::where('user_id', $userId)->orderByDesc('created_at')->orderByDesc('id')->paginate(20, ['id', 'operation_id', 'product_snapshot', 'quantity', 'unit_price', 'total', 'status', 'created_at'], 'page', $page)->toArray()];
        }, 5);
    }
}
