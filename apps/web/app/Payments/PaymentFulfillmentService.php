<?php

namespace App\Payments;

use App\Models\CreditTransaction;
use App\Models\PaymentConfirmation;
use App\Models\PaymentOrder;
use App\Services\AccountLock;
use App\Services\WalletService;
use Illuminate\Support\Facades\DB;

class PaymentFulfillmentService
{
    public function fulfill(string $orderId, string $actor = 'system'): CreditTransaction
    {
        $original = PaymentOrder::whereKey($orderId)->firstOrFail();
        try {
            return DB::transaction(function () use ($original, $actor): CreditTransaction {
                AccountLock::acquire($original->user_id);
                $order = PaymentOrder::whereKey($original->id)->firstOrFail();
                app(PaymentProviderRegistry::class)->get($order->provider);
                $confirmation = PaymentConfirmation::where('order_id', $order->id)->first();
                if ($order->status !== 'succeeded' || ! $confirmation || ! $order->confirmed_at) {
                    throw new PaymentProblem('payment_not_verified');
                }
                app(PaymentConfirmationValidator::class)->validate($order, $confirmation);
                if ($order->fulfillment_status === 'fulfilled' && $order->credit_transaction_id) {
                    return CreditTransaction::whereKey($order->credit_transaction_id)->where('user_id', $order->user_id)->firstOrFail();
                }
                $order->fulfillment_attempts++;
                $ledger = app(WalletService::class)->creditVerifiedPayment($confirmation);
                $order->credit_transaction_id = $ledger->id;
                $order->fulfilled_at = now();
                $order->fulfillment_status = 'fulfilled';
                $order->fulfillment_error = null;
                $order->save();
                PaymentAudit::record($order, 'credits_fulfilled', ['ledger_id' => $ledger->id, 'credits' => $order->credits_amount], $actor);

                return $ledger;
            }, 5);
        } catch (\Throwable $error) {
            $reason = $error instanceof PaymentProblem ? $error->reason : 'ledger_credit_failed';
            DB::transaction(function () use ($original, $reason): void {
                AccountLock::acquire($original->user_id);
                $order = PaymentOrder::whereKey($original->id)->firstOrFail();
                if ($order->status === 'succeeded' && $order->fulfilled_at === null) {
                    $order->fulfillment_status = 'failed';
                    $order->fulfillment_error = $reason;
                    $order->fulfillment_attempts++;
                    $order->save();
                    PaymentAudit::record($order, 'fulfillment_failed', ['reason' => $reason]);
                }
            }, 5);
            throw new PaymentProblem($reason);
        }
    }
}
