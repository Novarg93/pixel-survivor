<?php

use App\Models\User;
use App\Services\PurchaseService;
use App\Services\WalletService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('balance')->default(0);
            $table->unsignedInteger('sequence')->default(0);
        });
        Schema::create('credit_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained('wallets', 'user_id')->cascadeOnDelete();
            $table->enum('type', ['level_reward', 'shop_purchase', 'admin_adjustment', 'payment_credit', 'purchase_refund']);
            $table->integer('amount');
            $table->unsignedInteger('balance_after');
            $table->unsignedInteger('sequence');
            $table->string('source_id', 120);
            $table->string('idempotency_reference', 120);
            $table->string('request_hash', 64);
            $table->json('metadata');
            $table->timestamp('created_at', 6);
            $table->unique(['user_id', 'type', 'source_id']);
            $table->unique(['user_id', 'idempotency_reference']);
            $table->unique(['user_id', 'sequence']);
        });
        Schema::create('shop_products', function (Blueprint $table) {
            $table->string('key', 60)->primary();
            $table->string('item_id', 60);
            $table->foreign('item_id')->references('id')->on('item_definitions');
            $table->string('name', 120);
            $table->text('description');
            $table->unsignedInteger('price');
            $table->boolean('active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->unsignedInteger('per_user_limit')->nullable();
            $table->string('icon', 40)->nullable();
        });
        Schema::create('purchases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('operation_id');
            $table->string('request_hash', 64);
            $table->string('product_key', 60);
            $table->foreign('product_key')->references('key')->on('shop_products');
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('unit_price');
            $table->unsignedInteger('total');
            $table->enum('status', ['completed']);
            $table->json('product_snapshot');
            $table->json('receipt');
            $table->uuid('credit_transaction_id')->unique();
            $table->foreign('credit_transaction_id')->references('id')->on('credit_transactions')->cascadeOnDelete();
            $table->uuid('inventory_transaction_id')->unique();
            $table->foreign('inventory_transaction_id')->references('id')->on('inventory_transactions')->cascadeOnDelete();
            $table->timestamp('created_at', 6);
            $table->unique(['user_id', 'operation_id']);
            $table->index(['user_id', 'created_at']);
        });
        $checks = [
            'wallets' => 'balance BETWEEN 0 AND 2000000000 AND sequence >= 0',
            'credit_transactions' => 'amount BETWEEN -2000000000 AND 2000000000 AND amount != 0 AND balance_after BETWEEN 0 AND 2000000000 AND sequence > 0',
            'shop_products' => 'price BETWEEN 1 AND 1000000 AND (per_user_limit IS NULL OR per_user_limit > 0)',
            'purchases' => 'quantity BETWEEN 1 AND 20 AND unit_price BETWEEN 1 AND 1000000 AND total = quantity * unit_price',
        ];
        foreach ($checks as $table => $check) {
            if (DB::getDriverName() === 'sqlite') {
                $integerFields = match ($table) {
                    'wallets' => ['balance', 'sequence'], 'credit_transactions' => ['amount', 'balance_after', 'sequence'],
                    'shop_products' => ['price'], 'purchases' => ['quantity', 'unit_price', 'total'],
                };
                $check = preg_replace('/\b('.implode('|', $integerFields).')\b/', 'NEW.$1', $check);
                $integerCheck = implode(' AND ', array_map(fn ($field) => "typeof(NEW.{$field}) = 'integer'", $integerFields));
                // Remaining nullable/integer fields also need a NEW prefix in SQLite triggers.
                $check = str_replace('per_user_limit', 'NEW.per_user_limit', $check);
                foreach (['INSERT', 'UPDATE'] as $event) {
                    DB::statement("CREATE TRIGGER {$table}_bounds_{$event} BEFORE {$event} ON {$table} WHEN NOT ({$check} AND {$integerCheck}) BEGIN SELECT RAISE(ABORT, 'Invalid wallet or purchase bounds'); END");
                }
            } else {
                DB::statement("ALTER TABLE {$table} ADD CONSTRAINT {$table}_bounds CHECK ({$check})");
            }
        }
        User::orderBy('id')->each(fn (User $user) => app(WalletService::class)->create($user->id));
        app(PurchaseService::class)->syncCatalog();
    }

    public function down(): void
    {
        foreach (['purchases', 'shop_products', 'credit_transactions', 'wallets'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
