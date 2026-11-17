<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property string $order_id
 * @property string $provider
 * @property string $provider_payment_id
 * @property string $provider_checkout_id
 * @property int $amount_minor
 * @property string $currency
 * @property CarbonImmutable $settled_at
 * @property CarbonImmutable $verified_at
 * @property array<string, mixed> $evidence
 * @property string $evidence_hash
 * @property string $source_type
 * @property string $source_reference
 */
class PaymentConfirmation extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $dateFormat = 'Y-m-d H:i:s.u';

    protected $fillable = ['id', 'order_id', 'provider', 'provider_payment_id', 'provider_checkout_id', 'amount_minor', 'currency', 'settled_at', 'verified_at', 'evidence', 'evidence_hash', 'source_type', 'source_reference'];

    protected function casts(): array
    {
        return ['amount_minor' => 'integer', 'settled_at' => 'immutable_datetime', 'verified_at' => 'immutable_datetime', 'evidence' => 'array'];
    }
}
