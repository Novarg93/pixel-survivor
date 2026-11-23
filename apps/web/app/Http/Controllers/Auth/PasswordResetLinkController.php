<?php

namespace App\Http\Controllers\Auth;

use App\Auth\AuthMailDeliveryFailed;
use App\Jobs\SendPasswordResetLink;
use Illuminate\Contracts\Bus\Dispatcher;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Http\Controllers\PasswordResetLinkController as FortifyController;
use Laravel\Fortify\Http\Requests\SendPasswordResetLinkRequest;
use Throwable;

class PasswordResetLinkController extends FortifyController
{
    public function store(SendPasswordResetLinkRequest $request): Responsable
    {
        $email = (string) $request->validated(Fortify::email());
        if (config('fortify.lowercase_usernames')) {
            $email = Str::lower($email);
        }

        $connection = config('queue.default');
        if (app()->isProduction() && ! in_array(config("queue.connections.{$connection}.driver"), ['database', 'redis', 'sqs', 'beanstalkd'], true)) {
            Log::error('Password reset requests require an asynchronous queue in production.');

            throw new AuthMailDeliveryFailed;
        }

        try {
            app(Dispatcher::class)->dispatch(new SendPasswordResetLink($email));
        } catch (Throwable $error) {
            Log::error('Password reset request could not be queued.', ['error_type' => $error::class]);

            throw new AuthMailDeliveryFailed;
        }

        return new PasswordResetRequested;
    }
}
