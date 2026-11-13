# Удержание движения через Level-Up

Ветка `fix/held-movement-levelup`, 2026-11-03. Предыдущая работа Endgame Enrage II
сохранена локальным checkpoint `e87a06c` после успешного check (462 теста)
и сверки 42 SHA из предыдущего отчёта. Push, merge и deploy не выполнялись.

## Первопричина и воспроизведение

Перед изменениями игровой логики Playwright воспроизвёл оба варианта:

| Сценарий | Старый код после подтверждения |
| --- | --- |
| W нажат внутри окна прокачки | y остаётся 0, движения нет |
| D удерживается до получения уровня | x остаётся 20.009367, движения нет |

Оба теста завершились ожидаемым падением по реальным координатам World,
а не состоянию DOM: [baseline.log](baseline.log).

В `LevelUpModal.vue` keydown и keyup останавливают всплытие. Phaser 4.2.1
слушает клавиатуру на window в bubble-фазе и не видит эти события.
Дополнительно обработчик команды upgrade в GameScene вызывает resetKeys(),
сбрасывая и клавишу, удерживаемую ещё до открытия модального окна.

## Исправление

- `src/game/input/HeldInputTracker.ts`: один источник физического состояния
  WASD и стрелок, два capture-listener на window. Keyup учитывается независимо
  от текущего UI-состояния. Синтетические нажатия и отдельный polling отсутствуют.
- `src/game/scenes/GameScene.ts`: движение читается из трекера, а нормализация
  по-прежнему выполняется один раз в World после добавления touch-ввода.
  Команда upgrade сохраняет движение, но очищает запрос мобильности и touch.
  Phaser resetKeys() сохранён для action-ввода.
- Blur, скрытие вкладки, pause, menu, смерть, restart и shutdown очищают трекер.
  Отдельно обработан Phaser DESTROY, который может прийти без SHUTDOWN.
  Автоповтор после очистки не возрождает старое нажатие.
- Vue-карточки, 1/2/3, Enter, Tab/Shift+Tab, Space guard, 200-мс подтверждение,
  скорость персонажа и механики Dash/Blink сохранены.

## Проверки

Добавлены 4 unit-теста и 20 Playwright E2E в `tests/unit/held-input.test.ts`
и `tests/e2e/held-movement.spec.ts`. E2E проверяют:

- W внутри окна и D до уровня без повторного keydown;
- актуальный keyup в модальном окне и во время анимации подтверждения;
- фактический input (0, -1) в первом возобновлённом кадре World;
- W+D с прежней физической скоростью, все четыре стрелки и A/S;
- Space без выбора карточки и отложенного Blink/Dash;
- три последовательных предложения улучшений;
- pause/menu/death/restart, blur/focus, visibilitychange;
- десять рестартов без роста window/bridge listeners;
- прямое удаление Phaser-сцены: трекер пуст и больше не принимает события.

Целевой набор Level-Up/mobility/held-input прошёл 36/36 до добавления отдельной
проверки DESTROY; последняя отдельно прошла 1/1.
`npm.cmd run check`: 466/466, 57 файлов, TypeScript/lint/build, exit 0.
`npm.cmd run test:e2e:production`: 4/4, exit 0 (30.2 с).
Финальный `npm.cmd run test:e2e -- --workers=4`: 232/232 за 15.1 минуты,
exit 0; skipped/unexpected/flaky = 0. Все 20 новых E2E прошли.
`git diff --check`: exit 0. Пять финальных SHA не изменились за время прогона;
все 42 файла из предыдущего Enrage-манифеста также сохранили прежние SHA.

| Проверка | Результат | Лог / данные |
| --- | --- | --- |
| Check (типы, lint, unit, build) | 466/466, exit 0 | [лог](check-final.log) |
| Полный E2E, финальный повтор | 232/232, exit 0 | [лог](full-final.log), [JSON](full-final.json) |
| Production E2E | 4/4, exit 0 | [лог](production.log), [JSON](production.json) |
| Warrior, три повтора каждой карты | 6/6, exit 0 | [лог](warrior-repeat.log) |
| Настоящий tab switch | trusted blur/focus, без залипания, exit 0 | [JSON](real-blur.json) |

Первый полный прогон (231/232 за 15.2 минуты) обнаружил таймаут существующего `hd-warrior.spec.ts`:
после прямого World.resume тест ждёт только 80 мс, а Vue наблюдает World
через снимки раз в 100 мс. Escape мог увидеть старое paused и отправить resume,
поэтому кнопка настроек не появлялась. В тест добавлены ожидание исчезновения
диалога и явная проверка pause после Escape. Проверки анимаций, слоёв, урона,
очистки эффектов и frozen World не изменены; таймауты не увеличены.
Обе карты прошли три повторения: 6/6 ([лог](warrior-repeat.log)), затем финальный
полный прогон 232/232 на пяти исходных файлах из SOURCE.json.

Изменённые файлы: HeldInputTracker.ts, GameScene.ts, held-input.test.ts,
held-movement.spec.ts и синхронизация существующего hd-warrior.spec.ts.
Локальные документы: этот отчёт, docs/PROGRESS.md, docs/DECISIONS.md и
docs/TEST_REPORT.md. Docs/screenshots исключены из Git по прежнему .gitignore.

Реальный Playwright PNG [после удержанного W](../../screenshots/held-input/after-held-w.png)
открыт и осмотрен: Phaser Canvas и HUD отображаются корректно.
Также открыт [мобильный кадр подтверждения](../../screenshots/frost-audio-levelup/selected-390.png)
390×844: прежняя вёрстка карточек и выделение сохранены.
[Координаты до/после](../../screenshots/held-input/A.json) записываются сценарием A.
Исходные SHA для финального запуска: [SOURCE.json](SOURCE.json).

## Ограничения проверки

Playwright принудительно включает focus emulation для управляемых страниц:
обычная смена вкладки в стандартном runner не доставляет window blur.
Поэтому E2E подаёт управляемый сигнал blur/focus в существующий обработчик
Phaser; visibilitychange проверяется отдельным управляемым сигналом hidden.
Клавиатура во всех E2E использует Playwright keyboard, а движение проверяется
по World.

Дополнительно пройден настоящий tab switch в оконном Chromium через CDP
`noDefaults: true`, без эмуляции фокуса и без dispatchEvent. События blur/focus
имеют `isTrusted: true`, World перешёл в paused; после resume автоповтор D
не сдвинул координаты (x = 6.7455), а новый физический press сдвинул x до 15.7311.
Mobility sequence остался 0. [Raw JSON](real-blur.json), [лог](real-blur.log),
[PNG](real-blur.png), exit 0. Для этой проверки использовался software Canvas,
её результаты не являются измерением производительности.

Известное предупреждение сборки о размере Phaser chunk сохранено.
Следующий шаг: ручная проверка пользователем на http://127.0.0.1:5173/,
после обновления страницы и старта нового забега. Работа остановлена для этой
проверки; Task.done не создавался, публикация не выполнялась.
