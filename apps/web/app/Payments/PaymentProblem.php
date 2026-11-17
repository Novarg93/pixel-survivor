<?php

namespace App\Payments;

class PaymentProblem extends \RuntimeException
{
    public function __construct(public readonly string $reason)
    {
        parent::__construct($reason);
    }
}
