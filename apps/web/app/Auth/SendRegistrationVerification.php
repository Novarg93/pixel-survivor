<?php

namespace App\Auth;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;

class SendRegistrationVerification extends SendEmailVerificationNotification
{
    public function handle(Registered $event): void
    {
        try {
            parent::handle($event);
        } catch (AuthMailDeliveryFailed) {
            if (request()->hasSession()) {
                request()->session()->flash('status', 'verification-delivery-failed');
            }
        }
    }
}
