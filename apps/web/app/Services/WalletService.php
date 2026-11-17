<?php

namespace App\Services;

use App\Models\AccountProgress;
use App\Models\CreditTransaction;
use App\Models\GameRun;
use App\Models\LevelReward;
use App\Models\PaymentConfirmation;
use App\Models\PaymentOrder;
use App\Models\RewardGrant;
use App\Models\User;
use App\Models\Wallet;
use App\Payments\PaymentConfirmationValidator;
use App\Payments\PaymentProviderRegistry;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class WalletService
{
    public function create(int $userId): Wallet
    {
        return DB::transaction(function () use ($userId): Wallet {
            AccountLock::acquire($userId);

            return Wallet::firstOrCreate(['user_id' => $userId], ['balance' => 0, 'sequence' => 0]);
        }, 5);
    }

    /** Internal operations only. No route accepts arbitrary credits or debits.
     * @param  array<string, mixed>  $metadata
     */
    public function credit(int $userId, mixed $amount, string $type, string $source, string $reference, array $metadata = []): CreditTransaction
    {
        if ($type !== 'level_reward') {
            throw new \DomainException('Unsupported credit source. Use the audited adjustment operation.');
        }

        return $this->write($userId, $amount, $type, $source, $reference, $metadata);
    }

    /** Only persisted, provider-verified confirmations can enter the existing ledger. */
    public function creditVerifiedPayment(PaymentConfirmation $confirmation): CreditTransaction
    {
        $confirmation = PaymentConfirmation::whereKey($confirmation->id)->firstOrFail();
        $order = PaymentOrder::whereKey($confirmation->order_id)->firstOrFail();
        app(PaymentProviderRegistry::class)->get($order->provider);
        app(PaymentConfirmationValidator::class)->validate($order, $confirmation);

        return $this->write($order->user_id, $order->credits_amount, 'payment_credit', 'payment_order:'.$order->id, 'payment_order:'.$order->id,
            ['payment_order_id' => $order->id, 'confirmation_id' => $confirmation->id, 'provider' => $order->provider, 'provider_payment_id' => $order->provider_payment_id, 'mode' => $order->mode]);
    }

    /** @param array<string, mixed> $metadata */
    public function debit(int $userId, mixed $amount, string $source, string $reference, array $metadata = []): CreditTransaction
    {
        if (! is_int($amount) || $amount < 1) {
            throw new \DomainException('Debit amount must be positive.');
        }

        return $this->write($userId, -$amount, 'shop_purchase', $source, $reference, $metadata);
    }

    public function adjust(int $userId, mixed $amount, int $actorId, string $reason, string $operationId): CreditTransaction
    {
        // A future authorized admin controller must also enforce an explicit operator policy.
        if (! User::whereKey($actorId)->exists() || trim($reason) === '' || mb_strlen($reason) > 200 || ! Str::isUuid($operationId)) {
            throw new \DomainException('Adjustment requires an actor, reason and operation UUID.');
        }
        Gate::forUser(User::whereKey($actorId)->firstOrFail())->authorize('adjust-wallet');

        return $this->write($userId, $amount, 'admin_adjustment', 'adjustment:'.$operationId, 'adjustment:'.$operationId, ['actor_id' => $actorId, 'reason' => trim($reason)]);
    }

    /** @param array<string, mixed> $metadata */
    private function write(int $userId, mixed $amount, string $type, string $source, string $reference, array $metadata): CreditTransaction
    {
        if (! is_int($amount) || $amount === 0 || $amount < -config('wallet.max_balance') || $amount > config('wallet.max_balance') || ($type === 'level_reward' && $amount < 1) || strlen($source) > 120 || strlen($reference) > 120 || $source === '' || $reference === '' || strlen(json_encode($metadata, JSON_THROW_ON_ERROR)) > 2048) {
            throw new \DomainException('Invalid bounded integer wallet operation.');
        }
        $hash = hash('sha256', json_encode([$type, $source, $amount, $metadata], JSON_THROW_ON_ERROR));

        return DB::transaction(function () use ($userId, $amount, $type, $source, $reference, $metadata, $hash): CreditTransaction {
            AccountLock::acquire($userId);
            Wallet::firstOrCreate(['user_id' => $userId], ['balance' => 0, 'sequence' => 0]);
            $existing = CreditTransaction::where('user_id', $userId)->where('idempotency_reference', $reference)->first();
            if ($existing) {
                abort_unless(hash_equals($existing->request_hash, $hash), 409, 'Wallet idempotency conflict.');

                return $existing;
            }
            abort_if(CreditTransaction::where('user_id', $userId)->where('type', $type)->where('source_id', $source)->exists(), 409, 'Wallet source already applied.');
            $query = Wallet::where('user_id', $userId);
            $amount > 0 ? $query->where('balance', '<=', config('wallet.max_balance') - $amount) : $query->where('balance', '>=', -$amount);
            $updated = $amount > 0 ? $query->increment('balance', $amount, ['sequence' => DB::raw('sequence + 1')]) : $query->decrement('balance', -$amount, ['sequence' => DB::raw('sequence + 1')]);
            abort_unless($updated === 1, 409, $amount < 0 ? 'Not enough credits.' : 'Wallet limit reached.');
            $wallet = Wallet::where('user_id', $userId)->firstOrFail();

            return CreditTransaction::create(['id' => (string) Str::uuid(), 'user_id' => $userId, 'type' => $type, 'amount' => $amount,
                'balance_after' => $wallet->balance, 'sequence' => $wallet->sequence, 'source_id' => $source, 'idempotency_reference' => $reference,
                'request_hash' => $hash, 'metadata' => $metadata, 'created_at' => now()]);
        }, 5);
    }

    /** Caller holds AccountLock in the same transaction as XP/grant creation. */
    public function fulfillLocked(RewardGrant $grant): void
    {
        $items = $grant->fulfillment;
        foreach ($items as $index => &$item) {
            if (($item['type'] ?? '') !== 'credits' || ($item['status'] ?? '') !== 'pending_fulfillment') {
                continue;
            }
            $definition = LevelReward::whereKey($grant->level_reward_id)->where('track', $grant->track)->where('level', $grant->level)->first();
            $run = $grant->game_run_id ? GameRun::whereKey($grant->game_run_id)->where('user_id', $grant->user_id)->first() : null;
            $expected = $definition?->rewards[$index] ?? null;
            $amount = $item['quantity'] ?? null;
            if ($grant->track !== 'account' || ! is_int($amount) || $amount < 1 || $amount > config('wallet.max_balance') || ! $expected || ($expected['type'] ?? '') !== 'credits' || ($expected['quantity'] ?? null) !== $amount
                || ! $run || $run->status !== 'accepted' || $run->mode !== 'normal' || ($run->record['outcome'] ?? '') !== 'victory' || ! $run->finish_hash
                || ! AccountProgress::where('user_id', $grant->user_id)->where('level', '>=', $grant->level)->exists()) {
                throw new \DomainException('Credit grant lacks a confirmed matching level reward and owned accepted victory.');
            }
            $source = 'reward_grant:'.$grant->id.':'.$index;
            $transaction = $this->credit($grant->user_id, $amount, 'level_reward', $source, $source, ['grant_id' => $grant->id, 'track' => $grant->track, 'level' => $grant->level]);
            $item['status'] = 'fulfilled';
            $item['credit_transaction_id'] = $transaction->id;
            $item['fulfilled_at'] = now()->toISOString();
        }
        unset($item);
        $grant->recordFulfillment($items);
    }

    /** @return array{processed: int, failed: int} */
    public function reconcileRewards(?int $userId = null): array
    {
        $result = ['processed' => 0, 'failed' => 0];
        RewardGrant::where('fulfillment_status', '!=', 'fulfilled')->when($userId !== null, fn ($q) => $q->where('user_id', $userId))->chunkById(100, function ($grants) use (&$result): void {
            foreach ($grants as $candidate) {
                if (! array_filter($candidate->fulfillment, fn ($item) => ($item['type'] ?? '') === 'credits' && ($item['status'] ?? '') === 'pending_fulfillment')) {
                    continue;
                }
                try {
                    DB::transaction(function () use ($candidate): void {
                        AccountLock::acquire($candidate->user_id);
                        $this->fulfillLocked(RewardGrant::where('user_id', $candidate->user_id)->whereKey($candidate->id)->firstOrFail());
                    }, 5);
                    $result['processed']++;
                } catch (\Throwable $error) {
                    $result['failed']++;
                    DB::transaction(function () use ($candidate, $error): void {
                        AccountLock::acquire($candidate->user_id);
                        RewardGrant::whereKey($candidate->id)->where('fulfillment_status', '!=', 'fulfilled')->update(['last_fulfillment_error' => class_basename($error).': credit fulfillment requires review/retry', 'fulfillment_attempted_at' => now()]);
                    }, 5);
                }
            }
        });

        return $result;
    }

    /** @return array<string, mixed> */
    public function snapshot(int $userId, int $page = 1): array
    {
        return DB::transaction(function () use ($userId, $page): array {
            AccountLock::acquire($userId);
            $wallet = Wallet::where('user_id', $userId)->firstOrFail();
            $history = CreditTransaction::where('user_id', $userId)->orderByDesc('sequence')->paginate(20, ['id', 'type', 'amount', 'balance_after', 'sequence', 'source_id', 'idempotency_reference', 'metadata', 'created_at'], 'page', $page);

            return ['server_now' => now()->toISOString(), 'balance' => $wallet->balance, 'sequence' => $wallet->sequence, 'history' => $history->toArray()];
        }, 5);
    }

    /** Read-only reconciliation: compare every ledger prefix and materialized balance.
     * @return array<string, mixed>
     */
    public function audit(?int $onlyUser = null): array
    {
        $result = ['checked' => 0, 'mismatches' => []];
        User::when($onlyUser !== null, fn ($q) => $q->whereKey($onlyUser))->orderBy('id')->each(function (User $user) use (&$result): void {
            DB::transaction(function () use ($user, &$result): void {
                $wallet = Wallet::where('user_id', $user->id)->first();
                $sum = $sequence = 0;
                $valid = $wallet !== null;
                foreach (CreditTransaction::where('user_id', $user->id)->orderBy('sequence')->cursor() as $entry) {
                    $sum += $entry->amount;
                    $sequence++;
                    $valid = $valid && $entry->sequence === $sequence && $entry->balance_after === $sum && $sum >= 0;
                }
                $result['checked']++;
                if (! $valid || $wallet->balance !== $sum || $wallet->sequence !== $sequence) {
                    $result['mismatches'][] = ['user_id' => $user->id, 'balance' => $wallet?->balance, 'ledger_sum' => $sum, 'sequence' => $sequence];
                }
            }, 5);
        });

        return $result;
    }
}
