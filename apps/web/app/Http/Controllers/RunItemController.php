<?php

namespace App\Http\Controllers;

use App\Services\RunItemService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RunItemController extends Controller
{
    public function show(Request $request, string $run, RunItemService $items): JsonResponse
    {
        return response()->json($items->snapshot((int) $request->user()?->id, $run));
    }

    public function death(Request $request, string $run, RunItemService $items): JsonResponse
    {
        return response()->json($items->death((int) $request->user()?->id, $run, $request->all()));
    }

    public function consume(Request $request, string $run, RunItemService $items): JsonResponse
    {
        return response()->json($items->consume((int) $request->user()?->id, $run, $request->all()));
    }

    public function acknowledge(Request $request, string $run, string $usage, RunItemService $items): JsonResponse
    {
        $items->acknowledge((int) $request->user()?->id, $run, $usage);

        return response()->json(['acknowledged' => true]);
    }
}
