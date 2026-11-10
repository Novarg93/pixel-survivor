# Lightning Ultimate — Radial Aftershock

2026-11-05, main. Работа только над отдельным радиальным VFX; без веток,
push/deploy. После QA — остановка для ручной приёмки.

## Изменение

Источник спиц — `art/LightningGroundArt.ts`: прежние 16 направлений по четыре
длинных соединённых отрезка плюс ответвления (80 прямых линий), видимые 2 секунды.
Теперь этот же один Graphics рисует разорванные электрические ломаные:

- 20–24 неодинаковых направления/скопления, 3–5 отдельных участков в каждом;
- 3–6 коротких отрезков на участке, случайные промежутки, длина и угловое отклонение;
- по одному небольшому ответвлению у части путей, максимум 144 коротких дуги;
- бело-голубое ядро, ярко-голубая линия, слабое синее свечение;
- раскрытие от центра наружу примерно за 65–72 ms, основная яркость до 135 ms;
- независимое мерцание/затухание участков, полная очистка не позднее 450 ms.

После 450 ms очищаются Graphics и cached geometry. Двухсекундный World-record
прежнего GroundDischarge сохранён: это не видимая линия или постоянный эффект.
Существующий тихий звуковой хвост и пауза спавна не перерабатывались.

Геометрия генерируется единожды при новой ссылке GroundDischarge. Используется
отдельный экземпляр SeededRandom с косметическим seed из времени/позиции Release.
World.rng не читается. Новых GameObjects на сегменты, таймеров, RAF, шейдеров и
listeners в игре нет. Интенсивность масштабирует alpha; reduced motion/flash
убирает мерцание и раскрытие, снижает яркость. Pause использует прежний World time.

## Соответствие gameplay

VFX читает неизменённый `GroundDischarge.radius`:
`hypot(viewport.width, viewport.height) / 2 + 24` в World-координатах.
Это круг вокруг текущей позиции Mage в момент Release, охватывающий все углы
видимой области. Обычные враги, чьи коллайдеры пересекают круг, получают прежнее
испепеление; bosses/Guardian сохраняют прежние ограничения урона и попадания
через граф. Паутина по своим прежним правилам может поражать дальше этого круга.
Радиальный VFX показывает круговую часть поражения и не расширяет её.

Все точки VFX ограничены исходным кругом с небольшим внутренним отступом для
ширины свечения. Равномерного кольца или геометрии звезды нет. При сравнении
зона поражения не обнаружила расхождений с прежним gameplay.

Основной толстый разряд, паутина, HP/урон/цели, зарядка, баланс, персонаж,
Frost и Fire не менялись. SHA256 baseline охватывает все src/tests/scripts/assets;
на этом этапе допустимы изменения только LightningGroundArt, двух его старых
тестов и нового E2E lightning-aftershock.

## Проверки

- `npm.cmd run check`: 549 unit/integration в 69 файлах, typecheck/lint/build exit 0.
- Первичный целевой прогон: 10/11, один новый assert ошибочно сравнивал
  floating-point 0.22000000000000003 с <=0.22. Исправлен на toBeCloseTo(.22,12),
  без изменения игровой логики; финальный новый E2E-набор 3/3 за 19s.
- Остальные 10 целевых cinematic/devastation/performance проверок прошли.
- `npm.cmd run test:e2e`: **329/329** за 20.5 минуты, exit 0; чистый сервер5194,
  3workers; skipped/flaky/unexpected = 0 (`full-results.json`, `full.log`).
- `npm.cmd run test:e2e:production`: **7/7** за 36.3s, exit 0; без пропусков,
  ошибок и нестабильных тестов (`production.json`, `production.log`).
- `git diff --check`: exit 0 (`diff-check.log`). SHA256 всех337файлов из
  `full-manifest.json` совпали после прогона. Относительно baseline изменены
  только3ранее перечисленных файла, добавлен только новый E2E. Весь gameplay,
  Frost/Fire, главный bolt/web, анимации и assets прежние (`verification.json`).
