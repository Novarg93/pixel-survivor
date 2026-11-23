<?php

namespace App\Filament\Widgets;

use App\Filament\Pages\Analytics;
use App\Services\AnalyticsPeriod;
use App\Services\WebsiteAnalytics;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class AnalyticsOverview extends StatsOverviewWidget
{
    use InteractsWithPageFilters;

    protected static bool $isDiscovered = false;

    protected static ?bool $isLazyLoaded = false;

    protected ?string $pollingInterval = null;

    public static function canView(): bool
    {
        return Analytics::canAccess();
    }

    protected function getStats(): array
    {
        $period = AnalyticsPeriod::fromFilter($this->pageFilters['period'] ?? null);
        $stats = app(WebsiteAnalytics::class)->counts($period);

        return [
            Stat::make('Total registered users', number_format($stats['users']))
                ->description('All existing accounts, including unverified accounts.'),
            Stat::make('New registered users', number_format($stats['registrations']))
                ->description('Accounts created during the selected period.'),
            Stat::make('Unique website visitors', number_format($stats['visitors']))
                ->description('Distinct consenting browsers during the selected period.'),
            Stat::make('Total page views', number_format($stats['views']))
                ->description('Website views recorded after consent during the selected period.'),
            Stat::make('Total game runs started', number_format($stats['runs']))
                ->description('Server-recorded starts, including practice, during the selected period.'),
            Stat::make('Unique players who started a game', number_format($stats['players']))
                ->description('Distinct accounts with a recorded start during the selected period.'),
        ];
    }
}
