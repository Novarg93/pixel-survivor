<?php

namespace App\Services;

use App\Models\Currency;
use App\Models\User;
use Brick\Math\BigDecimal;
use Brick\Math\BigRational;
use Brick\Math\RoundingMode;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CurrencyService
{
    /** @return Collection<int, Currency> */
    public function active(): Collection
    {
        return Currency::where('is_active', true)->orderBy('sort_order')->orderBy('code')->get();
    }

    public function default(): Currency
    {
        return Currency::where('is_default', true)->where('is_active', true)->firstOrFail();
    }

    public function available(string $code): Currency
    {
        $currency = Currency::where('code', $code)->where('is_active', true)->first();
        if (! $currency || $code === 'XTS') {
            throw ValidationException::withMessages(['currency' => 'Currency unavailable.']);
        }

        return $currency;
    }

    public function selected(?User $user, ?string $guestCode = null): Currency
    {
        $candidate = $user ? Currency::whereKey($user->getAttribute('preferred_currency_id'))->where('is_active', true)->first()
            : Currency::where('code', $guestCode)->where('is_active', true)->first();

        return $candidate ?? $this->default();
    }

    /** Integer minor units, exact rational arithmetic, one final HALF_UP rounding. */
    public function convert(string $minor, string $from, string $to): string
    {
        $source = $this->available($from);
        $target = $this->available($to);
        if (! preg_match('/^-?\d{1,24}$/D', $minor)) {
            throw new \InvalidArgumentException('Expected integer minor units.');
        }

        return (string) BigRational::of($minor)->multipliedBy($target->exchange_rate)->multipliedBy(10 ** $target->decimal_places)
            ->dividedBy($source->exchange_rate)->dividedBy(10 ** $source->decimal_places)->toScale(0, RoundingMode::HalfUp);
    }

    public function format(string $minor, string $code, ?int $originalExponent = null): string
    {
        $currency = Currency::where('code', $code)->first();
        $places = $originalExponent ?? $currency->decimal_places ?? 2;
        // Converted display values can exceed the bounded source amount's digit count.
        if (! preg_match('/^-?\d{1,64}$/D', $minor) || $places < 0 || $places > 4) {
            throw new \InvalidArgumentException('Invalid monetary value.');
        }

        return (string) BigDecimal::of($minor)->dividedBy(10 ** $places, $places).' '.$code.($currency ? ' '.$currency->symbol : '');
    }

    /** Default changes only display fallback; the EUR anchor and settlement contracts never change.
     * @param  array<string, mixed>  $input
     */
    public function save(?Currency $currency, array $input): Currency
    {
        if (isset($input['exchange_rate']) && ! is_string($input['exchange_rate'])) {
            throw ValidationException::withMessages(['exchange_rate' => 'Provide the exchange rate as a decimal string.']);
        }

        return DB::transaction(function () use ($currency, $input): Currency {
            Currency::where('code', 'EUR')->lockForUpdate()->firstOrFail();
            $currency = $currency ? Currency::whereKey($currency->id)->lockForUpdate()->firstOrFail() : new Currency;
            $v = Validator::make($input, ['code' => ['required', 'regex:/^[A-Z]{3}$/D', 'not_in:XTS,XXX', Rule::unique('currencies', 'code')->ignore($currency->id)],
                'name' => 'required|string|max:100', 'symbol' => 'required|string|max:12', 'exchange_rate' => ['required', 'regex:/^\d{1,12}(\.\d{1,8})?$/D'],
                'decimal_places' => 'required|integer|between:0,4', 'is_default' => 'required|boolean', 'is_active' => 'required|boolean', 'sort_order' => 'required|integer|between:0,1000000'])->validate();
            $isoCurrencies = \ResourceBundle::create('en', 'ICUDATA-curr')?->get('Currencies');
            if (! $isoCurrencies instanceof \ResourceBundle || ! $isoCurrencies->get($v['code']) instanceof \ResourceBundle) {
                throw ValidationException::withMessages(['code' => 'Enter a valid ISO 4217 code.']);
            }
            if (! BigDecimal::of((string) $v['exchange_rate'])->isPositive()) {
                throw ValidationException::withMessages(['exchange_rate' => 'The exchange rate must be greater than zero.']);
            }
            if (($v['code'] === 'EUR' && (! BigDecimal::of((string) $v['exchange_rate'])->isEqualTo(1) || (int) $v['decimal_places'] !== 2 || ! $v['is_active']))
                || ($currency->exists && ($currency->code === 'EUR' || $currency->isReferenced()) && ($currency->code !== $v['code'] || $currency->decimal_places !== (int) $v['decimal_places']))) {
                throw ValidationException::withMessages(['code' => 'The EUR base and the code/precision of a currency in use cannot be changed.']);
            }
            if (($v['is_default'] && ! $v['is_active']) || ($currency->is_default && ! $v['is_default'])) {
                throw ValidationException::withMessages(['is_default' => 'Choose another active default currency before disabling this one.']);
            }
            if ($v['is_default']) {
                Currency::where('is_default', true)->when($currency->exists, fn ($q) => $q->where('id', '!=', $currency->id))->update(['is_default' => false, 'updated_at' => now()]);
            }
            $currency->fill($v)->save();

            return $currency->refresh();
        }, 5);
    }

    public function delete(Currency $currency): void
    {
        DB::transaction(function () use ($currency): void {
            Currency::where('code', 'EUR')->lockForUpdate()->firstOrFail();
            $currency = Currency::whereKey($currency->id)->lockForUpdate()->firstOrFail();
            if ($currency->code === 'EUR' || $currency->is_default || $currency->isReferenced()) {
                throw ValidationException::withMessages(['currency' => 'This currency is in use or is required.']);
            }
            $currency->delete();
        }, 5);
    }

    /** @return array<string, mixed> */
    public function snapshot(?User $user, ?string $guestCode = null): array
    {
        $active = $this->active();

        return ['active' => $active->map(fn (Currency $c) => $c->only(['code', 'name', 'symbol', 'exchange_rate', 'decimal_places']))->all(),
            'default' => $this->default()->code, 'selected' => $this->selected($user, $guestCode)->code, 'base' => 'EUR'];
    }
}
