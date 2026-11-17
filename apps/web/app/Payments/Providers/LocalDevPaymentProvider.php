<?php

namespace App\Payments\Providers;

use App\Payments\Data\CheckoutSession;
use App\Payments\Data\OrderData;
use App\Payments\LocalDevPaymentGuard;

class LocalDevPaymentProvider extends TestPaymentProvider
{
    public function name(): string
    {
        return 'dev';
    }

    protected function requireEnabled(): void
    {
        app(LocalDevPaymentGuard::class)->requireEnabled();
    }

    public function createCheckout(OrderData $order): CheckoutSession
    {
        $session = parent::createCheckout($order);

        return new CheckoutSession($session->checkoutId, $session->paymentId, '/payments/'.$order->id, $session->expiresAt);
    }
}
