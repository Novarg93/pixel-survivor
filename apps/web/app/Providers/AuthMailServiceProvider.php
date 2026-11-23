<?php

namespace App\Providers;

use App\Auth\AuthMailDeliveryFailed;
use App\Auth\SafeResendTransport;
use App\Auth\SendRegistrationVerification;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Routing\UrlGenerator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;
use Resend\Contracts\Client;

class AuthMailServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(SendEmailVerificationNotification::class, SendRegistrationVerification::class);

        $this->app->singleton(Client::class, static function (): Client {
            $key = config('services.resend.key');
            if (! is_string($key) || trim($key) === '') {
                Log::error('Resend email submission disabled because RESEND_KEY is missing.');

                throw new AuthMailDeliveryFailed;
            }

            return SafeResendTransport::client($key);
        });
    }

    public function boot(): void
    {
        Mail::extend('resend', static fn () => new SafeResendTransport(app(Client::class)));

        VerifyEmail::createUrlUsing(fn (MustVerifyEmail&Model $user): string => $this->emailUrls()->temporarySignedRoute(
            'verification.verify',
            now()->addMinutes((int) config('auth.verification.expire', 60)),
            ['id' => $user->getKey(), 'hash' => sha1($user->getEmailForVerification())],
        ));

        VerifyEmail::toMailUsing(static fn (MustVerifyEmail $user, string $url) => self::message(
            'Verify your email address',
            'Confirm your email to unlock your Pixel Survivor account.',
            'Verify Email Address',
            $url,
            (int) config('auth.verification.expire', 60),
            'If you did not create a Pixel Survivor account, you can ignore this email.',
        ));

        ResetPassword::toMailUsing(fn (CanResetPassword $user, string $token) => self::message(
            'Reset your password',
            'We received a request to reset the password for your Pixel Survivor account.',
            'Reset Password',
            $this->emailUrls()->route('password.reset', ['token' => $token, 'email' => $user->getEmailForPasswordReset()]),
            (int) config('auth.passwords.'.config('fortify.passwords').'.expire'),
            'If you did not request a reset, you can ignore this email. Your password will stay the same.',
        ));
    }

    private function emailUrls(): UrlGenerator
    {
        $urls = app(UrlGenerator::class);
        if (! $this->app->isProduction()) {
            return $urls;
        }

        $origin = rtrim((string) config('app.url'), '/');
        $parts = parse_url($origin);
        if (($parts['scheme'] ?? null) !== 'https' || empty($parts['host'])
            || array_intersect(['user', 'pass', 'path', 'query', 'fragment'], array_keys($parts)) !== []) {
            Log::error('Transactional email links require an HTTPS APP_URL origin.');

            throw new AuthMailDeliveryFailed;
        }

        $urls = clone $urls;
        $urls->setRequest(Request::create($origin));
        $urls->useOrigin($origin);
        $urls->forceScheme('https');

        return $urls;
    }

    private static function message(string $title, string $intro, string $action, string $url, int $minutes, string $ignore): MailMessage
    {
        return (new MailMessage)
            ->subject($title)
            ->action($action, $url)
            ->view(['html' => 'mail.auth.html', 'text' => 'mail.auth.text'], compact('title', 'intro', 'action', 'url', 'minutes', 'ignore'));
    }
}
