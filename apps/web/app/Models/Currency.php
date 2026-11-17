<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $code
 * @property string $name
 * @property string $symbol
 * @property string $exchange_rate
 * @property int $decimal_places
 * @property bool $is_default
 * @property bool $is_active
 * @property int $sort_order
 */
class Currency extends Model
{
    protected $fillable = ['code', 'name', 'symbol', 'exchange_rate', 'decimal_places', 'is_default', 'is_active', 'sort_order'];

    protected $hidden = ['default_slot'];

    protected function casts(): array
    {
        return ['exchange_rate' => 'decimal:8', 'decimal_places' => 'integer', 'sort_order' => 'integer', 'is_default' => 'boolean', 'is_active' => 'boolean'];
    }

    public function isReferenced(): bool
    {
        return PaymentOrder::where('currency', $this->code)->exists() || PaymentPackage::where('currency', $this->code)->exists();
    }
}
