# Full Gamepad Support MVP — проверка и передача

Дата: 2026-11-04. Ветка: `feature/full-gamepad-support`, база `2fb3134`.
Статус: локальная реализация и автоматический QA завершены; остановка для физического теста.
Физические контроллеры в этой сессии не проверялись.

## Раскладка

| Действие | Xbox / standard index | PlayStation |
|---|---|---|
| Аналоговое движение | Left stick, axes 0/1 | Левый стик |
| Warrior Dash / Mage Blink | X, button 2 | Square |
| Меню / выбор поля настроек | D-Pad, 12/13/14/15 | D-Pad |
| Подтверждение / улучшение | A, button 0 | Cross |
| Карточка назад / вперёд | LB/RB, buttons 4/5 | L1/R1 |
| Карточка влево / вправо | D-Pad 14/15 | D-Pad |
| Изменить слайдер | D-Pad Left/Right | D-Pad |
| Пауза / продолжить | Start, button 9 | Options |
| Ничего | B, button 1; Y, button 3; RT и остальные | Circle, Triangle и остальные |

UI использует стандартные обозначения A/X/LB/RB/Start независимо от имени
устройства. В меню LB/RB также переключают фокус назад/вперёд. D-Pad и кнопки
работают на новое нажатие, без автоповтора. B не возвращает назад: используйте
видимую кнопку «Назад», «Готово» или «В главное меню» через D-Pad + A.

WASD/стрелки, Space, мышь, touch, 1/2/3, Enter и Tab/Shift+Tab сохранены.
Space никогда не подтверждает карту. Приоритет движения: ненулевая клавиатура,
затем touch, затем стик. Deadzone 0.19, оставшаяся амплитуда линейно масштабируется.
Через Level Up стик сохраняется; после blur, обычной паузы и рестарта сначала
верните стик в центр. Удержанные кнопки требуют отпускания и нового нажатия.

## Изменённые файлы

- `src/game/input/GamepadInputController.ts` — mapping, опрос, hotplug, edges,
  фокус/visibility, neutral gate, lifecycle.
- `src/game/input/movement.ts` — deadzone, аналоговый контракт, приоритет источников.
- `src/game/bootstrap/createGame.ts` — явное отключение второго Phaser poller.
- `src/game/scenes/GameScene.ts` — опрос в существующем update, маршрутизация,
  направление X, lifecycle, сообщения об активном источнике.
- `src/game/systems/World.ts` — величина аналогового ввода в общей модели движения.
- `src/game/events/bridge.ts` — типизированные UI/device/connection channels.
- `src/ui/gamepadNavigation.ts`, `src/ui/inputDevice.ts` — прямые callbacks/focus,
  доступ к реактивному типу устройства.
- `src/App.vue` — shell navigation, уведомление 4s, фокус экрана, обновление подсказок.
- `src/ui/components/MainMenu.vue`, `SettingsPanel.vue`, `DialogFrame.vue` —
  доступные цели навигации, настройка слайдеров, начальный фокус.
- `src/ui/components/LevelUpModal.vue` — A/навигация через существующий choose
  и неизменённый UpgradeConfirmation (200ms), блокировка ввода при анимации.
- `src/ui/components/GameHUD.vue`, `MobilityControl.vue`, `src/style.css` —
  контекстные подсказки, заметный focus, уведомление вне центра персонажа.
- `tests/unit/gamepad.test.ts`, `tests/helpers/gamepad.ts`,
  `tests/e2e/gamepad.spec.ts`, `gamepad-performance.spec.ts`, `production.spec.ts`.
- `README.md`; локальные `docs/DECISIONS.md`, `PROGRESS.md`, `TEST_REPORT.md`, этот отчёт.

HeldInputTracker, VirtualJoystick, UpgradeConfirmation и MobilitySystem изучены
и сохранены. Конфиги баланса, способности, HP, AI, Enrage и Guardian не изменялись.

## Автотесты

9 новых unit/integration: радиальная deadzone, аналоговая скорость и диагонали,
старые digital/touch в World, приоритет, button edges, удержание X, свежая A,
неназначенные кнопки, навигационные команды, сохранение стика в upgrade,
очистка blur/disconnect/hidden/restart, один активный index, неверная раскладка
и ошибки API, идемпотентное снятие подписок за 10 lifecycle.

