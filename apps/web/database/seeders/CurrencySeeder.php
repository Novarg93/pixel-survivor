<?php

namespace Database\Seeders;

use App\Models\Currency;
use Illuminate\Database\Seeder;

class CurrencySeeder extends Seeder
{
    public function run(): void
    {
        Currency::firstOrCreate(['code' => 'EUR'], ['name' => 'Euro', 'symbol' => '€', 'exchange_rate' => '1.00000000', 'decimal_places' => 2,
            'is_default' => ! Currency::where('is_default', true)->exists(), 'is_active' => true, 'sort_order' => 0]);
    }
}
