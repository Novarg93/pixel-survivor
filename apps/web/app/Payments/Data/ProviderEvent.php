<?php

declare(strict_types=1);

namespace App\Payments\Data;

use Illuminate\Support\Facades\Validator;

final readonly class ProviderEvent
{
    public function __construct(public string $id, public string $type, public ?PaymentEvidence $payment, public ?string $providerType = null) {}

    public static function fromJson(string $raw): self
    {
        $input = json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
        $v = Validator::make(['event' => $input], ['event' => 'required|array:id,type,payment', 'event.id' => 'required|string|regex:/^[a-zA-Z0-9_-]{1,120}$/',
            'event.type' => 'required|string|max:80', 'event.payment' => 'required|array:provider,payment_id,checkout_id,order_id,user_id,amount_minor,currency,status,settled_at'])->validate()['event'];

        return new self($v['id'], $v['type'], PaymentEvidence::fromArray($v['payment']));
    }
}
