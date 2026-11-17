<?php

use App\Services\InventoryService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_definitions', function (Blueprint $table) {
            $table->string('id', 60)->primary();
            $table->string('version', 40);
            $table->string('name', 120);
            $table->string('type', 40);
            $table->string('icon', 40);
            $table->text('description');
            $table->json('effect');
            $table->boolean('activation_enabled')->default(false);
        });
        Schema::create('inventory_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('item_id', 60);
            $table->foreign('item_id')->references('id')->on('item_definitions');
            $table->unsignedInteger('quantity')->default(0);
            $table->unique(['user_id', 'item_id']);
        });
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('item_id', 60);
            $table->foreign('item_id')->references('id')->on('item_definitions');
            $table->integer('delta');
            $table->unsignedInteger('balance_after');
            $table->enum('source_type', ['account_level_reward', 'character_level_reward', 'xp_boost_activation', 'future_shop_purchase', 'future_refund', 'future_in_game_consumption', 'future_admin_grant']);
            $table->string('source_reference', 100);
            $table->foreignId('reward_grant_id')->nullable()->constrained()->nullOnDelete();
            $table->uuid('operation_id')->nullable();
            $table->json('receipt');
            $table->timestamp('created_at', 6);
            $table->unique(['user_id', 'source_type', 'source_reference'], 'inventory_source_unique');
            $table->unique(['user_id', 'operation_id']);
            $table->index(['user_id', 'created_at']);
        });
        Schema::create('active_account_effects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('item_id', 60);
            $table->foreign('item_id')->references('id')->on('item_definitions');
            $table->string('effect_key', 60);
            $table->uuid('inventory_transaction_id')->unique();
            $table->foreign('inventory_transaction_id')->references('id')->on('inventory_transactions')->cascadeOnDelete();
            $table->json('parameters');
            $table->string('definition_version', 40);
            $table->timestamp('activated_at');
            $table->timestamp('expires_at');
            $table->index(['user_id', 'effect_key', 'expires_at']);
        });
        Schema::table('reward_grants', function (Blueprint $table) {
            $table->enum('fulfillment_status', ['pending_fulfillment', 'partial', 'fulfilled'])->default('pending_fulfillment');
            $table->string('last_fulfillment_error', 255)->nullable();
            $table->timestamp('fulfillment_attempted_at')->nullable();
        });
        foreach (['inventory_balances' => 'quantity', 'inventory_transactions' => 'balance_after'] as $table => $column) {
            if (DB::getDriverName() === 'sqlite') {
                foreach (['INSERT', 'UPDATE'] as $event) {
                    DB::statement("CREATE TRIGGER {$table}_bounds_{$event} BEFORE {$event} ON {$table} WHEN NEW.{$column} < 0 OR NEW.{$column} > 1000000 OR typeof(NEW.{$column}) != 'integer' BEGIN SELECT RAISE(ABORT, 'Invalid inventory balance'); END");
                }
            } else {
                DB::statement("ALTER TABLE {$table} ADD CONSTRAINT {$table}_bounds CHECK ({$column} BETWEEN 0 AND 1000000)");
            }
        }
        app(InventoryService::class)->syncCatalog();
    }

    public function down(): void
    {
        Schema::table('reward_grants', fn (Blueprint $table) => $table->dropColumn(['fulfillment_status', 'last_fulfillment_error', 'fulfillment_attempted_at']));
        foreach (['active_account_effects', 'inventory_transactions', 'inventory_balances', 'item_definitions'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
