<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** @property int $quantity */
class InventoryBalance extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['quantity' => 'integer'];
    }
}
