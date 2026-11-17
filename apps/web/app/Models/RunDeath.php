<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property int $user_id
 * @property string $game_run_id
 * @property string $status
 * @property string $elapsed
 * @property CarbonImmutable $expires_at
 */
class RunDeath extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['requested_at' => 'immutable_datetime', 'expires_at' => 'immutable_datetime', 'revived_at' => 'immutable_datetime', 'elapsed' => 'decimal:3', 'user_id' => 'integer'];
    }
}
