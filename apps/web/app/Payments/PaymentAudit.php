<?php

namespace App\Payments;

use App\Models\PaymentAuditEntry;
use App\Models\PaymentOrder;
use Illuminate\Support\Str;

class PaymentAudit
{
    /** @param array<string, mixed> $metadata */
    public static function record(PaymentOrder $order, string $action, array $metadata = [], string $actor = 'system', ?int $actorId = null): void
    {
        PaymentAuditEntry::create(['id' => (string) Str::uuid(), 'order_id' => $order->id, 'action' => $action, 'metadata' => $metadata, 'actor_type' => $actor, 'actor_id' => $actorId, 'created_at' => now()]);
    }

    public static function transition(PaymentOrder $order, PaymentStatus $next): void
    {
        $old = PaymentStatus::from($order->status);
        if (! $old->permits($next)) {
            throw new PaymentProblem('terminal_status_conflict');
        }
        if ($old !== $next) {
            $order->status = $next->value;
            self::record($order, 'status_changed', ['from' => $old->value, 'to' => $next->value]);
        }
    }
}
