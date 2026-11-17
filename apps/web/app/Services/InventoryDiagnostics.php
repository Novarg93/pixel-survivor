<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class InventoryDiagnostics
{
    /** @return array<string,mixed> */
    public function inspect(?int $userId = null): array
    {
        return DB::transaction(function () use ($userId): array {
            $totals = DB::table('inventory_transactions')->selectRaw('user_id, item_id, SUM(delta) AS ledger_total')->groupBy('user_id', 'item_id');
            $balances = DB::table('inventory_balances as b')->leftJoinSub($totals, 't', fn ($j) => $j->on('t.user_id', '=', 'b.user_id')->on('t.item_id', '=', 'b.item_id'))
                ->when($userId !== null, fn ($q) => $q->where('b.user_id', $userId));
            $mismatches = (clone $balances)->whereRaw('b.quantity <> COALESCE(t.ledger_total, 0)');
            $missing = DB::query()->fromSub($totals, 't')->leftJoin('inventory_balances as b', fn ($j) => $j->on('b.user_id', '=', 't.user_id')->on('b.item_id', '=', 't.item_id'))
                ->whereNull('b.user_id')->when($userId !== null, fn ($q) => $q->where('t.user_id', $userId));
            $orphan = DB::table('inventory_transactions as t')->leftJoin('run_item_usages as u', 'u.inventory_transaction_id', '=', 't.id')
                ->where('t.source_type', 'future_in_game_consumption')->whereNull('u.id')->when($userId !== null, fn ($q) => $q->where('t.user_id', $userId));

            return ['balances_checked' => (clone $balances)->count(), 'balance_mismatches' => (clone $mismatches)->count(), 'missing_balances' => $missing->count(), 'orphan_run_consumptions' => $orphan->count(),
                'sample' => $mismatches->limit(50)->get(['b.user_id', 'b.item_id', 'b.quantity', 't.ledger_total'])->toArray()];
        });
    }
}
