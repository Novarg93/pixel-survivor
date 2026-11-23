<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Contracts\Support\Responsable;
use Symfony\Component\HttpFoundation\Response;

class PasswordResetRequested implements Responsable
{
    public function toResponse($request): Response
    {
        $message = 'If an account exists for that email address, you will receive a password reset link. Check your spam folder if it does not arrive.';

        return $request->wantsJson()
            ? response()->json(['message' => $message], 202)
            : redirect()->route('password.request')->with('status', $message);
    }
}
