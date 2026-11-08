# Rootbound Guardian — модель, анимации, общий projectile и тестовая дуэль

Дата: 2026-11-08.

Финальная принятая версия также удаляет все процедурные кольца/glow вокруг
Guardian, включая подготовку, cast/death обводки и финальных support.
После этой правки полный check834unit/102files/typecheck/lint/build и7целевых
Canvas E2E прошли; desktop/portrait/ritual screenshots без колец просмотрены:
screenshots/rootbound-guardian-no-rings/. Публикация в main явно запрошена пользователем.

Guardian заменён на выбранный Rootbound Arcane Totem. Все13idle и13cast кадров
из пользовательского art/guardian подключены в обычных волнах и финальном
ритуале. Вторая тестовая кнопка меню — «Бой с Хранителем», изолированная дуэль
с настоящим Guardian и штатным Mage54. Первая кнопка запускает Ash Warden.

## Исходники и импорт

- art/guardian/idle/pixellab-make-cracklight-lightninh-for--1794146212900.png/gif.
- art/guardian/cast/pixellab-make-energy-gathering-around-c-1794146274171.png/gif.
- Оба PNG512×512 содержат13native128 кадров и3пустые ячейки. Оба GIF —13×130ms.
- PNG RGB/alpha сохранены без resize, crop, квантования или перерисовки.
  GIF задаёт тайминги. У GIF палитровые RGB отличия; alpha всех26кадров совпадает
  с PNG. Непрозрачных пикселей на краю кадров и частичной alpha нет.
- Atlas: public/assets/hd/guardian.png/json,26frames1056×528,2230272RGBA bytes,
  PNG55671bytes. Все ячейки128×128 с padding2, общий pivot64,64.
- Builder: scripts/build-rootbound-guardian.mjs; прежний build-guardian-art.mjs
  вызывает его. Manifest: src/game/art/guardianManifest.json. SHA-256 четырёх
  оригиналов и отдельных кадров сохранены; повторная сборка трёх runtime файлов
  побайтно идентична. Proof: art/generated/rootbound-guardian-v1/reproduction.json,
  pixel-audit.json.

## Игровое отображение

Масштаб0.35 соответствует выбранному review model-b:44.8×44.8world для всех поз.
Idle идёт циклом1.69s. Реальный warning0.6s проигрывает cast0..5, выстрел включает
cast6, остаток6..12 идёт0.91s и возвращается в idle. Для ритуальных Guardian
сохранено0.65s warning. Попадание не сбрасывает каст; штатная hit-вспышка остаётся.
При смерти последняя новая поза затухает0.6s, без возврата к прежней модели;
обычная волна выдаёт артефакт немедленно.

У каждого owner свои visual clocks. Pause/upgrade и Ultimate freeze удерживают
кадр и возобновляют его без скачка. Действительный orbIndex/ритуальный выстрел
запускает release; фазовый переход без свободного projectile budget его не создаёт.
Нет новых timers, tweens, inputs, listener-ов, RNG или Vue обновлений на каждый кадр.

По уточнению пользователя Guardian использует принятые assets из
art/astral-revenant/projectile через уже загружаемый Astral atlas: static,
12flight и impact5..7. Поворот следует скорости, fast вариант визуально×1.2.
Процедурная сфера не дублирует новый sprite. Скорости, damage, steering, cooldown,
TTL, collision radius, caps и owner cleanup прежние; общий impact pool ограничен.
Исходники/atlas Astral не изменены и не дублируются.

## Дуэль из меню

startGuardianPractice использует общий preparePracticeMage: уровень54,200HP,
53законных улучшения, ледяная ульта и отсутствие тестовой неуязвимости.
Момент630s, один неподвижный Guardian на120,0. Regular/director/финальный босс
исключены. Его собственный AI работает; дальний отход/таймаут не удаляет цель
в practice. Обычные Guardian сохраняют стандартный leash/abandonment.

Победа/поражение, restart текущей дуэли и возврат к обычному забегу штатные.
Рекорды и localStorage не меняются, тренировочная победа не выдаёт artifacts,
XP или boss chests. HUD подписан «Корневой хранитель · 1×1», результат —
«ХРАНИТЕЛЬ ПОВЕРЖЕН». Блок обещания артефакта за волну скрыт в тренировке.
Актуальный menu E2E переименован из astral-practice.spec.ts в guardian-practice.spec.ts.

## Проверки

- npm.cmd run check: PASS,834unit/102files, typecheck/lint/build.
- После последних исправлений названий E2E отдельно typecheck/lint: PASS.
- guardian-practice.spec.ts + rootbound-guardian.spec.ts:10/10 PASS,52.5s.
  Обычные/burning сцены1280×720 и844×390, portrait390×844;13фаз тела,
  фактический выпуск slow/fast Astral homing, видимость sprite, impact,
  hit без сброса, pause/freeze/thaw, artifact/owner cleanup/death fade/restart,
  настоящие3ритуальных support, меню1280/844/740, keyboard/touch/gamepad,
  естественная победа, поражение, повторный бой и неизменный профиль.
- Guardian/HD регрессии:6/6 PASS,58.3s — encounter animation, elites/notice,
  HD integration и два stress сценария150regular+3boss+3Guardian.
- Production build на4175:9/9 PASS,36.4s, включая обе тренировочные кнопки
  без DEV harness, обычный забег, resize и controller-only shell.
- Stress15s: медиана59.13FPS/1.10ms sampled p95 update на1280,
  59.34FPS/1.70ms на390. Это конкретный локальный замер с invulnerability и
  повышенным HP врагов для постоянной нагрузки. Caps соблюдены; пять restart
  на каждом viewport дали одинаковые objects/textures/bytes/clock/listeners.
- Первый полный check, запущенный одновременно с browser прогоном, получил
 5s timeout существующего survival-enrage seed теста. Отдельный полный повтор
  прошёл без изменения теста или его timeout; финальный полный check также зелёный.
- Блокеров нет. git diff --check PASS. Push/deploy не выполнялись.

## Canvas evidence

screenshots/rootbound-guardian-v1/:85PNG, включая practice/production.png,
practice/menu-1280.png, practice/entry-canvas-740.png, cast/release/freeze/impact/
death на обеих картах, portrait-idle/reward и ritual casts. Четыре обычных
evidence.json и три menu evidence JSON фиксируют состояния/нулевые page errors.
Во всех четырёх art сценариях также проверены console errors,404 и Texture/Frame
warnings:0. Реальные PNG просмотрены: desktop cast/release, burning mobile fast
release, portrait idle/reward, обе кнопки меню и mobile practice Canvas.

Следующий шаг — художественная оценка игроком из кнопки «Бой с Хранителем».
