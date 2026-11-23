<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Laravel\Fortify\Features;
use Laravel\Fortify\Http\Responses\RegisterResponse;
use Symfony\Component\HttpFoundation\Response;

class RegistrationResponse extends RegisterResponse
{
    public function toResponse($request): Response
    {
        $user = $request->user();
        if (! $request->wantsJson() && Features::enabled(Features::emailVerification())
            && $user instanceof MustVerifyEmail && ! $user->hasVerifiedEmail()) {
            return redirect()->route('verification.notice');
        }

        return parent::toResponse($request);
    }
}
