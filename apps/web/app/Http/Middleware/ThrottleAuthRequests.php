<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Symfony\Component\HttpFoundation\Response;

class ThrottleAuthRequests
{
    public function __construct(private ThrottleRequests $throttle) {}

    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next): Response
    {
        $limiter = match ($request->route()?->getName()) {
            'register.store' => 'registration',
            'password.email' => 'password-reset-links',
            'password.update' => 'password-reset-submissions',
            default => null,
        };

        return $limiter === null ? $next($request) : $this->throttle->handle($request, $next, $limiter);
    }
}
