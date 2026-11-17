<?php

namespace App\Http\Controllers;

use App\Services\OperationsHealth;
use Illuminate\Http\JsonResponse;

class PublicHealthController extends Controller
{
    public function __invoke(OperationsHealth $health): JsonResponse
    {
        $ok = $health->databaseAvailable();

        return response()->json(['status' => $ok ? 'ok' : 'unavailable'], $ok ? 200 : 503)->header('Cache-Control', 'no-store');
    }
}
