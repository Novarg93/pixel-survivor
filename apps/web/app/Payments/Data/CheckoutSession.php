<?php

declare(strict_types=1);

namespace App\Payments\Data;

use App\Payments\PaymentProblem;
use Carbon\CarbonImmutable;

final readonly class CheckoutSession
{
    public function __construct(public string $checkoutId, public ?string $paymentId, public string $url, public CarbonImmutable $expiresAt, string $provider = 'test')
    {
        $relative = str_starts_with($url, '/') && ! str_starts_with($url, '//');
        $stripe = $provider === 'stripe_sandbox' && preg_match('~^https://checkout\.stripe\.com/[cg]/pay/cs_test_[a-zA-Z0-9]+(?:#[a-zA-Z0-9%_=+/.!-]+)?$~D', $url);
        if (! preg_match('/^[a-zA-Z0-9_-]{1,120}$/', $checkoutId) || ($paymentId !== null && ! preg_match('/^[a-zA-Z0-9_-]{1,120}$/', $paymentId))
            || (! $relative && ! $stripe) || strlen($url) > 2048 || str_contains($url, chr(92)) || str_contains($url, chr(10)) || str_contains($url, chr(13))) {
            throw new PaymentProblem('invalid_checkout_response');
        }
    }
}
