<?php

use App\Jobs\StripeWebhooks\HandlePaymentIntentSucceeded;
use Spatie\StripeWebhooks\StripeWebhookProfile;
use Spatie\WebhookClient\Models\WebhookCall;

return [
    'signing_secret' => env('SIGNING_SECRET'),
    'default_job' => '',
    'jobs' => [
        'payment_intent_succeeded' => HandlePaymentIntentSucceeded::class,
    ],
    'model' => WebhookCall::class,
    'profile' => StripeWebhookProfile::class,
    // Reuse the application's existing queue connection and worker.
    'connection' => null,
    'queue' => null,
    'verify_signature' => true,
];
