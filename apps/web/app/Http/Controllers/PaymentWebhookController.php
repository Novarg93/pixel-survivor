<?php

namespace App\Http\Controllers;

use App\Payments\Data\WebhookHeaders;
use App\Payments\PaymentProblem;
use App\Payments\PaymentProviderRegistry;
use App\Payments\PaymentWebhookProcessor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PaymentWebhookController extends Controller
{
    public function __invoke(Request $request, string $provider, PaymentWebhookProcessor $processor): JsonResponse
    {
        try {
            $adapter = app(PaymentProviderRegistry::class)->forWebhook($provider, $request);
        } catch (PaymentProblem) {
            abort(404);
        }
        abort_unless(str_contains(strtolower($request->header('Content-Type', '')), 'application/json'), 415);
        try {
            $signature = $adapter->extractSignature(WebhookHeaders::fromRequest($request, $adapter->signatureHeaderNames()));
        } catch (ValidationException) {
            abort(401, 'Invalid webhook authentication.');
        }
        try {
            $inbox = $processor->receive($provider, $request->getContent(), $signature);
        } catch (\JsonException) {
            abort(400, 'Invalid event JSON.');
        }

        return response()->json(['event_id' => $inbox->provider_event_id, 'status' => $inbox->status], in_array($inbox->status, ['pending', 'processing', 'failed'], true) ? 202 : 200);
    }
}
