<?php

namespace App\Payments;

use App\Payments\Providers\LocalDevPaymentProvider;
use App\Payments\Providers\StripeSandboxProvider;
use App\Payments\Providers\TestPaymentProvider;
use Illuminate\Http\Request;

class PaymentProviderRegistry
{
    public function available(): bool
    {
        try {
            $this->current();

            return true;
        } catch (PaymentProblem) {
            return false;
        }
    }

    public function current(): PaymentProviderInterface
    {
        return $this->get(config('payments.provider'));
    }

    public function availableFor(string $provider): bool
    {
        try {
            $this->get($provider);

            return true;
        } catch (PaymentProblem) {
            return false;
        }
    }

    public function forWebhook(string $provider, Request $request): PaymentProviderInterface
    {
        // Stripe uses the signed, queued Spatie endpoint at /webhook exclusively.
        abort_if($provider === 'stripe_sandbox', 404);
        $adapter = $this->get($provider);
        $this->authorizeRequest($request);

        return $adapter;
    }

    public function get(string $provider): PaymentProviderInterface
    {
        if ($provider === 'dev') {
            app(LocalDevPaymentGuard::class)->requireEnabled();

            return app(LocalDevPaymentProvider::class);
        }
        if ($provider === 'stripe_sandbox') {
            app(StripeSandboxGuard::class)->requireEnabled();

            return app(StripeSandboxProvider::class);
        }
        if ($provider !== 'test') {
            throw new PaymentProblem('provider_unavailable');
        }
        app(TestPaymentGuard::class)->requireEnabled();

        return app(TestPaymentProvider::class);
    }

    public function authorizeRequest(Request $request): void
    {
        if ($this->current()->name() === 'dev') {
            app(LocalDevPaymentGuard::class)->authorizeRequest($request);
        } elseif ($this->current()->name() === 'stripe_sandbox') {
            app(StripeSandboxGuard::class)->authorizeRequest($request);
        } else {
            app(TestPaymentGuard::class)->authorizeRequest($request);
        }
    }
}
