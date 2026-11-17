<?php

namespace App\Payments;

use Illuminate\Http\Request;

class LocalDevPaymentGuard
{
    public function enabled(): bool
    {
        if (! config('app.key') || ! app()->environment(['local', 'testing']) || ! in_array(config('app.env'), ['local', 'testing'], true)
            || ! config('payments.dev_enabled') || config('payments.provider') !== 'dev'
            || ! in_array(parse_url(config('app.url'), PHP_URL_HOST), ['127.0.0.1', 'localhost', '::1'], true)) {
            return false;
        }
        if (config('database.default') === 'mysql') {
            $allowed = app()->environment('testing') ? ['pixel_survivor_test'] : ['pixel_survivor', 'pixel_survivor_test'];

            return in_array(config('database.connections.mysql.database'), $allowed, true) && ! config('database.connections.mysql.url')
                && in_array(config('database.connections.mysql.host'), ['127.0.0.1', 'localhost'], true);
        }

        return app()->environment('testing') && config('database.default') === 'sqlite'
            && config('database.connections.sqlite.database') === ':memory:' && ! config('database.connections.sqlite.url');
    }

    public function requireEnabled(): void
    {
        if (! $this->enabled()) {
            throw new PaymentProblem('provider_unavailable');
        }
    }

    public function authorizeRequest(Request $request): void
    {
        abort_unless($this->enabled() && in_array($request->server('REMOTE_ADDR'), ['127.0.0.1', '::1'], true)
            && in_array($request->getHost(), ['127.0.0.1', 'localhost', '::1'], true), 404);
    }
}
