<?php

use App\Models\User;
use App\Services\AccountLock;
use App\Services\InventoryDiagnostics;
use App\Services\OperationsHealth;
use App\Services\PlatformAudit;
use App\Services\PlatformRecovery;
use App\Support\CanonicalJson;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

Artisan::command('platform:diagnose {--user=}', function (OperationsHealth $health): int {
    $result = $health->inspect($this->option('user') !== null ? (int) $this->option('user') : null);
    $this->info(json_encode($result, JSON_THROW_ON_ERROR));

    return isset($result['error']) ? 1 : 0;
})->purpose('Read-only operational diagnostics; never contacts a payment provider');

Artisan::command('inventory:check {--user=}', function (InventoryDiagnostics $health): int {
    $result = $health->inspect($this->option('user') !== null ? (int) $this->option('user') : null);
    $this->info(json_encode($result, JSON_THROW_ON_ERROR));

    return $result['balance_mismatches'] + $result['missing_balances'] + $result['orphan_run_consumptions'] > 0 ? 1 : 0;
});

Artisan::command('leaderboard:check', function (OperationsHealth $health): int {
    $r = $health->leaderboard();
    $this->info(json_encode($r, JSON_THROW_ON_ERROR));

    return $r['missing_players'] + $r['stale_entries'] + $r['not_best_entries'] + $r['source_score_drift'] + $r['unassessed_accepted'] + $r['assessed_accepted_ineligible'] > 0 ? 1 : 0;
});

Artisan::command('platform:recover {component} {--apply} {--user=} {--order=} {--event=} {--reason=} {--operation=}', function (PlatformRecovery $recovery): int {
    try {
        $component = $this->argument('component');
        if (! is_string($component)) {
            throw new InvalidArgumentException('A single recovery component is required.');
        }
        $result = $recovery->recover($component, (bool) $this->option('apply'), array_filter([
            'user' => $this->option('user'), 'order' => $this->option('order'), 'event' => $this->option('event'), 'reason' => $this->option('reason'),
            'operation_id' => $this->option('operation') ?? (string) Str::uuid(),
        ], fn ($value) => $value !== null));
        $this->info(json_encode($result, JSON_THROW_ON_ERROR));

        return $result['mode'] === 'incomplete' ? 1 : 0;
    } catch (Throwable $error) {
        $this->error('Recovery refused or failed: '.class_basename($error).'. No bypass or automatic financial correction is available.');

        return 1;
    }
})->purpose('Default: diagnostic only. --apply requires scope and reason; writers remain idempotent');

Artisan::command('platform:operator {user} {--enable} {--revoke} {--reason=} {--operation=}', function (): int {
    try {
        $data = Validator::make(['user' => $this->argument('user'), 'reason' => $this->option('reason'), 'operation_id' => $this->option('operation') ?? (string) Str::uuid()],
            ['user' => 'required|integer|min:1|exists:users,id', 'reason' => 'required|string|min:8|max:500', 'operation_id' => 'required|uuid'])->validate();
        if ((bool) $this->option('enable') === (bool) $this->option('revoke')) {
            throw new InvalidArgumentException('Select exactly one operator action.');
        }
        $enabled = (bool) $this->option('enable');
        $hash = CanonicalJson::hash([...$data, 'enabled' => $enabled]);
        $result = DB::transaction(function () use ($data, $enabled, $hash): array {
            AccountLock::acquire((int) $data['user']);
            $audit = app(PlatformAudit::class);
            if ($prior = $audit->replay('cli', $data['operation_id'], $hash)) {
                return $prior;
            }
            $user = User::findOrFail((int) $data['user']);
            $user->forceFill(['is_platform_operator' => $enabled])->save();

            return $audit->record('cli', null, $data['operation_id'], $hash, $enabled ? 'operator_enabled' : 'operator_revoked', 'user', (string) $user->id, $data['reason'],
                ['user_id' => $user->id, 'enabled' => $enabled]);
        }, 5);
        $this->info(json_encode($result, JSON_THROW_ON_ERROR));

        return 0;
    } catch (Throwable $error) {
        $this->error('Operator change refused: '.class_basename($error));

        return 1;
    }
})->purpose('CLI-only operator provisioning, never available through registration or public HTTP');
