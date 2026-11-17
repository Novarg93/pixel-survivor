<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** @property string $key
 * @property string $item_id
 * @property string $name
 * @property string $description
 * @property int $price
 * @property bool $active
 * @property int|null $per_user_limit
 * @property string|null $icon
 */
class ShopProduct extends Model
{
    public $timestamps = false;

    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['key', 'item_id', 'name', 'description', 'price', 'active', 'sort_order', 'per_user_limit', 'icon'];

    protected function casts(): array
    {
        return ['price' => 'integer', 'active' => 'boolean', 'sort_order' => 'integer', 'per_user_limit' => 'integer'];
    }
}
