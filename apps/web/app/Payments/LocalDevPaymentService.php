<?php

namespace App\Payments;

use App\Models\PaymentOrder;
use App\Payments\Providers\LocalDevPaymentProvider;

class LocalDevPaymentService
{
    public function confirm(PaymentOrder $order): PaymentOrder
    {
        app(LocalDevPaymentGuard::class)->requireEnabled();
        abort_unless($order->provider === 'dev' && $order->mode === 'test', 404);
        if ($order->fulfillment_status === 'fulfilled') {
            app(PaymentFulfillmentService::class)->fulfill($order->id, 'user');

            return $order->fresh();
        }
        $order = app(PaymentOrderService::class)->initializeCheckout($order->user_id, $order->id);
        $provider = app(LocalDevPaymentProvider::class);
        $provider->simulate($order->user_id, $order->provider_checkout_id, PaymentStatus::Succeeded);
        $delivery = $provider->event($order->provider_checkout_id, null, 'evt_dev_'.$order->id);
        $inbox = app(PaymentWebhookProcessor::class)->receive('dev', $delivery->raw, $delivery->signature);
        $order = $order->fresh();
        if ($order->fulfillment_status !== 'fulfilled') {
            throw new PaymentProblem($inbox->error ?? 'dev_payment_pending');
        }
        PaymentAudit::record($order, 'local_dev_payment_confirmed', ['real_money' => false], 'user', $order->user_id);

        return $order;
    }
}
