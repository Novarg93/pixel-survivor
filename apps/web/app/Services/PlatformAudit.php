<?php

namespace App\Services;

use App\Models\PlatformAuditEntry;
use Illuminate\Support\Str;

class PlatformAudit
{
    /** @return array<string,mixed>|null */
    public function replay(string $actor, string $operation, string $hash): ?array
    {
        $entry = PlatformAuditEntry::where('actor_key', $actor)->where('operation_id', $operation)->first();
        if (! $entry) {
            return null;
        }
        abort_unless(hash_equals($entry->request_hash, $hash), 409, 'Operation ID conflict.');

        return $entry->result;
    }

    /** @param array<string,mixed> $result
     * @param  array<string,mixed>  $context
     * @return array<string,mixed>
     */
    public function record(string $actor, ?int $actorId, string $operation, string $hash, string $action, string $subjectType, string $subjectId, ?string $reason, array $result, array $context = []): array
    {
        $row = PlatformAuditEntry::create(['id' => (string) Str::uuid(), 'actor_key' => $actor, 'actor_user_id' => $actorId,
            'operation_id' => $operation, 'request_hash' => $hash, 'action' => $action, 'subject_type' => $subjectType,
            'subject_id' => $subjectId, 'reason' => $reason, 'result' => $result, 'context' => $context, 'created_at' => now()]);

        return $row->refresh()->result;
    }
}
