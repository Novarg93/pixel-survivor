<?php

namespace App\Services;

use App\Models\GameRun;
use App\Models\PaymentOrder;
use App\Models\PaymentWebhookInbox;
use App\Models\RewardGrant;
use App\Payments\PaymentDiagnostics;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class OperationsHealth
{
    public function databaseAvailable(): bool
    {
        try {
            DB::connection()->selectOne('SELECT 1 AS available');

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    public function expiredRuns(?int $userId = null): int
    {
        return GameRun::where('status', 'active')->whereIn('lifecycle_state', ['active', 'awaiting_revive'])->when($userId !== null, fn ($q) => $q->where('user_id', $userId))
            ->where(function ($q): void {
                $q->where('session_expires_at', '<=', now())
                    ->orWhere(fn ($s) => $s->whereNull('session_expires_at')->where('started_at', '<=', now()->subSeconds(config('run_items.session_ttl_seconds'))))
                    ->orWhereExists(fn ($s) => $s->selectRaw('1')->from('run_deaths as d')->whereColumn('d.id', 'game_runs.death_id')->where('d.status', 'awaiting_revive')->where('d.expires_at', '<=', now()));
            })->count();
    }

    /** @return array<string,mixed> */
    public function leaderboard(): array
    {
        $eligible = DB::table('game_runs as r')->where('r.status', 'accepted')->where('r.mode', 'normal')->where('r.ranking_eligible', true);
        $missing = (clone $eligible)->whereNotExists(fn ($s) => $s->selectRaw('1')->from('leaderboard_entries as e')->whereColumn('e.user_id', 'r.user_id'))->distinct()->count('r.user_id');
        $validEntries = app(LeaderboardService::class)->rankedQuery()->count();
        $wrongBest = DB::table('leaderboard_entries as e')->whereExists(function ($s): void {
            $s->selectRaw('1')->from('game_runs as b')->whereColumn('b.user_id', 'e.user_id')->where('b.status', 'accepted')->where('b.mode', 'normal')->where('b.ranking_eligible', true)
                ->where(function ($w): void {
                    $w->whereColumn('b.ranking_score', '>', 'e.score')
                        ->orWhere(fn ($a) => $a->whereColumn('b.ranking_score', 'e.score')->whereColumn('b.ranking_elapsed_us', '>', 'e.elapsed_us'))
                        ->orWhere(fn ($a) => $a->whereColumn('b.ranking_score', 'e.score')->whereColumn('b.ranking_elapsed_us', 'e.elapsed_us')->whereColumn('b.finished_at', '>', 'e.completed_at'))
                        ->orWhere(fn ($a) => $a->whereColumn('b.ranking_score', 'e.score')->whereColumn('b.ranking_elapsed_us', 'e.elapsed_us')->whereColumn('b.finished_at', 'e.completed_at')->whereColumn('b.id', '<', 'e.game_run_id'));
                });
        })->count();
        $scoreDrift = (clone $eligible)->whereRaw("ranking_score <> JSON_EXTRACT(record, '$.score') OR ranking_elapsed_us <> ROUND(JSON_EXTRACT(record, '$.elapsed') * 1000000)")->count();

        return ['entries' => DB::table('leaderboard_entries')->count(), 'missing_players' => $missing,
            'stale_entries' => DB::table('leaderboard_entries')->count() - $validEntries, 'not_best_entries' => $wrongBest, 'source_score_drift' => $scoreDrift,
            'assessed_accepted_ineligible' => GameRun::where('status', 'accepted')->where('mode', 'normal')->whereNotNull('validation_evidence')->where('ranking_eligible', false)->count(),
            'unassessed_accepted' => GameRun::where('status', 'accepted')->where('mode', 'normal')->whereNull('ranking_score')->count()];
    }

    /** Closed diagnostics: no provider requests, payloads, credentials or automatic repair.
     * @return array<string,mixed>
     */
    public function inspect(?int $userId = null): array
    {
        if (! $this->databaseAvailable()) {
            return ['database' => false, 'error' => 'database_unavailable'];
        }
        try {
            $files = array_keys(app('migrator')->getMigrationFiles(database_path('migrations')));
            $ran = app('migration.repository')->getRan();
            $queue = config('queue.default');
            $payments = app(PaymentDiagnostics::class)->inspect();
            $wallet = $userId === null ? $payments['wallet_audit'] : app(WalletService::class)->audit($userId);

            return ['database' => true, 'driver' => DB::getDriverName(), 'pending_migrations' => array_values(array_diff($files, $ran)),
                'queue' => ['driver' => $queue, 'pending' => $queue === 'database' && Schema::hasTable('jobs') ? DB::table('jobs')->count() : null,
                    'failed' => Schema::hasTable('failed_jobs') ? DB::table('failed_jobs')->count() : null, 'worker_liveness' => 'not_observed'],
                'payments' => ['stuck_orders' => PaymentOrder::whereIn('status', ['created', 'checkout_pending', 'processing'])->where('expires_at', '<', now())->count(),
                    'fulfillment_failures' => PaymentOrder::where('fulfillment_status', 'failed')->count(), 'issues_count' => count($payments['issues']), 'issues' => array_slice($payments['issues'], 0, 50),
                    'unprocessed_webhooks' => PaymentWebhookInbox::whereNotIn('status', ['processed', 'ignored'])->count()],
                'wallet' => ['checked' => $wallet['checked'], 'mismatch_count' => count($wallet['mismatches']), 'mismatches' => array_slice($wallet['mismatches'], 0, 50)],
                'inventory' => app(InventoryDiagnostics::class)->inspect($userId),
                'rewards' => ['pending' => RewardGrant::where('fulfillment_status', '!=', 'fulfilled')->when($userId !== null, fn ($q) => $q->where('user_id', $userId))->count(),
                    'failed' => RewardGrant::whereNotNull('last_fulfillment_error')->when($userId !== null, fn ($q) => $q->where('user_id', $userId))->count()],
                'runs' => ['unfinished' => GameRun::where('status', 'active')->whereIn('lifecycle_state', ['active', 'awaiting_revive'])->count(), 'expired_candidates' => $this->expiredRuns($userId),
                    'pending_review' => GameRun::where('status', 'pending_review')->count(), 'rejected' => GameRun::where('status', 'rejected')->count(),
                    'accepted_missing_award_marker' => GameRun::where('status', 'accepted')->where('mode', 'normal')->whereNull('rewards_awarded_at')->count()],
                'leaderboard' => $this->leaderboard()];
        } catch (\Throwable) {
            return ['database' => true, 'error' => 'diagnostics_unavailable'];
        }
    }
}
