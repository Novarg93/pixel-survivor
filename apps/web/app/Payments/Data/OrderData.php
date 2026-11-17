<?php

declare(strict_types=1);

namespace App\Payments\Data;

use App\Models\PaymentOrder;
use Carbon\CarbonImmutable;

final readonly class OrderData
{
    public function __construct(public string $id, public int $userId, public int $amountMinor, public string $currency, public int $credits, public CarbonImmutable $expiresAt) {}

    public static function fromOrder(PaymentOrder $order): self
    {
        return new self($order->id, $order->user_id, $order->amount_minor, $order->currency, $order->credits_amount, $order->expires_at);
    }
}
