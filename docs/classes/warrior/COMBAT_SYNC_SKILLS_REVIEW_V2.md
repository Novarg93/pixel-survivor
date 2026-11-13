# Warrior — слеш, ускорение, приоритет Charge и приёмка навыков v2

## Изменение в игре

Пользователь сообщил о несинхронном слеше и попросил ускорить обычные атаки,
прерывать их при Charge и собрать все проекции навыков для приёмки.

Причина слеша: кроме скрытого HD crescent, в CombatFeedback/WarriorMagic оставался
процедурный Cleave, работающий от короткого World.effect независимо от очереди body.
Теперь GameArt передаёт CombatFeedback точную фазу текущего WarriorHeroAnimation.
Слеш виден только в трёх кадрах вокруг impactFrame принятого взмаха. При ожидании,
возврате в стойку и рывке явный null запрещает прежнее рисование по World.effect.
Архивные самостоятельные обзоры сохраняют прежнее поведение через optional-аргумент.

Автоатаки: 75→60мс/кадр, скорость1.25×; C1/C3 длительность780мс, Heavy1020мс.
Ни один исходный кадр не удалён. Idle120мс и Run75мс сохранены.
Урон, cooldown, движение, диапазоны попадания и баланс World не менялись.
Урон всё ещё рассчитывается существующей механикой; эта правка синхронизирует визуальный
слеш с телом, не переносит урон на новую задержку.

При смене Mobility.sequence активная и ожидающая автоатаки отменяются.
Во время настоящего рывка180мс играет старый принятый gesture-charge (9×20мс).
События обычного удара до конца рывка не возобновляют отменённую анимацию.
Пауза замораживает Charge и слеш, свежий run сбрасывает оба канала.
Старый Charge временно используется и для северных направлений с теми же зеркалами;
новые северные Charge-кадры пока только в демке на приёмке.

Runtime manifest: `src/game/art/warriorHeroManifest.json` v2, 127 оригинальных RGBA-кадров /
147 playback-ссылок. Старые пять atlas-страниц byte-identical. Новая шестая — только9
старых Charge-кадров, PNG+JSON26386байт. Сборщик/верификатор обновлены воспроизводимо.

## Демка навыков

`art/generated/warrior-skills-directions-review-v2/viewer.html`

Шесть навыков: Cleave A, пользовательский Whirlwind, Ground Stomp, Shield Block,
старые физическое копьё и Charge. Все шесть принятых front-источников сохранены.
Сгенерированы по одной северной пробе на навык от правильной ячейки№4 из
`art/warrior/8-proections.png`. First=Last, PixMiniMax/Enhance/12/Low top-down/
north-east/transparent; полные args, фактический Enhance, seed/job и receipts сохранены.
Шесть заданий успешны с первой попытки, 78 PNG, стоимость6.30generations.

N/NE напрямую, NW зеркально. S/E/SE напрямую front, W/SW зеркально front.
Всего12 клипов /152 body-кадра /48 сочетаний. По выбранному навыку показаны сразу8
проекций; есть сравнение всех48, покадровый шаг, scrub/pause/speed/zoom/background,
PNG-листы и исходники, параметры генерации, optional crack/Charge displacement/legacyVFX.
Трещина повторно использует прежний программный рисунок и появляется на приземлении.
Демка открывается offline/file://. Старые южные копьё/Charge не заменены новыми пробами.
Новый северный Throw стартует из нейтральной стойки; форму и выпуск копья оценить отдельно.

Poolv10 содержит pendingNorthReview новой серии. Неверная прежняя северная серия
архивирована и остаётся приостановленной. Registry42 byte-identical: новые северные
навыки НЕ приняты и не подключены в игру. Все новые промпты добавлены в журнал как
пробы. Эталон Whirlwind и его пользовательский рецепт сохранены.

## Проверки

- Runtime RGBA verifier PASS:127 кадров,147 ссылок, SHA6страниц, атакующие60мс и Charge180мс.
- Source verifier PASS:152 raw↔atlas↔nativePNG↔mirrorPNG, исходные front provenance/padding,
  все78 входных/generated северных кадров, first-frame=cell4, clipping0, registry unchanged.
- `npm run check` PASS: typecheck/lint,156 файлов /1131 unit tests, build; exit0.
  Лог `.tmp/warrior-combat-sync-v2-check.log`. Существующее предупреждение о больших Vite chunks.
- DEV E2E3/3 PASS: реальный Cleave/слеш на взмахе, Space прерывает удар и показывает старый
  Charge, freeze/resume без replay,8 movement directions,3 атаки до конца, restart/listeners/textures.
  `.tmp/warrior-combat-sync-v2-e2e-final.log`.
- Production E2E8/8 PASS,48.8с, exit0: Mage/Warrior, убийства, pause/resize, controller1280/390,
  отсутствие dev hook/внешних ресурсов, ровно6локальных warrior atlas-страниц.
  `.tmp/warrior-combat-sync-v2-production.log`.
- Viewer browser PASS:48 сочетаний, все152 кадра, реальный CanvasN=NE/NWmirror для6навыков,
  pause byte-freeze, step75мс,48cards,390px,PNG/source links,file://,cleanup,JS/HTTP errors0.
  `.tmp/warrior-skills-directions-v2-browser.log`; `validation.json` внутри демки.
- Scope:7 изменённых presentation-файлов,2 новых atlas-файла;421 другой runtime файл byte-identical,
  включая весь combat/balance/audio. Прежние proofs сохранены; guard-тесты учитывают точный
  SHA отдельной новой разрешённой интеграции. Зависимости и lockfile не менялись.
- Настоящие игровые Canvas PNG просмотрены: `screenshots/warrior-combat-sync-v2/`.
  Overlay паузы скрыт только тестовым CSS при фотографировании; внутри игры не меняется.
  Покадровые выборки — `interrupt-evidence.json`. Демо PNG desktop/mobile и все6 контактов
  просмотрены: `art/generated/warrior-skills-directions-review-v2/screenshots/`.

Блокеров нет. Следующий шаг — выбор пользователем новых северных навыков; до этого их
в runtime не подключать. Done-маркеры, commit, push и deployment не делались.
