<?php

namespace App\Payments;

use App\Models\PaymentOrder;
use App\Models\PaymentPackage;
use Illuminate\Support\Facades\Validator;

class PaymentService
{
    public function syncPackages(): void
    {
        foreach (config('payments.packages') as $id => $package) {
            $v = Validator::make(['id' => $id, ...$package], ['id' => 'required|string|regex:/^[a-z][a-z0-9_]{0,59}$/', 'name' => 'required|string|max:120',
                'credits_amount' => 'required|integer:strict|between:1,1000000', 'amount_minor' => 'required|integer:strict|between:1,2000000000',
                'currency' => 'required|in:XTS', 'sort_order' => 'required|integer:strict|min:0'])->validate();
            PaymentPackage::updateOrCreate(['id' => $id], [...$v, 'description' => 'Local test package. No real money is accepted.', 'currency_exponent' => 2, 'mode' => 'test', 'active' => true]);
        }
        if (config('payments.provider') === 'stripe_sandbox') {
            foreach (config('payments.packages') as $id => $package) {
                // Separate catalog entries in the isolated sandbox; XTS is not an ISO payment currency.
                PaymentPackage::updateOrCreate(['id' => 'stripe_'.$id], [...$package, 'currency' => config('payments.stripe_sandbox.currency'),
                    'description' => 'Stripe Sandbox. Test price only, no real money.', 'currency_exponent' => 2, 'mode' => 'test', 'active' => true]);
            }
        }
    }

    /** @return array<string, mixed> */
    public function orderDto(PaymentOrder $order): array
    {
        $canCheckout = app(PaymentProviderRegistry::class)->availableFor($order->provider) && ! PaymentStatus::from($order->status)->terminal() && $order->expires_at->isFuture();

        return ['id' => $order->id, 'provider' => $order->provider, 'package' => $order->package_snapshot, 'credits_amount' => $order->credits_amount, 'amount_minor' => $order->amount_minor,
            'currency' => $order->currency, 'currency_exponent' => $order->currency_exponent, 'mode' => $order->mode, 'status' => $order->status, 'fulfillment_status' => $order->fulfillment_status,
            'checkout_url' => $canCheckout ? $order->checkout_url : null, 'checkout_error' => $order->checkout_error, 'verification_error' => $order->verification_error,
            'fulfillment_error' => $order->fulfillment_error, 'created_at' => $order->created_at->toISOString(), 'expires_at' => $order->expires_at->toISOString(),
            'confirmed_at' => $order->confirmed_at?->toISOString(), 'fulfilled_at' => $order->fulfilled_at?->toISOString()];
    }

    /** @return array<string, mixed> */
    public function snapshot(int $userId, int $page = 1): array
    {
        $enabled = app(PaymentProviderRegistry::class)->available();
        $stripe = config('payments.provider') === 'stripe_sandbox';
        $history = PaymentOrder::where('user_id', $userId)->orderByDesc('created_at')->orderByDesc('id')->paginate(20, ['*'], 'payment_page', $page);
        $data = $history->toArray();
        $data['data'] = array_map(fn (PaymentOrder $o) => $this->orderDto($o), $history->items());

        return ['enabled' => $enabled, 'mode' => $enabled ? app(PaymentProviderRegistry::class)->current()->mode() : 'unavailable', 'server_now' => now()->toISOString(),
            'dev_mode' => $enabled && config('payments.provider') === 'dev',
            'stripe_mode' => $enabled && config('payments.provider') === 'stripe_sandbox',
            'payment_method' => match ($enabled ? config('payments.provider') : 'none') {
                'dev' => 'DEV payment · no money charged', 'stripe_sandbox' => 'Stripe Sandbox · test card', default => 'Local Test Provider',
            },
            'custom' => app(PaymentPricingService::class)->customConfiguration(),
            'packages' => ($enabled || $stripe) ? PaymentPackage::where('mode', $stripe ? 'test' : app(PaymentProviderRegistry::class)->current()->mode())
                ->where('currency', $stripe ? config('payments.stripe_sandbox.currency') : app(PaymentPricingService::class)->currency())->orderBy('sort_order')->get()->toArray() : [], 'orders' => $data];
    }
}
