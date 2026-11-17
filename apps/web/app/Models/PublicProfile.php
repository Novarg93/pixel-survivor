<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property int $user_id
 * @property string $nickname
 * @property string $nickname_key
 * @property CarbonImmutable|null $nickname_changed_at
 */
class PublicProfile extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $dateFormat = 'Y-m-d H:i:s.u';

    protected function casts(): array
    {
        return ['user_id' => 'integer', 'nickname_changed_at' => 'immutable_datetime'];
    }
}
