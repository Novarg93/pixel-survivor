<?php

use App\Models\PaymentOrder;
use App\Models\PaymentWebhookInbox;
use App\Payments\PaymentAudit;
use App\Payments\PaymentDiagnostics;
use App\Payments\PaymentFulfillmentService;
use App\Payments\PaymentProblem;
use App\Payments\PaymentService;
use App\Payments\PaymentVerificationService;
use App\Payments\PaymentWebhookProcessor;
use App\Services\AccountLock;
use App\Services\InventoryService;
use App\Services\OperationsHealth;
use App\Services\PurchaseService;
use App\Services\RunItemService;
use App\Services\WalletService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Str;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('runs:expire {--dry-run} {--user=}', function (RunItemService $items) {
    $user = $this->option('user') !== null ? (int) $this->option('user') : null;
    $count = $this->option('dry-run') ? app(OperationsHealth::class)->expiredRuns($user) : $items->expireSessions($user);
    $this->info(json_encode(['mode' => $this->option('dry-run') ? 'diagnostic' : 'applied', 'expired' => $count], JSON_THROW_ON_ERROR));
});
Schedule::command('runs:expire')->everyFiveMinutes()->withoutOverlapping();

Artisan::command('inventory:sync-catalog', function (InventoryService $inventory) {
    $inventory->syncCatalog();
    $this->info('Item definitions synchronized.');
})->purpose('Synchronize configured item definitions without granting inventory');

Artisan::command('inventory:reconcile-rewards {--user=} {--dry-run}', function (InventoryService $inventory) {
    if ($this->option('dry-run')) {
        $this->info(json_encode(app(OperationsHealth::class)->inspect($this->option('user') !== null ? (int) $this->option('user') : null), JSON_THROW_ON_ERROR));

        return 0;
    }
    $result = $inventory->reconcile($this->option('user') !== null ? (int) $this->option('user') : null);
    $this->info(json_encode($result, JSON_THROW_ON_ERROR));

    return $result['failed'] > 0 ? 1 : 0;
})->purpose('Retry pending item grants without recalculating progress; credits stay pending');

Artisan::command('shop:sync-catalog', function (PurchaseService $shop) {
    $shop->syncCatalog();
    $this->info('Preliminary configured shop products synchronized; no purchases created.');
});
Artisan::command('wallet:reconcile-rewards {--user=} {--dry-run}', function (WalletService $wallet) {
    if ($this->option('dry-run')) {
        $this->info(json_encode(app(OperationsHealth::class)->inspect($this->option('user') !== null ? (int) $this->option('user') : null), JSON_THROW_ON_ERROR));

        return 0;
    }
    $result = $wallet->reconcileRewards($this->option('user') !== null ? (int) $this->option('user') : null);
    $this->info(json_encode($result, JSON_THROW_ON_ERROR));

    return $result['failed'] > 0 ? 1 : 0;
});
Artisan::command('wallet:check {--user=}', function (WalletService $wallet) {
    $result = $wallet->audit($this->option('user') !== null ? (int) $this->option('user') : null);
    $this->info(json_encode($result, JSON_THROW_ON_ERROR));

    return count($result['mismatches']) > 0 ? 1 : 0;
});

Artisan::command('payments:sync-packages', function (PaymentService $payments) {
    $payments->syncPackages();
    $this->info('Test packages synchronized; no order or credit created.');
});
Artisan::command('payments:diagnose', function (PaymentDiagnostics $diagnostics) {
    $result = $diagnostics->inspect();
    $this->info(json_encode($result, JSON_THROW_ON_ERROR));

    return count($result['issues']) + count($result['wallet_audit']['mismatches']) > 0 ? 1 : 0;
});
Artisan::command('payments:process-inbox {--event=} {--dry-run}', function (PaymentWebhookProcessor $processor) {
    if ($this->option('dry-run')) {
        $this->info(json_encode(app(PaymentDiagnostics::class)->inspect(), JSON_THROW_ON_ERROR));

        return 0;
    }
    $query = PaymentWebhookInbox::whereNotIn('status', ['processed', 'ignored']);
    if ($this->option('event')) {
        $query->whereKey($this->option('event'));
    }
    $failed = 0;
    foreach ($query->orderBy('received_at')->cursor() as $event) {
        try {
            $row = $processor->process($event->id);
            if (! in_array($row->status, ['processed', 'ignored'], true)) {
                $failed++;
            }
        } catch (PaymentProblem) {
            $failed++;
        }
    }
    $this->info(json_encode(['failed' => $failed], JSON_THROW_ON_ERROR));

    return $failed ? 1 : 0;
});
Artisan::command('payments:verify {order} {--dry-run}', function (PaymentVerificationService $verification, PaymentFulfillmentService $fulfillment) {
    if ($this->option('dry-run')) {
        $this->info(json_encode(app(PaymentDiagnostics::class)->inspect(), JSON_THROW_ON_ERROR));

        return 0;
    }
    $order = PaymentOrder::whereKey($this->argument('order'))->firstOrFail();
    DB::transaction(function () use ($order): void {
        AccountLock::acquire($order->user_id);
        PaymentAudit::record($order, 'reconciliation_requested', [], 'cli');
    });
    try {
        $order = $verification->verify($order->id, null, 'reconciliation', 'cli:'.Str::uuid());
        if ($order->status === 'succeeded') {
            $fulfillment->fulfill($order->id, 'cli');
        }
    } catch (PaymentProblem $problem) {
        $this->error($problem->reason);

        return 1;
    }
    $this->info('Provider state checked; fulfillment only if verified settled.');

    return 0;
});
Artisan::command('payments:retry-fulfillment {order} {--dry-run}', function (PaymentFulfillmentService $fulfillment) {
    if ($this->option('dry-run')) {
        $this->info(json_encode(app(PaymentDiagnostics::class)->inspect(), JSON_THROW_ON_ERROR));

        return 0;
    }
    $order = PaymentOrder::whereKey($this->argument('order'))->firstOrFail();
    DB::transaction(function () use ($order): void {
        AccountLock::acquire($order->user_id);
        PaymentAudit::record($order, 'fulfillment_retry_requested', [], 'cli');
    });
    try {
        $entry = $fulfillment->fulfill($order->id, 'cli');
        $this->info('Ledger receipt: '.$entry->id);

        return 0;
    } catch (PaymentProblem $problem) {
        $this->error($problem->reason);

        return 1;
    }
});

require __DIR__.'/operations.php';
