<?php

return [
    'enabled' => true,
    'reroll_enabled' => true,
    'resurrection_enabled' => true,
    'reroll_price' => 25,
    'revive_limit' => 1,
    'revive_health_basis_points' => 5000,
    'revive_protection_ms' => 1500,
    'max_actions' => 128,
    'consumables' => [
        'healing_potion' => ['enabled' => true, 'heal_basis_points' => 3000],
        'movement_boost' => ['enabled' => true, 'duration_ms' => 10000, 'multiplier_basis_points' => 15000],
        'damage_boost' => ['enabled' => true, 'duration_ms' => 10000, 'multiplier_basis_points' => 15000],
    ],
];
