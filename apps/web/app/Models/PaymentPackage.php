<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property string $name
 * @property string|null $description
 * @property int $credits_amount
 * @property int $amount_minor
 * @property string $currency
 * @property int $currency_exponent
 * @property string $mode
 * @property bool $active
 * @property int $sort_order
 */
class PaymentPackage extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $dateFormat = 'Y-m-d H:i:s.u';

    protected $fillable = ['id', 'name', 'description', 'credits_amount', 'amount_minor', 'currency', 'currency_exponent', 'mode', 'active', 'sort_order'];

    protected function casts(): array
    {
        return ['credits_amount' => 'integer', 'amount_minor' => 'integer', 'currency_exponent' => 'integer', 'active' => 'boolean', 'sort_order' => 'integer'];
    }
}
