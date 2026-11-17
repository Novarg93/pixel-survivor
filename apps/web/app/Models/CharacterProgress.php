<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $user_id
 * @property string $character_id
 * @property int $level
 * @property int $xp
 */
class CharacterProgress extends Model
{
    protected $table = 'character_progress';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['level' => 'integer', 'xp' => 'integer'];
    }
}
