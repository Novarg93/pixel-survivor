<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LimitRunPayload
{
    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next): Response
    {
        abort_if(strlen($request->getContent()) > 32768, 413, 'Run payload exceeds 32 KiB.');

        return $next($request);
    }
}
