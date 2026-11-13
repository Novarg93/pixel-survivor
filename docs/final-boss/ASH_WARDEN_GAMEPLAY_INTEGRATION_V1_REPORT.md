# Ash Warden — Gameplay Integration V1

Дата: 2026-11-07. Текущая ветка `main`. На этапе интеграции Ash Warden новых генераций и расходов нет: **$0.00**. Принятые каталоги `art/generated/` используются только для чтения. Последующий отдельный staging-эксперимент описан в [Secondary Bosses report](../secondary-bosses/ART_EXPLORATION_V1_REPORT.md). Commit, push и deploy не выполнялись.

## Runtime и арт

Расширен существующий `World.finalEncounter`; второго энкаунтера нет. Phaser вызывает `World.step`, Vue получает snapshots и показывает HUD/результаты. Клипы выбираются из состояния симуляции, нанесение урона не зависит от рендера кадра.

`scripts/build-ash-warden-runtime.mjs` упаковывает принятые PNG в `public/assets/hd/ash-warden-v1/`. Параметры и SHA-256 исходников сохранены в `src/game/art/ashWardenManifest.json` и runtime manifest. Упаковщик удаляет только прозрачные поля, сохраняя `sourceSize`, `spriteSourceSize`, исходный pivot и масштаб. Per-frame fitting отсутствует. Текстуры фильтруются NEAREST.

Подключены:

| Материал | Использование |
| --- | --- |
| directional-melee-b-v1 | Idle/Walk/Melee в S/E/W/N, общий верх S/E, West flip East |
| charge-v1 | Windup 650, Travel 420, Brake 300 мс; South pilot |
| charge-vfx-v1 | Отдельные ground/back/front, старт 160 и стоп 240 мс, неподвижный world anchor |
| cleave-rd-01/attempt-02 | 12 поз overhead slam, 1800 мс |
| magic-pack-v1 | Cast B в четырёх направлениях, Ritual Enter/Channel, Armageddon Cast |
| meteor-v1/meteor-c | Одни telegraph/fall/impact/aftermath для Single и обоих Armageddon |
| cinematics-v1 | Spawn, Shield Break, Stagger/Recover, Transformation, Death A, отдельный меч/угасание/пепел |
| cinematics-v1/phase3-persistence | Синхронные sparse emissive masks принятых действий |

Тело: логический canvas 192×192, pivot (96,154), scale 0.6548310811. VFX используют собственные размеры и pivot. Атлас: 4 страницы, 399 уникальных фрагментов, **14 680 064 байта RGBA = 14 МиБ**; PNG страниц суммарно 629 796 байт. Новый пакет заменяет загрузку старого `hd-ash-guard`, а не добавляется поверх него. Исторический procedural pack остаётся в проекте для архива и собственных старых тестов.

Fallback: Charge, Cleave, Spawn, Shield Break, Transformation и Death используют принятую South постановку для всех combat directions. Это не меняет мировой вектор атаки. Cast B/Idle/Walk/Melee имеют настоящий North со спины. West у полных directional-клипов зеркалит East; общие верхние слои не дублируются.

## Вход в бой и атаки

На 1200 с запускается единственный финальный бой. Обычный директор и волны прекращаются. Техническая очистка врагов и hostile projectiles/impacts не выдаёт kill/XP/loot. Сохраняются HP, билд, способности, артефакты, положительные эффекты, Ultimate и Blink. Арена фиксирована в world space с радиусом 800; управление игроком остаётся доступным.

До `spawnReady` через 2300 мс босс не атакует и не принимает урон. Появление начинается с принятых пустых/силуэтных кадров и переходит в Idle.

