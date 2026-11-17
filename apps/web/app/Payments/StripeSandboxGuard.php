<?php

namespace App\Payments;

use Illuminate\Http\Request;

class StripeSandboxGuard
{
    public function enabled(): bool
    {
        $secret = (string) config('payments.stripe_sandbox.secret');

        // Public HTTPS Sandbox is supported; live Stripe keys remain disabled.
        return (bool) config('app.key')
            && config('payments.provider') === 'stripe_sandbox'
            && str_starts_with($secret, 'sk_test_') && strlen($secret) > 8
            && ! preg_match('/\s/', $secret)
            && str_starts_with((string) config('stripe-webhooks.signing_secret'), 'whsec_');
    }

    public function requireEnabled(): void
    {
        if (! $this->enabled()) {
            throw new PaymentProblem('provider_unavailable');
        }
    }

    public function authorizeRequest(Request $request): void
    {
        abort_unless($this->enabled(), 404);
    }
}
