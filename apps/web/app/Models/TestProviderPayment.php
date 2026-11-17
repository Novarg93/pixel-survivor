<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property string $checkout_id
 * @property string $order_id
 * @property int $user_id
 * @property int $amount_minor
 * @property string $currency
 * @property string $status
 * @property CarbonImmutable $expires_at
 * @property CarbonImmutable|null $settled_at
 * @property CarbonImmutable $created_at
 */
class TestProviderPayment extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $dateFormat = 'Y-m-d H:i:s.u';

    protected $fillable = ['id', 'checkout_id', 'order_id', 'user_id', 'amount_minor', 'currency', 'status', 'expires_at', 'settled_at', 'created_at'];

    protected function casts(): array
    {
        return ['user_id' => 'integer', 'amount_minor' => 'integer', 'expires_at' => 'immutable_datetime', 'settled_at' => 'immutable_datetime', 'created_at' => 'immutable_datetime'];
    }
}
