<?php

namespace App\Http\Controllers;

use App\Services\PublicProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicProfileController extends Controller
{
    public function edit(Request $request, PublicProfileService $profiles): Response
    {
        return Inertia::render('settings/PublicProfile', ['profile' => $profiles->dto($profiles->ensure((int) $request->user()?->id))]);
    }

    public function update(Request $request, PublicProfileService $profiles): JsonResponse
    {
        return response()->json($profiles->rename((int) $request->user()?->id, $request->all()));
    }
}
