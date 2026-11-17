<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['UPDATE', 'DELETE'] as $event) {
            $condition = "OLD.source_type IN ('xp_boost_activation', 'future_in_game_consumption')";
            if (DB::getDriverName() === 'sqlite') {
                DB::statement("CREATE TRIGGER inventory_usage_immutable_{$event} BEFORE {$event} ON inventory_transactions WHEN $condition BEGIN SELECT RAISE(ABORT, 'Inventory usage is immutable'); END");
            } else {
                DB::unprepared("CREATE TRIGGER inventory_usage_immutable_{$event} BEFORE {$event} ON inventory_transactions FOR EACH ROW BEGIN IF $condition THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Inventory usage is immutable'; END IF; END");
            }
        }
    }

    public function down(): void
    {
        foreach (['UPDATE', 'DELETE'] as $event) {
            DB::statement("DROP TRIGGER IF EXISTS inventory_usage_immutable_{$event}");
        }
    }
};