17 новых функциональных E2E + 2 нагрузочных + 2 production smoke.
Mock устанавливается до загрузки приложения, заменяет navigator.getGamepads
и connection events; при каждом опросе выдаёт новый объект. Вся обработка ввода,
Phaser/Vue/World, 200ms анимация и проверки первого resumed frame — настоящие.
В функциональном тесте подготавливаются XP и тихая арена; смерть вызывается
реальным контактом обычного врага при тестовом HP=1. Методы мобильности и
выбора upgrade в обход input не вызываются. В production нет __PIXEL__ hook.

Blur/hidden в headless доставляются управляемыми `blur`/`focus`/`visibilitychange`
через настоящие обработчики Phaser/controller; это не trusted OS/tab switch.
Проверка реального переключения окна и USB/Bluetooth входит в ручной сценарий.
После клика по неинтерактивной области модалки A сначала восстанавливает
видимый focus, следующая новая A выбирает карточку. Малейший выход из deadzone
переключает подсказки на геймпад.

Покрыты два размера, оба героя/карты, все меню, sliders/checkbox,
Dash/Blink, неактивные B/Y/RT, A до открытия окна и через два offers,
D-Pad/LB/RB, Start внутри upgrade/настроек, held/changed/released stick,
отпускание в 200ms анимации, keyboard priority при активном pad и touch,
disconnect в движении/upgrade, blur/hidden, десять run + десять scene restarts,
стабильные listeners/bridge/resources, прямой DESTROY, возврат фокуса и подсказки.

## Результаты

- Первый `npm.cmd run check`: **475/475**, 58 файлов, typecheck/lint/build exit 0.
- Первый целевой E2E: **16/16**; затем расширен проверкой фокуса и performance.
- Полный последовательный прогон остановлен после 132 выполненных тестов:
  131 прошёл, новый desktop performance fixture потерял одного Guardian из-за
  выхода полноскоростного пилота/Blink за настоящий leash. Сохранены assertions
  150+3+3; тестовый стик ограничен амплитудой 0.5 для удержания нагрузки.
  Игровые leash, баланс и application source не изменялись. Повтор двух размеров
  три раза: **6/6**, 1 worker. Снимки изолированных замеров сохранены отдельно
  в `docs/gamepad/isolated-performance-{1280,390}.json`. Финальный полный набор
  прошёл с `--workers=2`, без пропуска тестов; performance оценивается
  по изолированному запуску, а не конкурентному прогону.
- Финальные обязательные прогоны, Node22.16.0/npm10.9.2, все exit0:
  - `npm.cmd run check`: **475/475**, 58 файлов, строгие typecheck/lint/build.
  - `npm.cmd run test:e2e -- --workers=2`: **251/251**, **26.6min**.
  - `npm.cmd run test:e2e:production`: **6/6**, **37.8s**.
  - `git diff --check`: **0**. Skipped/flaky/unexpected: **0**.
  - SHA256 всех **252** файлов `src/` и `tests/` до/после QA совпали.
  - `npm.cmd run test:e2e -- gamepad-performance.spec.ts --repeat-each=3`:
    **6/6**, **1.3min**, один worker, без снижения assertions.
  Логи: `docs/gamepad-check.log`, `gamepad-e2e-final.log`, `gamepad-production.log`,
  `gamepad-performance-repeat.log`; manifest: `gamepad-final-source-hashes.json`.
- Тест переключения устройств выявил неверный момент возврата фокуса после
  настроек: исправлен `flush: post`, два повтора меню/фокуса прошли 6/6.
  Просмотр PNG выявил невидимый начальный restart на мобильном экране смерти:
  добавлен scrollIntoView и assertion toBeInViewport. Первый полный прогон
  остановлен для этой правки; финальный прошёл на неизменяемом коде.
- Первое измерение под 150 mixed + 3 boss + 3 Guardian, Mage пять способностей V:
  desktop median FPS **58.99**, mobile **59.19**, sampled p95 Scene.update **1.0/1.2ms**,
  p95 gamepad.poll **0.10ms** на обоих. Это Chromium на данном компьютере,
  тестовое invulnerability/HP удерживает нагрузку; не обещание FPS на телефоне.
