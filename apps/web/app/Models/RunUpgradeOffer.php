<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** @property string $id
 * @property array<string,mixed> $context
 * @property list<string> $choices
 * @property int $generation
 * @property int $level
 * @property string $context_hash
 */
class RunUpgradeOffer extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['context' => 'array', 'choices' => 'array', 'generation' => 'integer', 'level' => 'integer'];
    }
}
