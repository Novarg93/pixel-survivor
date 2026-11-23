<?php

namespace App\Filament\Widgets;

use App\Filament\Pages\Analytics;
use App\Services\AnalyticsPeriod;
use App\Services\WebsiteAnalytics;
use Filament\Widgets\ChartWidget;
use Filament\Widgets\Concerns\InteractsWithPageFilters;

class WebsiteTraffic extends ChartWidget
{
    use InteractsWithPageFilters;

    protected static bool $isDiscovered = false;

    protected static ?bool $isLazyLoaded = false;

    protected int|string|array $columnSpan = 'full';

    protected ?string $pollingInterval = null;

    protected ?string $maxHeight = '20rem';

    protected ?string $heading = 'Daily website traffic';

    protected ?string $description = 'Unique browsers are counted separately for each UTC day.';

    protected ?array $options = [
        'scales' => [
            'x' => ['ticks' => ['color' => '#a9bbc6', 'maxRotation' => 0, 'maxTicksLimit' => 8]],
            'y' => ['beginAtZero' => true, 'ticks' => ['color' => '#a9bbc6', 'precision' => 0]],
        ],
    ];

    public static function canView(): bool
    {
        return Analytics::canAccess();
    }

    protected function getData(): array
    {
        $period = AnalyticsPeriod::fromFilter($this->pageFilters['period'] ?? null);
        $series = app(WebsiteAnalytics::class)->dailyTraffic($period);

        return [
            'labels' => $series['labels'],
            'datasets' => [
                ['label' => 'Unique visitors', 'data' => $series['visitors'], 'borderColor' => '#83d9bf', 'borderDash' => [5, 3]],
                ['label' => 'Page views', 'data' => $series['views'], 'borderColor' => '#d8b476'],
            ],
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }
}
