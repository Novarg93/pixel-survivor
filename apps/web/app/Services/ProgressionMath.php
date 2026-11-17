<?php

namespace App\Services;

class ProgressionMath
{
    /** @return array{level: int, xp: int, gained: int, levels: list<int>} */
    public static function add(int $level, int $xp, int $reward): array
    {
        if ($level < 1 || $level > 10 || $xp < 0 || $xp > 99 || ($level === 10 && $xp !== 0) || $reward < 0) {
            throw new \InvalidArgumentException('Invalid progression input.');
        }
        $actual = min($reward, (10 - $level) * 100 - $xp);
        $remaining = $xp + $actual;
        $levels = [];
        while ($remaining >= 100 && $level < 10) {
            $remaining -= 100;
            $levels[] = ++$level;
        }

        return ['level' => $level, 'xp' => $level === 10 ? 0 : $remaining, 'gained' => $actual, 'levels' => $levels];
    }
}
