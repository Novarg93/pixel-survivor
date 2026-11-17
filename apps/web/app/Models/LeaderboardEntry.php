<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// Rebuildable best-run projection. GameRun.record remains the statistics authority.
class LeaderboardEntry extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $primaryKey = 'user_id';

    protected $guarded = [];
}
