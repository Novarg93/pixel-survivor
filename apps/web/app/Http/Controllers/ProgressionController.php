<?php

namespace App\Http\Controllers;

use App\Services\AccountDashboardService;
use App\Services\AccountLock;
use App\Services\ProgressionService;
use App\Services\PurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProgressionController extends Controller
{
    public function dashboard(Request $request, ProgressionService $service): Response
    {
        return DB::transaction(function () use ($request, $service): Response {
            $userId = (int) $request->user()?->id;
            AccountLock::acquire($userId);
            $progression = $service->snapshot($userId);
            $snapshot = app(PurchaseService::class)->snapshot($userId);

            return Inertia::render('Dashboard', ['progression' => $progression, 'inventory' => $snapshot['inventory'],
                'commerce' => ['balance' => $snapshot['wallet']['balance'], 'purchases' => array_slice($snapshot['purchases']['data'], 0, 3)],
                'account' => app(AccountDashboardService::class)->summary($userId)]);
        }, 5);
    }

    public function show(Request $request, ProgressionService $service): JsonResponse
    {
        return response()->json($service->snapshot((int) $request->user()?->id));
    }

    public function start(Request $request, ProgressionService $service): JsonResponse
    {
        return response()->json($service->start((int) $request->user()?->id, $request->only(['operation_id', 'client_run_id', 'character_id', 'biome_id', 'mode'])));
    }

    public function finish(Request $request, string $run, ProgressionService $service): JsonResponse
    {
        $data = $request->validate(['record' => 'required|array:id,outcome,completionKind,elapsed,score,kills,level,finishedAt,abilities,byKind,eliteByKind,finalEncounter,details']);

        return response()->json($service->finish((int) $request->user()?->id, $run, $data['record']));
    }
}
