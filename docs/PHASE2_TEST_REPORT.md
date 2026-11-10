# Pixel Survivor — Phase 2: проверка 12–19

31.10.2026. Работа выполнена в существующем проекте; сохранены все маркеры 00–11. Новые зависимости не устанавливались. Старый run-stages.ps1 не запускался.

## Проверенные результаты

| Команда | Результат |
|---|---|
| `npm run check` | **80 passed / 19 unit test files**, строгая TS/Vue типизация, ESLint, production build |
| `npm run build` | Успешно, отдельный запуск после check |
| `npm run test:e2e` | **21 passed**, примерно 1.4 минуты, включая 60 секунд реального peak-wave stress |
| `npm run test:e2e -- final-qa.spec.ts phase2.spec.ts` | **12 passed** после уточнения текстов общих улучшений и счётчика третьего босса |
| `npm run test:e2e:production` | **4 passed**: Mage/Warrior × grove/Dark Forest; реальные автоматические убийства, pause/resume/resize, без harness/404/внешних requests/console errors |

Предупреждение о Phaser chunk 1.39MB остаётся; build завершается успешно. Дополнительные dev-зависимости не вводились; предыдущий dependency audit хранится отдельно в отчёте Phase1.

## Частота спавна

Детерминированный тест использует один и тот же реальный World/SpawnClock, seed71 и120с, baseline rate1 против1.3. Живые враги убираются между шагами **без kill/XP**, чтобы исключить насыщение cap:

- baseline: **108** созданных обычных мобов;
- Phase2: **141**;
- прирост: **30.56%**.

[JSON сравнения](benchmarks/phase2-spawn-comparison.json). Отдельно проверены cap150, расход попыток при заполнении, быстрое восполнение и отсутствие долга после паузы. HP/damage/boss cadence автоматически на30% не увеличивались.

## Новые unit/integration проверки

К прежним58 тестам добавлены22; существующие тесты сохранены, director assertion расширен с4 до6 архетипов.

| Файл | Тестов | Проверка |
|---|---:|---|
| phase2-spawn | 2 | Реальные создания old/new, cap/refill/pause |
| phase2-feedback | 2 | Timed feedback/expiry/cap96, старые/новые settings |
| phase2-evolutions | 5 | III-rank eligibility/max1/3unique, freeze+immunity, unique secondary chain, splash/shield/cap, реальное создание burn после meteor |
| phase2-enemies | 3 | Rusher windup/lock/recovery, splitter children/cap, elite timers/defense/volatile |
| phase2-boss | 2 | Scheduler третьего босса/cap3, HP phase transition/volley/floor marks/owner cleanup/score |
| phase2-warrior | 3 | Свой каталог/живучесть/reset, пять разных эффектов, seeded120с melee collection pilot |
| phase2-biomes | 2 | Детерминизм/палитры/дальние координаты/caps, изоляция параметров run |
| phase2-statistics | 3 | Фактически снятый HP/overkill/duplicate death, normal/elite/boss counters/reset, v1→v2 migration/roundtrip |

Сохранились два одинаковых accelerated20мин simulation run с проверкой caps на каждом шаге и одинаковыми kills/score. Mage и Warrior выдержали seeded120с pilots с >30 kills. Пилот Warrior подходит к врагу при отсутствии XP, поскольку бегство от целей не упражняет ближний бой. Это проверка доступности начала, не субъективная оценка полного забега.

## Браузерные сценарии

- Открытие всех **пяти умений каждого героя через реальные три карточки**; XP ускоряется harness, затем способности действуют в настоящей Phaser Scene.
- Меню, оба героя/карты, keyboard movement, touch joystick при390×844, modal focus/1/2/3, pause/blur/resume.
- XP pickups, очереди уровней, смерти/сохранение двух рекордов/reload, результаты с ability damage и тремя типами kills.
- 10 run restarts + настоящий Scene restart: один Canvas, commands/snapshots/metrics по одному listener. Дополнительно три Warrior/Dark Forest restart сохраняют выбор и очищают damage/XP/skills.
- Новый босс, rusher/volatile предупреждения при **нулевой интенсивности косметики** — реальные screenshots desktop/mobile.
- Production: все четыре сочетания героя/карты реально атакуют и набирают очки; тестовый объект отсутствует, локальные ресурсы загружены, внешних запросов нет.

