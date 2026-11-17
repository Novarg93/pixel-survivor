<?php

namespace App\Filament\Resources\Currencies\Pages;

use App\Filament\Resources\Currencies\CurrencyResource;
use App\Filament\Resources\Currencies\Schemas\CurrencyForm;
use App\Models\Currency;
use App\Services\CurrencyService;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Database\Eloquent\Model;

class EditCurrency extends EditRecord
{
    protected static string $resource = CurrencyResource::class;

    /** @param array<string, mixed> $data */
    protected function handleRecordUpdate(Model $record, array $data): Model
    {
        if (! $record instanceof Currency) {
            throw new \LogicException('Expected currency.');
        }

        return CurrencyForm::save($record, $data);
    }

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make()->using(function (Currency $record): bool {
                app(CurrencyService::class)->delete($record);

                return true;
            }),
        ];
    }
}
