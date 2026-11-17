<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameplaySetting extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['settings' => 'array'];
    }
}
