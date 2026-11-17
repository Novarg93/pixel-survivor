<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $user_id
 * @property int $level
 * @property int $xp
 */
class AccountProgress extends Model
{
    protected $table = 'account_progress';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['level' => 'integer', 'xp' => 'integer'];
    }
}
