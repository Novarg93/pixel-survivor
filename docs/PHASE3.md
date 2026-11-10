# Phase 3 — Rare Guardians, run artifacts and radar

Продолжение этапа20 без изменения старых markers. Задача21 объединяет интеграцию трёх связанных механик.

1. Чистые модели: отдельный guardian scheduler/RNG, cap1/stationary/despawn; artifacts loot pool, physical pickups, capped derived run stats; убрать periodic chest scheduling, boss chests сохранить.
2. Общие боевые пути: guardian в enemies без ordinary/boss budget, HP/damage/cooldown/XP modifiers без мутации постоянных upgrades. Death/menu/restart/shutdown cleanup.
3. Radar: player-relative coordinates, finite radius от viewport в world units; ограниченная частота, только текущие bounded collections, отдельный bridge от scalar HUD snapshot, без истории чанков/мира.
4. Оригинальная pixel art guardian/artifact, gold glow/HP, notification, отдельные permanent/temporary HUD, responsive radar.
5. Unit/integration и настоящие browser E2E/Canvas screenshots, caps/leaks/stress; npm check/build/dev+production E2E. Отчёт и PROGRESS/DECISIONS;21.done только после проверки.

Уточнение пользователя: guardian interval случайный120–240 игровых секунд; radar period200–250мс (4–5Hz). Выбран5Hz/200мс, оба таймера по simulation elapsed, без catch-up.

Все5 пунктов выполнены. Финальные gates:113 unit/37 dev E2E/4 production E2E, check/build PASS. Внекамерный Guardian защищён от авто-убийства Meteor до визита. PNG получены и просмотрены, bounded stress пройден. Доказательства: [PHASE3_TEST_REPORT](PHASE3_TEST_REPORT.md), состояние: PROGRESS.md; marker21.done.