- Unit проверяет ограничение геометрии кругом, разрывы, изгибы, 360°, branches,
  независимый seed, основную яркость/разные сроки затухания и отсутствие после .45s.
- Реальный Canvas E2E: Q/touch, мгновенный unique damage, disconnected rear kills,
  один geometry build, отсутствие отдельных объектов на участки, fade/cleanup,
  reduced effects, нулевая интенсивность, World pause и 10 scene restarts.
- Существующий постоянный стресс 150+3+3 и rankV/highCDR с test-only damage stub
  сохраняет плотность на время VFX: median до/во время 59.88/59.88 FPS,
  p95 16.7–16.8 ms на обоих viewport в целевом прогоне; в полном наборе
  median59.88FPS и p95~16.8ms на обоих размерах. Это Windows Chromium
  с viewport-эмуляцией, не физические мобильные устройства.

## Реальные кадры

Одинаковая сцена: восемь shielded элитных tank с 1M HP, включая disconnected
цели позади и по углам; авто-навыки отключены. Все восемь погибают одним Release.
Ниже кадры из реального Phaser RAF; время отсчитывается от Release.

| Фаза | До 1280×720 | После 1280×720 | До 844×390 | После 844×390 |
| --- | --- | --- | --- | --- |
| Release | [PNG](../screenshots/lightning-aftershock/before/release-1280.png) | [PNG](../screenshots/lightning-aftershock/after/release-1280.png) | [PNG](../screenshots/lightning-aftershock/before/release-844.png) | [PNG](../screenshots/lightning-aftershock/after/release-844.png) |
| ~75ms, радиальные дуги | [PNG](../screenshots/lightning-aftershock/before/radial-1280.png) | [PNG](../screenshots/lightning-aftershock/after/radial-1280.png) | [PNG](../screenshots/lightning-aftershock/before/radial-844.png) | [PNG](../screenshots/lightning-aftershock/after/radial-844.png) |
| ~140ms, поражение сзади | [PNG](../screenshots/lightning-aftershock/before/behind-1280.png) | [PNG](../screenshots/lightning-aftershock/after/behind-1280.png) | [PNG](../screenshots/lightning-aftershock/before/behind-844.png) | [PNG](../screenshots/lightning-aftershock/after/behind-844.png) |
| ~270ms, затухание | [PNG](../screenshots/lightning-aftershock/before/fade-1280.png) | [PNG](../screenshots/lightning-aftershock/after/fade-1280.png) | [PNG](../screenshots/lightning-aftershock/before/fade-844.png) | [PNG](../screenshots/lightning-aftershock/after/fade-844.png) |
| ~400ms, остаток | [PNG](../screenshots/lightning-aftershock/before/late-fade-1280.png) | [PNG](../screenshots/lightning-aftershock/after/late-fade-1280.png) | [PNG](../screenshots/lightning-aftershock/before/late-fade-844.png) | [PNG](../screenshots/lightning-aftershock/after/late-fade-844.png) |
| ~520ms, очищено | [PNG](../screenshots/lightning-aftershock/before/cleared-1280.png) | [PNG](../screenshots/lightning-aftershock/after/cleared-1280.png) | [PNG](../screenshots/lightning-aftershock/before/cleared-844.png) | [PNG](../screenshots/lightning-aftershock/after/cleared-844.png) |

Все25кадров before/after/reduced визуально просмотрены; финальные burst/fade/
clear повторно просмотрены после полного набора. Блокеров нет. Измеренные
радиусы прежнего ground-поражения:391.151World px при1280×720 и388.059World px
при844×390 (разница определяется существующим camera zoom на touch).

Логи/численные состояния: docs/lightning-aftershock/. Локальный сервер5185
перезапущен и отвечает200. Для приёмки: http://127.0.0.1:5185/ → DEV «Гнев Небес»
→ Q/Y/touch. Работа остановлена для ручной приёмки; новых commit/push/deploy нет.
