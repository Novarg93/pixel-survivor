<?php

namespace App\Payments;

use App\Models\PaymentConfirmation;
use App\Models\PaymentOrder;
use App\Payments\Data\PaymentEvidence;
use App\Payments\Data\PaymentLookup;
use App\Payments\Data\ProviderEvent;
use App\Services\AccountLock;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentVerificationService
{
    private function assertMatches(PaymentOrder $order, PaymentEvidence $evidence, bool $allowUnassigned = false): void
    {
        if ((in_array($order->provider, ['test', 'stripe_sandbox', 'dev'], true) && $order->mode !== 'test') || $evidence->provider !== $order->provider || $evidence->orderId !== $order->id || $evidence->userId !== $order->user_id
            || $evidence->checkoutId !== $order->provider_checkout_id || ($order->provider_payment_id !== null && $evidence->paymentId !== $order->provider_payment_id && ! ($allowUnassigned && $evidence->paymentId === null && $evidence->status !== PaymentStatus::Succeeded))) {
            throw new PaymentProblem('payment_identity_mismatch');
        }
        if ($evidence->amountMinor !== $order->amount_minor) {
            throw new PaymentProblem('amount_mismatch');
        }
        if ($evidence->currency !== $order->currency) {
            throw new PaymentProblem('currency_mismatch');
        }
    }

    public function verify(string $orderId, ?ProviderEvent $event = null, string $sourceType = 'reconciliation', ?string $sourceReference = null): PaymentOrder
    {
        $original = PaymentOrder::whereKey($orderId)->firstOrFail();
        $evidence = null;
        try {
            if ($original->provider_checkout_id === null) {
                throw new PaymentProblem('checkout_not_initialized');
            }
            $provider = app(PaymentProviderRegistry::class)->get($original->provider);
            if ($original->provider === 'stripe_sandbox') {
                // A return URL, reconciliation or Checkout event cannot confirm Stripe payments.
                if ($event?->providerType !== 'payment_intent.succeeded' || $event->payment === null) {
                    return $original;
                }
                $evidence = $event->payment;
            } else {
                // Other providers retain their existing verification flow.
                $evidence = $provider->retrievePaymentEvidence(new PaymentLookup($original->provider_checkout_id, $original->provider_payment_id, $orderId));
            }

            return DB::transaction(function () use ($original, $evidence, $provider, $event, $sourceType, $sourceReference): PaymentOrder {
                AccountLock::acquire($original->user_id);
                $order = PaymentOrder::whereKey($original->id)->where('user_id', $original->user_id)->firstOrFail();
                $this->assertMatches($order, $evidence);
                if ($event) {
                    if ($event->payment === null) {
                        throw new PaymentProblem('invalid_payment_event');
                    }
                    $this->assertMatches($order, $event->payment, true);
                    if ($event->payment->paymentId !== null && $event->payment->paymentId !== $evidence->paymentId) {
                        throw new PaymentProblem('payment_identity_mismatch');
                    }
                }
                if ($evidence->paymentId !== null && PaymentOrder::where('provider', $order->provider)->where('provider_payment_id', $evidence->paymentId)->where('id', '!=', $order->id)->exists()) {
                    throw new PaymentProblem('payment_reference_conflict');
                }
                $next = $provider->resolvePaymentStatus($evidence);
                $current = PaymentStatus::from($order->status);
                if ($next === PaymentStatus::Created) {
                    $next = PaymentStatus::CheckoutPending;
                }
                if ($current === PaymentStatus::Processing && $next === PaymentStatus::CheckoutPending) {
                    $next = $current;
                }
                if ($next === PaymentStatus::Succeeded) {
                    if ($evidence->paymentId === null || $evidence->settledAt === null || $evidence->settledAt->isAfter(now()->addSeconds(60)) || $evidence->settledAt->isBefore($order->created_at->subSeconds(60))) {
                        throw new PaymentProblem('invalid_settlement_evidence');
                    }
                    if ($evidence->settledAt->isAfter($order->expires_at)) {
                        throw new PaymentProblem('late_settlement_requires_review');
                    }
                }
                PaymentAudit::transition($order, $next);
                $order->provider_payment_id = $evidence->paymentId ?? $order->provider_payment_id;
                $order->last_checked_at = now();
                $order->verification_error = null;
                if ($next === PaymentStatus::Succeeded) {
                    $confirmation = PaymentConfirmation::where('order_id', $order->id)->first();
                    $proof = $evidence->toArray();
                    if (! $confirmation) {
                        PaymentConfirmation::create(['id' => (string) Str::uuid(), 'order_id' => $order->id, 'provider' => $order->provider, 'provider_payment_id' => $evidence->paymentId,
                            'provider_checkout_id' => $evidence->checkoutId, 'amount_minor' => $evidence->amountMinor, 'currency' => $evidence->currency, 'settled_at' => $evidence->settledAt,
                            'verified_at' => now(), 'evidence' => $proof, 'evidence_hash' => hash('sha256', json_encode($proof, JSON_THROW_ON_ERROR)),
                            'source_type' => $sourceType, 'source_reference' => $sourceReference ?? 'verify:'.Str::uuid()]);
                        $order->confirmed_at = now();
                        $order->fulfillment_status = 'pending';
                        PaymentAudit::record($order, 'payment_verified', ['source_type' => $sourceType, 'source_reference' => $sourceReference]);
                    }
                } elseif (in_array($next, [PaymentStatus::Failed, PaymentStatus::Canceled, PaymentStatus::Expired], true)) {
                    $order->failure_reason = 'provider_'.$next->value;
                }
                $order->save();
                if ($event && $event->payment->status !== $evidence->status) {
                    PaymentAudit::record($order, 'outdated_event_ignored', ['event_id' => $event->id]);
                }

                return $order;
            }, 5);
        } catch (\Throwable $error) {
            $reason = $error instanceof PaymentProblem ? $error->reason : ($error instanceof UniqueConstraintViolationException ? 'payment_reference_conflict' : 'verification_unavailable');
            DB::transaction(function () use ($original, $reason, $evidence): void {
                AccountLock::acquire($original->user_id);
                $order = PaymentOrder::whereKey($original->id)->firstOrFail();
                $order->verification_error = $reason;
                $order->last_checked_at = now();
                $order->save();
                PaymentAudit::record($order, 'verification_failed', ['reason' => $reason, 'evidence' => $evidence?->toArray()]);
            }, 5);
            throw new PaymentProblem($reason);
        }
    }
}
