# Mage Ultimates / Chain Storm — QA и баланс

Актуализация после пользовательского теста: доступ теперь с10:00/уровня40,
при выборе первый заряд сразу10/10; далее10 успешных Blink. Добавлены три
временных DEV-запуска. Подробности и новые проверки —
[ULTIMATE_PRACTICE_QA.md](ULTIMATE_PRACTICE_QA.md). Ниже — исходный отчёт
предыдущего этапа с историческими порогами15:00/60.

2026-11-04. База main679ab20. Принятый boss/Guardian pass отправлен отдельно;
ультимейты остаются в рабочем дереве до ручной приёмки, без push/deploy.

## Что реализовано

Один отдельный ручной ultimate slot. После15:00 и queued уровня≥60 следующий
подходящий Level Up гарантированно даёт три карточки; выбор разовый. Pending
очередь потребляет ровно одно предложение, XP/ranks/пять авто-слотов не меняются.
Десять успешных MobilitySystem.activate дают10зарядов; неудачные нажатия не
учитываются. Q / standard gamepad3(Y/Triangle) / отдельный touch control.
Pause/Upgrade/GameOver и portrait запрещают активацию. Нет нового cooldown.

**Lightning.** Ближайшая цель впереди, fallback вокруг; без целей заряд не
расходуется. Один BFS-граф через SpatialGrid, Set ID,4ребра на узел, cap156.
Область ±visibleWidth/Height от исходного Mage; переход≤.5min(width,height).
Размеры берутся из настоящей Phaser camera в world units, а не logical spawn
viewport. Подготовка.4s, одно событие урона всем ещё живым узлам, включая
потомков умершего до release узла. Никакого вызова обычной Chain Lightning.
Толстый beam сразу; все остальные рёбра вместе проявляются за.075s, держатся
ещё.125s и затухают.2s. Обычное движение возобновляется со следующим step,
удержанные клавиши/стик не сбрасываются. Отдача только визуальная, hitbox прежний.

**Frost.** Направленная волна шириной.7меньшей стороны viewport, длиной.9большей,
за1.1s; swept front предотвращает пропуски между кадрами. Hit Set исключает
повторный основной урон. Root2s для обычных/элиты, существующие root-gap и heavy
Slow/resist сохраняются через applyFrostControl. Это контроль, не invulnerability.

**Fire.**10игровых секунд; aura radius82, общий per-target gate.5s для ауры
и всех своих сегментов. Следы шириной38, живут≤2s и никогда дольше воплощения,
cap12 с ограничением по свободной area-квоте24. Blink segment использует from
и фактическое прибытие MobilitySystem. Перекрывающиеся следы не умножают hits.
Flame Trail остаётся прежним отдельным источником с его существующим gate/cap.
Урон прекращается на10s; краткое визуальное затухание.35s без damage.

## Баланс до выбора чисел

Воспроизводимый замер: `node --experimental-transform-types scripts/measure-ultimates.mjs`.
Данные: [baseline.json](ultimates/baseline.json). Seed12345, настоящее World.spawn;
DPS —60s/20Hz по одной неподвижной бессмертной tank-цели65px, пятьV, без эволюций,
временных бафов и incoming damage. Возврат после Blink — только в измерении.
Это сравнительный single-target probe, не DPS в произвольном реальном бою.

| Минута | Средний HP regular / elite | Charger | Sorcerer | Eclipse | Guardian |
|---|---:|---:|---:|---:|---:|
|15|83.75 /167.50|5276.25|6683.25|8442.00|6331.50|
|17|83.75 /167.50|5559.75|7042.35|8895.60|6671.70|
|20|83.75 /167.50|5985.00|7581.00|9576.00|7182.00|

Regular по видам:36.85/26.80/175.875/70.35/83.75/108.875HP, элита×2.
Самый толстый ordinary tank175.875, elite tank351.75; shielded×.35 остаётся.

| Билд | DPS probe | Damage multiplier | Cooldown multiplier | Blink interval20Hz |
|---|---:|---:|---:|---:|
|ПятьV|170.39|1|1|6.05s|
|+damageV/CDRV/projectilesIII/areaIV|1433.03|2.25|.59049|3.55s|
|+damage/CDR artifacts×3|2203.12|2.79|.4842018|2.95s|

Пять damage upgrades дают×2.25, три damage artifact —ещё×1.24.
Предел существующего cooldown multiplier.35 сохраняется: Blink≥2.10s,
то есть новая готовность не чаще примерно21s при таком предельном CDR.
При измеренном легальном наборе —около29.5s на10подтверждённых Blink.

