<?php

namespace App\Payments\Providers;

use App\Models\TestProviderPayment;
use App\Payments\Data\CheckoutSession;
use App\Payments\Data\OrderData;
use App\Payments\Data\PaymentEvidence;
use App\Payments\Data\PaymentLookup;
use App\Payments\Data\ProviderEvent;
use App\Payments\Data\WebhookDelivery;
use App\Payments\Data\WebhookHeaders;
use App\Payments\Data\WebhookSignature;
use App\Payments\PaymentProblem;
use App\Payments\PaymentProviderInterface;
use App\Payments\PaymentStatus;
use App\Payments\TestPaymentGuard;
use App\Services\AccountLock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TestPaymentProvider implements PaymentProviderInterface
{
    protected function requireEnabled(): void
    {
        app(TestPaymentGuard::class)->requireEnabled();
    }

    public function mode(): string
    {
        return 'test';
    }

    public function signatureHeaderNames(): array
    {
        return ['X-Test-Timestamp', 'X-Test-Signature'];
    }

    public function extractSignature(WebhookHeaders $headers): WebhookSignature
    {
        return WebhookSignature::fromHeaders($headers->get('X-Test-Timestamp'), $headers->get('X-Test-Signature'));
    }

    public function name(): string
    {
        return 'test';
    }

    public function createCheckout(OrderData $order): CheckoutSession
    {
        $this->requireEnabled();
        $payment = DB::transaction(function () use ($order): TestProviderPayment {
            AccountLock::acquire($order->userId);
            $existing = TestProviderPayment::where('order_id', $order->id)->first();
            if ($existing) {
                return $existing;
            }
            if ($order->expiresAt->isPast()) {
                throw new PaymentProblem('checkout_expired');
            }

            return TestProviderPayment::create(['id' => 'tp_'.Str::uuid(), 'checkout_id' => 'tc_'.Str::uuid(), 'order_id' => $order->id, 'user_id' => $order->userId,
                'amount_minor' => $order->amountMinor, 'currency' => $order->currency, 'status' => 'processing', 'expires_at' => $order->expiresAt, 'created_at' => now()]);
        }, 5);

        return new CheckoutSession($payment->checkout_id, $payment->id, '/payments/test/'.$payment->checkout_id, $payment->expires_at);
    }

    public function retrievePayment(PaymentLookup $reference): PaymentEvidence
    {
        return $this->retrievePaymentEvidence($reference);
    }

    public function retrievePaymentEvidence(PaymentLookup $reference): PaymentEvidence
    {
        $this->requireEnabled();
        $payment = $reference->paymentId !== null ? TestProviderPayment::whereKey($reference->paymentId)->first() : TestProviderPayment::where('checkout_id', $reference->checkoutId)->first();
        if (! $payment) {
            throw new PaymentProblem('provider_payment_not_found');
        }
        if (! PaymentStatus::from($payment->status)->terminal() && $payment->expires_at->isPast()) {
            TestProviderPayment::whereKey($payment->id)->whereIn('status', ['created', 'checkout_pending', 'processing'])->update(['status' => 'expired']);
            $payment->refresh();
        }

        return PaymentEvidence::fromArray(['provider' => $this->name(), 'payment_id' => $payment->id, 'checkout_id' => $payment->checkout_id, 'order_id' => $payment->order_id, 'user_id' => $payment->user_id,
            'amount_minor' => $payment->amount_minor, 'currency' => $payment->currency, 'status' => $payment->status, 'settled_at' => $payment->settled_at?->toISOString()]);
    }

    public function resolvePaymentStatus(PaymentEvidence $evidence): PaymentStatus
    {
        return $evidence->status;
    }

    private function secret(): string
    {
        $this->requireEnabled();
        if (! config('app.key')) {
            throw new PaymentProblem('test_signing_unavailable');
        }

        // Existing local app key, domain-separated; never a real provider credential.
        return hash_hmac('sha256', 'pixel-survivor/local-'.$this->name().'-provider/v1', config('app.key'));
    }

    public function verifyWebhook(string $raw, WebhookSignature $signature): void
    {
        $this->requireEnabled();
        abort_unless(strlen($raw) <= 32768 && abs(now()->getTimestamp() - $signature->timestamp) <= config('payments.signature_tolerance_seconds')
            && hash_equals(hash_hmac('sha256', $signature->timestamp.'.'.$raw, $this->secret()), $signature->digest), 401, 'Invalid webhook authentication.');
    }

    public function normalizeProviderEvent(string $raw): ProviderEvent
    {
        return ProviderEvent::fromJson($raw);
    }

    public function sign(string $raw, ?int $timestamp = null): WebhookDelivery
    {
        $timestamp ??= now()->getTimestamp();

        return new WebhookDelivery($raw, new WebhookSignature($timestamp, hash_hmac('sha256', $timestamp.'.'.$raw, $this->secret())));
    }

    public function event(string $checkoutId, ?PaymentStatus $eventStatus = null, ?string $eventId = null): WebhookDelivery
    {
        $evidence = $this->retrievePaymentEvidence(new PaymentLookup($checkoutId, null, ''));
        $data = $evidence->toArray();
        if ($eventStatus !== null) {
            $data['status'] = $eventStatus->value;
        }

        return $this->sign(json_encode(['id' => $eventId ?? 'evt_'.Str::uuid(), 'type' => 'payment.'.$data['status'], 'payment' => $data], JSON_THROW_ON_ERROR));
    }

    public function simulate(int $userId, string $checkoutId, PaymentStatus $status): WebhookDelivery
    {
        $this->requireEnabled();
        if (! in_array($status, [PaymentStatus::Processing, PaymentStatus::Succeeded, PaymentStatus::Failed, PaymentStatus::Canceled, PaymentStatus::Expired], true)) {
            throw new PaymentProblem('invalid_test_scenario');
        }
        DB::transaction(function () use ($userId, $checkoutId, $status): void {
            AccountLock::acquire($userId);
            $payment = TestProviderPayment::where('user_id', $userId)->where('checkout_id', $checkoutId)->firstOrFail();
            $current = PaymentStatus::from($payment->status);
            if ($current->terminal() && $current !== $status) {
                throw new PaymentProblem('test_payment_already_final');
            }
            if ($payment->expires_at->isPast() && ! $current->terminal()) {
                $status = PaymentStatus::Expired;
            }
            $payment->status = $status->value;
            $payment->settled_at = $status === PaymentStatus::Succeeded ? ($payment->settled_at ?? now()->startOfSecond()) : null;
            $payment->save();
        }, 5);

        return $this->event($checkoutId);
    }
}
