<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property int $user_id
 * @property string $game_run_id
 * @property string $operation_id
 * @property string $request_hash
 * @property string $action
 * @property string $status
 * @property array<string,mixed> $receipt
 */
class RunPaidAction extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $dateFormat = 'Y-m-d H:i:s.u';

    protected function casts(): array
    {
        return ['receipt' => 'array', 'effect_snapshot' => 'array', 'sequence' => 'integer', 'price_tokens' => 'integer',
            'accepted_at' => 'immutable_datetime', 'applied_at' => 'immutable_datetime', 'user_id' => 'integer'];
    }
}
