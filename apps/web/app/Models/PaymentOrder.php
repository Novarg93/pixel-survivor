<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property int $user_id
 * @property string|null $package_id
 * @property string $operation_id
 * @property string $request_hash
 * @property array<string, mixed> $package_snapshot
 * @property int $credits_amount
 * @property int $amount_minor
 * @property string $currency
 * @property int $currency_exponent
 * @property string $provider
 * @property string $mode
 * @property string|null $provider_checkout_id
 * @property string|null $provider_payment_id
 * @property string $status
 * @property string $fulfillment_status
 * @property string|null $checkout_url
 * @property int $checkout_attempts
 * @property string|null $checkout_error
 * @property int $fulfillment_attempts
 * @property string|null $fulfillment_error
 * @property string|null $verification_error
 * @property string|null $failure_reason
 * @property CarbonImmutable $created_at
 * @property CarbonImmutable $expires_at
 * @property CarbonImmutable|null $confirmed_at
 * @property CarbonImmutable|null $fulfilled_at
 * @property CarbonImmutable|null $last_checked_at
 * @property string|null $credit_transaction_id
 * @property array<string, mixed> $metadata
 */
class PaymentOrder extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $dateFormat = 'Y-m-d H:i:s.u';

    protected static function booted(): void
    {
        static::creating(function (PaymentOrder $order): void {
            // Settlement snapshot only. Display preferences never enter payment pricing.
            $currency = Currency::where('code', $order->currency)->first();
            if ($currency && $order->currency !== 'XTS') {
                $order->setAttribute('currency_id', $currency->id);
                $order->setAttribute('currency_exchange_rate', $currency->exchange_rate);
            }
        });
    }

    protected $fillable = ['id', 'user_id', 'package_id', 'operation_id', 'request_hash', 'package_snapshot', 'credits_amount', 'amount_minor', 'currency', 'currency_exponent', 'provider', 'mode', 'provider_checkout_id', 'provider_payment_id', 'status', 'fulfillment_status', 'checkout_url', 'checkout_attempts', 'checkout_error', 'fulfillment_attempts', 'fulfillment_error', 'verification_error', 'failure_reason', 'created_at', 'expires_at', 'confirmed_at', 'fulfilled_at', 'last_checked_at', 'credit_transaction_id', 'metadata'];

    protected function casts(): array
    {
        return ['currency_id' => 'integer', 'currency_exchange_rate' => 'decimal:8', 'user_id' => 'integer', 'credits_amount' => 'integer', 'amount_minor' => 'integer', 'currency_exponent' => 'integer', 'package_snapshot' => 'array', 'metadata' => 'array', 'created_at' => 'immutable_datetime', 'expires_at' => 'immutable_datetime', 'confirmed_at' => 'immutable_datetime', 'fulfilled_at' => 'immutable_datetime', 'last_checked_at' => 'immutable_datetime', 'checkout_attempts' => 'integer', 'fulfillment_attempts' => 'integer'];
    }
}
