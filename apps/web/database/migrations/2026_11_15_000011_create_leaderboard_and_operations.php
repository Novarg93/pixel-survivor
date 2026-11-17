<?php

use App\Services\PublicProfileService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', fn (Blueprint $t) => $t->boolean('is_platform_operator')->default(false));
        Schema::table('game_runs', function (Blueprint $t) {
            $t->uuid('public_id')->nullable()->unique();
            $t->unsignedInteger('ranking_score')->nullable();
            $t->unsignedBigInteger('ranking_elapsed_us')->nullable();
            $t->boolean('ranking_eligible')->default(false);
            $t->unsignedInteger('review_version')->default(0);
            $t->json('validation_evidence')->nullable();
            $t->timestamp('rewards_awarded_at')->nullable();
            $t->json('reward_receipt')->nullable();
            $t->index(['user_id', 'status', 'mode', 'ranking_eligible', 'ranking_score', 'ranking_elapsed_us', 'finished_at', 'id'], 'run_best_candidate_idx');
            $t->index(['status', 'finished_at'], 'run_review_queue_idx');
        });
        Schema::create('public_profiles', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $t->string('nickname', 96);
            $key = $t->string('nickname_key', 128);
            if (DB::getDriverName() === 'mysql') {
                $key->collation('utf8mb4_bin');
            }
            $t->unique('nickname_key');
            $t->timestamp('nickname_changed_at', 6)->nullable();
        });
        Schema::create('platform_audit_entries', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('actor_key', 64);
            $t->uuid('operation_id');
            $t->string('request_hash', 64);
            $t->string('action', 64);
            $t->string('subject_type', 40);
            $t->string('subject_id', 64);
            $t->string('reason', 500)->nullable();
            $t->json('result');
            $t->json('context');
            $t->timestamp('created_at', 6);
            $t->unique(['actor_key', 'operation_id']);
            $t->index(['subject_type', 'subject_id', 'created_at'], 'platform_subject_history_idx');
        });
        Schema::create('leaderboard_entries', function (Blueprint $t) {
            $t->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $t->foreignUuid('game_run_id')->unique()->constrained('game_runs')->cascadeOnDelete();
            $t->unsignedInteger('score');
            $t->unsignedBigInteger('elapsed_us');
            $t->timestamp('completed_at');
        });
        DB::statement('CREATE INDEX leaderboard_rank_idx ON leaderboard_entries (score DESC, elapsed_us DESC, completed_at DESC, game_run_id ASC)');
        // Historical accepted runs must never receive their XP a second time on review.
        DB::table('game_runs')->where('status', 'accepted')->update([
            'rewards_awarded_at' => DB::raw('COALESCE(finished_at, started_at)'),
            'reward_receipt' => DB::raw('receipt'),
        ]);
        DB::table('users')->orderBy('id')->each(fn (object $u) => app(PublicProfileService::class)->ensure((int) $u->id));
    }

    public function down(): void
    {
        Schema::dropIfExists('leaderboard_entries');
        Schema::dropIfExists('platform_audit_entries');
        Schema::dropIfExists('public_profiles');
        Schema::table('game_runs', function (Blueprint $t) {
            $t->dropIndex('run_best_candidate_idx');
            $t->dropIndex('run_review_queue_idx');
            $t->dropUnique(['public_id']);
            $t->dropColumn(['public_id', 'ranking_score', 'ranking_elapsed_us', 'ranking_eligible', 'review_version', 'validation_evidence', 'rewards_awarded_at', 'reward_receipt']);
        });
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('is_platform_operator'));
    }
};
