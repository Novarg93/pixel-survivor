<?php

return [
    // Preliminary internal-credit prices; no fiat exchange rate is defined.
    'max_quantity' => 20,
    'products' => [
        'healing_potion' => ['item_id' => 'healing_potion', 'price' => 25, 'sort_order' => 10],
        'movement_boost' => ['item_id' => 'movement_boost', 'price' => 40, 'sort_order' => 20],
        'damage_boost' => ['item_id' => 'damage_boost', 'price' => 40, 'sort_order' => 30],
        'revive' => ['item_id' => 'revive', 'price' => 100, 'sort_order' => 40],
        'xp_boost_24h' => ['item_id' => 'xp_boost_24h', 'price' => 150, 'sort_order' => 50],
    ],
];
