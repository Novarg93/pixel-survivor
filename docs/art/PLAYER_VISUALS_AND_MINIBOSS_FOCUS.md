# Временное отключение player VFX и один HP-бар минибосса

По поручению пользователя временно отключена геометрия Mage Arcane Blink
и Arcane Shield. Переключатели находятся в `src/game/config/playerVisuals.ts`:
`arcaneBlink:false`, `arcaneShield:false`. Для возвращения эффекта достаточно
сменить соответствующий флаг на true. Исходная отрисовка сохранена.

Скрываются Blink departure/arrival кольца, соединительная линия, частицы,
геометрия его специализаций и Arcane Shield shell/pulse. Shield shell не
возвращается после Fire-form fade, пока флаг выключен. Телепорт, защита,
Absorb, cooldowns, урон/slow специализаций и индикация Absorb у HP не менялись.
Warrior и эффекты врагов не затронуты.

В `BossBars.vue` выводится максимум один минибосс. World добавляет к снимку
каждого активного босса `damageOrder`: уникальный порядковый номер фактической
потери HP. Это позволяет выбирать последнее попадание даже в одном simulation
tick, где временные метки совпадают. Нулевой/запрещённый/нечисловой урон, попадание
по обычному мобу или Guardian не переводят фокус. До первого попадания выбран
первый активный минибосс; после смерти/деспавна выбранной цели — последний
раненый из оставшихся, либо первый активный. Без минибоссов бара нет.

История ограничена cap живых боссов и очищается от старых IDs при следующем
попадании. Новый World начинает с пустой истории. Снимок по-прежнему содержит
всех боссов, поэтому счётчики/радар работают с полным списком. Выбор Vue выполняется
на существующей ограниченной частоте snapshot, без новых listeners или timers.
Финальный босс сохраняет отдельный `FinalBossBar`.

Файлы: playerVisuals.ts, playerShieldVisuals.ts, EncounterArt.ts, World.ts,
ui/bossBar.ts, BossBars.vue. Новые unit/E2E: player-visuals-boss-bar.test.ts,
player-presentation-focus.spec.ts. Прежние тесты включённой отрисовки явно
устанавливают флаги через vi.mock; новые тесты проверяют production default-off.

Проверки:119unit files /977tests PASS (--maxWorkers=2), typecheck/lint/build PASS.
Прежние gameplay/RNG replay hashes сохранены без изменения fixtures: helper
исключает только новое UI-поле damageOrder из исторического сериализованного снимка.
10 DEV E2E PASS: новый desktop/mobile сценарий, старый boss UI, ранний Guardian/
PhaseII, Nova boss-practice и две реальные Canvas pixel-diff проверки Fire-form.
Pixel difference shield/no-shield =0 во время формы, fade и после её завершения.
Canvas/UI просмотрены: screenshots/player-presentation-focus/{1280,390}/ и
screenshots/fire-radius/after/. Production9/9 PASS: Mage/Warrior в обоих биомах,
обе тренировки, controller-only и реальный runtime без внешних запросов.
Итого19релевантных браузерных сценариев прошли отдельными группами.
Полный игровой E2E suite не запускался.