DEV fixtures ускоряют получение XP/встречу боссов и иногда задают большое HP мишеням для наблюдения эффектов. В production тестах таких подмен нет.

## FPS и ограниченные ресурсы

Финальный [phase2-browser-smoke.json](benchmarks/phase2-browser-smoke.json), измерение `2026-10-31T18:06:27.306Z`.

Windows x64, Node22.16, Playwright1.64.1, Chromium156.0.8078.4 headless,1280×720. AMD Ryzen5 7500F,12 logical cores,31.6GiB RAM; ANGLE/NVIDIA RTX4060/Direct3D11.

Fixture: игровая20-я минута,150 мобов **шести архетипов**,3 босса, умения III,5 эволюций, **цифры урона включены**, движущийся keyboard pilot, тестовая неуязвимость.60 ожиданий по1с + расходы автоматизации; игровое время60.881с.

| Метрика | Значение |
|---|---:|
| FPS min / median / average | **58.62 / 60.12 / 60.05** |
| Update median / p95 | **0.80 / 1.50мс** |
| Max sampled regular mobs | 150 |
| Max sampled bosses | 3 |
| Max sampled projectiles | 25 |
| Max sampled XP orbs | 240 |
| Max sampled chunks | 48 |
| Console/page/resource errors | **0** |

Существующие лимиты150/3/96/240/96 сохранены. Зоны делят общий бюджет24, цифры урона переиспользуются с cap24, запас спрайтов128. Проверяются expiry/cleanup и повторные запуски; новых uncontrolled timers/intervals нет. UpdateMs не включает полное время GPU rendering. Draw calls и отсутствие любой JS heap-утечки не заявляются: длительный heap profiling не проводился. FPS относится только к этому ПК.

## Реально полученные и просмотренные изображения

Использован локальный Playwright Chromium. PNG открывались через view_image, а не заменялись DOM snapshot.

- [Feedback/цифры](screenshots/13-feedback.png)
- [Warrior](screenshots/17-warrior.png), [его пять умений](screenshots/19-Warrior-five-skills.png)
- [Dark Forest / Mage](screenshots/18-Mage-dark.png), [Warrior mobile](screenshots/18-Warrior-dark.png)
- [Eclipse/rusher/volatile при intensity0](screenshots/19-telegraphs.png), [mobile](screenshots/19-telegraphs-mobile.png)
- [Подробная статистика](screenshots/19-statistics.png)
- [Production Warrior/Dark Forest desktop](screenshots/19-production-Warrior-dark-desktop.png), [mobile](screenshots/19-production-Warrior-dark-mobile.png)
- [Минутный стресс с цифрами](screenshots/19-stress.png)

Дополнительные изображения всех комбинаций и карточек лежат в screenshots/19-*.png. Проверялась различимость нового героя/биома, предупреждений над косметикой, счётчиков/таблицы и отсутствие горизонтального overflow.

## Исправления по результатам QA

- Runtime Phaser4 сохраняет `setTintFill()` в типах как compatibility stub с console.error. После строгого minute smoke вызов заменён на реальный `setTint(...).setTintMode(FILL)`. Ошибки консоли не фильтровались/не подавлялись; повторный полный run зелёный.
- Новые типы не должны обнулять историю v1: missing counters мигрируют нулями, детали новых run сохраняются в schema2 под прежним storage key. Исторический damage не выдумывается.
- Накопление мороза ограничено2, заморозка имеет immunity6с; области ограничены общим24; splash/secondary hits не запускают другие proc рекурсивно.
- Runner распознаёт уже работающий Pixel Survivor на5173 и не завершает его. Собственный preview4173 завершает после тестов. Другой сервис по совпавшему порту не убивает.
- Общая карточка скорости теперь явно говорит +13.5px/с: это одинаковая прибавка для двух разных базовых скоростей. Счётчик боссов результата включает Eclipse.

Нет отключённых тестов, подавления TypeScript или поднятия старых entity caps. Открытых функциональных блокеров не выявлено.

## Что остаётся непроверенным

- Физические iOS/Android, Safari/Firefox; mobile покрыт Chromium viewport и Pointer Events.
- Ручной полный15–20мин забег каждой сборкой и субъективный баланс эволюций. Автоматические pilots/accelerated simulation/60с stress не заменяют его.
- Длительный реальный heap/soak и субъективное прослушивание SFX.
- Первый reload без локального сервера/PWA не поддерживается; runtime остаётся локальным, без CDN/API/backend.
