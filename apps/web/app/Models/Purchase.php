<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** @property string $id
 * @property string $request_hash
 * @property array<string, mixed> $receipt
 */
class Purchase extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $dateFormat = 'Y-m-d H:i:s.u';

    protected $fillable = ['id', 'user_id', 'operation_id', 'request_hash', 'product_key', 'quantity', 'unit_price', 'total', 'status', 'product_snapshot', 'receipt', 'credit_transaction_id', 'inventory_transaction_id', 'created_at'];

    protected function casts(): array
    {
        return ['quantity' => 'integer', 'unit_price' => 'integer', 'total' => 'integer', 'product_snapshot' => 'array', 'receipt' => 'array', 'created_at' => 'immutable_datetime'];
    }
}
