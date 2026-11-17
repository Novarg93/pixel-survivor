<?php

namespace App\Http\Controllers;

use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function show(Request $request, InventoryService $inventory): JsonResponse
    {
        return response()->json($inventory->snapshot((int) $request->user()?->id));
    }

    public function activate(Request $request, InventoryService $inventory): JsonResponse
    {
        $data = $request->validate(['operation_id' => 'required|uuid', 'quantity' => 'prohibited', 'expires_at' => 'prohibited', 'multiplier' => 'prohibited', 'user_id' => 'prohibited']);

        return response()->json($inventory->activateXpBoost((int) $request->user()?->id, $data['operation_id']));
    }
}
