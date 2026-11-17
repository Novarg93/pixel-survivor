<?php

namespace App\Payments;

use App\Models\PaymentPackage;
use App\Payments\Data\PaymentQuote;
use Illuminate\Support\Facades\Validator;

class PaymentPricingService
{
    /** @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function selection(array $input, bool $order = false): array
    {
        $rules = ['package_id' => 'required_without:custom_credits|prohibits:custom_credits|string|max:60',
            'custom_credits' => 'required_without:package_id|prohibits:package_id|integer:strict|between:1,1000000',
            'quote_hash' => 'sometimes|string|regex:/^[a-f0-9]{64}$/'];
        if ($order) {
            $rules['operation_id'] = 'required|uuid';
        }
        foreach (['price', 'amount_minor', 'currency', 'credits', 'credits_amount', 'user_id', 'provider', 'status', 'provider_payment_id', 'provider_checkout_id', 'provider_reference', 'success', 'mode'] as $key) {
            $rules[$key] = 'prohibited';
        }

        return Validator::make($input, $rules)->validate();
    }

    public function currency(): string
    {
        return app(PaymentProviderRegistry::class)->current()->name() === 'stripe_sandbox' ? config('payments.stripe_sandbox.currency') : 'XTS';
    }

    /** @return array<string, mixed> */
    public function customConfiguration(): array
    {
        $enabled = app()->environment(['local', 'testing']) && in_array(config('app.env'), ['local', 'testing'], true)
            && config('payments.custom.enabled') && app(PaymentProviderRegistry::class)->available();
        $v = Validator::make(config('payments.custom'), ['min' => 'required|integer:strict|between:1,1000000', 'max' => 'required|integer:strict|gte:min|max:1000000',
            'step' => 'required|integer:strict|between:1,1000000', 'minor_per_credit' => 'required|integer:strict|between:1,2000'])->validate();

        return ['enabled' => (bool) $enabled, 'min' => $v['min'], 'max' => $v['max'], 'step' => $v['step'], 'test_only' => true];
    }

    /** @param array<string, mixed> $selection */
    public function quote(array $selection, bool $lock = false): PaymentQuote
    {
        $provider = app(PaymentProviderRegistry::class)->current();
        if (isset($selection['package_id'])) {
            $query = PaymentPackage::whereKey($selection['package_id']);
            $package = ($lock ? $query->lockForUpdate() : $query)->firstOrFail();
            abort_unless($package->active && $package->mode === $provider->mode() && $package->currency === $this->currency(), 409, 'Package unavailable.');

            return new PaymentQuote($package->id, $package->credits_amount, $package->amount_minor, $package->currency, $package->currency_exponent, $provider->name(), $package->toArray());
        }
        $config = $this->customConfiguration();
        abort_unless($config['enabled'], 409, 'Custom top-ups are unavailable.');
        $credits = $selection['custom_credits'];
        Validator::make(['custom_credits' => $credits], ['custom_credits' => 'required|integer:strict|between:'.$config['min'].','.$config['max']])->validate();
        abort_unless(($credits - $config['min']) % $config['step'] === 0, 422, 'The quantity does not match the allowed increment.');
        $rate = config('payments.custom.minor_per_credit');
        abort_unless($credits <= intdiv(2000000000, $rate), 422, 'The amount exceeds the limit.');
        $amount = $credits * $rate;
        $snapshot = ['id' => 'custom', 'name' => 'Custom Credits', 'description' => 'Test quote. Not production pricing.', 'credits_amount' => $credits,
            'amount_minor' => $amount, 'currency' => $this->currency(), 'currency_exponent' => 2, 'mode' => 'test', 'kind' => 'custom',
            'pricing' => ['minor_per_credit' => $rate, 'min' => $config['min'], 'max' => $config['max'], 'step' => $config['step']]];

        return new PaymentQuote(null, $credits, $amount, $this->currency(), 2, $provider->name(), $snapshot);
    }
}
