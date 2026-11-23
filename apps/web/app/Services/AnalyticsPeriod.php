<?php

namespace App\Services;

use Carbon\CarbonImmutable;

enum AnalyticsPeriod: string
{
    case Today = 'today';
    case Week = '7-days';
    case Month = '30-days';
    case AllTime = 'all-time';

    /** @return array<string, string> */
    public static function options(): array
    {
        return [
            self::Today->value => 'Today',
            self::Week->value => '7 days',
            self::Month->value => '30 days',
            self::AllTime->value => 'All time',
        ];
    }

    public static function fromFilter(mixed $value): self
    {
        return (is_string($value) ? self::tryFrom($value) : null) ?? self::Week;
    }

    public function start(CarbonImmutable $today): ?CarbonImmutable
    {
        return match ($this) {
            self::Today => $today,
            self::Week => $today->subDays(6),
            self::Month => $today->subDays(29),
            self::AllTime => null,
        };
    }
}
