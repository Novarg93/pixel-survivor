<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property string $effect_key
 * @property CarbonImmutable $activated_at
 * @property CarbonImmutable $expires_at
 * @property array<string, mixed> $parameters
 */
class ActiveAccountEffect extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['parameters' => 'array', 'activated_at' => 'immutable_datetime', 'expires_at' => 'immutable_datetime'];
    }
}
