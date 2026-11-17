<?php

declare(strict_types=1);

namespace App\Payments\Data;

final readonly class PaymentLookup
{
    public function __construct(public string $checkoutId, public ?string $paymentId, public string $orderId) {}
}
