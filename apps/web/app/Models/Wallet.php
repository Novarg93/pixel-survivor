<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** @property int $user_id
 * @property int $balance
 * @property int $sequence
 */
class Wallet extends Model
{
    public $timestamps = false;

    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $fillable = ['user_id', 'balance', 'sequence'];

    protected function casts(): array
    {
        return ['balance' => 'integer', 'sequence' => 'integer'];
    }
}
