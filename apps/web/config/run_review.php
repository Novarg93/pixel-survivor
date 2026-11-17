<?php

return [
    'version' => 'run-review-v1',
    'nickname_cooldown_hours' => 24,
    'soft_score_threshold' => 1000000,
    'soft_kills_per_second' => 100,
    // Validation mirror of ENEMIES[].score; parity is tested against the game source.
    'enemy_points' => ['ashGuard' => 5000, 'guardian' => 500, 'grunt' => 10, 'runner' => 15, 'tank' => 30, 'caster' => 25, 'rusher' => 25, 'splitter' => 35, 'charger' => 1000, 'sorcerer' => 1000, 'eclipse' => 1500],
    'regular_kinds' => ['grunt', 'runner', 'tank', 'caster', 'rusher', 'splitter'],
];
