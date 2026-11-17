<?php

namespace App\Http\Controllers;

use App\Services\LeaderboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class LeaderboardController extends Controller
{
    public function index(Request $request, LeaderboardService $leaderboard): Response
    {
        $page = $request->validate(['page' => 'sometimes|integer|between:1,100000']);
        $data = $leaderboard->page((int) ($page['page'] ?? 1), $request->user()?->id);
        if ($request->is('api/*')) {
            return response()->json($data)->header('Cache-Control', 'private, no-store');
        }
        $response = Inertia::render('Leaderboard', ['leaderboard' => $data])->toResponse($request);
        $response->headers->set('Cache-Control', 'private, no-store');

        return $response;
    }

    public function show(Request $request, string $publicRun, LeaderboardService $leaderboard): Response
    {
        $data = $leaderboard->publicRun($publicRun);
        if ($request->is('api/*')) {
            return response()->json($data)->header('Cache-Control', 'private, no-store');
        }

        $response = Inertia::render('LeaderboardRun', ['run' => $data])->toResponse($request);
        $response->headers->set('Cache-Control', 'private, no-store');

        return $response;
    }
}
