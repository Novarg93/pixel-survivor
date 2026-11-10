# Phase 3 — Rare Guardians & Minimap

Завершено31.10.2026 на существующем Phaser4.2.1/Vue3/TypeScript проекте. Задача21; этапы и маркеры00–20 сохранены. Параметры уточнены пользователем: хранитель каждые120–240 игровых секунд; радар каждые200–250мс, выбран5Hz/200мс.

## Хранитель и награда

Rare Guardian — отдельный EnemyKind общего combat pipeline с независимым cap1. Стоит на месте, не преследует игрока, не получает separation/knockback. Имеет1800 базовых HP с существующим ограниченным time scaling, оригинальный спрайт каменного солнечного стража, золотое свечение и HP-bar. Контактный урон проходит общую защиту/i-frames.

RareGuardianSystem использует отдельный seeded RNG. Точка находится вне камерного прямоугольника, на60–85% радиуса радара. На радаре он сразу отмечен золотой звездой; есть короткое уведомление. До первого визита игрока, когда спрайт полностью входит в видимую область, хранитель исключён из combatTargets и защищён центральным damage gate. Это закрывает реальный крайний случай существующего Meteor, который может выбирать цели без ограничения дальности: удалённый хранитель не погибнет автоматически до посещения. После обнаружения общий бой работает обычным образом.

Если хранитель оставлен на8 игровых минут или игрок уходит дальше2.5 радиуса радара, он удаляется без score/XP/награды. После этого начинается новый случайный интервал. При занятом слоте/насыщенном artifact pool события не копятся. Мир хранит максимум одного такого врага; обычный cap150 и boss cap3 сохранены.

Смерть оставляет ровно один физический артефакт в точке смерти. Он не применяется автоматически, подбирается в16px. Отдельный GUARDIAN_ARTIFACT_POOL с весами и своим RNG исключает максимально накопленные и уже зарезервированные лежащими предметами варианты. Guardian не выдаёт одновременно consumable или сундук. Периодический map chest scheduler удалён по новому запросу; гарантированные сундуки обычных боссов и их consumable pool сохранены.

## Артефакты забега

| Название | За копию | Максимум при3 копиях |
|---|---|---|
| Сердце дуба | +10% maxHP | +30% |
| Печать пламени | +8% общего урона | +24% |
| Перо ветра | +7% скорости | +21% |
| Песочные часы | −6% времени перезарядки | −18% |
| Кристалл памяти | +15% XP | +45% |

Бонусы суммируются внутри типа, затем отдельным множителем действуют поверх обычных upgrades. Постоянные player.maxHp/player.speed/stats не изменяются. Haste/Fury работают поверх этого слоя. HP-artifact один раз добавляет новую ёмкость HP к текущему здоровью, сохраняя количество недостающего HP; зелье/обычные HP upgrades учитывают effectiveMaxHp. Damage применяется единожды в момент попадания; cooldown — при назначении следующей перезарядки. XP bonus применяется единожды через gainXp, в том числе для магнита; накопление округляется до сотых перед проверкой threshold.

Все полученные бонусы действуют до конца текущего забега, отображаются отдельно от временных buffs и сбрасываются при смерти/меню/restart/Scene shutdown. В localStorage они не превращаются в усиления следующего забега. При полном или зарезервированном наборе15/15 новый хранитель не создаётся без доступной награды. Лежащих артефактов максимум3, TTL180 игровых секунд; при искусственно полном ground pool новая награда заменяет старейшую. В естественном цикле min120с/TTL180с такой backlog не накапливается.

Основные модули: src/game/systems/RareGuardianSystem.ts, src/game/loot/ArtifactSystem.ts, src/game/config/gameBalance.ts. byKind.guardian мигрирует нулём для старых рекордов, Guardian kills отображаются отдельно от ordinary/elite/boss.

## Радар и интерфейс

- Vue GameRadar SVG:180×180 на desktop,112×112 на mobile, без второго Canvas. Игрок в центре, белая стрелка сохраняет последнее направление движения.
- Отдельные формы/цвета: обычные и elite dots, triangle Charger, diamond Sorcerer, ring Eclipse, золотая звезда Guardian, healing cross, buff squares, artifact diamond и chest marker. Важные glyph рисуются поверх обычных точек.
- Радиус2×max(width,height) видимой области в мировых координатах; круговое отсечение. Объекты за пределами радиуса не отображаются и не прижимаются к краю. Мир не ограничен; истории карты/чанков нет.
- Отдельный typed radarFrames channel/RadarPublisher до5Hz на World.elapsed. Pause/upgrade замораживают кадр; смена состояния/viewport допускает один служебный update. Catch-up отсутствует. Scalar HUD snapshot остаётся10Hz.
- Линейный просмотр текущих ограниченных коллекций имеет максимум167 маркеров:150+3+1 враг,6 consumables,4 сундука,3 артефакта. Steering grid48px предназначен для локальных запросов и при таком радиусе перебирал бы тысячи пустых cells, поэтому для радара не используется.
- RunArtifacts отделён от BuffDock, показывает суммарные проценты и копии; pickup toast содержит название/эффект. Мобильные boss bars размещены слева от радара. В390×844 важные HUD показатели, радар и joystick не перекрываются.

