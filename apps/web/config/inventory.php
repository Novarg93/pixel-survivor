<?php

return [
    'version' => 'items-v1',
    'max_quantity' => 1000000,
    'items' => [
        'healing_potion' => ['name' => 'Healing Potion', 'type' => 'consumable', 'icon' => 'potion', 'description' => 'Restores 30% maxHP through Healing in a regular server run. Not consumed at full health.', 'effect' => ['kind' => 'run_heal'], 'activation_enabled' => false],
        'movement_boost' => ['name' => 'Movement boost', 'type' => 'consumable', 'icon' => 'wind', 'description' => 'Activates Haste in a regular server run: ×1.5 speed for 10 seconds of game time.', 'effect' => ['kind' => 'run_movement_multiplier'], 'activation_enabled' => false],
        'damage_boost' => ['name' => 'Damage boost', 'type' => 'consumable', 'icon' => 'sword', 'description' => 'Activates Fury in a regular server run: ×1.5 damage for 10 seconds of game time.', 'effect' => ['kind' => 'run_damage_multiplier'], 'activation_enabled' => false],
        'revive' => ['name' => 'Revive', 'type' => 'consumable', 'icon' => 'heart', 'description' => 'Used after death in a server run. Defaults: 50% HP, 1.5 seconds of protection, one successful Revive per run.', 'effect' => ['kind' => 'run_revive'], 'activation_enabled' => false],
        'xp_boost_24h' => ['name' => 'XP Boost 24h', 'type' => 'activatable_boost', 'icon' => 'hourglass', 'description' => 'After manual activation: ×1.5 permanent Character XP for runs started within the next 24 hours. Account XP is unchanged.', 'effect' => ['kind' => 'character_xp_multiplier', 'multiplier_basis_points' => 15000, 'duration_seconds' => 86400], 'activation_enabled' => true],
    ],
];
