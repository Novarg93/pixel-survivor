<?php

namespace App\Filament\Resources\Currencies\Schemas;

use App\Models\Currency;
use App\Services\CurrencyService;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;
use Illuminate\Validation\ValidationException;

class CurrencyForm
{
    /** @param array<string, mixed> $data */
    public static function save(?Currency $record, array $data): Currency
    {
        try {
            return app(CurrencyService::class)->save($record, $data);
        } catch (ValidationException $error) {
            $errors = [];
            foreach ($error->errors() as $key => $messages) {
                $errors['data.'.$key] = $messages;
            }
            throw ValidationException::withMessages($errors);
        }
    }

    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('code')->label('ISO 4217')->required()->length(3)->regex('/^[A-Z]{3}$/D')->unique(ignoreRecord: true)->helperText('Three uppercase letters. XTS/XXX cannot be exchanged.'),
                TextInput::make('name')->label('Name')->required()->maxLength(100),
                TextInput::make('symbol')->label('Symbol')->required()->maxLength(12),
                TextInput::make('exchange_rate')->label('Units per 1 EUR')->required()->inputMode('decimal')->default('1.00000000')->helperText('For example, 1.10 means 1 EUR = 1.10 USD. The EUR base rate is always 1.'),
                TextInput::make('decimal_places')->label('Decimal places')->integer()->minValue(0)->maxValue(4)->required()->default(2),
                TextInput::make('sort_order')->label('Sort order')->integer()->minValue(0)->maxValue(1000000)->required()->default(0),
                Toggle::make('is_active')->label('Active')->default(true)->required(),
                Toggle::make('is_default')->label('Default')->default(false)->required()->helperText('Changes display only. Previous amounts and payment currencies remain unchanged.'),
            ]);
    }
}