| Атака | Gameplay / тайминг |
| --- | --- |
| Basic Melee B | При дистанции ≤105; принятый клип 1200 мс; единственный контакт в 650 мс; сектор 100°, радиус 115; урон 32; cooldown 2.2 с. Вектор фиксируется при старте. |
| Charge → Cleave | Специальное комбо не чаще 12 с. Charge максимум 300 units за 420 мс, windup 650, brake 300. Swept collision, урон 48 максимум один раз за travel. Игрока после lock не преследует. |
| Infernal Great Cleave | Windup 900, active 150, recovery 750 мс. **Прямая полоса 280×44 world units**, а не старый сектор 170°. Урон 64 один раз. Ground warning, огненная проекция, короткий flash и затухающий разлом — отдельная Graphics/VFX презентация. |
| Single Meteor | Дистанция ≥300; Cast B 1440 мс; интервал 8 с; один неизменяемый target lock. Meteor C с радиусом урона 42, урон 54. |

Приоритет: готовое специальное комбо, ближний Melee, дальний Meteor, преследование. Новая направленная атака может быть отложена ради уже объявленных опасных зон. Столкновение с телом само по себе урона не наносит.

Скорость дальней погони: `clamp(effectivePlayerSpeed × 1.10, 120, 255)`. Вблизи, до 145 units, множитель 0.55; на 105 начинается остановка для Melee. Дистанция шага ограничена, чтобы не проскочить range. Walk сохраняет исходный цикл ~15.7 FPS; движение в мире не подгоняется под кадры.

## Три фазы и Guardian

HP босса 108 000. Большой burst ограничивается порогом 70%, затем 30%; обязательные переходы имеют защёлки и не пропускаются. Урон сверх порога не переносится сквозь защиту. Пауза/upgrade не продвигают симуляцию.

Фаза I: активное преследование и четыре атаки. На 70% — защищённый переход 800 мс и Ritual Enter 900 мс. Создаются три encounter-specific Guardian с HP 1800, номинальный радиус постановки 550. Они неподвижны, поддерживают отдельные лучи, выпускают не более одной принадлежащей каждому сферы одновременно: скорость 86, редкий интервал 8 с, урон 24. Обычная система Guardian и её артефактные награды не изменены.

Пока есть хотя бы одна опора, босс полностью иммунен и исключён из `combatTargets`. Доступные для атак Guardian остаются целями. Offscreen-маркеры и радар помогают найти опоры на desktop/mobile. Смерть каждой опоры сразу убирает её луч и owned threats. Последняя немедленно снимает иммунитет; Shield Break 1040 мс → held stagger → Recover 700 мс укладываются в трёхсекундное окно. Логическая уязвимость не ждёт окончания клипа.

Под щитом: Channel → Armageddon Cast 1200 мс, release 330 мс → Channel. Первая группа до 6, вторая до 5; разрыв между началами групп 1550 мс, между impacts внутри группы 60 мс. Все точки фиксируются при появлении предупреждений; длительность индивидуального warning — 1300 + index×60 мс. Первый каст через 3 с после входа; последующие — примерно через 18 с, без наложения нового ритуального залпа на старый. Safety planner может уменьшить число индивидуальных предупреждений.

После первой волны — открытая фаза II с четырьмя атаками. После 50 с открытого незамороженного боя возможна ровно одна повторная волна: 2 Guardian, HP 1350 каждый. Затем повторений нет. На 30% — принятая Transformation 1800 мс; далее фаза III.

Фаза III: четыре обычные атаки продолжаются. Отдельный arena scheduler создаёт группы 5+4 каждые 15 с, первая — через 3 с после Transformation. Он не запускает ритуальный cast и не останавливает босса. Frost останавливает личные clocks, но не arena clock. Пауза останавливает оба без накопленного catch-up. Личные метеориты босса замораживаются вместе с ним; уже world-anchored косметические Charge VFX продолжают короткое затухание.

## Meteor C и безопасность

За базу сохранены gameplay radius **42** и warning **1300 мс**. Пакет C не заменён: его эллиптическое ground кольцо адаптировано по осям к кругу реального урона; поверх сохраняется точная тонкая world-space граница. Видимый радиус не зависит от зума. Радиус игрока учитывается обычной проверкой пересечения с опасной зоной.

