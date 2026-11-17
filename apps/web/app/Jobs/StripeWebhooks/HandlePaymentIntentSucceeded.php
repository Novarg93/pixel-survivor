<?php

namespace App\Jobs\StripeWebhooks;

use App\Models\PaymentOrder;
use App\Payments\Data\PaymentEvidence;
use App\Payments\Data\ProviderEvent;
use App\Payments\PaymentFulfillmentService;
use App\Payments\PaymentProblem;
use App\Payments\PaymentVerificationService;
use App\Payments\StripeSandboxGuard;
use App\Services\AccountLock;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Spatie\WebhookClient\Jobs\ProcessWebhookJob;

class HandlePaymentIntentSucceeded extends ProcessWebhookJob
{
    public int $tries = 3;

    public function handle(PaymentVerificationService $verification, PaymentFulfillmentService $fulfillment): void
    {
        app(StripeSandboxGuard::class)->requireEnabled();
        $payload = $this->webhookCall->payload ?? [];
        if (($payload['type'] ?? null) !== 'payment_intent.succeeded') {
            return;
        }
        $v = Validator::make($payload, [
            'id' => 'required|string|regex:/^evt_[a-zA-Z0-9]+$/',
            'created' => 'required|integer:strict|min:1',
            'livemode' => 'required|boolean',
            'data.object.object' => 'required|in:payment_intent',
            'data.object.id' => 'required|string|regex:/^pi_[a-zA-Z0-9]+$/',
            'data.object.status' => 'required|in:succeeded',
            'data.object.livemode' => 'required|boolean',
            'data.object.amount' => 'required|integer:strict|between:1,2000000000',
            'data.object.amount_received' => 'required|integer:strict|between:1,2000000000',
            'data.object.currency' => 'required|string|regex:/^[a-z]{3}$/',
            'data.object.metadata.order_id' => 'required|uuid',
        ])->validate();
        $intent = $v['data']['object'];
        if ($v['livemode'] !== false || $intent['livemode'] !== false || isset($payload['account'])) {
            throw new PaymentProblem('sandbox_event_required');
        }
        if ($intent['amount_received'] !== $intent['amount']) {
            throw new PaymentProblem('amount_mismatch');
        }
        $original = PaymentOrder::whereKey($intent['metadata']['order_id'])->where('provider', 'stripe_sandbox')->first();
        if (! $original) {
            return; // This Stripe account may also contain unrelated payments.
        }

        DB::transaction(function () use ($original, $intent, $v, $verification, $fulfillment): void {
            AccountLock::acquire($original->user_id);
            $order = PaymentOrder::whereKey($original->id)->lockForUpdate()->firstOrFail();
            $evidence = PaymentEvidence::fromArray([
                'provider' => 'stripe_sandbox', 'payment_id' => $intent['id'],
                'checkout_id' => $order->provider_checkout_id, 'order_id' => $order->id, 'user_id' => $order->user_id,
                'amount_minor' => $intent['amount'], 'currency' => strtoupper($intent['currency']),
                'status' => 'succeeded', 'settled_at' => CarbonImmutable::createFromTimestampUTC($v['created'])->toISOString(),
            ]);
            // Existing confirmation, unique PaymentIntent and Wallet ledger enforce idempotency.
            // The outer transaction makes confirmation + token credit one atomic operation.
            $verification->verify($order->id, new ProviderEvent($v['id'], 'payment.succeeded', $evidence, 'payment_intent.succeeded'), 'webhook', 'spatie:'.$this->webhookCall->id);
            $fulfillment->fulfill($order->id, 'webhook');
        }, 5);
    }
}
