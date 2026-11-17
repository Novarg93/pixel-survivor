<?php

namespace App\Http\Controllers;

use App\Payments\PaymentService;
use App\Services\AccountDashboardService;
use App\Services\InventoryService;
use App\Services\PurchaseService;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommerceController extends Controller
{
    private function page(Request $request): int
    {
        return (int) ($request->validate(['page' => 'sometimes|integer|between:1,1000000'])['page'] ?? 1);
    }

    public function walletPage(Request $request, WalletService $wallet): Response
    {
        return Inertia::render('Wallet', ['wallet' => $wallet->snapshot((int) $request->user()?->id, $this->page($request)), 'payments' => app(PaymentService::class)->snapshot((int) $request->user()?->id, (int) ($request->validate(['payment_page' => 'sometimes|integer|between:1,1000000'])['payment_page'] ?? 1))]);
    }

    public function shopPage(Request $request, PurchaseService $shop): Response
    {
        return Inertia::render('Shop', ['shop' => $shop->snapshot((int) $request->user()?->id, $this->page($request))]);
    }

    public function inventoryPage(Request $request, InventoryService $inventory, AccountDashboardService $account): Response
    {
        $request->validate(['purchases_page' => 'sometimes|integer|between:1,1000000', 'usage_page' => 'sometimes|integer|between:1,1000000']);
        $userId = (int) $request->user()?->id;

        return Inertia::render('Inventory', ['inventory' => $inventory->snapshot($userId), 'purchases' => $account->purchases($userId), 'usage' => $account->usage($userId)]);
    }

    public function wallet(Request $request, WalletService $wallet): JsonResponse
    {
        return response()->json($wallet->snapshot((int) $request->user()?->id, $this->page($request)));
    }

    public function shop(Request $request, PurchaseService $shop): JsonResponse
    {
        return response()->json($shop->snapshot((int) $request->user()?->id, $this->page($request)));
    }

    public function purchase(Request $request, PurchaseService $shop): JsonResponse
    {
        return response()->json($shop->purchase((int) $request->user()?->id, $request->all()));
    }
}
