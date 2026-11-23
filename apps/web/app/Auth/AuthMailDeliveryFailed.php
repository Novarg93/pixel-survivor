<?php

namespace App\Auth;

use RuntimeException;

class AuthMailDeliveryFailed extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('Transactional email delivery could not be confirmed.');
    }
}
