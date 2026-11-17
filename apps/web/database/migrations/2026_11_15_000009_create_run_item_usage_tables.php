<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('game_runs', function (Blueprint $t) {
            $t->enum('lifecycle_state', ['active', 'awaiting_revive', 'closed', 'expired'])->default('active');
            $t->uuid('death_id')->nullable();
            $t->unsignedSmallInteger('revive_count')->default(0);
            $t->unsignedInteger('item_sequence')->default(0);
            $t->timestamp('session_expires_at')->nullable()->index();
        });
        Schema::create('run_deaths', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignUuid('game_run_id')->constrained()->cascadeOnDelete();
            $t->decimal('elapsed', 12, 3);
            $t->enum('status', ['awaiting_revive', 'revived', 'declined', 'expired']);
            $t->timestamp('requested_at');
            $t->timestamp('expires_at')->index();
            $t->timestamp('revived_at')->nullable();
        });
        Schema::create('run_item_usages', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignId('user_id')->constrained()->restrictOnDelete();
            $t->foreignUuid('game_run_id')->constrained()->restrictOnDelete();
            $t->string('item_id', 60);
            $t->foreign('item_id')->references('id')->on('item_definitions')->restrictOnDelete();
            $t->uuid('inventory_transaction_id')->unique();
            $t->foreign('inventory_transaction_id')->references('id')->on('inventory_transactions')->restrictOnDelete();
            $t->uuid('death_id')->nullable()->unique();
            $t->foreign('death_id')->references('id')->on('run_deaths')->restrictOnDelete();
            $t->uuid('operation_id');
            $t->string('request_hash', 64);
            $t->unsignedInteger('sequence');
            $t->decimal('elapsed', 12, 3);
            $t->enum('status', ['accepted', 'applied'])->default('accepted');
            $t->timestamp('accepted_at', 6);
            $t->timestamp('applied_at')->nullable();
            $t->json('effect_snapshot');
            $t->json('receipt');
            $t->json('metadata');
            $t->unique(['user_id', 'operation_id']);
            $t->unique(['game_run_id', 'sequence']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('run_item_usages');
        Schema::dropIfExists('run_deaths');
        Schema::table('game_runs', fn (Blueprint $t) => $t->dropColumn(['lifecycle_state', 'death_id', 'revive_count', 'item_sequence', 'session_expires_at']));
    }
};
