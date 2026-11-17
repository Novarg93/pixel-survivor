<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** @property string $id
 * @property int $user_id
 * @property string $type
 * @property int $amount
 * @property int $balance_after
 * @property int $sequence
 * @property string $source_id
 * @property string $idempotency_reference
 * @property string $request_hash
 * @property array<string, mixed> $metadata
 */
class CreditTransaction extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $dateFormat = 'Y-m-d H:i:s.u';

    protected $fillable = ['id', 'user_id', 'type', 'amount', 'balance_after', 'sequence', 'source_id', 'idempotency_reference', 'request_hash', 'metadata', 'created_at'];

    protected function casts(): array
    {
        return ['amount' => 'integer', 'balance_after' => 'integer', 'sequence' => 'integer', 'metadata' => 'array', 'created_at' => 'immutable_datetime'];
    }
}
