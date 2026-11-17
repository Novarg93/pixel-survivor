<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property string $provider
 * @property string $provider_event_id
 * @property string $event_type
 * @property string|null $order_id
 * @property string $payload
 * @property string $payload_hash
 * @property CarbonImmutable $received_at
 * @property CarbonImmutable $last_received_at
 * @property CarbonImmutable $verified_at
 * @property int $delivery_count
 * @property int $attempts
 * @property string $status
 * @property string|null $error
 * @property CarbonImmutable|null $processed_at
 */
#[Hidden(['payload'])]
class PaymentWebhookInbox extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $dateFormat = 'Y-m-d H:i:s.u';

    protected $table = 'payment_webhook_inbox';

    protected $fillable = ['id', 'provider', 'provider_event_id', 'event_type', 'order_id', 'payload', 'payload_hash', 'received_at', 'last_received_at', 'verified_at', 'delivery_count', 'attempts', 'status', 'error', 'processed_at'];

    protected function casts(): array
    {
        return ['payload' => 'encrypted', 'received_at' => 'immutable_datetime', 'last_received_at' => 'immutable_datetime', 'verified_at' => 'immutable_datetime', 'delivery_count' => 'integer', 'attempts' => 'integer', 'processed_at' => 'immutable_datetime'];
    }
}
