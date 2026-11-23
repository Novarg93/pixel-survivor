<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\AnalyticsOverview;
use App\Filament\Widgets\WebsiteTraffic;
use App\Models\User;
use App\Services\AnalyticsPeriod;
use BackedEnum;
use Filament\Facades\Filament;
use Filament\Forms\Components\Select;
use Filament\Pages\Dashboard;
use Filament\Pages\Dashboard\Concerns\HasFiltersForm;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;

class Analytics extends Dashboard
{
    use HasFiltersForm;

    protected static ?string $title = 'Analytics';

    protected static string $routePath = '/analytics';

    protected static ?int $navigationSort = -1;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedChartBar;

    public static function canAccess(): bool
    {
        $user = auth()->user();
        $panel = Filament::getPanel('admin');

        return $user instanceof User && $panel !== null && $user->canAccessPanel($panel);
    }

    public function filtersForm(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('period')
                ->label('Date range')
                ->options(AnalyticsPeriod::options())
                ->default(AnalyticsPeriod::Week->value)
                ->selectablePlaceholder(false)
                ->helperText('Dates are in UTC.'),
        ]);
    }

    public function getWidgets(): array
    {
        return [AnalyticsOverview::class, WebsiteTraffic::class];
    }
}
