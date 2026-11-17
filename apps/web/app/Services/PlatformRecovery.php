<?php

namespace App\Services;

use App\Models\GameRun;
use App\Models\PaymentWebhookInbox;
use App\Models\User;
use App\Payments\PaymentFulfillmentService;
use App\Payments\PaymentWebhookProcessor;
use App\Support\CanonicalJson;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PlatformRecovery
{
    /** @param array<string,mixed> $input
     * @return array<string,mixed>
     */
    public function recover(string $component, bool $apply, array $input): array
    {
        abort_unless(in_array($component, ['wallet', 'inventory', 'rewards', 'payment', 'webhook', 'runs', 'leaderboard'], true), 422, 'Unknown recovery component.');
        if (! $apply) {
            return ['mode' => 'diagnostic', 'component' => $component, 'health' => app(OperationsHealth::class)->inspect(isset($input['user']) ? (int) $input['user'] : null)];
        }
        $data = Validator::make($input, ['operation_id' => 'required|uuid', 'reason' => 'required|string|min:8|max:500',
            'user' => 'nullable|integer|min:1', 'order' => 'nullable|uuid', 'event' => 'nullable|uuid'])->validate();
        abort_if(in_array($component, ['wallet', 'inventory', 'rewards'], true) && empty($data['user']), 422, 'A single user is required for reward recovery.');
        abort_if($component === 'payment' && empty($data['order']) || $component === 'webhook' && empty($data['event']), 422, 'Explicit order/event is required.');
        $hash = CanonicalJson::hash(['component' => $component, ...$data]);
        $audit = app(PlatformAudit::class);
        $audit->record('cli', null, (string) Str::uuid(), $hash, 'recovery_requested', $component, $data['order'] ?? $data['event'] ?? (string) ($data['user'] ?? 'all'), $data['reason'],
            ['operation_id' => $data['operation_id']]);
        try {
            $result = [];
            if (in_array($component, ['rewards', 'inventory'], true)) {
                $result['inventory'] = app(InventoryService::class)->reconcile((int) $data['user']);
            }
            if (in_array($component, ['rewards', 'wallet'], true)) {
                $result['wallet'] = app(WalletService::class)->reconcileRewards((int) $data['user']);
            }
            if ($component === 'payment') {
                $result['ledger_id'] = app(PaymentFulfillmentService::class)->fulfill($data['order'], 'cli')->id;
            }
            if ($component === 'webhook') {
                $event = PaymentWebhookInbox::whereKey($data['event'])->firstOrFail();
                $verified = $event->getRawOriginal('verified_at');
                abort_unless(is_string($verified) && $verified !== '' && hash_equals($event->payload_hash, hash('sha256', $event->payload)), 409, 'Inbox authenticity record is invalid.');
                $result['event_status'] = app(PaymentWebhookProcessor::class)->process($event->id)->status;
            }
            if ($component === 'runs') {
                $result['expired'] = app(RunItemService::class)->expireSessions(isset($data['user']) ? (int) $data['user'] : null);
            }
            if ($component === 'leaderboard') {
                $result['users_rebuilt'] = $this->rebuild(isset($data['user']) ? (int) $data['user'] : null);
            }
            $incomplete = ($result['inventory']['failed'] ?? 0) + ($result['wallet']['failed'] ?? 0) > 0;
            $audit->record('cli', null, (string) Str::uuid(), $hash, $incomplete ? 'recovery_incomplete' : 'recovery_completed', $component, $data['order'] ?? $data['event'] ?? (string) ($data['user'] ?? 'all'), $data['reason'],
                ['operation_id' => $data['operation_id'], ...$result]);

            return ['mode' => $incomplete ? 'incomplete' : 'applied', ...$result];
        } catch (\Throwable $error) {
            $audit->record('cli', null, (string) Str::uuid(), $hash, 'recovery_failed', $component, $data['order'] ?? $data['event'] ?? (string) ($data['user'] ?? 'all'), $data['reason'],
                ['operation_id' => $data['operation_id'], 'error_class' => class_basename($error)]);
            throw $error;
        }
    }

    public function rebuild(?int $onlyUser): int
    {
        $count = 0;
        User::when($onlyUser !== null, fn ($q) => $q->whereKey($onlyUser))->orderBy('id')->each(function (User $u) use (&$count): void {
            DB::transaction(function () use ($u): void {
                AccountLock::acquire($u->id);
                $board = app(LeaderboardService::class);
                app(PublicProfileService::class)->ensure($u->id);
                GameRun::where('user_id', $u->id)->whereNotNull('record')->orderBy('id')->each(fn (GameRun $run) => $board->refreshFactsLocked($run));
                $board->syncUserLocked($u->id);
            }, 5);
            $count++;
        });

        return $count;
    }
}
