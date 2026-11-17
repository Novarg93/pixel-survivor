<?php

$bonuses = [
    2 => ['damage' => 200], 3 => ['maximum_health' => 300],
    4 => ['movement_speed' => 200], 5 => ['pickup_radius' => 800],
    6 => ['ability_area' => 300], 7 => ['cooldown_reduction' => 200],
    8 => ['damage_reduction' => 200], 9 => ['experience_gain' => 500],
    10 => ['damage' => 300],
];

return [
    'version' => 'progression-v1',
    'max_level' => 10,
    'xp_per_level' => 100,
    'characters' => ['mage' => 'Mage', 'warrior' => 'Warrior'],
    'character_abilities' => ['mage' => ['fireball', 'frost', 'lightning', 'meteor', 'shield'], 'warrior' => ['cleave', 'whirlwind', 'slam', 'blades', 'iron']],
    'maps' => ['grove'],
    'stats' => ['damage', 'maximum_health', 'movement_speed', 'pickup_radius', 'ability_area', 'cooldown_reduction', 'damage_reduction', 'experience_gain'],
    'bonuses' => $bonuses,
    'account_rewards' => [
        2 => [['type' => 'healing_potion', 'quantity' => 1]],
        3 => [['type' => 'credits', 'quantity' => 100]],
        4 => [['type' => 'movement_boost', 'quantity' => 1]],
        5 => [['type' => 'revive', 'quantity' => 1]],
        6 => [['type' => 'damage_boost', 'quantity' => 1]],
        7 => [['type' => 'credits', 'quantity' => 200]],
        8 => [['type' => 'xp_boost_24h', 'quantity' => 1]],
        9 => [['type' => 'revive', 'quantity' => 1]],
        10 => [['type' => 'cosmetic_reward', 'id' => 'survivor_title', 'quantity' => 1]],
    ],
    'character_rewards' => [5 => [['type' => 'healing_potion', 'quantity' => 1]], 10 => [['type' => 'revive', 'quantity' => 1]]],
];
