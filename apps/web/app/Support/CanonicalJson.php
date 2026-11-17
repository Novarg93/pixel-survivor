<?php

namespace App\Support;

final class CanonicalJson
{
    /** Eloquent/JSON databases may persist 190.0 as 190. Telemetry fingerprints
     * compare numeric values; the existing Finish request hash remains unchanged.
     *
     * @param  array<mixed>  $value
     */
    public static function recordHash(array $value): string
    {
        $normalize = function (array $items) use (&$normalize): array {
            foreach ($items as &$item) {
                if (is_array($item)) {
                    $item = $normalize($item);
                } elseif (is_float($item) && is_finite($item) && floor($item) === $item && abs($item) < PHP_INT_MAX) {
                    $item = (int) $item;
                }
            }

            return $items;
        };

        return self::hash($normalize($value));
    }

    /** @param array<mixed> $value */
    public static function hash(array $value): string
    {
        $sort = function (array $items) use (&$sort): array {
            if (! array_is_list($items)) {
                ksort($items);
            }
            foreach ($items as &$item) {
                if (is_array($item)) {
                    $item = $sort($item);
                }
            }

            return $items;
        };

        return hash('sha256', json_encode($sort($value), JSON_THROW_ON_ERROR | JSON_PRESERVE_ZERO_FRACTION));
    }
}