Single timeline относительно старта Cast B / warning:

| Событие | мс |
| --- | ---: |
| Cast start / target lock / warning | 0 |
| Meteor release, исходный выразительный жест B | 550 |
| Fall, последние пять кадров по 60 мс | 1000 |
| Impact / единственная проверка урона группы | 1300 |
| Конец Cast B | 1440 |
| Aftermath | 1480 |
| Полная очистка instance | 1800 |

Исходный warning C проигрывается за 900 мс, затем последний кадр удерживается до индивидуального impact; падение занимает последние 300 мс его timeline. Цель после объявления никогда не двигается. При разнесённых impacts учитываются только метеориты, упавшие в текущий simulation tick: будущий круг не наносит ранний урон. Группа может попытаться попасть в игрока максимум один раз, включая absorbed/immune contact и пересекающиеся круги. Все instances используют общие atlas frames; уникальных метеоритных PNG на залп нет.

`FinalDangerPlanner` ограничен набором walking routes и проверкой опасных временных окон. Он учитывает уже объявленные круги, Charge, Melee и узкий Cleave, а также границу арены. Проверка не предполагает Blink. При конфликте сокращаются отдельные новые метеориты или откладывается начало направленной атаки; весь автоматический Armageddon из-за меча не выключается. Это bounded практический helper, не формальное доказательство безопасности при любом вводе.

## Ультимейты, смерть и lifecycle

Lightning сохраняет действующие per-target caps; фазовый gate дополнительно ограничивает фактический HP damage. Иммунный босс не получает урон. Frost сохраняет заморозку босса/Guardian и личных AI clocks; щит сам собой не исчезает, Phase3 overlay остаётся привязан к замороженному кадру. Fire поглощает предусмотренные вражеские сферы, но не наземные метеориты и не даёт иммунитет к мечу.

При HP=0 результат victory защёлкивается сразу, весь hostile damage прекращается, Meteor instances и Guardian threats очищаются. Босс остаётся в rendering layer в состоянии `dying`. Повторный урон/Ultimate/Blink и поражение после victory заблокированы. События Death A: swordRelease 860, bodyCollapse 1060, emberFade 1480, complete 2200 мс. Отдельный sword sprite падает, затем сохраняется с угасанием; тело остаётся в принятой низкой позе на коленях/руках. Никакого принудительного плоского падения нет.

Vue сохраняет victory один раз по runId уже при fatal hit, включая закрытие страницы во время смерти; результаты открываются только после `deathAnimationComplete`. Practice и DEV scenario помечаются practice и не загрязняют рекорды. Старый wall-clock таймер победы удалён. Pause удерживает Death A и события без повторного dispatch.

Изображения VFX переиспользуются из ограниченного пула. Warning cap 12, projectile cap остаётся общим World budget; фрагменты не создаются отдельными GameObjects. Graphics очищаются каждый render. Scene shutdown уничтожает pool/labels/graphics; restart создаёт новый World и не оставляет schedulers/listeners. Новых wall-clock AI timers нет.

HUD показывает имя, HP, фазу, иммунитет/щит и число опор; mobile не закрывает Blink/joystick. Косметические пепел/камни/embers учитывают effects intensity и reduced motion; обязательные danger boundaries, тело, меч и состояние Phase3 остаются читаемыми. Звуки переиспользуют существующий оригинальный procedural PCM catalog: spawn, шаг, melee, charge start/stop, cleave, cast/impact, shield/break, transformation/death. Сохраняются volume/mute, voice limits и интервалы.

## Development harness и проверка

Расширен существующий `window.__PIXEL__`, доступный только в DEV при `?test=1`: `finalScenario('before20'|'shield'|'breakShield'|'repeat'|'phase3'|'armageddon'|'death')`. Он использует настоящий World и маркирует прогон practice. Существующая публичная кнопка «Бой со Стражем» использует обычный legal Mage54 build; это не production debug console. Для разных legal билдов тесты используют существующий `finalBuild` через настоящие upgrade rules.

