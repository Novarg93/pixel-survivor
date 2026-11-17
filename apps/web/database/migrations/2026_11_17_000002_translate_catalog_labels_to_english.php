<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Translate catalog copy only. Preserve prices, effects, stock and historical receipts.
        foreach (config('inventory.items') as $id => $definition) {
            $labels = ['name' => $definition['name'], 'description' => $definition['description']];
            DB::table('item_definitions')->where('id', $id)->update($labels);
            DB::table('shop_products')->where('item_id', $id)->update($labels);
        }
        foreach (array_keys(config('payments.packages')) as $id) {
            DB::table('payment_packages')->where('id', $id)->update(['description' => 'Local test package. No real money is accepted.']);
            DB::table('payment_packages')->where('id', 'stripe_'.$id)->update(['description' => 'Stripe Sandbox. Test price only, no real money.']);
        }
    }

    public function down(): void
    {
        // Copy changes do not require reverting catalog data when rolling back code.
    }
};
