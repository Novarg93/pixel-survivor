# Lightning Ultimate — Divine Storm Cinematic Pass

Дата: 2026-11-05. Рабочая ветка main, поверх существующей незакоммиченной
Ultimate System. Без новых веток, commit/push/deploy. Frost/Fire не переработаны.
После завершения автоматического QA — остановка для ручной визуальной приёмки.

## Поведение и сроки

| Возраст каста | Состояние |
| --- | --- |
| 0–340ms | Invocation: остановка обычного движения, поднятая рука, затемнение до24% |
| 340–405ms | Sky Strike: небесная молния в руку, локальный импульс, начало ауры |
| 405–520ms | Overload: короткие разряды по силуэту, усиление накопленной энергии |
| 520ms / ближайший World step | Release: снятие защиты/ауры, однократный урон всему графу |
| Release +0–75ms | Одновременное проявление всех ветвей |
| Release +75–200ms | Удержание разрядов, визуальная отдача |
| Release +200–320ms | Быстрое затухание разрядов |
| Release +0–400ms | Один flash pulse120ms, плавное восстановление освещения |
| Release +0–850ms | Пепел, ограниченные силуэты и пыль |

Игровое время World.elapsed; ни защита, ни аура не зависят от CSS/реального таймера.
Физические координаты отдача не меняет. Основные входы/пять авто-навыков прежние.
Указанные520ms квантуются ближайшим шагом симуляции; normal dt ограничен50ms.

## Файлы этого pass

- `src/game/config/ultimates.ts`, `ultimates/UltimateSystem.ts`, новый
  `ultimates/lightningCinematic.ts`: сроки, защита, фазы и release boundary.
- `systems/World.ts`: проверка защиты перед расходом HP/Absorb и порядок Lightning.
- `art/UltimateArt.ts`, `art/GameArt.ts`, `art/MageCastingArt.ts`,
  `art/MageCastingController.ts`, `art/mageCastingPoses.ts`, `scenes/GameScene.ts`:
  world overlay, силуэт, рука, вспышка, небесные ветви и визуальная отдача.
- `scripts/mage-casting-art-source.mjs`, `public/assets/hd/mage-casting.png`:
  оригинальные позы Lightning; layout/число294кадра сохраняются.
- `audio/catalog.ts`, `audio/synthesis.ts`, `audio/AudioPresentation.ts`,
  `events/gameFeedback.ts`: синхронные cues и оригинальный PCM.
- `tests/unit/lightning-cinematic.test.ts`, `tests/e2e/lightning-cinematic.spec.ts`:
  новые проверки. Прежние `ultimates.test.ts`, `ultimate-practice.test.ts` и
  `ultimate-practice.spec.ts` учитывают новый520ms cast и защиту до Release.

Перечень не включает прежние незакоммиченные изменения других pass.

## Проверки

- `npm.cmd run check`:517unit в66файлах, typecheck/lint/build exit0.
- Целевой E2E до последнего уточнения направления руки:30/30,1.1min, exit0.
- Полный `npm.cmd run test:e2e -- --workers=2 --reporter=list,html,json`:
  315/315 за27.7min,exit0; unexpected/skipped/flaky0.
- `npm.cmd run test:e2e:production -- --reporter=list,html,json`:7/7 за34.1s,
  exit0; unexpected/skipped/flaky0, внешний runtime network отсутствует.
- `git diff --check`:exit0 на финальной проверке.
- SHA256 исходников/тестов/ассетов/скриптов зафиксированы перед полным QA в
  `lightning-cinematic/final-manifest.json`. Финальная сверка всех326файлов:
  изменённых/добавленных/пропавших0.

Windows PowerShell блокирует npm.ps1, поэтому используется штатный npm.cmd без
изменения ExecutionPolicy. Art builder требует флаг Node22:
`node --experimental-strip-types scripts/build-mage-casting-art.mjs`.

## Измерения и ограничения

Постоянная нагрузка150обычных+3boss+3Guardian,5rankV/highCDR: median59.88FPS
до/во время молнии на1280×720 и844×390, p95≈16.7–16.8ms в полном прогоне.
Activation2.1/2.2ms в постоянной нагрузке. Отдельный прежний mass-kill harness:
baseline59.88FPS/p95~16.8ms → итог59.88FPS/p95~16.7–16.8ms,
activation1.8/1.7ms в полном прогоне. Это две разные нагрузки, не игровой DPS.
Ресурсы:2Graphics,2ауры,≤16ash images, ноль Clock/tweens;10рестартов дают
одинаковый объектный/текстурный/listener baseline. JSON — в `lightning-cinematic/`.

