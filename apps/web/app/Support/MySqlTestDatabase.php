<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class MySqlTestDatabase
{
    public static function assertSafe(): void
    {
        if (! app()->environment('testing') || config('database.default') !== 'mysql'
            || config('database.connections.mysql.database') !== 'pixel_survivor_test'
            || config('database.connections.mysql.url')
            || ! in_array(config('database.connections.mysql.host'), ['127.0.0.1', 'localhost'], true)) {
            throw new \RuntimeException('Refusing MySQL tests outside the isolated pixel_survivor_test database.');
        }
        try {
            $database = DB::connection()->selectOne('SELECT DATABASE() AS active_database');
        } catch (\Throwable) {
            throw new \RuntimeException('MySQL test connection unavailable. Check the local environment privately.');
        }
        if ($database?->active_database !== 'pixel_survivor_test') {
            throw new \RuntimeException('Active database differs from pixel_survivor_test. Tests refused.');
        }
    }
}
