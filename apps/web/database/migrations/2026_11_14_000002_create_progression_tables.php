<?php

use App\Services\ProgressionService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('level')->default(1);
            $table->unsignedSmallInteger('xp')->default(0);
            $table->timestamps();
        });
        Schema::create('character_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('character_id', 40);
            $table->unsignedTinyInteger('level')->default(1);
            $table->unsignedSmallInteger('xp')->default(0);
            $table->timestamps();
            $table->unique(['user_id', 'character_id']);
        });
        Schema::create('game_runs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('client_run_id');
            $table->uuid('operation_id');
            $table->string('start_hash', 64);
            $table->string('finish_hash', 64)->nullable();
            $table->string('character_id', 40);
            $table->string('biome_id', 40);
            $table->enum('mode', ['normal', 'practice']);
            $table->enum('status', ['active', 'accepted', 'pending_review', 'rejected'])->default('active');
            $table->string('config_version', 40);
            $table->json('start_snapshot');
            $table->json('record')->nullable();
            $table->json('receipt')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->unique(['user_id', 'operation_id']);
            $table->unique(['user_id', 'client_run_id']);
            $table->index(['user_id', 'started_at']);
        });
        Schema::create('level_rewards', function (Blueprint $table) {
            $table->id();
            $table->string('track', 50);
            $table->unsignedTinyInteger('level');
            $table->string('config_version', 40);
            $table->json('rewards');
            $table->unique(['track', 'level', 'config_version']);
        });
        Schema::create('reward_grants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('level_reward_id')->constrained('level_rewards');
            $table->foreignUuid('game_run_id')->nullable()->constrained('game_runs');
            $table->string('track', 50);
            $table->unsignedTinyInteger('level');
            $table->json('fulfillment');
            $table->timestamp('created_at');
            $table->unique(['user_id', 'track', 'level']);
        });
        foreach (['account_progress', 'character_progress'] as $name) {
            $check = 'NEW.level BETWEEN 1 AND 10 AND NEW.xp BETWEEN 0 AND 99 AND (NEW.level < 10 OR NEW.xp = 0) AND typeof(NEW.level) = \'integer\' AND typeof(NEW.xp) = \'integer\'';
            if (DB::getDriverName() === 'sqlite') {
                foreach (['INSERT', 'UPDATE'] as $event) {
                    DB::statement("CREATE TRIGGER {$name}_bounds_{$event} BEFORE {$event} ON {$name} WHEN NOT ({$check}) BEGIN SELECT RAISE(ABORT, 'Invalid progression bounds'); END");
                }
            } else {
                DB::statement("ALTER TABLE {$name} ADD CONSTRAINT {$name}_bounds CHECK (level BETWEEN 1 AND 10 AND xp BETWEEN 0 AND 99 AND (level < 10 OR xp = 0))");
            }
        }
        app(ProgressionService::class)->syncCatalog();
        DB::table('users')->orderBy('id')->each(fn (object $user) => app(ProgressionService::class)->initialize((int) $user->id));
    }

    public function down(): void
    {
        foreach (['reward_grants', 'level_rewards', 'game_runs', 'character_progress', 'account_progress'] as $name) {
            Schema::dropIfExists($name);
        }
    }
};
