<?php

namespace App\Payments;

use App\Models\PaymentOrder;
use App\Payments\Data\OrderData;
use App\Services\AccountLock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentOrderService
{
    /** @param array<string, mixed> $input */
    public function create(int $userId, array $input): PaymentOrder
    {
        $pricing = app(PaymentPricingService::class);
        $data = $pricing->selection($input, true);
        $provider = app(PaymentProviderRegistry::class)->current();
        $hash = hash('sha256', $data['package_id'] ?? 'custom:'.$data['custom_credits']);

        return DB::transaction(function () use ($userId, $data, $hash, $provider, $pricing): PaymentOrder {
            AccountLock::acquire($userId);
            $existing = PaymentOrder::where('user_id', $userId)->where('operation_id', strtolower($data['operation_id']))->first();
            if ($existing) {
                abort_unless(hash_equals($existing->request_hash, $hash), 409, 'Checkout idempotency conflict.');

                return $existing;
            }
            $quote = $pricing->quote($data, true);
            abort_if(isset($data['quote_hash']) && ! hash_equals($quote->fingerprint(), $data['quote_hash']), 409, 'The price changed. Confirm the new quote.');
            $ttl = $provider->name() === 'stripe_sandbox' ? config('payments.stripe_sandbox.order_ttl_seconds') : config('payments.order_ttl_seconds');
            $order = PaymentOrder::create(['id' => (string) Str::uuid(), 'user_id' => $userId, 'package_id' => $quote->packageId, 'operation_id' => strtolower($data['operation_id']), 'request_hash' => $hash,
                'package_snapshot' => $quote->snapshot, 'credits_amount' => $quote->credits, 'amount_minor' => $quote->amountMinor, 'currency' => $quote->currency, 'currency_exponent' => $quote->exponent,
                'provider' => $provider->name(), 'mode' => $provider->mode(), 'status' => 'created', 'fulfillment_status' => 'not_ready', 'created_at' => now(), 'expires_at' => now()->addSeconds($ttl)->startOfSecond(), 'metadata' => ['channel' => 'wallet', 'dev_payment' => $provider->name() === 'dev']]);
            PaymentAudit::record($order, 'order_created', [], 'user', $userId);

            return $order;
        }, 5);
    }

    public function initializeCheckout(int $userId, string $orderId): PaymentOrder
    {
        $order = DB::transaction(function () use ($userId, $orderId): PaymentOrder {
            AccountLock::acquire($userId);
            $order = PaymentOrder::where('user_id', $userId)->whereKey($orderId)->firstOrFail();
            app(PaymentProviderRegistry::class)->get($order->provider);
            if (PaymentStatus::from($order->status)->terminal() || $order->checkout_url !== null) {
                return $order;
            }
            PaymentAudit::transition($order, PaymentStatus::CheckoutPending);
            $order->checkout_attempts++;
            $order->save();
            PaymentAudit::record($order, 'checkout_attempt', ['attempt' => $order->checkout_attempts], 'user', $userId);

            return $order;
        }, 5);
        if (PaymentStatus::from($order->status)->terminal() || $order->checkout_url !== null) {
            return $order;
        }
        try {
            // External adapter call intentionally happens outside the account transaction.
            $session = app(PaymentProviderRegistry::class)->get($order->provider)->createCheckout(OrderData::fromOrder($order));

            return DB::transaction(function () use ($userId, $orderId, $session): PaymentOrder {
                AccountLock::acquire($userId);
                $order = PaymentOrder::where('user_id', $userId)->whereKey($orderId)->firstOrFail();
                if (($order->provider_checkout_id && $order->provider_checkout_id !== $session->checkoutId) || ($order->provider_payment_id && $order->provider_payment_id !== $session->paymentId)) {
                    throw new PaymentProblem('checkout_reference_conflict');
                }
                $other = PaymentOrder::where('provider', $order->provider)->where('id', '!=', $orderId)->where(fn ($q) => $q->where('provider_checkout_id', $session->checkoutId)->when($session->paymentId !== null, fn ($q) => $q->orWhere('provider_payment_id', $session->paymentId)))->exists();
                if ($other) {
                    throw new PaymentProblem('checkout_reference_conflict');
                }
                $order->provider_checkout_id = $session->checkoutId;
                $order->provider_payment_id = $session->paymentId;
                $order->checkout_url = $session->url;
                $order->checkout_error = null;
                $order->save();
                PaymentAudit::record($order, 'checkout_initialized');

                return $order;
            }, 5);
        } catch (\Throwable $error) {
            DB::transaction(function () use ($userId, $orderId, $error): void {
                AccountLock::acquire($userId);
                $order = PaymentOrder::where('user_id', $userId)->whereKey($orderId)->firstOrFail();
                $order->checkout_error = $error instanceof PaymentProblem ? $error->reason : 'checkout_unavailable';
                $order->save();
                PaymentAudit::record($order, 'checkout_failed', ['reason' => $order->checkout_error]);
            }, 5);
            throw $error instanceof PaymentProblem ? $error : new PaymentProblem('checkout_unavailable');
        }
    }
}
