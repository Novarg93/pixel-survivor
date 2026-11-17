<?php

use App\Payments\PaymentService;
use App\Payments\PaymentStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $statuses = array_column(PaymentStatus::cases(), 'value');
        Schema::create('payment_packages', function (Blueprint $t) {
            $t->string('id', 60)->primary();
            $t->string('name', 120);
            $t->text('description')->nullable();
            $t->unsignedInteger('credits_amount');
            $t->unsignedInteger('amount_minor');
            $t->string('currency', 3);
            $t->unsignedTinyInteger('currency_exponent')->default(2);
            $t->enum('mode', ['test', 'live'])->default('test');
            $t->boolean('active')->default(true);
            $t->unsignedInteger('sort_order')->default(0);
        });
        Schema::create('payment_orders', function (Blueprint $t) use ($statuses) {
            $t->uuid('id')->primary();
            $t->foreignId('user_id')->constrained()->restrictOnDelete();
            $t->string('package_id', 60);
            $t->foreign('package_id')->references('id')->on('payment_packages')->restrictOnDelete();
            $t->uuid('operation_id');
            $t->string('request_hash', 64);
            $t->json('package_snapshot');
            $t->unsignedInteger('credits_amount');
            $t->unsignedInteger('amount_minor');
            $t->string('currency', 3);
            $t->unsignedTinyInteger('currency_exponent');
            $t->string('provider', 40);
            $t->enum('mode', ['test', 'live']);
            $t->string('provider_checkout_id', 120)->nullable();
            $t->string('provider_payment_id', 120)->nullable();
            $t->enum('status', $statuses)->default('created');
            $t->enum('fulfillment_status', ['not_ready', 'pending', 'failed', 'fulfilled'])->default('not_ready');
            $t->string('checkout_url', 500)->nullable();
            $t->unsignedInteger('checkout_attempts')->default(0);
            $t->string('checkout_error', 120)->nullable();
            $t->unsignedInteger('fulfillment_attempts')->default(0);
            $t->string('fulfillment_error', 120)->nullable();
            $t->string('verification_error', 120)->nullable();
            $t->string('failure_reason', 120)->nullable();
            $t->timestamp('created_at', 6);
            $t->timestamp('expires_at');
            $t->timestamp('confirmed_at')->nullable();
            $t->timestamp('fulfilled_at')->nullable();
            $t->timestamp('last_checked_at')->nullable();
            $t->uuid('credit_transaction_id')->nullable()->unique();
            $t->foreign('credit_transaction_id')->references('id')->on('credit_transactions')->restrictOnDelete();
            $t->json('metadata');
            $t->unique(['user_id', 'operation_id']);
            $t->unique(['provider', 'provider_checkout_id']);
            $t->unique(['provider', 'provider_payment_id']);
            $t->index(['user_id', 'created_at']);
        });
        Schema::create('payment_confirmations', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->uuid('order_id')->unique();
            $t->foreign('order_id')->references('id')->on('payment_orders')->restrictOnDelete();
            $t->string('provider', 40);
            $t->string('provider_payment_id', 120);
            $t->string('provider_checkout_id', 120);
            $t->unsignedInteger('amount_minor');
            $t->string('currency', 3);
            $t->timestamp('settled_at');
            $t->timestamp('verified_at');
            $t->json('evidence');
            $t->string('evidence_hash', 64);
            $t->enum('source_type', ['webhook', 'reconciliation']);
            $t->string('source_reference', 120);
            $t->unique(['provider', 'provider_payment_id']);
        });
        Schema::create('payment_webhook_inbox', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->string('provider', 40);
            $t->string('provider_event_id', 120);
            $t->string('event_type', 80);
            $t->uuid('order_id')->nullable();
            $t->foreign('order_id')->references('id')->on('payment_orders')->restrictOnDelete();
            $t->text('payload');
            $t->string('payload_hash', 64);
            $t->timestamp('received_at', 6);
            $t->timestamp('last_received_at', 6);
            $t->timestamp('verified_at');
            $t->unsignedInteger('delivery_count')->default(1);
            $t->unsignedInteger('attempts')->default(0);
            $t->enum('status', ['pending', 'processing', 'processed', 'failed', 'ignored', 'orphan'])->default('pending');
            $t->string('error', 120)->nullable();
            $t->timestamp('processed_at')->nullable();
            $t->unique(['provider', 'provider_event_id']);
            $t->index(['status', 'received_at']);
        });
        Schema::create('test_provider_payments', function (Blueprint $t) use ($statuses) {
            $t->string('id', 120)->primary();
            $t->string('checkout_id', 120)->unique();
            $t->uuid('order_id')->unique();
            $t->foreign('order_id')->references('id')->on('payment_orders')->restrictOnDelete();
            $t->foreignId('user_id')->constrained()->restrictOnDelete();
            $t->unsignedInteger('amount_minor');
            $t->string('currency', 3);
            $t->enum('status', $statuses)->default('processing');
            $t->timestamp('expires_at');
            $t->timestamp('settled_at')->nullable();
            $t->timestamp('created_at', 6);
        });
        Schema::create('payment_audit_entries', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->uuid('order_id');
            $t->foreign('order_id')->references('id')->on('payment_orders')->restrictOnDelete();
            $t->enum('actor_type', ['user', 'webhook', 'cli', 'test_provider', 'system']);
            $t->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('action', 80);
            $t->json('metadata');
            $t->timestamp('created_at', 6);
            $t->index(['order_id', 'created_at']);
        });
        foreach (['payment_packages' => ['credits_amount', 'amount_minor', 'currency_exponent'], 'payment_orders' => ['credits_amount', 'amount_minor', 'currency_exponent'],
            'payment_confirmations' => ['amount_minor'], 'test_provider_payments' => ['amount_minor']] as $table => $fields) {
            $conditions = [];
            foreach ($fields as $field) {
                $range = match ($field) {
                    'credits_amount' => 'BETWEEN 1 AND 1000000', 'currency_exponent' => 'BETWEEN 0 AND 3', default => 'BETWEEN 1 AND 2000000000'
                };
                $conditions[] = "$field $range";
            }
            $check = implode(' AND ', $conditions);
            if (DB::getDriverName() === 'sqlite') {
                $check = preg_replace('/\b('.implode('|', $fields).')\b/', 'NEW.$1', $check);
                $check .= ' AND '.implode(' AND ', array_map(fn ($f) => "typeof(NEW.$f) = 'integer'", $fields));
                foreach (['INSERT', 'UPDATE'] as $event) {
                    DB::statement("CREATE TRIGGER {$table}_bounds_{$event} BEFORE {$event} ON {$table} WHEN NOT ($check) BEGIN SELECT RAISE(ABORT, 'Invalid payment units'); END");
                }
            } else {
                DB::statement("ALTER TABLE {$table} ADD CONSTRAINT {$table}_bounds CHECK ($check)");
            }
        }
        app(PaymentService::class)->syncPackages();
    }

    public function down(): void
    {
        foreach (['payment_audit_entries', 'test_provider_payments', 'payment_webhook_inbox', 'payment_confirmations', 'payment_orders', 'payment_packages'] as $table) {
            Schema::dropIfExists($table);
        }
        // Existing Wallet ledger credits are never silently reversed by a schema rollback.
    }
};
