# Fire Ultimate — Living Inferno

Следующая итерация увеличила радиус82→164 и скрыла оболочки щитов во время огня: [актуальный отчёт и кадры](../fire-radius/REVIEW.md). Ниже — отчёт исходного реворка; автоматические кадры Fire timeline обновляются последующими прогонами.

2026-11-05, main. Текущий результат предназначен для ручной визуальной приёмки.

## Поведение

Сохранены 10 секунд действия, радиус82, периодический урон62 раз в0.5s, лимит24%HP боссов/Guardian за активацию и существующий ограниченный след. Новая защита сжигает вражеские пули и оба типа Guardian orb при первом пересечении ауры. Учитывается вся траектория за кадр, включая быстрый пролёт насквозь; точка сгорания находится на поверхности контакта. Радиус столкновения82 + физический радиус снаряда3/5/6. Дружественные снаряды продолжают полёт. Нет общей неуязвимости, защиты от melee или ударов по земле.

Кольцо удалено. Мягкая исходная текстура света128×128, четыре Graphics и одно Image дают жёлтое ядро/оранжевый falloff, живое пламя тела, лёгкие восходящие тепловые линии, поджог целей и короткие хлопки от сгоревших снарядов. Верх Mage и руки остаются читаемыми: огонь спереди ниже рук, голова не перекрывается; HP выше огня. Heat haze — лёгкая визуальная имитация без shader/refraction. След вторичен. Fade0.4s — только презентация после прекращения механики.

Отдельный ignition и тихий roar используют существующие SFX/master/mute. Roar — один loop с gain0.11, суммарно не более трёх loops вместе с музыкой и окружением. Короткое сгорание ограничено одним запросом в0.16s. Остальные PCM сохранены побитово; fixture взята до правок Fire.

World.elapsed управляет длительностью и затуханием; Pause/LevelUp останавливают время. Intensity0 скрывает VFX; reduced motion/flash уменьшает движение и пик ignition. Нет новых timers/listeners/RAF в runtime, отдельных объектов на огни/врагов, модификации tint/alpha Mage или полноэкранного фильтра. Максимум24 записи сгорания и156 ignite-записей. Текстура удаляется при shutdown, состояния очищаются при death/restart.

## Реальные кадры

Для каждого viewport1280×720 и844×390:

| Этап | Desktop | Mobile landscape |
|---|---|---|
| До, старый визуал | [до](../../screenshots/fire-inferno/before/02-form-1280.png) | [до](../../screenshots/fire-inferno/before/02-form-844.png) |
| До активации | [кадр](../../screenshots/fire-inferno/after/00-before-1280.png) | [кадр](../../screenshots/fire-inferno/after/00-before-844.png) |
| Ignition | [кадр](../../screenshots/fire-inferno/after/01-ignition-1280.png) | [кадр](../../screenshots/fire-inferno/after/01-ignition-844.png) |
| Форма, свет, поджог | [кадр](../../screenshots/fire-inferno/after/02-form-ground-burn-1280.png) | [кадр](../../screenshots/fire-inferno/after/02-form-ground-burn-844.png) |
| Жар | [кадр](../../screenshots/fire-inferno/after/04-heat-1280.png) | [кадр](../../screenshots/fire-inferno/after/04-heat-844.png) |
| Пули до контакта | [кадр](../../screenshots/fire-inferno/after/absorption-0-1280.png) | [кадр](../../screenshots/fire-inferno/after/absorption-0-844.png) |
| Пули сгорают | [кадр](../../screenshots/fire-inferno/after/absorption-1-1280.png) | [кадр](../../screenshots/fire-inferno/after/absorption-1-844.png) |
| HP, HUD и руки во время каста | [кадр](../../screenshots/fire-inferno/after/ui-casting-1280.png) | [кадр](../../screenshots/fire-inferno/after/ui-casting-844.png) |
| Fade | [кадр](../../screenshots/fire-inferno/after/08-fade-1280.png) | [кадр](../../screenshots/fire-inferno/after/08-fade-844.png) |
| Всё погасло | [кадр](../../screenshots/fire-inferno/after/09-clear-1280.png) | [кадр](../../screenshots/fire-inferno/after/09-clear-844.png) |
| Нагрузка150+3+3 | [кадр](../../screenshots/fire-inferno/after/stress-1280.png) | [кадр](../../screenshots/fire-inferno/after/stress-844.png) |

Все кадры — реальный Phaser Canvas; UI-кадры — браузерный screenshot с HUD. Полные10.55s последовательности записаны без перемотки World. Дополнительные видео: screenshots/fire-inferno/videos/. JSON по кадрам: timeline-1280.json / timeline-844.json. Режим уменьшенных эффектов: after/reduced-effects-1280.png. Артефакты локальные, Git их не включает.

## Проверки

- Целевые Fire E2E6/6: keyboard/touch/gamepad, фазы, урон рядом, сгорание пули без потери HP/Absorb, expiry, audio, reduced,10restarts, объектные/listener/timer бюджеты, нагрузка150+3+3 и protected PCM.
- Unit Fire8 + audio loop1; весь `npm run check`:70 файлов,558 тестов, typecheck/lint/build — exit0.
- В отдельном последовательном нагрузочном прогоне оба viewport ≈60FPS до и во время Fire; p95 frame16.8–16.9ms. Это проверка Chromium с mobile viewport, не физического телефона.
- Полный `npm.cmd run test:e2e -- --workers=3 --reporter=list`:335/335 за20.8min,exit0. Все прежние тесты сохранены.
- `npm.cmd run test:e2e:production -- --workers=1 --reporter=list`:7/7 за35.1s,exit0.
- Существующий stress с настоящим уроном, всеми rankV и высоким CDR:150+3+3 сохранены; median59.88FPS, p9516.7ms на desktop/mobile; tablet p9516.8ms. Данные: docs/ultimates/performance/fire-{1280,844,1024}.json. Наряду с этим новый сравнительный render harness фиксирует одинаковую плотность, запрещая смерть врагов.
- SHA256342 исходников/тестов/скриптов/ассетов не изменились за полный прогон;68 защищённых файлов идентичны исходной принятой версии. `git diff --check`:exit0. Логи: check.log, e2e-full.log, e2e-production.log; verification.json / scope.json / frozen-source-check.json.

Проверки завершены. Блокеров нет. Работа остановлена для ручной приёмки; push/deploy/commit/новых веток не выполнялось.

Для ручной проверки открыть http://127.0.0.1:5185/ и выбрать DEV-кнопку «Погребальное Пламя», затем Q / Y / touch. Проверить ощущения движения, поджог, сгорание входящих снарядов и затухание. Lightning/Frost не переработаны. Новых веток, push и deploy нет.
