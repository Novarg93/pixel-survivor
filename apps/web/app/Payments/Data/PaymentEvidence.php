<?php

declare(strict_types=1);

namespace App\Payments\Data;

use App\Payments\PaymentStatus;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

final readonly class PaymentEvidence
{
    public function __construct(public string $provider, public ?string $paymentId, public string $checkoutId, public string $orderId, public int $userId,
        public int $amountMinor, public string $currency, public PaymentStatus $status, public ?CarbonImmutable $settledAt) {}

    /** @param array<string, mixed> $input */
    public static function fromArray(array $input): self
    {
        $v = Validator::make($input, ['provider' => 'required|string|regex:/^[a-z][a-z0-9_]{0,39}$/', 'payment_id' => 'present|nullable|string|regex:/^[a-zA-Z0-9_-]{1,120}$/',
            'checkout_id' => 'required|string|regex:/^[a-zA-Z0-9_-]{1,120}$/', 'order_id' => 'required|uuid', 'user_id' => 'required|integer:strict|min:1',
            'amount_minor' => 'required|integer:strict|between:1,2000000000', 'currency' => 'required|string|regex:/^[A-Z]{3}$/', 'status' => ['required', Rule::enum(PaymentStatus::class)], 'settled_at' => 'present|nullable|date'])->validate();

        return new self($v['provider'], $v['payment_id'], $v['checkout_id'], strtolower($v['order_id']), $v['user_id'], $v['amount_minor'], $v['currency'], PaymentStatus::from($v['status']), $v['settled_at'] ? CarbonImmutable::parse($v['settled_at']) : null);
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return ['provider' => $this->provider, 'payment_id' => $this->paymentId, 'checkout_id' => $this->checkoutId, 'order_id' => $this->orderId, 'user_id' => $this->userId,
            'amount_minor' => $this->amountMinor, 'currency' => $this->currency, 'status' => $this->status->value, 'settled_at' => $this->settledAt?->toISOString()];
    }
}
