<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property string $request_hash
 * @property array<string,mixed> $result
 */
class PlatformAuditEntry extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $dateFormat = 'Y-m-d H:i:s.u';

    protected function casts(): array
    {
        return ['result' => 'array', 'context' => 'array', 'created_at' => 'immutable_datetime'];
    }
}
