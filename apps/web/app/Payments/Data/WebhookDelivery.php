<?php

declare(strict_types=1);

namespace App\Payments\Data;

final readonly class WebhookDelivery
{
    public function __construct(public string $raw, public WebhookSignature $signature) {}
}
