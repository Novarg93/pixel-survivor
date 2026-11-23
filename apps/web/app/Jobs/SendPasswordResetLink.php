<?php

namespace App\Jobs;

use App\Auth\AuthMailDeliveryFailed;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Password;
use Laravel\Fortify\Fortify;

class SendPasswordResetLink implements ShouldBeEncrypted, ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public function __construct(public string $email) {}

    public function handle(): void
    {
        try {
            Password::broker(config('fortify.passwords'))->sendResetLink([Fortify::email() => $this->email]);
        } catch (AuthMailDeliveryFailed $error) {
            $this->fail($error);
        }
    }
}
