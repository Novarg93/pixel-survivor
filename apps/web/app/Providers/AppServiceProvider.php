<?php

namespace App\Providers;

use App\Models\User;
use App\Services\ProgressionService;
use App\Support\MySqlTestDatabase;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define('operate-platform', fn (User $user): bool => $user->is_platform_operator && $user->email_verified_at !== null);
        if (app()->environment('testing') && config('database.default') === 'mysql') {
            MySqlTestDatabase::assertSafe();
        }
        $this->configureDefaults();
        User::created(fn (User $user) => app(ProgressionService::class)->initialize($user->id));
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
