<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Contracts\Support\Responsable;
use Illuminate\Http\Request;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Http\Controllers\NewPasswordController;

class ResetPasswordController extends NewPasswordController
{
    public function store(Request $request): Responsable
    {
        $request->validate([
            Fortify::email() => ['required', 'string', 'email', 'max:255'],
            'token' => ['required', 'string', 'max:255'],
        ]);

        return parent::store($request);
    }
}
