<?php

namespace App\Policies;

use App\Models\Currency;
use App\Models\User;

class CurrencyPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, Currency $currency): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, Currency $currency): bool
    {
        return $this->viewAny($user);
    }

    public function delete(User $user, Currency $currency): bool
    {
        return $this->viewAny($user) && $currency->code !== 'EUR' && ! $currency->is_default && ! $currency->isReferenced();
    }
}
