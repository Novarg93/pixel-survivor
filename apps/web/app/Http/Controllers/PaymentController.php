<?php

namespace App\Http\Controllers;

use App\Models\PaymentOrder;
use App\Payments\LocalDevPaymentGuard;
use App\Payments\LocalDevPaymentService;
use App\Payments\PaymentOrderService;
use App\Payments\PaymentPricingService;
use App\Payments\PaymentProblem;
use App\Payments\PaymentProviderRegistry;
use App\Payments\PaymentService;
use App\Services\AccountLock;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function create(Request $request, PaymentOrderService $orders): JsonResponse
    {
        app(PaymentProviderRegistry::class)->authorizeRequest($request);
        $dev = config('payments.provider') === 'dev';
        if ($dev) {
            $request->validate(['dev_confirmed' => 'required|accepted']);
        }
        $order = $orders->create((int) $request->user()?->id, $request->all());
        try {
            $order = $orders->initializeCheckout($order->user_id, $order->id);
            if ($dev) {
                $order = app(LocalDevPaymentService::class)->confirm($order);
            }
        } catch (PaymentProblem $problem) {
            return response()->json(['order' => app(PaymentService::class)->orderDto($order->fresh()), 'error' => $problem->reason], 503);
        }

        return response()->json(['order' => app(PaymentService::class)->orderDto($order)]);
    }

    public function checkout(Request $request, string $order, PaymentOrderService $orders): JsonResponse
    {
        app(PaymentProviderRegistry::class)->authorizeRequest($request);
        $model = $orders->initializeCheckout((int) $request->user()?->id, $order);

        return response()->json(['order' => app(PaymentService::class)->orderDto($model)]);
    }

    public function confirmDev(Request $request, string $order): JsonResponse
    {
        app(LocalDevPaymentGuard::class)->authorizeRequest($request);
        $request->validate(['dev_confirmed' => 'required|accepted']);
        $model = PaymentOrder::where('user_id', $request->user()?->id)->whereKey($order)->where('provider', 'dev')->firstOrFail();
        $model = app(LocalDevPaymentService::class)->confirm($model);

        return response()->json(['order' => app(PaymentService::class)->orderDto($model), 'wallet_balance' => app(WalletService::class)->snapshot($model->user_id)['balance']]);
    }

    /** @return array<string, mixed> */
    public function quote(Request $request, PaymentPricingService $pricing): array
    {
        app(PaymentProviderRegistry::class)->authorizeRequest($request);

        return ['quote' => $pricing->quote($pricing->selection($request->all()))->toArray()];
    }

    /** @return array<string, mixed> */
    private function snapshot(Request $request, string $id): array
    {
        return DB::transaction(function () use ($request, $id): array {
            $userId = (int) $request->user()?->id;
            AccountLock::acquire($userId);
            $order = PaymentOrder::where('user_id', $userId)->whereKey($id)->firstOrFail();

            return ['order' => app(PaymentService::class)->orderDto($order), 'wallet_balance' => app(WalletService::class)->snapshot($userId)['balance']];
        }, 5);
    }

    public function show(Request $request, string $order): JsonResponse
    {
        return response()->json($this->snapshot($request, $order));
    }

    public function result(Request $request, string $order, ?string $view = null): Response
    {
        return Inertia::render('PaymentResult', [
            ...$this->snapshot($request, $order),
            'checkout_return' => $view === 'success',
        ]);
    }
}
