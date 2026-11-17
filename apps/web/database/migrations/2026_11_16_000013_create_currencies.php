<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('currencies', function (Blueprint $t): void {
            $t->id();
            $t->string('code', 3)->unique();
            $t->string('name', 100);
            $t->string('symbol', 12);
            // Units of this currency per 1 EUR. EUR remains the rate anchor forever.
            if (DB::getDriverName() === 'sqlite') {
                // SQLite NUMERIC affinity can coerce DECIMAL into binary float.
                $t->string('exchange_rate', 21);
            } else {
                $t->decimal('exchange_rate', 20, 8);
            }
            $t->unsignedTinyInteger('decimal_places')->default(2);
            $t->boolean('is_default')->default(false);
            $t->boolean('is_active')->default(true);
            $t->unsignedInteger('sort_order')->default(0);
            $t->unsignedTinyInteger('default_slot')->nullable()->virtualAs('CASE WHEN is_default = 1 THEN 1 ELSE NULL END')->unique();
            $t->timestamps();
            $t->index(['is_active', 'sort_order']);
        });
        DB::table('currencies')->insert(['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'exchange_rate' => '1.00000000', 'decimal_places' => 2,
            'is_default' => true, 'is_active' => true, 'sort_order' => 0, 'created_at' => now(), 'updated_at' => now()]);
        Schema::table('users', fn (Blueprint $t) => $t->foreignId('preferred_currency_id')->nullable()->constrained('currencies')->nullOnDelete());
        Schema::table('payment_orders', function (Blueprint $t): void {
            $t->foreignId('currency_id')->nullable()->constrained('currencies')->restrictOnDelete();
            // Null on historical/unconfigured settlements: never invent an old exchange rate.
            if (DB::getDriverName() === 'sqlite') {
                $t->string('currency_exchange_rate', 21)->nullable();
            } else {
                $t->decimal('currency_exchange_rate', 20, 8)->nullable();
            }
        });
        $valid = "exchange_rate > 0 AND decimal_places BETWEEN 0 AND 4 AND sort_order >= 0 AND (is_default = 0 OR is_active = 1) AND (code != 'EUR' OR (exchange_rate = 1 AND decimal_places = 2 AND is_active = 1))";
        if (DB::getDriverName() === 'sqlite') {
            $valid = preg_replace('/\b(exchange_rate|decimal_places|sort_order|is_default|is_active|code)\b/', 'NEW.$1', $valid);
            // A numerical comparison only validates bounds; monetary arithmetic uses strings.
            $valid = str_replace('NEW.exchange_rate', 'CAST(NEW.exchange_rate AS NUMERIC)', $valid);
            foreach (['INSERT', 'UPDATE'] as $event) {
                DB::statement("CREATE TRIGGER currencies_bounds_{$event} BEFORE {$event} ON currencies WHEN NOT ($valid) BEGIN SELECT RAISE(ABORT, 'Invalid currency'); END");
            }
        } else {
            DB::statement("ALTER TABLE currencies ADD CONSTRAINT currencies_bounds CHECK ($valid)");
        }
        // Protect existing string-based settlements as well as the new FK snapshots.
        $references = 'EXISTS (SELECT 1 FROM payment_orders WHERE currency = OLD.code) OR EXISTS (SELECT 1 FROM payment_packages WHERE currency = OLD.code)';
        if (DB::getDriverName() === 'sqlite') {
            DB::statement("CREATE TRIGGER currencies_delete_guard BEFORE DELETE ON currencies WHEN OLD.code = 'EUR' OR OLD.is_default = 1 OR $references BEGIN SELECT RAISE(ABORT, 'Currency is referenced or required'); END");
            DB::statement("CREATE TRIGGER currencies_identity_guard BEFORE UPDATE ON currencies WHEN (NEW.code != OLD.code OR NEW.decimal_places != OLD.decimal_places) AND (OLD.code = 'EUR' OR $references) BEGIN SELECT RAISE(ABORT, 'Currency identity is immutable'); END");
        } else {
            DB::unprepared("CREATE TRIGGER currencies_delete_guard BEFORE DELETE ON currencies FOR EACH ROW BEGIN IF OLD.code = 'EUR' OR OLD.is_default = 1 OR $references THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Currency is referenced or required'; END IF; END");
            DB::unprepared("CREATE TRIGGER currencies_identity_guard BEFORE UPDATE ON currencies FOR EACH ROW BEGIN IF (NEW.code != OLD.code OR NEW.decimal_places != OLD.decimal_places) AND (OLD.code = 'EUR' OR $references) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Currency identity is immutable'; END IF; END");
        }
    }

    public function down(): void
    {
        Schema::table('payment_orders', function (Blueprint $t): void {
            $t->dropForeign(['currency_id']);
            $t->dropColumn(['currency_id', 'currency_exchange_rate']);
        });
        Schema::table('users', function (Blueprint $t): void {
            $t->dropForeign(['preferred_currency_id']);
            $t->dropColumn('preferred_currency_id');
        });
        Schema::dropIfExists('currencies');
    }
};
