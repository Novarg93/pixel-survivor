<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class PublicHealthRateLimit
{
    /** A file-backed limiter remains available when MySQL/session storage is down.
     * @param  Closure(Request):Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $limiter = new RateLimiter(Cache::store('file'));
            $key = 'platform-health-'.hash('sha256', (string) $request->ip());
            if ($limiter->tooManyAttempts($key, 60)) {
                return response()->json(['status' => 'rate_limited'], 429);
            }
            $limiter->hit($key, 60);

            return $next($request);
        } catch (\Throwable) {
            return response()->json(['status' => 'unavailable'], 503);
        }
    }
}
