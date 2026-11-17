<?php

namespace App\Http\Controllers;

use App\Models\GameRun;
use App\Models\PlatformAuditEntry;
use App\Services\LeaderboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RunHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $data = $request->validate(['page' => 'sometimes|integer|between:1,100000']);
        $rows = GameRun::where('user_id', $request->user()?->id)->orderByDesc('started_at')->orderBy('id')->paginate(20,
            ['id', 'public_id', 'character_id', 'mode', 'status', 'lifecycle_state', 'record', 'started_at', 'finished_at', 'ranking_eligible', 'item_sequence', 'revive_count'], 'page', (int) ($data['page'] ?? 1));

        return Inertia::render('RunHistory', ['runs' => $rows]);
    }

    /** @return array<string,mixed> */
    private function facts(int $userId, string $id, LeaderboardService $leaderboard): array
    {
        $run = GameRun::where('user_id', $userId)->whereKey($id)->firstOrFail();

        return ['run' => $leaderboard->detail($run), 'server_run_id' => $run->id, 'lifecycle' => $run->lifecycle_state, 'review_version' => $run->review_version,
            'initial_receipt' => $run->receipt, 'reward_receipt' => $run->reward_receipt,
            'decisions' => PlatformAuditEntry::where('subject_type', 'game_run')->where('subject_id', $run->public_id)->orderByDesc('created_at')->limit(30)->get(['action', 'reason', 'created_at'])->toArray()];
    }

    public function show(Request $request, string $run, LeaderboardService $leaderboard): Response
    {
        return Inertia::render('RunHistoryDetail', $this->facts((int) $request->user()?->id, $run, $leaderboard));
    }

    public function status(Request $request, string $run, LeaderboardService $leaderboard): JsonResponse
    {
        return response()->json($this->facts((int) $request->user()?->id, $run, $leaderboard));
    }
}
