<?php

namespace App\Payments;

use App\Models\PaymentOrder;
use App\Models\PaymentWebhookInbox;
use App\Payments\Data\WebhookSignature;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentWebhookProcessor
{
    public function receive(string $providerName, string $raw, WebhookSignature $signature): PaymentWebhookInbox
    {
        $provider = app(PaymentProviderRegistry::class)->get($providerName);
        $provider->verifyWebhook($raw, $signature);
        $event = $provider->normalizeProviderEvent($raw);
        $hash = hash('sha256', $raw);
        $inbox = DB::transaction(function () use ($providerName, $event, $raw, $hash): PaymentWebhookInbox {
            if (DB::getDriverName() === 'sqlite') {
                DB::table('payment_packages')->where('id', '__inbox_lock__')->update(['sort_order' => DB::raw('sort_order')]);
            }
            try {
                // Insert before any consistent read. InnoDB REPEATABLE READ can hide a
                // concurrent winner from firstOrCreate's nonlocking duplicate fallback.
                $row = DB::transaction(fn () => PaymentWebhookInbox::create(['provider' => $providerName, 'provider_event_id' => $event->id,
                    'id' => (string) Str::uuid(), 'event_type' => $event->providerType ?? $event->type, 'payload' => $raw, 'payload_hash' => $hash,
                    'received_at' => now(), 'last_received_at' => now(), 'verified_at' => now()]));
                $created = true;
            } catch (UniqueConstraintViolationException) {
                $row = PaymentWebhookInbox::where('provider', $providerName)->where('provider_event_id', $event->id)->lockForUpdate()->firstOrFail();
                $created = false;
            }
            $row = PaymentWebhookInbox::whereKey($row->id)->lockForUpdate()->firstOrFail();
            abort_unless(hash_equals($row->payload_hash, $hash), 409, 'Provider event ID payload conflict.');
            if (! $created) {
                $row->delivery_count++;
            }
            $row->last_received_at = now();
            $row->save();

            return $row;
        }, 5);

        return $this->process($inbox->id);
    }

    public function process(string $inboxId): PaymentWebhookInbox
    {
        $inbox = PaymentWebhookInbox::whereKey($inboxId)->firstOrFail();
        if (in_array($inbox->status, ['processed', 'ignored'], true)) {
            return $inbox;
        }
        $provider = app(PaymentProviderRegistry::class)->get($inbox->provider);
        // Stored payload was authenticated at receive time. Retry retrieves fresh provider truth;
        // it never relaxes signature timestamp checks on the public HTTP endpoint.
        $event = $provider->normalizeProviderEvent($inbox->payload);
        PaymentWebhookInbox::whereKey($inboxId)->whereNotIn('status', ['processed', 'ignored'])->update(['status' => 'processing', 'attempts' => DB::raw('attempts + 1')]);
        if ($event->payment === null) {
            $financialReview = preg_match('/refund|dispute|chargeback|reversal/i', $event->type) === 1;
            PaymentWebhookInbox::whereKey($inboxId)->update(['status' => 'ignored', 'error' => $financialReview ? 'unsupported_financial_event_requires_review' : null, 'processed_at' => now()]);

            return $inbox->fresh();
        }
        $order = PaymentOrder::whereKey($event->payment->orderId)->where('provider', $inbox->provider)->first();
        if (! $order) {
            $inbox->status = 'orphan';
            $inbox->error = 'unknown_order';
            $inbox->save();

            return $inbox;
        }
        PaymentWebhookInbox::whereKey($inboxId)->update(['order_id' => $order->id]);
        try {
            if (! in_array($event->type, array_map(fn (PaymentStatus $s) => 'payment.'.$s->value, PaymentStatus::cases()), true)) {
                $financialReview = preg_match('/refund|dispute|chargeback|reversal/i', $event->type) === 1;
                PaymentWebhookInbox::whereKey($inboxId)->update(['status' => 'ignored', 'error' => $financialReview ? 'unsupported_financial_event_requires_review' : null, 'processed_at' => now()]);
                if ($financialReview) {
                    PaymentAudit::record($order, 'unsupported_financial_event', ['inbox_id' => $inboxId, 'event_type' => $event->type]);
                }
            } else {
                $verified = app(PaymentVerificationService::class)->verify($order->id, $event, 'webhook', $inboxId);
                if ($verified->status === 'succeeded') {
                    app(PaymentFulfillmentService::class)->fulfill($order->id, 'webhook');
                }
                PaymentWebhookInbox::whereKey($inboxId)->update(['status' => 'processed', 'error' => null, 'processed_at' => now()]);
            }
        } catch (\Throwable $error) {
            PaymentWebhookInbox::whereKey($inboxId)->where('status', '!=', 'processed')->update(['status' => 'failed', 'error' => $error instanceof PaymentProblem ? $error->reason : 'processing_unavailable']);
        }

        return $inbox->fresh();
    }
}
