<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property string $item_id
 * @property int $delta
 * @property int $balance_after
 * @property string $source_type
 * @property array<string, mixed> $receipt
 */
class InventoryTransaction extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected $dateFormat = 'Y-m-d H:i:s.u';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['receipt' => 'array', 'delta' => 'integer', 'balance_after' => 'integer', 'created_at' => 'immutable_datetime'];
    }
}
