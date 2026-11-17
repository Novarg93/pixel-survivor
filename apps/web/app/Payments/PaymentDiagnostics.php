<?php

namespace App\Payments;

use App\Models\CreditTransaction;
use App\Models\PaymentConfirmation;
use App\Models\PaymentOrder;
use App\Models\PaymentWebhookInbox;
use App\Services\WalletService;
use Illuminate\Support\Facades\DB;

class PaymentDiagnostics
{
    /** Local consistency checks only; no provider call or financial repair.
     * @return array<string, mixed>
     */
    public function inspect(): array
    {
        $issues = [];
        $checked = 0;
        PaymentOrder::orderBy('id')->each(function (PaymentOrder $candidate) use (&$issues, &$checked): void {
            DB::transaction(function () use ($candidate, &$issues, &$checked): void {
                $o = $candidate->fresh();
                $checked++;
                $confirmation = PaymentConfirmation::where('order_id', $o->id)->first();
                $ledger = CreditTransaction::where('user_id', $o->user_id)->where('type', 'payment_credit')->where('source_id', 'payment_order:'.$o->id)->first();
                if ($o->status === 'succeeded' && ! $confirmation) {
                    $issues[] = ['order_id' => $o->id, 'reason' => 'missing_confirmation'];
                }
                if ($o->status === 'succeeded' && $o->fulfillment_status !== 'fulfilled') {
                    $issues[] = ['order_id' => $o->id, 'reason' => 'paid_without_fulfillment'];
                }
                if ($o->fulfillment_status === 'fulfilled' && (! $ledger || $ledger->id !== $o->credit_transaction_id || $ledger->amount !== $o->credits_amount || ! $o->fulfilled_at)) {
                    $issues[] = ['order_id' => $o->id, 'reason' => 'fulfillment_ledger_mismatch'];
                }
                if ($ledger && $o->status !== 'succeeded') {
                    $issues[] = ['order_id' => $o->id, 'reason' => 'unverified_credit'];
                }
                if ($o->verification_error) {
                    $issues[] = ['order_id' => $o->id, 'reason' => $o->verification_error];
                }
                if ($o->provider_payment_id && ! $o->provider_checkout_id) {
                    $issues[] = ['order_id' => $o->id, 'reason' => 'orphan_provider_reference'];
                }
                if ($confirmation && ($confirmation->provider_payment_id !== $o->provider_payment_id || $confirmation->amount_minor !== $o->amount_minor || $confirmation->currency !== $o->currency)) {
                    $issues[] = ['order_id' => $o->id, 'reason' => 'confirmation_mismatch'];
                }
                if ($confirmation) {
                    try {
                        app(PaymentConfirmationValidator::class)->validate($o, $confirmation);
                    } catch (PaymentProblem $problem) {
                        $issues[] = ['order_id' => $o->id, 'reason' => $problem->reason];
                    }
                }
                if ($o->mode === 'test' && ! app(PaymentProviderRegistry::class)->availableFor($o->provider)) {
                    $issues[] = ['order_id' => $o->id, 'reason' => 'test_order_outside_isolated_environment'];
                }
            }, 5);
        });
        foreach (PaymentWebhookInbox::where(fn ($q) => $q->whereIn('status', ['pending', 'failed', 'orphan', 'processing'])->orWhere('error', 'unsupported_financial_event_requires_review'))->cursor() as $event) {
            $issues[] = ['inbox_id' => $event->id, 'reason' => $event->error ?? 'unfinished_event'];
        }
        foreach (CreditTransaction::where('type', 'payment_credit')->cursor() as $entry) {
            $orderId = $entry->metadata['payment_order_id'] ?? '';
            if (! is_string($orderId) || ! PaymentOrder::whereKey($orderId)->where('user_id', $entry->user_id)->exists()) {
                $issues[] = ['ledger_id' => $entry->id, 'reason' => 'orphan_payment_credit'];
            }
        }

        return ['orders_checked' => $checked, 'issues' => $issues, 'duplicate_deliveries' => (int) PaymentWebhookInbox::sum('delivery_count') - PaymentWebhookInbox::count(), 'wallet_audit' => app(WalletService::class)->audit()];
    }
}
