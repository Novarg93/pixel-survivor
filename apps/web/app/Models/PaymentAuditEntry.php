<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property string $order_id
 * @property string $actor_type
 * @property string $actor_id
 * @property string $action
 * @property array<string, mixed> $metadata
 * @property CarbonImmutable $created_at
 */
class PaymentAuditEntry extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $dateFormat = 'Y-m-d H:i:s.u';

    protected $fillable = ['id', 'order_id', 'actor_type', 'actor_id', 'action', 'metadata', 'created_at'];

    protected function casts(): array
    {
        return ['metadata' => 'array', 'created_at' => 'immutable_datetime'];
    }
}
