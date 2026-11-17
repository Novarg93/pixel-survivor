<?php

namespace App\Filament\Resources\Currencies\Pages;

use App\Filament\Resources\Currencies\CurrencyResource;
use App\Filament\Resources\Currencies\Schemas\CurrencyForm;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Database\Eloquent\Model;

class CreateCurrency extends CreateRecord
{
    protected static string $resource = CurrencyResource::class;

    /** @param array<string, mixed> $data */
    protected function handleRecordCreation(array $data): Model
    {
        return CurrencyForm::save(null, $data);
    }
}
