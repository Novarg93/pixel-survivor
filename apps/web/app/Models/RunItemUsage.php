<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property int $user_id
 * @property string $game_run_id
 * @property string $item_id
 * @property string $operation_id
 * @property string $request_hash
 * @property string $status
 * @property array<string, mixed> $receipt
 */
class RunItemUsage extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $dateFormat = 'Y-m-d H:i:s.u';

    protected function casts(): array
    {
        return ['effect_snapshot' => 'array', 'receipt' => 'array', 'metadata' => 'array', 'accepted_at' => 'immutable_datetime', 'applied_at' => 'immutable_datetime', 'sequence' => 'integer', 'user_id' => 'integer'];
    }
}
