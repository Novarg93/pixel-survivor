<?php

namespace App\Http\Controllers;

use App\Models\PaymentOrder;
use App\Models\PaymentWebhookInbox;
use App\Models\TestProviderPayment;
use App\Payments\PaymentAudit;
use App\Payments\PaymentStatus;
use App\Payments\PaymentWebhookProcessor;
use App\Payments\Providers\TestPaymentProvider;
use App\Payments\TestPaymentGuard;
use App\Services\AccountLock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class TestCheckoutController extends Controller
{
    private function payment(Request $request, string $checkout): TestProviderPayment
    {
        app(TestPaymentGuard::class)->authorizeRequest($request);

        return TestProviderPayment::where('user_id', $request->user()?->id)->where('checkout_id', $checkout)->firstOrFail();
    }

    public function show(Request $request, string $checkout): View
    {
        $payment = $this->payment($request, $checkout);
        $order = PaymentOrder::where('user_id', $request->user()?->id)->whereKey($payment->order_id)->firstOrFail();

        return view('test-checkout', ['payment' => $payment, 'order' => $order]);
    }

    public function simulate(Request $request, string $checkout, TestPaymentProvider $provider, PaymentWebhookProcessor $processor): RedirectResponse
    {
        $payment = $this->payment($request, $checkout);
        $v = $request->validate(['scenario' => ['required', Rule::in(['processing', 'succeeded', 'failed', 'canceled', 'expired', 'duplicate', 'late_failed'])]]);
        if ($v['scenario'] === 'duplicate') {
            $event = PaymentWebhookInbox::where('order_id', $payment->order_id)->orderByDesc('received_at')->firstOrFail();
            $delivery = $provider->sign($event->payload);
        } elseif ($v['scenario'] === 'late_failed') {
            $delivery = $provider->event($checkout, PaymentStatus::Failed);
        } else {
            $delivery = $provider->simulate((int) $request->user()?->id, $checkout, PaymentStatus::from($v['scenario']));
        }
        DB::transaction(function () use ($payment, $request, $v): void {
            AccountLock::acquire($payment->user_id);
            PaymentAudit::record(PaymentOrder::whereKey($payment->order_id)->firstOrFail(), 'test_scenario', ['scenario' => $v['scenario']], 'test_provider', (int) $request->user()?->id);
        }, 5);
        $processor->receive('test', $delivery->raw, $delivery->signature);

        return redirect('/payments/'.$payment->order_id);
    }
}
