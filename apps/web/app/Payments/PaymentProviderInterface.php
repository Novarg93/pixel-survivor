<?php

namespace App\Payments;

use App\Payments\Data\CheckoutSession;
use App\Payments\Data\OrderData;
use App\Payments\Data\PaymentEvidence;
use App\Payments\Data\PaymentLookup;
use App\Payments\Data\ProviderEvent;
use App\Payments\Data\WebhookHeaders;
use App\Payments\Data\WebhookSignature;

interface PaymentProviderInterface
{
    public function name(): string;

    public function mode(): string;

    /** @return list<string> */
    public function signatureHeaderNames(): array;

    public function extractSignature(WebhookHeaders $headers): WebhookSignature;

    // Must use immutable order UUID as the provider idempotency key, including timeout retries.
    public function createCheckout(OrderData $order): CheckoutSession;

    public function retrievePayment(PaymentLookup $reference): PaymentEvidence;

    public function retrievePaymentEvidence(PaymentLookup $reference): PaymentEvidence;

    public function verifyWebhook(string $raw, WebhookSignature $signature): void;

    public function normalizeProviderEvent(string $raw): ProviderEvent;

    public function resolvePaymentStatus(PaymentEvidence $evidence): PaymentStatus;
}
