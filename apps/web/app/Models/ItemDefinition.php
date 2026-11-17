<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property string $version
 * @property string $type
 * @property bool $activation_enabled
 * @property array<string, mixed> $effect
 */
class ItemDefinition extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['effect' => 'array', 'activation_enabled' => 'boolean'];
    }
}
