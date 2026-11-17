<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gameplay_settings', function (Blueprint $t): void {
            $t->unsignedTinyInteger('id')->primary();
            $t->json('settings');
            $t->timestamps();
        });
        DB::table('gameplay_settings')->insert(['id' => 1, 'settings' => json_encode(array_diff_key(config()->array('premium'), ['consumables' => true, 'max_actions' => true]), JSON_THROW_ON_ERROR), 'created_at' => now(), 'updated_at' => now()]);
        Schema::table('game_runs', fn (Blueprint $t) => $t->unsignedInteger('premium_sequence')->default(0));
        Schema::create('run_upgrade_offers', function (Blueprint $t): void {
            $t->uuid('id')->primary();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignUuid('game_run_id')->constrained()->cascadeOnDelete();
            $t->unsignedSmallInteger('level');
            $t->unsignedInteger('generation')->default(0);
            $t->string('context_hash', 64);
            $t->json('context');
            $t->json('choices');
            $t->timestamps();
            $t->unique(['game_run_id', 'level']);
        });
        Schema::create('run_paid_actions', function (Blueprint $t): void {
            $t->uuid('id')->primary();
            $t->foreignId('user_id')->constrained()->restrictOnDelete();
            $t->foreignUuid('game_run_id')->constrained()->restrictOnDelete();
            $t->uuid('operation_id');
            $t->string('request_hash', 64);
            $t->enum('action', ['skill_reroll', 'resurrection']);
            $t->unsignedInteger('sequence');
            $t->decimal('elapsed', 12, 3);
            $t->unsignedInteger('price_tokens');
            $t->uuid('credit_transaction_id')->unique();
            $t->foreign('credit_transaction_id')->references('id')->on('credit_transactions')->restrictOnDelete();
            $t->foreignUuid('death_id')->nullable()->unique()->constrained('run_deaths')->restrictOnDelete();
            $t->enum('status', ['accepted', 'applied'])->default('accepted');
            $t->json('effect_snapshot');
            $t->json('receipt');
            $t->timestamp('accepted_at', 6);
            $t->timestamp('applied_at')->nullable();
            $t->unique(['user_id', 'operation_id']);
            $t->unique(['game_run_id', 'sequence']);
            $t->index(['user_id', 'accepted_at']);
        });
        $columns = ['id', 'user_id', 'game_run_id', 'operation_id', 'request_hash', 'action', 'sequence', 'elapsed', 'price_tokens', 'credit_transaction_id', 'death_id', 'effect_snapshot', 'receipt', 'accepted_at'];
        $sqlite = DB::getDriverName() === 'sqlite';
        $changed = implode(' OR ', array_map(fn ($c) => $sqlite ? "NEW.$c IS NOT OLD.$c" : "NOT (NEW.$c <=> OLD.$c)", $columns));
        $changed .= " OR (OLD.status = 'applied' AND NEW.status != 'applied')";
        $changed .= $sqlite
            ? " OR (OLD.status = 'applied' AND NEW.applied_at IS NOT OLD.applied_at)"
            : " OR (OLD.status = 'applied' AND NOT (NEW.applied_at <=> OLD.applied_at))";
        $changed .= " OR (NEW.status = 'applied' AND NEW.applied_at IS NULL) OR (NEW.status = 'accepted' AND NEW.applied_at IS NOT NULL)";
        if ($sqlite) {
            DB::statement("CREATE TRIGGER run_paid_actions_immutable_update BEFORE UPDATE ON run_paid_actions WHEN $changed BEGIN SELECT RAISE(ABORT, 'Paid action is immutable'); END");
            DB::statement("CREATE TRIGGER run_paid_actions_immutable_delete BEFORE DELETE ON run_paid_actions BEGIN SELECT RAISE(ABORT, 'Paid action is immutable'); END");
            DB::statement("CREATE TRIGGER run_paid_actions_bounds BEFORE INSERT ON run_paid_actions WHEN NEW.price_tokens < 1 OR NEW.price_tokens > 1000000 OR NEW.sequence < 1 OR NEW.sequence > 128 BEGIN SELECT RAISE(ABORT, 'Invalid paid action bounds'); END");
        } else {
            DB::unprepared("CREATE TRIGGER run_paid_actions_immutable_update BEFORE UPDATE ON run_paid_actions FOR EACH ROW BEGIN IF $changed THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Paid action is immutable'; END IF; END");
            DB::unprepared("CREATE TRIGGER run_paid_actions_immutable_delete BEFORE DELETE ON run_paid_actions FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Paid action is immutable'");
            DB::statement('ALTER TABLE run_paid_actions ADD CONSTRAINT run_paid_actions_bounds CHECK (price_tokens BETWEEN 1 AND 1000000 AND sequence BETWEEN 1 AND 128)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('run_paid_actions');
        Schema::dropIfExists('run_upgrade_offers');
        Schema::table('game_runs', fn (Blueprint $t) => $t->dropColumn('premium_sequence'));
        Schema::dropIfExists('gameplay_settings');
    }
};
