<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }
        // Opaque provider identifiers are case-sensitive, unlike the default MySQL collation.
        foreach (['payment_orders' => ['provider_checkout_id' => true, 'provider_payment_id' => true],
            'payment_confirmations' => ['provider_checkout_id' => false, 'provider_payment_id' => false],
            'payment_webhook_inbox' => ['provider_event_id' => false],
            'test_provider_payments' => ['id' => false, 'checkout_id' => false]] as $table => $columns) {
            foreach ($columns as $column => $nullable) {
                $null = $nullable ? 'NULL' : 'NOT NULL';
                DB::statement("ALTER TABLE {$table} MODIFY {$column} VARCHAR(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin {$null}");
            }
        }
    }

    public function down(): void
    {
        // Never merge case-distinct historical provider identifiers during rollback.
    }
};
