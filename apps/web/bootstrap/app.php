<?php

use App\Auth\AuthMailDeliveryFailed;
use App\Http\Controllers\AnalyticsPageViewController;
use App\Http\Controllers\PublicHealthController;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\PrivatePlatformResponses;
use App\Http\Middleware\PublicHealthRateLimit;
use App\Http\Middleware\ThrottleAuthRequests;
use App\Payments\PaymentProblem;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Spatie\WebhookClient\Exceptions\InvalidWebhookSignature;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: null,
        then: function (): void {
            Route::post('/analytics/page-view', AnalyticsPageViewController::class)
                ->middleware('throttle:60,1,analytics-page-view-')
                ->name('analytics.page-view');

            Route::get('/health', PublicHealthController::class)
                ->middleware(PublicHealthRateLimit::class);
            Route::get('/up', PublicHealthController::class)
                ->middleware(PublicHealthRateLimit::class);
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->preventRequestForgery(except: ['webhook', 'payments/webhooks/*']);
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            PrivatePlatformResponses::class,
            ThrottleAuthRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->dontFlash('token');
        $exceptions->dontReport(AuthMailDeliveryFailed::class);
        $exceptions->render(function (AuthMailDeliveryFailed $error, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Email is temporarily unavailable. Please try again later.'], 503);
            }

            if ($request->routeIs('verification.send')) {
                return redirect()->route('verification.notice')->with('status', 'verification-delivery-failed');
            }

            if ($request->routeIs('password.email')) {
                return redirect()->route('password.request')->with('deliveryError', 'Password reset is temporarily unavailable. Please try again later.');
            }
        });
        $exceptions->dontReport(InvalidWebhookSignature::class);
        $exceptions->render(fn (InvalidWebhookSignature $error) => response()->json(['error' => 'invalid_stripe_signature'], 400));
        $exceptions->render(function (PaymentProblem $problem) {
            return response()->json(['error' => $problem->reason], in_array($problem->reason, ['provider_unavailable', 'checkout_unavailable', 'verification_unavailable'], true) ? 503 : 409);
        });
        $exceptions->render(function (HttpExceptionInterface $error, Request $request) {
            if (! $request->expectsJson()) {
                if ($error->getStatusCode() === 403 && $request->routeIs('verification.verify')) {
                    return redirect()->route('verification.notice')->with('status', 'verification-link-invalid');
                }

                if ($error->getStatusCode() === 429) {
                    if ($request->routeIs('verification.send')) {
                        return redirect()->route('verification.notice')->with('status', 'verification-rate-limited');
                    }

                    if ($request->routeIs('password.email')) {
                        return redirect()->route('password.request')->with('deliveryError', 'Too many requests. Wait a minute and try again.');
                    }
                }
            }

            if ($request->is('health', 'operations*', 'api/*', 'leaderboard*')) {
                $status = $error->getStatusCode();

                return response()->json(['error' => $status === 409 ? $error->getMessage() : match ($status) {
                    401 => 'unauthenticated', 403 => 'forbidden', 404 => 'not_found', 419 => 'session_expired',
                    429 => 'too_many_requests', default => 'request_failed',
                }], $status, $error->getHeaders());
            }
        });
        $exceptions->render(function (Throwable $error, Request $request) {
            if (($request->is('health', 'operations*', 'api/*', 'leaderboard*'))
                && ! $error instanceof HttpExceptionInterface
                && ! $error instanceof ValidationException
                && ! $error instanceof AuthenticationException
                && ! $error instanceof AuthorizationException) {
                return response()->json(['error' => 'temporarily_unavailable'], $request->is('api/*') ? 500 : 503);
            }
        });
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
