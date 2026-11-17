<?php

namespace App\Http\Controllers;

use App\Services\RunPaidActionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RunPaidActionController extends Controller
{
    public function offer(Request $request, string $run, RunPaidActionService $actions): JsonResponse
    {
        return response()->json($actions->offer((int) $request->user()?->id, $run, $request->all()));
    }

    public function execute(Request $request, string $run, RunPaidActionService $actions): JsonResponse
    {
        return response()->json($actions->execute((int) $request->user()?->id, $run, $request->all()));
    }

    public function recover(Request $request, string $run, string $operation, RunPaidActionService $actions): JsonResponse
    {
        return response()->json($actions->recover((int) $request->user()?->id, $run, $operation));
    }

    public function acknowledge(Request $request, string $run, string $operation, RunPaidActionService $actions): JsonResponse
    {
        $actions->acknowledge((int) $request->user()?->id, $run, $operation);

        return response()->json(['acknowledged' => true]);
    }
}
