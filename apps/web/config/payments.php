<?php

return [
    // Stripe needs only STRIPE_SECRET + SIGNING_SECRET. Overrides below are for DEV/Test harnesses.
    'provider' => env('PAYMENTS_PROVIDER', 'stripe_sandbox'),
    'dev_enabled' => env('PAYMENTS_DEV_ENABLED', false),
    'test_enabled' => env('PAYMENTS_TEST_ENABLED', false),
    'test_mysql_enabled' => env('PAYMENTS_TEST_MYSQL_ENABLED', false),
    'order_ttl_seconds' => 1200,
    'signature_tolerance_seconds' => 300,
    // Sandbox prices only. No production exchange rate or live provider is enabled.
    'custom' => [
        'enabled' => env('PAYMENTS_CUSTOM_TEST_ENABLED', true),
        'min' => 100, 'max' => 100000, 'step' => 100,
        'minor_per_credit' => 2,
    ],
    'stripe_sandbox' => [
        'secret' => env('STRIPE_SECRET'),
        'currency' => 'USD',
        'order_ttl_seconds' => 3600,
        'api_version' => '2025-02-24.acacia',
    ],
    'packages' => [
        'starter_credits' => ['name' => 'Starter Credits', 'credits_amount' => 100, 'amount_minor' => 199, 'currency' => 'XTS', 'sort_order' => 10],
        'standard_credits' => ['name' => 'Standard Credits', 'credits_amount' => 300, 'amount_minor' => 499, 'currency' => 'XTS', 'sort_order' => 20],
        'large_credits' => ['name' => 'Large Credits', 'credits_amount' => 700, 'amount_minor' => 999, 'currency' => 'XTS', 'sort_order' => 30],
    ],
];
