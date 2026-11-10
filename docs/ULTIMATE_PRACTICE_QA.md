# Ultimate: ранний доступ и временные dev-запуски

2026-11-04, непосредственно main. Изменения поверх незакоммиченной Ultimate System;
без веток, commit, push и deploy. Последнее уточнение пользователя имеет приоритет:
первый заряд даётся сразу при выборе, последующие — за Blink.

## Поведение

- Гарантированный выбор из трёх ультимейтов при подходящем queued Level Up:
  игровое время ≥10:00 и уровень выдаваемого повышения ≥40. Если уровень40
  получен раньше, предложение ждёт следующего повышения после10:00.
- После выбора сразу10/10; первый ультимейт можно применить сразу. После
  активации0/10; дальше по одному заряду за подтверждённый успешный Blink,
  максимум10. Повторное предложение/бесплатное пополнение невозможно.
- Q/Y/touch, блокировки Pause/Level Up/GameOver, отсутствие нового cooldown,
  ограничения Fire/Frost/Lightning и отсутствие целей у Lightning сохраняются.
- В меню `npm run dev` доступны три временные кнопки: Гнев Небес,
  Абсолютный Ноль, Погребальное Пламя. Каждая запускает Mage на10:00/уровне40
  с выбранной готовой ультой, полной обычной HP и случайным билдом.
- Билд:39 обычных допустимых улучшений, гарантированно открыты пять авто-навыков,
  остальные ранги/пассивные улучшения/специализация Blink выбираются seeded RNG.
  Свежий запуск получает новый seed. Предвыбранная ульта — дополнительная dev-выдача.
- 48 обычных врагов реального масштаба10-й минуты позволяют сразу проверить
  разряд. Никакой неуязвимости, ускоренной перезарядки, особого урона или
  изменения director/spawn schedule. Mage изначально смотрит на подготовленную
  толпу, чтобы Frost можно было сразу выпустить в неё. Дальше идёт обычный забег.
- HUD/экран смерти помечены DEV; тестовые результаты не записываются в рекорды
  и накопительную статистику. Обычная кнопка старта снова создаёт уровень1.
- Production не показывает dev-кнопки и игнорирует dev-команду запуска.

## Изменённые файлы этой корректировки

Gameplay: `src/game/config/ultimates.ts`, `src/game/ultimates/UltimateSystem.ts`,
`src/game/bootstrap/ultimatePractice.ts` (новый), `src/game/systems/World.ts`,
`src/game/events/bridge.ts`, `src/game/scenes/GameScene.ts`.

UI: `src/App.vue`, `src/ui/components/MainMenu.vue`,
`src/ui/components/GameHUD.vue`, `src/ui/upgradeCards.ts`.

Проверки: `tests/unit/ultimates.test.ts`, `tests/unit/ultimate-practice.test.ts`
(новый), `tests/e2e/ultimates.spec.ts`, `tests/e2e/ultimate-practice.spec.ts`
(новый), `tests/e2e/production.spec.ts`.

## Проверки

- `npm run check`:512/512 unit в65файлах, TypeScript/ESLint/build успешно.
- Финальный целевой browser-набор:15/15 за47.8s,exit0. Реальные клики всех трёх кнопок на
  1280×720,844×390,1024×768; настоящая активация Q/touch, неизменность localStorage
  после смерти, обычный старт после dev. Natural Level Up на10:00/40,
  первый готовый заряд, следующее применение только после10 успешных Blink.
- `npm run test:e2e:production`:7/7 за34.9s,exit0. Включает отсутствие dev-меню.
- `npm run test:e2e -- --workers=2 --reporter=list,html,json`:309/309 за27.9min,
  exit0; skipped/unexpected/flaky0. Включает прежние survival, Enrage, input,
  loot, boss/Guardian, рестарты и все новые ultimate-тесты.
- `git diff --check`:exit0. SHA256 всех299 src/tests/public-assets совпали
  с manifest; новых/пропавших/изменившихся файлов во время финального QA нет.
- Обычный адрес `http://127.0.0.1:5173/`, без query и без `window.__PIXEL__`:
  три клика запускают40/10:00/10зарядов, реальный Q снимает готовность;3/3,
  ошибок страницы0. Проверка через `.tmp/verify-default-ultimate-menu.mjs`.
- Девять стресс-сцен из полного набора:150обычных+3boss+3Guardian,5навыковV,
  высокий CDR,20-я минута; median59.88FPS,p95 кадра16.7–16.8ms,
  max activation2.20ms. Cap пепла16images, следов12, Clock timers0,
  рестарты без роста ресурсов. Замеры Chromium на этой машине и viewport,
  не физического телефона/планшета. Неуязвимость есть только в stress-fixture
  для постоянной нагрузки; в пользовательском dev-пресете её нет.

Настоящие Canvas PNG: `screenshots/ultimate-practice/`: меню и ready/cast
для каждой стихии на всех трёх viewport (21PNG), плюс3 default-entry ready.
Все24 открыты и просмотрены визуально. Dev-кнопки видны,10/10 читается,
на телефоне ульта не перекрывает Blink/джойстик, игровой Canvas настоящий.
Скриншоты сами по себе не подтверждают динамику: новое поведение проверяется
браузерными событиями и World state. Анимации/урон этой корректировкой не менялись.

Логи скопированы в `docs/ultimate-practice/`: check/target/production/full/default-entry;
HTML: `{target,production,full}-report/`, JSON: `full-results.json`,
`final-manifest.json`, `final-source-audit.json`. Performance JSON сохранены
в `docs/ultimates/performance/` существующим harness.

Первый полный запуск был прерван после правки направления dev-пресета:
горячая перезагрузка и пересечение прогонов сделали его непригодным для QA.
Его лог отдельно `interrupted-full.log`; итог выше — полностью новый отдельный
прогон на неизменяемых исходниках. Production bundle после этой DEV-правки
побайтно тот же (`index-CNaQ7deZ.js`), production-проверки актуальны.

Блокеров нет. Работа остановлена для ручной приёмки, без commit/push/deploy.