Реальный Canvas background sample:51.9675 →43.680989583333336 →51.9675
(обычный/затемнённый/восстановленный). Все6CSS ancestor filters HUD — `none`.
Это измерение выбранного участка фона, не фотометрия всего изображения.
Паутина полностью проявилась за83.17/83.23ms после фактического Release.
На каждом viewport64уникальные цели получили64удара с одним World timestamp.

Машина: Windows x64, AMD Ryzen5 7500F (6cores/12logical),32GB RAM, Node22.16.0,
Playwright1.64.1, Chromium156.0.8078.4. Чтение WMI ограничено средой;
CPU/RAM получены через Node os.
Browser viewport эмуляция Chromium на этой Windows-машине; физический телефон
и слуховая субъективная оценка синтезированных эффектов не проверялись.
Canvas PNG открываются и оцениваются отдельно от DOM. Резкие белые экраны не
используются; режим reduced flash и OS reduced motion проверены.

## Реальные кадры

В `../screenshots/lightning-cinematic/` находятся по8Canvas PNG для
1280×720 и844×390 (`01-normal`, `02-invocation`, `03-sky-strike`, `04-overload`,
`05-release`, `06-flash`, `07-ash-recoil`, `08-restored`). Сняты с обычного RAF
без подмены рендера и перемотки фаз. Также сохранены full-before/full-restored,
reduced-flash и constant-stress. Метаданные World/pose/audio/hit timestamps —
`lightning-cinematic/sequence-1280.json` и `sequence-844.json`.

| Кадр | Desktop1280×720 | Mobile844×390 |
| --- | --- | --- |
| Обычный мир | [PNG](../screenshots/lightning-cinematic/01-normal-1280.png) | [PNG](../screenshots/lightning-cinematic/01-normal-844.png) |
| Призыв, поднятая рука | [PNG](../screenshots/lightning-cinematic/02-invocation-1280.png) | [PNG](../screenshots/lightning-cinematic/02-invocation-844.png) |
| Удар с неба | [PNG](../screenshots/lightning-cinematic/03-sky-strike-1280.png) | [PNG](../screenshots/lightning-cinematic/03-sky-strike-844.png) |
| Накопленная энергия | [PNG](../screenshots/lightning-cinematic/04-overload-1280.png) | [PNG](../screenshots/lightning-cinematic/04-overload-844.png) |
| Release/паутина | [PNG](../screenshots/lightning-cinematic/05-release-1280.png) | [PNG](../screenshots/lightning-cinematic/05-release-844.png) |
| Вспышка | [PNG](../screenshots/lightning-cinematic/06-flash-1280.png) | [PNG](../screenshots/lightning-cinematic/06-flash-844.png) |
| Пепел/отдача | [PNG](../screenshots/lightning-cinematic/07-ash-recoil-1280.png) | [PNG](../screenshots/lightning-cinematic/07-ash-recoil-844.png) |
| Свет восстановлен | [PNG](../screenshots/lightning-cinematic/08-restored-1280.png) | [PNG](../screenshots/lightning-cinematic/08-restored-844.png) |

Для ручной проверки: обычный dev-адрес → «Гнев Небес» в DEV-практике → Q,
либо Y/кнопка ультимейта. Первый заряд уже готов; следующие10успешных Blink прежние.

## Итоговый QA

Все обязательные команды завершены успешно. Логи и HTML/JSON:
`lightning-cinematic/check.log`, `full.log`, `full-results.json`, `full-report/`,
`production.log`, `production-results.json`, `production-report/`.
Первые целевые прогоны обнаружили слишком строгий порог reveal, существующее
neutral-gating стика после Pause, преждевременную повторную активацию в тесте и
чтение очищенного WebGL buffer вне RAF. Причины исправлены; тесты не отключались.
Полный финальный прогон — без failures/retries/skipped. Исходники во время него
не менялись. Создание production HTML-report вызвало Vite reload, текущие тесты
прошли; файлового HMR кода не было, финальная SHA256-сверка точная.

Все16финальных кадров повторно открыты и визуально проверены после выполнения
новых тестов в полном прогоне. Всего23PNG, включая UI/reduced/stress свидетельства.
Блокеров нет. Работа остановлена для ручной приёмки Lightning; Frost/Fire pass
не начаты. Коммиты, push, deploy и done-маркеры отсутствуют.