| Ultimate | База без множителей | Heavy cap за одну активацию | Роль |
|---|---:|---:|---|
|Lightning|480 один раз|12%maxHP|Сильнейший одновременный взрыв|
|Frost|220 один раз|8%maxHP|Меньший урон, массовый контроль|
|Fire|62/tick, до20ticks=1240|24%maxHP суммарно|Наибольший полный урон при удержании контакта/движении|

С эффективным damage2.79 regular получает1339.2 /613.8 /до3459.6 до защиты.
Все общие множители применяются один раз: stats.damage в ultimate, остальное
в прежнем World.damageEnemy. Heavy cap применяется к финальному урону после
защиты/recover bonus; Fire учитывает общий фактически снятый HP по каждой цели.
Даже усиленная активация не убивает трёх здоровых боссов. Не даёт защиты/неуязвимости.

## Анимация, VFX, звук

MageGesture расширяет прежний MageCastingController, не заменяет пять MageSpell.
72новых оригинальных arm frames, итого294, прежние head/feet/body pixels и pivot
проверяются тестом. Ultimate выше ordinary casts и cosmetic Blink, ниже hurt/death.
После hurt продолжается с фактического возраста. Неуспешная активация не даёт жеста.

Lightning-kill помечается отдельным deathSource: фактическое удаление/XP/loot
не задерживаются, стандартная corpse/death animation этого источника подавляется.
Слой пепла: cap48лёгких записей,16переиспользуемых силуэтов и один Graphics на
весь ultimate VFX; не по GameObject на ребро. Fire/Frost/обычные убийства прежние.

Оригинальные procedural PCM: заряд, release+thunder+crackle, avalanche,
ignition и ограниченный embers bed; SFX/master/mute/priorities/voice caps
AudioController прежние. Нет грома на каждую цель. Bed останавливается в конце
Fire и при pause/death. Суммарный PCM-cache остаётся<4MB.

Ни одного полноэкранного белого rect/flash. Reduced flash затемняет сеть и
убирает target glow; reduced motion фиксирует jitter и уменьшает particles/pulse.
OS preference включает оба; независимые переключатели в Settings сохраняются.
Дополнительная живая проверка переключателей через UI: reducedMotion=true,
reducedFlash=true, успешная активация,50целей/50убийств,charge0,ошибок0.
Снимок обновлён именно в активной reduced-буре; результат в
`ultimates/reduced-live-verification.json`. Код после полного QA не менялся.

Статистика ultimate-lightning/frost/fire записывается отдельно в ScoreSystem
и отображается в текущем результате. Схема локальных records остаётся прежней,
поэтому дополнительная ultimate-разбивка не добавляется в архив старых рекордов.

## Проверки

- `npm run check`:504/504 unit в64файлах, typecheck/lint/build exit0.
- Production E2E:6/6 за33.3s,exit0.
- Целевой набор23/23 за1.1min до последнего исправления приоритета Blink;
  затем новый RAF-тест и23unit по controller/ultimate прошли с исправлением.
- Полный финальный305E2E:305/305 за27.6min,exit0, failures/skipped/retries0.
- `git diff --check`:exit0, финальная сверка manifest320файлов без отличий.
- Final manifest320файлов src/tests/public HD/scripts; во время полного QA не меняются.

Старые pre10/pre15 replay hashes и аудиобюджет сохранены, тесты не отключались
и не ослаблялись. Только ожидаемый atlas count222→294 отражает новые кадры;
все294кадра проверяются по hard alpha, границам и исходным пикселям тела.

9нагрузочных сценариев:150mixed+3boss+3Guardian, пятьV, highCDR,
1280×720 /844×390 /1024×768. У Lightning обычный HP толпы для массовой смерти;
у Fire/Frost immortal regulars для постоянной нагрузки. Player защищён только
в тестовой fixture. Каждый сценарий записывает2.4s настоящего RAF и3рестарта.
Median59.88FPS, p95frame16.7–16.8ms; максимальный graph activation2.90ms в полном
прогоне (предварительный замер1.9–3.5ms). Это Chromium
на текущем компьютере под автоматизированным QA, не обещание физических mobile FPS.
Данные: `docs/ultimates/performance/`. Сценарии повторяются в полном наборе.

## Визуальная и временная проверка

Реальный Phaser Canvas, три viewport, без дорисовки скриншотов. Ключевые материалы:

