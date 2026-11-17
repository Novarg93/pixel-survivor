<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reward_grants', function (Blueprint $table) {
            $table->dropForeign(['game_run_id']);
            $table->foreign('game_run_id')->references('id')->on('game_runs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('reward_grants', function (Blueprint $table) {
            $table->dropForeign(['game_run_id']);
            $table->foreign('game_run_id')->references('id')->on('game_runs');
        });
    }
};
