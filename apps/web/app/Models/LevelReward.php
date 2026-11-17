<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $track
 * @property int $level
 * @property array<int, array<string, mixed>> $rewards
 */
class LevelReward extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['level' => 'integer', 'rewards' => 'array'];
    }
}
