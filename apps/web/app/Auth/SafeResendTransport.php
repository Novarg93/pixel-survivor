<?php

namespace App\Auth;

use GuzzleHttp\Client as HttpClient;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use Illuminate\Mail\Transport\ResendTransport;
use Illuminate\Support\Facades\Log;
use Psr\Http\Message\ResponseInterface;
use Resend\Client as ResendClient;
use Resend\Contracts\Client;
use Resend\Transporters\HttpTransporter;
use Resend\ValueObjects\ApiKey;
use Resend\ValueObjects\Transporter\BaseUri;
use Resend\ValueObjects\Transporter\Headers;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\SentMessage;
use Throwable;

class SafeResendTransport extends ResendTransport
{
    public static function client(#[\SensitiveParameter] string $key, ?callable $handler = null): Client
    {
        $stack = HandlerStack::create($handler);
        $stack->push(Middleware::mapResponse(static function (ResponseInterface $response): ResponseInterface {
            $status = $response->getStatusCode();
            if ($status < 200 || $status >= 300) {
                throw new TransportException('Resend rejected the email submission.', $status);
            }

            return $response;
        }));

        return new ResendClient(new HttpTransporter(
            new HttpClient(['handler' => $stack, 'connect_timeout' => 3, 'timeout' => 8, 'allow_redirects' => false]),
            BaseUri::from('https://api.resend.com'),
            Headers::withAuthorization(ApiKey::from($key)),
        ));
    }

    protected function doSend(SentMessage $message): void
    {
        try {
            parent::doSend($message);
        } catch (Throwable $error) {
            $status = (int) $error->getCode();
            Log::error('Resend email submission failed.', [
                'error_type' => $error::class,
                'http_status' => $status >= 400 && $status <= 599 ? $status : null,
            ]);

            // Provider exceptions can contain sensitive request or response data.
            throw new AuthMailDeliveryFailed;
        }
    }
}
