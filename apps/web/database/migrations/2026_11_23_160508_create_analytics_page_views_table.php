<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('analytics_page_views', function (Blueprint $table) {
            $table->uuid('event_id')->primary();
            $table->char('visitor_hash', 64);
            $table->date('viewed_on');
            $table->index(['viewed_on', 'visitor_hash']);
        });

        Schema::table('users', fn (Blueprint $table) => $table->index('created_at', 'users_registration_date_index'));
        Schema::table('game_runs', fn (Blueprint $table) => $table->index(['started_at', 'user_id'], 'game_runs_analytics_start_index'));
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('game_runs', fn (Blueprint $table) => $table->dropIndex('game_runs_analytics_start_index'));
        Schema::table('users', fn (Blueprint $table) => $table->dropIndex('users_registration_date_index'));
        Schema::dropIfExists('analytics_page_views');
    }
};
