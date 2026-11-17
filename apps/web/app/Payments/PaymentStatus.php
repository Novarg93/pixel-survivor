<?php

namespace App\Payments;

enum PaymentStatus: string
{
    case Created = 'created';
    case CheckoutPending = 'checkout_pending';
    case Processing = 'processing';
    case Succeeded = 'succeeded';
    case Failed = 'failed';
    case Canceled = 'canceled';
    case Expired = 'expired';

    public function terminal(): bool
    {
        return in_array($this, [self::Succeeded, self::Failed, self::Canceled, self::Expired], true);
    }

    public function permits(self $next): bool
    {
        if ($this === $next) {
            return true;
        }
        if ($this->terminal()) {
            return false;
        }

        return match ($this) {
            self::Created => $next === self::CheckoutPending,
            self::CheckoutPending => $next !== self::Created,
            self::Processing => $next->terminal(),
            default => false,
        };
    }
}
