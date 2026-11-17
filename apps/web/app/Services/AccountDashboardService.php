<?php

namespace App\Services;

use App\Models\CreditTransaction;
use App\Models\PaymentOrder;
use App\Models\Purchase;
use App\Models\RewardGrant;
use App\Models\RunPaidAction;
use App\Models\Wallet;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class AccountDashboardService
{
    /** @return Builder<PaymentOrder> */
    private function pendingPayments(int $userId): Builder
    {
        return PaymentOrder::where('user_id', $userId)->where(function ($q): void {
            $q->where(fn ($q) => $q->whereIn('status', ['created', 'checkout_pending', 'processing'])->where('expires_at', '>', now()))
                ->orWhere(fn ($q) => $q->where('status', 'succeeded')->where('fulfillment_status', '!=', 'fulfilled'));
        });
    }

    /** These existing grants have at most 30 level records per account. No new balance.
     * @return list<array<string, mixed>>
     */
    public function pendingRewards(int $userId): array
    {
        $pending = [];
        foreach (RewardGrant::where('user_id', $userId)->where('fulfillment_status', '!=', 'fulfilled')->orderByDesc('id')->get() as $grant) {
            foreach ($grant->fulfillment as $index => $item) {
                if (($item['type'] ?? '') === 'credits' && ($item['status'] ?? '') === 'pending_fulfillment') {
                    $pending[] = ['id' => 'reward:'.$grant->id.':'.$index, 'amount' => $item['quantity'], 'type' => 'level_reward',
                        'description' => $grant->track.' · level '.$grant->level, 'reason' => $grant->last_fulfillment_error ?? 'Awaiting reconciliation and reward fulfillment',
                        'run_id' => $grant->game_run_id, 'created_at' => $grant->getAttribute('created_at')];
                }
            }
        }

        return $pending;
    }

    /** @return array<string, mixed> */
    public function balances(int $userId): array
    {
        $pending = $this->pendingRewards($userId);

        return ['available' => Wallet::where('user_id', $userId)->firstOrFail()->balance,
            'pending' => (int) $this->pendingPayments($userId)->sum('credits_amount') + array_sum(array_column($pending, 'amount')),
            'reserved' => null, 'gold' => null,
            'spent' => -(int) CreditTransaction::where('user_id', $userId)->where('type', 'shop_purchase')->where('amount', '<', 0)->sum('amount'),
            'refunded' => (int) CreditTransaction::where('user_id', $userId)->where('type', 'purchase_refund')->sum('amount')];
    }

    /** Monetary token purchases only; game services belong to Inventory.
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function orders(int $userId, array $filters = []): array
    {
        $query = PaymentOrder::where('user_id', $userId);
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['fulfillment'])) {
            $query->where('fulfillment_status', $filters['fulfillment']);
        }

        return $query->orderBy('created_at', $filters['direction'] ?? 'desc')->orderBy('id')->paginate(20)->withQueryString()
            ->through(fn (PaymentOrder $order) => $this->payment($order))->toArray();
    }

    /** @return array<string, mixed> */
    public function purchases(int $userId): array
    {
        $items = DB::table('purchases')->where('user_id', $userId)->selectRaw("id, 'shop' AS kind, created_at");
        $services = DB::table('run_paid_actions')->where('user_id', $userId)->selectRaw("id, 'service' AS kind, accepted_at AS created_at");
        $page = DB::query()->fromSub($items->unionAll($services), 'service_purchases')->orderByDesc('created_at')->orderBy('kind')->orderBy('id')
            ->paginate(20, ['*'], 'purchases_page')->withQueryString()->fragment('service-purchases');
        $ids = array_map(fn ($row) => $row->id, $page->items());
        $purchases = Purchase::where('user_id', $userId)->whereIn('id', $ids)->get()->keyBy('id');
        $actions = RunPaidAction::where('user_id', $userId)->whereIn('id', $ids)->get()->keyBy('id');

        return $page->through(fn ($row) => $row->kind === 'shop' ? $this->purchase($purchases[$row->id]) : $this->servicePurchase($actions[$row->id]))->toArray();
    }

    /** @return array<string, mixed> */
    private function servicePurchase(RunPaidAction $action): array
    {
        return ['id' => $action->id, 'number' => 'SERVICE-'.$action->id, 'kind' => 'service', 'created_at' => $action->getAttribute('accepted_at')->toISOString(),
            'items' => [['name' => $this->serviceName($action->action), 'quantity' => 1]], 'amount' => (string) $action->getAttribute('price_tokens'),
            'currency' => 'TOKENS', 'exponent' => 0, 'exchange_rate' => null, 'method' => 'Wallet', 'mode' => null, 'status' => 'completed',
            'fulfillment_status' => $action->status === 'applied' ? 'fulfilled' : 'pending', 'fulfilled_at' => $action->getAttribute('applied_at')?->toISOString(),
            'ledger_id' => $action->getAttribute('credit_transaction_id')];
    }

    private function serviceName(string $action): string
    {
        return $action === 'skill_reroll' ? 'Reroll Abilities' : 'Revive';
    }

    /** @return array<string, mixed> */
    public function payment(PaymentOrder $order): array
    {
        return ['id' => $order->id, 'number' => 'PAY-'.$order->id, 'kind' => 'payment', 'created_at' => $order->created_at->toISOString(),
            'items' => [['name' => $order->package_snapshot['name'] ?? 'Tokens', 'quantity' => 1, 'tokens' => $order->credits_amount]],
            'amount' => (string) $order->amount_minor, 'currency' => $order->currency, 'exponent' => $order->currency_exponent,
            'exchange_rate' => $order->getAttribute('currency_exchange_rate'), 'method' => $order->provider, 'mode' => $order->mode,
            'status' => $order->status, 'fulfillment_status' => $order->fulfillment_status,
            'fulfilled_at' => $order->fulfilled_at?->toISOString(), 'ledger_id' => $order->credit_transaction_id,
            'invoice_url' => '/account/orders/payment/'.$order->id.'/invoice'];
    }

    /** @return array<string, mixed> */
    public function purchase(Purchase $order): array
    {
        $snapshot = $order->getAttribute('product_snapshot');

        return ['id' => $order->id, 'number' => 'SHOP-'.$order->id, 'kind' => 'shop', 'created_at' => $order->getAttribute('created_at')->toISOString(),
            'items' => [['name' => $snapshot['name'] ?? $order->getAttribute('product_key'), 'quantity' => $order->getAttribute('quantity')]],
            'amount' => (string) $order->getAttribute('total'), 'currency' => 'TOKENS', 'exponent' => 0, 'exchange_rate' => null, 'method' => 'Wallet', 'mode' => null,
            'status' => $order->getAttribute('status'), 'fulfillment_status' => 'fulfilled', 'fulfilled_at' => $order->getAttribute('created_at')->toISOString(),
            'ledger_id' => $order->getAttribute('credit_transaction_id'), 'inventory_transaction_id' => $order->getAttribute('inventory_transaction_id')];
    }

    /** The only settled token source is credit_transactions. Unsettled orders are a read projection.
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function transactions(int $userId, array $filters = []): array
    {
        $ledger = DB::table('credit_transactions')->where('user_id', $userId)->selectRaw("id, 'ledger' AS kind, type, created_at, amount, 'available' AS status");
        $pending = $this->pendingPayments($userId)->selectRaw("id, 'payment' AS kind, 'payment_credit' AS type, created_at, credits_amount AS amount, 'pending' AS status")->toBase();
        $query = DB::query()->fromSub($ledger->unionAll($pending), 'account_transactions');
        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        $page = $query->orderByDesc('created_at')->orderBy('kind')->orderByDesc('id')->paginate(20)->withQueryString();
        $ids = array_map(fn ($row) => $row->id, $page->items());
        $entries = CreditTransaction::where('user_id', $userId)->whereIn('id', $ids)->get()->keyBy('id');
        $related = PaymentOrder::where('user_id', $userId)->where(fn ($q) => $q->whereIn('id', $ids)->orWhereIn('credit_transaction_id', $ids))->get();
        $orders = $related->keyBy('id');
        $settledOrders = $related->keyBy('credit_transaction_id');

        return $page->through(function ($row) use ($entries, $orders, $settledOrders): array {
            $entry = $entries->get($row->id);
            $order = $row->kind === 'payment' ? $orders->get($row->id) : $settledOrders->get($row->id);
            $metadata = $entry->metadata ?? [];
            $purchaseId = $metadata['purchase_id'] ?? null;

            return ['id' => $row->kind.':'.$row->id, 'created_at' => $row->created_at, 'type' => $row->type, 'amount' => (int) $row->amount,
                'denomination' => 'Tokens', 'status' => $row->status,
                'description' => (isset($metadata['premium_action']) ? ($metadata['premium_action'] === 'skill_reroll' ? 'Skill Reroll' : 'Resurrection').' ? run '.($metadata['server_run_id'] ?? '') : null) ?? $metadata['reason'] ?? ($order ? ($order->package_snapshot['name'] ?? 'Token top-up') : $entry?->source_id),
                'reason' => $row->kind === 'payment' ? ($order?->status === 'succeeded' ? 'Payment confirmed; awaiting fulfillment' : 'Awaiting payment confirmation') : null,
                'order_url' => $order ? '/account/orders/payment/'.$order->id : ($purchaseId ? '/account/orders/shop/'.$purchaseId : null),
                'operation' => $entry->source_id ?? $row->id, 'balance_after' => $entry?->balance_after,
                'settlement' => $order ? ['amount' => (string) $order->amount_minor, 'currency' => $order->currency, 'exponent' => $order->currency_exponent] : null,
                'provider' => $order->provider ?? ($metadata['provider'] ?? null)];
        })->toArray();
    }

    /** @return array<string, mixed> */
    public function usage(int $userId): array
    {
        $items = DB::table('inventory_transactions as t')->where('t.user_id', $userId)->where('t.delta', '<', 0)
            ->whereIn('t.source_type', ['xp_boost_activation', 'future_in_game_consumption'])
            ->join('item_definitions as d', 'd.id', '=', 't.item_id')
            ->leftJoin('run_item_usages as u', fn ($j) => $j->on('u.inventory_transaction_id', '=', 't.id')->where('u.user_id', $userId))
            ->selectRaw("t.id, 'item' AS kind, t.item_id, t.delta, t.created_at, t.source_type, t.receipt, d.name, u.game_run_id, u.status, u.applied_at, 0 AS credits");
        $services = DB::table('run_paid_actions')->where('user_id', $userId)
            ->selectRaw("id, 'service' AS kind, NULL AS item_id, -1 AS delta, accepted_at AS created_at, action AS source_type, receipt, action AS name, game_run_id, status, applied_at, price_tokens AS credits");
        $page = DB::query()->fromSub($items->unionAll($services), 'service_usage')->orderByDesc('created_at')->orderByDesc('id')->orderBy('kind')
            ->paginate(20, ['*'], 'usage_page')->withQueryString()->fragment('service-usage');

        return $page->through(function ($row): array {
            $receipt = json_decode($row->receipt, true, 32, JSON_THROW_ON_ERROR);

            return ['id' => $row->id, 'kind' => $row->kind, 'credits' => (int) $row->credits, 'item_id' => $row->item_id, 'name' => $row->kind === 'service' ? $this->serviceName($row->source_type) : ($receipt['item_snapshot']['name'] ?? $row->name),
                'quantity' => -(int) $row->delta, 'created_at' => $row->created_at, 'run_id' => $row->game_run_id,
                'context' => $row->kind === 'service' ? 'In-run game service' : ($row->source_type === 'xp_boost_activation' ? 'XP Boost activation · account' : 'In-run consumable'),
                'status' => $row->status ?? ($row->source_type === 'xp_boost_activation' ? 'applied' : 'accepted'), 'applied_at' => $row->applied_at];
        })->toArray();
    }

    /** @return array<string, mixed> */
    public function summary(int $userId): array
    {
        return ['balances' => $this->balances($userId), 'orders' => array_slice($this->orders($userId)['data'], 0, 3),
        ];
    }
}
