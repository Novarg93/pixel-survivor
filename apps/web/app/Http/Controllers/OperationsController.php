<?php

namespace App\Http\Controllers;

use App\Models\AccountProgress;
use App\Models\CharacterProgress;
use App\Models\GameRun;
use App\Models\InventoryTransaction;
use App\Models\PaymentOrder;
use App\Models\PlatformAuditEntry;
use App\Models\PublicProfile;
use App\Models\User;
use App\Services\LeaderboardService;
use App\Services\OperationsHealth;
use App\Services\RunReviewService;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OperationsController extends Controller
{
    public function index(Request $request): Response
    {
        $data = $request->validate(['status' => 'sometimes|in:active,accepted,pending_review,rejected', 'page' => 'sometimes|integer|between:1,100000']);
        $query = GameRun::query()->leftJoin('public_profiles as p', 'p.user_id', '=', 'game_runs.user_id')->select('game_runs.*', 'p.nickname');
        $query->where('game_runs.status', $data['status'] ?? 'pending_review');
        $runs = $query->orderByDesc('game_runs.finished_at')->orderBy('game_runs.id')->paginate(20, ['*'], 'page', (int) ($data['page'] ?? 1));

        return Inertia::render('Operations', ['runs' => $runs, 'filter' => $data['status'] ?? 'pending_review',
            'counts' => ['pending_review' => GameRun::where('status', 'pending_review')->count(), 'leaderboard' => app(LeaderboardService::class)->rankedQuery()->count(),
                'payment_failures' => PaymentOrder::where('fulfillment_status', 'failed')->count(), 'users' => User::count()],
            'payment_failures' => PaymentOrder::where(fn ($q) => $q->where('fulfillment_status', 'failed')->orWhereNotNull('verification_error'))->orderByDesc('created_at')->limit(20)
                ->get(['id', 'provider', 'status', 'fulfillment_status', 'verification_error', 'created_at'])->toArray()]);
    }

    public function show(string $run, LeaderboardService $leaderboard): Response
    {
        $model = GameRun::findOrFail($run);

        return Inertia::render('OperationsRun', ['run' => $leaderboard->detail($model), 'server_run_id' => $model->id, 'owner_id' => $model->user_id,
            'review_version' => $model->review_version, 'evidence' => $model->validation_evidence, 'record' => $model->record,
            'initial_receipt' => $model->receipt, 'reward_receipt' => $model->reward_receipt,
            'decisions' => PlatformAuditEntry::where('subject_type', 'game_run')->where('subject_id', $model->public_id)->orderByDesc('created_at')->limit(50)->get(['action', 'reason', 'context', 'result', 'created_at'])->toArray()]);
    }

    public function decide(Request $request, string $run, RunReviewService $review): JsonResponse
    {
        return response()->json($review->decide((int) $request->user()?->id, $run, $request->all()));
    }

    public function health(OperationsHealth $health): JsonResponse
    {
        return response()->json($health->inspect())->header('Cache-Control', 'private, no-store');
    }

    public function user(string $user, WalletService $wallet): Response
    {
        $u = User::findOrFail((int) $user);

        return Inertia::render('OperationsUser', ['user_id' => $u->id, 'public_profile' => PublicProfile::where('user_id', $u->id)->first(['id', 'nickname']),
            'account' => AccountProgress::where('user_id', $u->id)->first(['level', 'xp']),
            'characters' => CharacterProgress::where('user_id', $u->id)->get(['character_id', 'level', 'xp']),
            'inventory_transactions' => InventoryTransaction::where('user_id', $u->id)->orderByDesc('created_at')->orderByDesc('id')->limit(30)->get(['item_id', 'delta', 'balance_after', 'source_type', 'created_at']),
            'wallet_audit' => $wallet->audit($u->id)]);
    }

    public function users(Request $request): Response
    {
        $data = $request->validate(['page' => 'sometimes|integer|between:1,100000']);

        return Inertia::render('OperationsUsers', ['users' => User::query()->leftJoin('public_profiles as p', 'p.user_id', '=', 'users.id')
            ->orderBy('users.id')->paginate(20, ['users.id', 'p.nickname', 'users.is_platform_operator'], 'page', (int) ($data['page'] ?? 1))
            ->through(fn (User $user) => ['id' => $user->id, 'nickname' => $user->getAttribute('nickname'), 'is_platform_operator' => $user->is_platform_operator])]);
    }
}
