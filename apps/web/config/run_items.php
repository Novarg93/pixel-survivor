<?php

return [
    'version' => 'run-items-v1',
    'session_ttl_seconds' => 21600,
    'revive_wait_seconds' => 1800,
    'max_usages' => 128,
    'revive_limit' => 1,
    'revive_health_basis_points' => 5000,
    'revive_protection_ms' => 1500,
    // Loot effects deliberately use the existing game LootSystem/LOOT_BALANCE.
    'items' => [
        'healing_potion' => ['kind' => 'loot', 'loot_kind' => 'healing', 'version' => 'loot-v1'],
        'movement_boost' => ['kind' => 'loot', 'loot_kind' => 'haste', 'version' => 'loot-v1'],
        'damage_boost' => ['kind' => 'loot', 'loot_kind' => 'fury', 'version' => 'loot-v1'],
        'revive' => ['kind' => 'revive', 'version' => 'revive-v1'],
    ],
];
