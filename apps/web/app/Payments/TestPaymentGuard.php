<?php

namespace App\Payments;

use Illuminate\Http\Request;

class TestPaymentGuard
{
    public function enabled(): bool
    {
        if (! config('app.key') || ! app()->environment(['local', 'testing']) || ! in_array(config('app.env'), ['local', 'testing'], true) || ! config('payments.test_enabled') || config('payments.provider') !== 'test') {
            return false;
        }
        $host = parse_url(config('app.url'), PHP_URL_HOST);
        if (! in_array($host, ['127.0.0.1', 'localhost', '::1'], true)) {
            return false;
        }
        if (config('database.default') === 'mysql') {
            return app()->environment('testing') && config('app.env') === 'testing' && config('payments.test_mysql_enabled')
                && config('database.connections.mysql.database') === 'pixel_survivor_test'
                && ! config('database.connections.mysql.url')
                && in_array(config('database.connections.mysql.host'), ['127.0.0.1', 'localhost'], true);
        }
        if (config('database.default') !== 'sqlite' || config('database.connections.sqlite.url')) {
            return false;
        }
        $database = config('database.connections.sqlite.database');
        if ($database === ':memory:') {
            return app()->environment('testing');
        }
        $path = realpath($database);
        if (! $path || basename($path) !== 'payments-test.sqlite') {
            return false;
        }
        $path = strtolower(str_replace('\\', '/', $path));
        foreach ([database_path(), storage_path('framework/testing')] as $root) {
            $root = strtolower(str_replace('\\', '/', (string) realpath($root)));
            if ($root !== '' && str_starts_with($path, $root.'/')) {
                return true;
            }
        }

        return false;
    }

    public function authorizeRequest(Request $request): void
    {
        abort_unless($this->enabled() && in_array($request->server('REMOTE_ADDR'), ['127.0.0.1', '::1'], true)
            && in_array($request->getHost(), ['127.0.0.1', 'localhost', '::1'], true), 404);
    }

    public function requireEnabled(): void
    {
        if (! $this->enabled()) {
            throw new PaymentProblem('provider_unavailable');
        }
    }
}
