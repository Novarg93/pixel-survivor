<?php

namespace App\Http\Middleware;

use App\Services\CurrencyService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'csrfToken' => csrf_token(),
            'emailJustVerified' => (bool) $request->session()->get('emailJustVerified', false),
            'currencies' => fn () => app(CurrencyService::class)->snapshot($request->user(), $request->session()->get('display_currency')),
            'auth' => [
                'user' => $request->is('leaderboard', 'leaderboard/*', 'api/v1/leaderboard', 'api/v1/leaderboard/*') ? null : $request->user(),
                'authenticated' => $request->user() !== null,
                'can_operate' => $request->user()?->can('operate-platform') ?? false,
                'can_admin' => $request->user()?->isAdmin() ?? false,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