Действующие per-Ultimate caps для босса/Guardian сохранены: Lightning 12%, Frost 8%, Fire 24% max HP за активацию, дополнительно действуют phase gates и полный Shield immunity. Конфиг самих Mage Ultimate не изменён.

Основные изменения этого этапа (в рабочем дереве до начала уже были другие пользовательские изменения, они не сбрасывались):

- Gameplay: `src/game/systems/FinalEncounter.ts`, `FinalDangerPlanner.ts`, `World.ts`, `src/game/config/finalBoss.ts`.
- Rendering/assets: `src/game/art/FinalBossArt.ts`, `GameArt.ts`, `assetRegistry.ts`, `ashWardenPack.ts`, `ashWardenManifest.json`; compatibility mapping новых имён в историческом `ashGuardPack.ts`; `scripts/build-ash-warden-runtime.mjs`; `public/assets/hd/ash-warden-v1/`.
- Lifecycle/UI: `src/App.vue`, `src/game/scenes/GameScene.ts`, `src/game/services/storage.ts`, `src/ui/components/FinalBossBar.vue`, guards в `MobilitySystem.ts`/`UltimateSystem.ts`.
- DEV/audio: `src/game/bootstrap/finalBossScenario.ts`, `src/env.d.ts`, `src/game/events/gameFeedback.ts`, `src/game/audio/catalog.ts`.
- Проверки: новые `tests/unit/ash-warden-integration-v1.test.ts` и `tests/e2e/ash-warden-integration-v1.spec.ts`; актуализированы asset references, сроки трансформации и смерти в существующих final-boss/practice/production тестах. `tests/helpers/finalBossTrial.ts` обучен уклоняться от добавленного Melee и узкой полосы; он не редактирует HP/иммунитет в lawful trials.
- `.gitignore`: `art` ограничено корневым `/art/`, чтобы новые runtime-модули `src/game/art/` не скрывались от Git. Никакие файлы не добавлены в index.
- Документация: этот отчёт, `INTEGRATION_V1_VISUAL_REVIEW.html`, `docs/PROGRESS.md`, `docs/DECISIONS.md` и измерительные JSON.

Проверки:

- `npm run check`: 83 файла, **669 тестов прошли**, typecheck/lint/production build прошли.
- Финальный полный `npm run test:e2e` с обычным одним worker выполнил **382 сценария за 1.1 часа: 381 прошёл, один прерван HMR**. Все final-boss сценарии, пять разрешений, полноценный lawful RAF бой, HD texture budget и прежний чувствительный loot-pool stress прошли.
- Прерванный `gamepad maximum load and bounded polling390` завершился ошибкой `__PIXEL__` undefined ровно в **12:14:25**, одновременно с моей правкой загруженного art viewer. Лог Vite подтвердил `page reload ...viewer.js`; dead-end HMR отправляет full-reload всем подключённым страницам. Это прервало DEV bridge, без изменения runtime. Доказательства — `e2e-hmr-interruption.json`. После завершения всех правок **тот же тест без изменений прошёл 1/1 за 13.5 с**. Assertions не ослаблялись. Полный прогон не выдаётся за непрерывный 382/382: честный результат —381 в общем прогоне плюс один неизменённый успешный повтор.
- Дополнительные целевые проверки после интеграции: **28/28**, затем **2/2** Canvas-сценария с прямой проверкой «НЕУЯЗВИМ» / «СТРАЖ ПОВЕРЖЕН». UTF-8 документации проверен отдельно.
- `npm run test:e2e:production`: **8/8**, проверен настоящий production build, публичный practice без DEV harness, звук, управление, pause/resize, все новые локальные atlas requests без внешней сети.
- `node scripts/verify-final-built.mjs`: minified World с настоящим legal build — victory за 136 с, AFK defeat за 39.5 с. Это отдельная проверка минифицированной симуляции, а не подмена Canvas E2E.
- Настоящий RAF бой в финальном полном прогоне: **victory, 142.931 с, HP 196, два phase gates**, без ручной смены HP, тестового иммунитета и удаления Guardian. Смерть и победа проверены через реальный Vue/Phaser pipeline.
- `git diff --check` прошёл. Существующее предупреждение CRLF в пользовательском GameRadar не является ошибкой diff.
- Проверены SHA-256 всех 395 использованных исходников, frame references, transparency/source offsets, исходные durations, hit once, direction lock, Frost clocks, планирование безопасного пути, конец VFX и Restart lifecycle. Предел нового атласа 16 МиБ не ослаблялся.

