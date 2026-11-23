<?php

use App\Providers\AppServiceProvider;
use App\Providers\AuthMailServiceProvider;
use App\Providers\Filament\AdminPanelProvider;
use App\Providers\FortifyServiceProvider;

return [
    AppServiceProvider::class,
    AuthMailServiceProvider::class,
    AdminPanelProvider::class,
    FortifyServiceProvider::class,
];