- [Три карточки](../screenshots/ultimates/selection-844.png).
- [HUD0/10](../screenshots/ultimates/hud-empty-844.png), [HUD10/10](../screenshots/ultimates/hud-ready-844.png).
- [Подготовка](../screenshots/ultimates/lightning-preparation-1280.png).
- [Паутина](../screenshots/ultimates/lightning-web-1280.png), [phone](../screenshots/ultimates/lightning-web-844.png).
- [Frost](../screenshots/ultimates/frost-active-844.png).
- [Fire](../screenshots/ultimates/fire-active-844.png), [Blink trail](../screenshots/ultimates/fire-blink-trail-844.png).
- [Reduced variant](../screenshots/ultimates/lightning-reduced.png).
- [Lightning video](../screenshots/ultimates/review/lightning.webm),
  [Frost video](../screenshots/ultimates/review/frost.webm),
  [Fire10s video](../screenshots/ultimates/review/fire.webm).

Динамика проверяется не только статичными кадрами: отдельный настоящий RAF-тест
пишет hits и7последовательных Canvas-кадров timeline-0…6. В50-цельной сцене
50уникальных ID имеют один damage timestamp. Кадры .116/.283s показывают
подготовку, .416s первый beam/смерть, .466s всю сеть, .566s отдачу, .716s
затухание и .915s пепел. Последовательность PNG осмотрена по времени; данные
в `docs/ultimates/live-timeline.json`. Видео записаны отдельно в реальном времени,
с test protection для читаемости; это не survival evidence. Полное прослушивание
звука на физических динамиках и тест физического gamepad/телефона не выполнялись.

Записи Lightning/Frost/Fire имеют длительность3.80/3.56/12.28s,1280×720;
проверены Chromium loadeddata/seek/decode без ошибок. Процедурные аудиопревью:
[Lightning](ultimates/audio/lightning.wav), [Frost](ultimates/audio/frost.wav),
[Fire](ultimates/audio/fire.wav). Это исходный PCM до runtime bus gain/compressor;
Playwright WebM не содержит системный звук.

Логи/HTML/manifest — `docs/ultimates/`; итоговые counts в results.json.
Материалы/docs локальные по `.gitignore`. Блокеров нет. Работа остановлена
для ручной приёмки. Текущие43файла исходников/ассетов/тестов не закоммичены,
push/deploy ультимейтов не выполнялись; main/remote остаются на принятом679ab20.

## Files

- `public/assets/hd/mage-casting.json`
- `public/assets/hd/mage-casting.png`
- `src/App.vue`
- `src/game/art/BossAnimation.ts`
- `src/game/art/EncounterFeedback.ts`
- `src/game/art/EnemyAnimation.ts`
- `src/game/art/GameArt.ts`
- `src/game/art/GuardianAnimation.ts`
- `src/game/art/MageCastingArt.ts`
- `src/game/art/MageCastingController.ts`
- `src/game/art/RunnerAnimation.ts`
- `src/game/art/mageCastingPack.ts`
- `src/game/art/mageCastingPoses.ts`
- `src/game/audio/AudioController.ts`
- `src/game/audio/AudioPresentation.ts`
- `src/game/audio/catalog.ts`
- `src/game/audio/synthesis.ts`
- `src/game/entities/types.ts`
- `src/game/events/bridge.ts`
- `src/game/events/gameFeedback.ts`
- `src/game/input/GamepadInputController.ts`
- `src/game/scenes/GameScene.ts`
- `src/game/services/storage.ts`
- `src/game/systems/MobilitySystem.ts`
- `src/game/systems/ScoreSystem.ts`
- `src/game/systems/UpgradeSystem.ts`
- `src/game/systems/World.ts`
- `src/ui/components/LevelUpModal.vue`
- `src/ui/components/RunStatistics.vue`
- `src/ui/components/SettingsPanel.vue`
- `src/ui/upgradeCards.ts`
- `src/ui/upgradeIdentity.ts`
- `tests/e2e/mage-casting.spec.ts`
- `tests/unit/mage-casting.test.ts`
- `scripts/measure-ultimates.mjs`
- `src/game/art/UltimateArt.ts`
- `src/game/config/ultimates.ts`
- `src/game/ultimates/UltimateSystem.ts`
- `src/game/ultimates/chainStorm.ts`
- `src/ui/components/UltimateControl.vue`
- `tests/e2e/ultimate-performance.spec.ts`
- `tests/e2e/ultimates.spec.ts`
- `tests/unit/ultimates.test.ts`
