<?php

namespace App\Services;

use App\Models\GameRun;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class WebsiteAnalytics
{
    /** @return array{users: int, registrations: int, visitors: int, views: int, runs: int, players: int} */
    public function counts(AnalyticsPeriod $period): array
    {
        $today = CarbonImmutable::today('UTC');
        $users = User::query()->count();
        $registrations = $period === AnalyticsPeriod::AllTime
            ? $users
            : $this->inPeriod(User::query()->toBase(), 'created_at', $period, $today)->count();

        $runs = $this->inPeriod(GameRun::query()->toBase(), 'started_at', $period, $today)
            ->selectRaw('COUNT(*) AS runs, COUNT(DISTINCT user_id) AS players')
            ->first();
        $traffic = $this->pageViews($period, $today)
            ->selectRaw('COUNT(*) AS views, COUNT(DISTINCT visitor_hash) AS visitors')
            ->first();

        return [
            'users' => $users,
            'registrations' => $registrations,
            'visitors' => (int) $traffic?->visitors,
            'views' => (int) $traffic?->views,
            'runs' => (int) $runs?->runs,
            'players' => (int) $runs?->players,
        ];
    }

    /** @return array{labels: list<string>, visitors: list<int>, views: list<int>} */
    public function dailyTraffic(AnalyticsPeriod $period): array
    {
        $today = CarbonImmutable::today('UTC');
        $days = $this->pageViews($period, $today)
            ->select('viewed_on')
            ->selectRaw('COUNT(*) AS views, COUNT(DISTINCT visitor_hash) AS visitors')
            ->groupBy('viewed_on')
            ->orderBy('viewed_on')
            ->get()
            ->keyBy('viewed_on');

        $first = $days->keys()->first();
        $date = $period->start($today) ?? (is_string($first) ? CarbonImmutable::parse($first, 'UTC') : $today);
        $series = ['labels' => [], 'visitors' => [], 'views' => []];

        for (; $date <= $today; $date = $date->addDay()) {
            $label = $date->toDateString();
            $totals = $days->get($label);
            $series['labels'][] = $label;
            $series['visitors'][] = (int) $totals?->visitors;
            $series['views'][] = (int) $totals?->views;
        }

        return $series;
    }

    private function pageViews(AnalyticsPeriod $period, CarbonImmutable $today): Builder
    {
        return $this->inPeriod(DB::table('analytics_page_views'), 'viewed_on', $period, $today);
    }

    private function inPeriod(Builder $query, string $column, AnalyticsPeriod $period, CarbonImmutable $today): Builder
    {
        $start = $period->start($today);

        return $start === null ? $query : $query
            ->where($column, '>=', $start->toDateString())
            ->where($column, '<', $today->addDay()->toDateString());
    }
}
