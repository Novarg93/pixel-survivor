<?php

namespace App\Payments;

use App\Models\PaymentConfirmation;
use App\Models\PaymentOrder;
use App\Payments\Data\PaymentEvidence;

class PaymentConfirmationValidator
{
    /** Check persisted proof without provider calls or financial writes. */
    public function validate(PaymentOrder $order, PaymentConfirmation $confirmation): void
    {
        try {
            $proof = PaymentEvidence::fromArray($confirmation->evidence);
        } catch (\Throwable) {
            throw new PaymentProblem('invalid_confirmation_proof');
        }

        if (! hash_equals($confirmation->evidence_hash, hash('sha256', json_encode($proof->toArray(), JSON_THROW_ON_ERROR)))
            || $confirmation->order_id !== $order->id || $confirmation->provider !== $order->provider
            || $proof->status !== PaymentStatus::Succeeded || $proof->orderId !== $order->id || $proof->userId !== $order->user_id
            || $proof->provider !== $order->provider || $proof->paymentId !== $confirmation->provider_payment_id
            || $proof->checkoutId !== $confirmation->provider_checkout_id || $proof->amountMinor !== $confirmation->amount_minor
            || $proof->currency !== $confirmation->currency || $proof->settledAt === null
            || $proof->settledAt->getTimestamp() !== $confirmation->settled_at->getTimestamp()
            || $proof->settledAt->isAfter($order->expires_at) || $proof->settledAt->isBefore($order->created_at->subSeconds(60))
            || (in_array($order->provider, ['test', 'stripe_sandbox', 'dev'], true) && $order->mode !== 'test')) {
            throw new PaymentProblem('invalid_confirmation_proof');
        }

        if ($order->status !== 'succeeded' || ! $order->confirmed_at
            || $order->provider_payment_id !== $confirmation->provider_payment_id || $order->provider_checkout_id !== $confirmation->provider_checkout_id
            || $order->amount_minor !== $confirmation->amount_minor || $order->currency !== $confirmation->currency) {
            throw new PaymentProblem('payment_not_verified');
        }
    }
}
