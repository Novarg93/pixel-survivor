<?php

namespace App\Filament\Resources\Currencies\Tables;

use App\Models\Currency;
use App\Services\CurrencyService;
use Filament\Actions\Action;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ToggleColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class CurrenciesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('code')->label('ISO')->searchable()->sortable(),
                TextColumn::make('name')->label('Name')->searchable()->sortable(),
                TextColumn::make('symbol')->label('Symbol'),
                TextColumn::make('exchange_rate')->label('Per 1 EUR')->sortable(),
                TextColumn::make('decimal_places')->label('Precision'),
                IconColumn::make('is_default')->label('Default')->boolean(),
                ToggleColumn::make('is_active')->label('Active')->disabled(fn (Currency $record) => $record->is_default || $record->code === 'EUR')
                    ->updateStateUsing(function (Currency $record, bool $state): bool {
                        app(CurrencyService::class)->save($record, [...$record->toArray(), 'is_active' => $state]);

                        return $state;
                    }),
                TextColumn::make('sort_order')->label('Sort order')->sortable(),
            ])
            ->filters([
                TernaryFilter::make('is_active')->label('Active'),
            ])
            ->recordActions([
                EditAction::make(),
                Action::make('makeDefault')->label('Set as default')->requiresConfirmation()->visible(fn (Currency $record) => $record->is_active && ! $record->is_default)
                    ->action(fn (Currency $record) => app(CurrencyService::class)->save($record, [...$record->toArray(), 'is_default' => true])),
            ])
            ->defaultSort('sort_order');
    }
}
