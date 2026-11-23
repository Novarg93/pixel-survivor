<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PrivatePlatformResponses
{
    /** @param Closure(Request):Response $next */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        if ($request->routeIs('verification.*', 'password.request', 'password.email', 'password.reset', 'password.update')) {
            $response->headers->set('Referrer-Policy', 'no-referrer');
            $response->headers->set('Cache-Control', 'private, no-store');
        }

        if ($request->is('account', 'account/*', 'dashboard', 'wallet', 'shop', 'inventory', 'currency', 'operations*', 'runs', 'runs/*', 'settings/*', 'api/v1/operations/*', 'api/v1/runs/*/status', 'api/v1/profile/nickname')) {
            $response->headers->set('Cache-Control', 'private, no-store');
        }

        return $response;
    }
}
