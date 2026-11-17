<?php

namespace App\Http\Controllers;

use App\Models\PaymentOrder;
use App\Models\Purchase;
use App\Services\AccountDashboardService;
use App\Services\OrderInvoiceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function orders(Request $request, AccountDashboardService $account): Response
    {
        $filters = $request->validate(['page' => 'sometimes|integer|between:1,1000000', 'direction' => 'sometimes|in:asc,desc',
            'status' => 'nullable|in:created,checkout_pending,processing,succeeded,failed,canceled,expired',
            'fulfillment' => 'nullable|in:not_ready,pending,failed,fulfilled']);

        return Inertia::render('account/Orders', ['orders' => $account->orders((int) $request->user()?->id, $filters), 'filters' => $filters]);
    }

    public function order(Request $request, string $kind, string $order, AccountDashboardService $account): Response|RedirectResponse
    {
        $userId = (int) $request->user()?->id;
        if ($kind === 'shop') {
            Purchase::where('user_id', $userId)->whereKey($order)->firstOrFail();

            return redirect('/inventory#service-purchases');
        }
        $record = $account->payment(PaymentOrder::where('user_id', $userId)->whereKey($order)->firstOrFail());

        return Inertia::render('account/Order', ['order' => $record]);
    }

    public function invoice(Request $request, string $order, OrderInvoiceService $invoices): \Illuminate\Http\Response
    {
        $request->validate(['download' => 'sometimes|boolean', 'preview' => 'sometimes|boolean']);
        $payment = PaymentOrder::where('user_id', (int) $request->user()?->id)->whereKey($order)->firstOrFail();
        $invoice = $invoices->make($payment, $request->user());

        if ($request->boolean('preview') && ! $request->boolean('download')) {
            return response((string) $invoice->toHtml())->header('Content-Type', 'text/html; charset=UTF-8')->header('X-Frame-Options', 'SAMEORIGIN');
        }

        return $request->boolean('download') ? $invoice->download() : $invoice->stream();
    }

    public function transactions(Request $request, AccountDashboardService $account): Response
    {
        $filters = $request->validate(['page' => 'sometimes|integer|between:1,1000000',
            'type' => 'nullable|in:payment_credit,shop_purchase,level_reward,admin_adjustment,purchase_refund', 'status' => 'nullable|in:available,pending']);
        $userId = (int) $request->user()?->id;

        return Inertia::render('account/Transactions', ['transactions' => $account->transactions($userId, $filters), 'filters' => $filters,
            'balances' => $account->balances($userId), 'pendingRewards' => $account->pendingRewards($userId), 'tokenHistory' => $request->is('account/tokens')]);
    }

    public function usage(Request $request, AccountDashboardService $account): Response
    {
        $request->validate(['page' => 'sometimes|integer|between:1,1000000']);

        return Inertia::render('account/Usage', ['usage' => $account->usage((int) $request->user()?->id)]);
    }
}