Источники доказательств: `integration-v1-1280.json`, `integration-v1-844.json`, `performance-1280.json`, `performance-844.json`, `performance-serial-1280.json`, `performance-serial-844.json`, `dodge-cap-audit.json`, `balance-trials.json`, `real-raf-fight.json`, `built-runtime.json`. Полные логи — `.tmp/final-integration-v1/`: `e2e-sequential.log`, `e2e-hmr-rerun.log`, `production.log`, `check-final-complete.log`. Runtime был заморожен до staging art этапа; итоговая проверка SHA-2562277 gameplay/public/accepted-art файлов показала0 изменений во время него.

Отдельный замер без других тестовых браузеров: `final-boss-performance.spec.ts`, **2/2**. Chromium, browser mobile emulation, DPR1:

| Viewport | Median FPS | p95 frame | p95 Scene update, Phase3+Ult | Все загруженные texture base levels |
| --- | ---: | ---: | ---: | ---: |
| 1280×720 | 59.88 | 16.9–17.0 мс | 0.4–0.6 мс | 57.63 МиБ |
| 844×390 | 59.88–60.24 | 16.9–17.0 мс | 0.4–0.6 мс | 51.63–52.63 МиБ |

Baseline150+3+3: p95 update 1.4 / 1.2 мс соответственно. Новый Ash Warden atlas занимает 14 МиБ из этих сумм. Это точная сумма RGBA base-level размеров загруженных текстур; framebuffer/driver overhead в неё не включён. Native phone/GPU VRAM profiler не использовались. VFX Images pool имеет жёсткий предел48; в типовом записанном сценарии выделено18.

В финальном полном последовательном прогоне median FPS59.88 в обоих viewport, p95 frame16.7–16.8 мс, p95 Phase3+Ultimate update0.5–0.7 мс; baseline150+3+3 —1.6/1.5 мс. Texture base budgets те же:57.63 МиБ desktop,51.63–52.63 mobile. Текущие `performance-*.json` содержат эти замеры, `performance-serial-*.json` сохраняют отдельный ранний standalone замер из таблицы.

Скриншоты настоящей игры, не art viewer: `screenshots/ash-warden-integration-v1/`, отдельно canvas и HUD для 1280×720 / 844×390. Включены Spawn, Melee, Charge, узкий Cleave, Single Meteor, Ritual/Shield, обе группы Phase2, Phase3 + независимые метеориты, Sword Release, Collapse, Ember Fade, Victory. Дополнительные направленные и lifecycle проверки — `screenshots/final-boss/`.

## V1 backlog и ручная приёмка

- South fallback специализированных клипов; реальные directional Charge/Cleave/Cinematics остаются art-polish задачей.
- Walk на высокой скорости имеет ограниченную длину шага; FPS ради маскировки не повышен.
- Death A заканчивается низкой позой, принятой пользователем; Death B не генерировалась.
- Planner проверяет ограниченные варианты маршрута; skill-based ручная приёмка комбинаций и плотности Meteor остаётся необходимой.
- Browser mobile emulation не заменяет замер на физическом телефоне.

После технической проверки следующий шаг — ручная игровая приёмка. Дополнительная генерация или смена принятого дизайна не нужны.
