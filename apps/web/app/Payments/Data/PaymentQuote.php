<?php

declare(strict_types=1);

namespace App\Payments\Data;

final readonly class PaymentQuote
{
    /** @param array<string, mixed> $snapshot */
    public function __construct(public ?string $packageId, public int $credits, public int $amountMinor, public string $currency,
        public int $exponent, public string $provider, public array $snapshot) {}

    public function fingerprint(): string
    {
        return hash('sha256', json_encode([$this->packageId, $this->credits, $this->amountMinor, $this->currency, $this->exponent, $this->provider], JSON_THROW_ON_ERROR));
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return ['package_id' => $this->packageId, 'name' => $this->snapshot['name'], 'credits_amount' => $this->credits, 'amount_minor' => $this->amountMinor,
            'currency' => $this->currency, 'currency_exponent' => $this->exponent, 'quote_hash' => $this->fingerprint(), 'payment_method' => match ($this->provider) {
                'dev' => 'DEV payment · no money charged', 'stripe_sandbox' => 'Stripe Sandbox · test card', default => 'Local Test Provider',
            }];
    }
}