- Финальное изолированное измерение (последний из 3 повторов каждого размера):
  desktop median FPS **59.03**, mobile **59.45**, sampled p95 Scene.update
  **1.1/1.1ms**, p95 gamepad.poll **0.10ms** на обоих. Raw JSON сохранены
  в `docs/gamepad/isolated-performance-{1280,390}.json`. Конкурентный полный
  прогон проверяет корректность, эти FPS взяты из отдельного запуска.
- Реальные Canvas PNG просмотрены: `screenshots/gamepad/1280-upgrade.png`,
  `390-upgrade.png`, `390-playing.png`, `390-death.png`, `1280-load.png`,
  `1280-production.png`, `390-production.png`. Остальные артефакты в той же папке:
  menu/playing/death/load/production и JSON performance/restarts.

## Ограничения и ручная проверка

Нужен браузер с Gamepad API, HTTPS или localhost, доступ API по permissions
policy и `mapping: standard`. Браузер может скрывать подключённое устройство
до первого нажатия. USB/Bluetooth, драйвер ОС и remapping браузера должны быть
проверены физически. Нестандартные mappings и неполные оси/кнопки отклоняются
уведомлением без падения; после SecurityError требуется исправить доступ
и перезагрузить страницу. Один активный pad; второй не управляет вторым игроком.

Звук зависит от autoplay policy браузера: gamepad input не всегда считается
user activation для AudioContext. Попытка resume есть один раз за scene lifetime,
pending promises не множатся каждым аналоговым отсчётом; игра при блокировке
звука продолжается. Разрешение autoplay — настройка пользователя, код её не меняет.
Mock не доказывает физическую совместимость Xbox/PlayStation или доступность звука.
Справка: [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API),
[secure context / permissions policy](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getGamepads).

1. Запустить `npm.cmd run dev`, открыть localhost. Подключить Xbox или PlayStation
   USB/Bluetooth и нажать кнопку; проверить временное уведомление у нижнего края.
2. Только D-Pad и A/Cross: выбрать Mage/Warrior, Grove/Dark Forest, открыть настройки,
   изменить громкость Left/Right, checkbox кнопкой A, закрыть «Готово»; посетить
   рекорды и помощь, затем запустить забег.
3. Проверить медленное/полное отклонение, круг стиком и диагонали. X/Square — один
   Dash/Blink на нажатие, при удержании после cooldown повторов нет. Отпустить
   стик и нажать X: используется последнее направление. RT/A/B/Y не дают манёвр.
4. Дождаться Level Up, удерживая стик. Переключить D-Pad Left/Right и LB/RB;
   нажать A, после 200ms движение сразу продолжается. Повторить, изменив направление
   в окне, затем отпустив стик в окне. Мир за окном должен оставаться неподвижным.
5. Удерживать A до появления Level Up: карта не выбирается до нового нажатия.
   Удерживать X при выборе A: после закрытия не должно быть Dash/Blink. B/X/Y/Start
   в окне не выбирают улучшение и не закрывают его.
6. Start/Options — пауза; Start или A на «Продолжить» — продолжение. Отцентрировать
   стик, затем двигаться. В паузе посетить настройки и вернуться через «Готово».
7. Отключить геймпад в движении и в Level Up; проверить остановку и WASD/1/2/3.
   Подключить снова, отцентрировать стик и продолжить. Потерять фокус браузера,
   вернуться, продолжить вручную: старое движение/нажатия не должны вернуться.
8. Доиграть до смерти, выбрать «Начать заново» кнопкой A. Повторить 10 раз,
   включая возврат в главное меню. Проверить выделение и отсутствие старых действий.

После автоматического QA работа останавливается для этого пользовательского теста.
Push, merge и deploy не выполняются. Документы/скриншоты локальны по .gitignore.
После последующего запроса «пуш в мейн» работа сохранена commit `4289bd7`,
main обновлена fast-forward и отправлена в origin/main без force. SHA удалённой
ветки подтверждена ls-remote; дерево чистое. Переключение веток поменяло только
LF→CRLF в10файлах, что отдельно подтверждено нормализованными QA SHA256.