Оригинальные guardian/relic textures создаются идемпотентно. Общий sprite pool и прежний spare cap128 сохранены. Artifact pool ограничен3; publisher хранит один кадр, а не историю. Подписка radarFrames удаляется при unmount, старый кадр очищается при смене World/Scene. Новых interval/Phaser timers/tween нет.

## Проверки на финальном коде

| Команда | Результат |
|---|---|
| npm run check | PASS:113 unit,22 файла; strict TS, ESLint и production build |
| npm run build | PASS:91 modules, без отсутствующих ресурсов; прежнее предупреждение Vite о размере Phaser chunk |
| npm run test:e2e | PASS:37 сценариев,2.5мин |
| npm run test:e2e:production | PASS:4 сценария,31.8с |

Новые16 unit/integration тестов покрывают seeded schedule и независимость RNG, внекамерный spawn в detection radius, cap150+3+1, stationary/no knockback, abandonment/lifetime без награды, pause/upgrade/no catch-up, guaranteed physical drop/pickup без повторного применения,5 modifiers/stack caps/зарезервированные rewards, maxHP/heal/обычные upgrades, Fury/Haste combinations, фактический cooldown, дробный XP/магнит/level threshold, death/disposal/reset/record migration, translation-invariant world projection/радиус/типы/facing/отсутствие истории и publisher lifecycle/throttle. Отдельная регрессия проверяет fireball/Meteor/lightning/damage gate до и после посещения хранителя.

Новые8 browser E2E: scheduler и радиомаркер вне камеры, ожидание без урона при включённом Meteor, направление стрелки, pause/upgrade freeze и abandonment; настоящая автоматическая fireball kill с физическим pickup;4 сочетания героя/биома, stack cap/UI/мобильное размещение;5 death/restart и полноценный Scene restart с одной Canvas и radar listeners1→0→1;15-секундный стресс.

Прежние тесты не отключены. Проверки периодических сундуков адаптированы к требованию их замены, boss chest/reward/expiry/cap/magnet regressions сохранены. Старый refill test проверяет regularCount вместо общего списка, поскольку Guardian имеет отдельный слот. Все остальные прежние E2E, включая минутный stress, повторные запуски и production smoke, прошли.

## Измеренная производительность

Windows x64, Chromium156.0.8078.4, Ryzen5 7500F/12 потоков,31.6GiB, RTX4060/ANGLE D3D11; viewport1280×720.

| Прогон | Результат |
|---|---|
| Существующий60-секундный peak-wave smoke | FPS min59.18/median60.04/average60.05; World+Scene update median1.0мс/p95 1.7мс; mobs150/bosses3/XP240/chunks48;61.05 игровых секунд |
| Phase3,15 реальных секунд | FPS min59.25/average59.86 после первых3 samples; update average0.99мс/max1.9мс; радар4.81Hz;15.60 игровых секунд |

Phase3 setup: повторное восполнение до150 обычных мобов, начальные3 bosses/1 guardian/6 consumables/4 boss chests/3 artifacts, Mage rankIII/evolutions, клавиатурное движение и тестовая неуязвимость. Достигнуты maxima150 ordinary/3 bosses/1 Guardian/167 radar markers, allocatedArtifacts3, sprites306, spareSprites26. Browser errors отсутствуют. Данные: [21-radar-browser.json](benchmarks/21-radar-browser.json) и [phase2-browser-smoke.json](benchmarks/phase2-browser-smoke.json).

Эти ограниченные smoke-прогоны подтверждают бюджеты и повторные жизненные циклы на указанном ПК. updateMs не включает всю GPU/Vue отрисовку, actualFps измеряет реальный Phaser loop. Это не гарантия FPS на любом телефоне и не полный heap profiler; отсутствие бесконечного накопления проверено по архитектуре, pool metrics, listener counts и рестартам.

## Реальные изображения

Playwright MCP действительно открыл игру и сделал снимки; local Playwright сделал PNG настоящего Phaser Canvas с работающим Vue/SVG HUD. Через view_image просмотрены:

- [21-mcp-desktop.png](screenshots/21-mcp-desktop.png) и [21-mcp-mobile.png](screenshots/21-mcp-mobile.png): guardian/relic art, все marker types, отдельные панели.
- [21-Mage-grove.png](screenshots/21-Mage-grove.png) и [21-Warrior-forest.png](screenshots/21-Warrior-forest.png):1280×720 и390×844, radar/boss bars/temporary/permanent HUD.
- [21-guardian-radar-at-spawn.png](screenshots/21-guardian-radar-at-spawn.png): цель за камерой, золотая звезда, короткий spawn toast; Meteor не снимает HP до посещения.
- [21-radar-stress.png](screenshots/21-radar-stress.png): настоящие бой, опасные телеграфы, Guardian и радар при нагрузке.
- [19-production-Warrior-dark-mobile.png](screenshots/19-production-Warrior-dark-mobile.png): собранная игра, mobile radar и управление без DEV harness.

Canvas-варианты четырёх сочетаний также сохранены как21-canvas-*.png. Это browser screenshots реальной отрисовки, а не DOM-only mock; dev fixtures ускоряют постановку сценариев и не включаются в production.

PROGRESS/DECISIONS/README/PHASE3 обновлены. Блокеров нет. Dev5173 был существующим и оставлен работать; production preview4173 закрыл runner. Push/деплой не выполнялись.
