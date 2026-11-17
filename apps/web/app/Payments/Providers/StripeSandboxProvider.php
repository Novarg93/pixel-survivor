<?php

declare(strict_types=1);

namespace App\Payments\Providers;

use App\Payments\Data\CheckoutSession;
use App\Payments\Data\OrderData;
use App\Payments\Data\PaymentEvidence;
use App\Payments\Data\PaymentLookup;
use App\Payments\Data\ProviderEvent;
use App\Payments\Data\WebhookHeaders;
use App\Payments\Data\WebhookSignature;
use App\Payments\PaymentProblem;
use App\Payments\PaymentProviderInterface;
use App\Payments\PaymentStatus;
use App\Payments\StripeSandboxGuard;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class StripeSandboxProvider implements PaymentProviderInterface
{
    public function name(): string
    {
        return 'stripe_sandbox';
    }

    public function mode(): string
    {
        return 'test';
    }

    public function signatureHeaderNames(): array
    {
        return ['Stripe-Signature'];
    }

    public function extractSignature(WebhookHeaders $headers): WebhookSignature
    {
        throw new PaymentProblem('stripe_webhook_route_required');
    }

    public function verifyWebhook(string $raw, WebhookSignature $signature): void
    {
        throw new PaymentProblem('stripe_webhook_route_required');
    }

    /** @param array<string, mixed> $parameters
     * @return array<string, mixed>
     */
    private function request(string $method, string $path, array $parameters = [], ?string $idempotency = null): array
    {
        app(StripeSandboxGuard::class)->requireEnabled();
        try {
            $http = Http::withToken(config('payments.stripe_sandbox.secret'))->acceptJson()->asForm()->connectTimeout(3)->timeout(12)
                ->withOptions(['allow_redirects' => false])->withHeaders(['Stripe-Version' => config('payments.stripe_sandbox.api_version')]);
            if ($idempotency !== null) {
                $http = $http->withHeaders(['Idempotency-Key' => $idempotency]);
            }
            $response = $method === 'POST' ? $http->post('https://api.stripe.com/v1/'.$path, $parameters) : $http->get('https://api.stripe.com/v1/'.$path, $parameters);
            if (! $response->successful()) {
                throw new PaymentProblem('stripe_request_unavailable');
            }
            $data = $response->json();
            if (! is_array($data)) {
                throw new PaymentProblem('invalid_provider_response');
            }

            return $data;
        } catch (\Throwable $error) {
            // Do not retain provider errors, request headers, customer details or secrets.
            throw $error instanceof PaymentProblem ? $error : new PaymentProblem('stripe_request_unavailable');
        }
    }

    public function createCheckout(OrderData $order): CheckoutSession
    {
        $base = rtrim(config('app.url'), '/');
        $meta = ['order_id' => $order->id, 'user_id' => (string) $order->userId];
        $session = $this->request('POST', 'checkout/sessions', ['mode' => 'payment', 'locale' => 'en', 'payment_method_types' => ['card'],
            'success_url' => $base.'/payments/'.$order->id.'/success', 'cancel_url' => $base.'/payments/'.$order->id.'/canceled',
            'client_reference_id' => $order->id, 'metadata' => $meta, 'payment_intent_data' => ['metadata' => $meta],
            'expires_at' => $order->expiresAt->getTimestamp(),
            'line_items' => [['quantity' => 1, 'price_data' => ['currency' => strtolower($order->currency), 'unit_amount' => $order->amountMinor,
                'product_data' => ['name' => $order->credits.' Pixel Survivor credits · SANDBOX']]]]], 'pixel-checkout:'.$order->id);
        $evidence = $this->sessionEvidence($session);
        if ($evidence->orderId !== $order->id || $evidence->userId !== $order->userId || $evidence->amountMinor !== $order->amountMinor || $evidence->currency !== $order->currency) {
            throw new PaymentProblem('checkout_response_mismatch');
        }
        $v = Validator::make($session, ['url' => 'required|string|max:2048', 'expires_at' => 'required|integer:strict|min:1'])->validate();

        return new CheckoutSession($evidence->checkoutId, $evidence->paymentId, $v['url'], CarbonImmutable::createFromTimestampUTC($v['expires_at']), $this->name());
    }

    /** @param array<string, mixed> $session */
    private function sessionEvidence(array $session, ?int $eventTime = null): PaymentEvidence
    {
        $v = Validator::make($session, ['object' => 'required|in:checkout.session', 'id' => 'required|string|regex:/^cs_test_[a-zA-Z0-9]+$/',
            'livemode' => 'required|boolean', 'mode' => 'required|in:payment', 'client_reference_id' => 'required|uuid',
            'metadata.order_id' => 'required|uuid', 'metadata.user_id' => 'required|string|regex:/^[1-9][0-9]{0,9}$/',
            'amount_total' => 'required|integer:strict|between:1,2000000000', 'currency' => 'required|string|regex:/^[a-z]{3}$/',
            'status' => 'required|in:open,complete,expired', 'payment_status' => 'required|in:paid,unpaid,no_payment_required',
            'payment_intent' => 'present|nullable'])->validate();
        if (($session['livemode'] ?? null) !== false || $v['client_reference_id'] !== $v['metadata']['order_id']) {
            throw new PaymentProblem('payment_identity_mismatch');
        }
        $intent = $v['payment_intent'];
        $paymentId = is_array($intent) ? ($intent['id'] ?? null) : $intent;
        if ($paymentId !== null && (! is_string($paymentId) || ! preg_match('/^pi_[a-zA-Z0-9]+$/', $paymentId))) {
            throw new PaymentProblem('invalid_provider_response');
        }
        $paid = $v['status'] === 'complete' && $v['payment_status'] === 'paid';
        $status = $paid ? PaymentStatus::Succeeded : ($v['status'] === 'expired' ? PaymentStatus::Expired : PaymentStatus::Processing);

        return PaymentEvidence::fromArray(['provider' => $this->name(), 'payment_id' => $paymentId, 'checkout_id' => $v['id'],
            'order_id' => $v['metadata']['order_id'], 'user_id' => (int) $v['metadata']['user_id'], 'amount_minor' => $v['amount_total'], 'currency' => strtoupper($v['currency']),
            'status' => $status->value, 'settled_at' => $paid && $eventTime !== null ? CarbonImmutable::createFromTimestampUTC($eventTime)->toISOString() : null]);
    }

    public function retrievePayment(PaymentLookup $lookup): PaymentEvidence
    {
        return $this->retrievePaymentEvidence($lookup);
    }

    public function retrievePaymentEvidence(PaymentLookup $lookup): PaymentEvidence
    {
        throw new PaymentProblem('stripe_webhook_confirmation_required');
    }

    public function normalizeProviderEvent(string $raw): ProviderEvent
    {
        // Stripe events are stored and dispatched by Spatie, never by the legacy inbox.
        throw new PaymentProblem('stripe_webhook_route_required');
    }

    public function resolvePaymentStatus(PaymentEvidence $payment): PaymentStatus
    {
        return $payment->status;
    }
}
