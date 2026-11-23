<?php

return [
    'enabled' => env('APP_ENV') !== 'testing'
        && (bool) env('ANALYTICS_ENABLED', env('APP_ENV', 'production') === 'production'),
];
