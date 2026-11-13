# Mage Fireball — native forming/idle/collide и первый размер

Дата: 2026-11-08. Масштаб с прокачкой отложен по запросу пользователя.

Подключены art/main-hero-mage/abilities/fireball/fireball-forming, fireball-idle
и fireball-explosion. Последний файл — запрошенный collide. Все9исходных PNG/GIF/
JSON сохранены без изменения. PNG задаёт RGBA, JSON — кадры/pivot/точные ms;
GIF остаётся исходным preview, не используется как источник квантованных цветов.

Builder scripts/build-mage-fireball.mjs сохраняет48native кадров без resize,
crop по силуэту или перерисовки. Source forming91×32/pivot63,17; idle74×28/
pivot63,15; explosion80×78/pivot39,39. Все помещены в прозрачный112×84canvas
с общей точкой65,42, atlas padding2. Никакой подгонки отдельных кадров нет.
Atlas public/assets/hd/mage-fireball-v1/:928×528,1959936RGBA bytes,PNG15386bytes.
SHA-256 sources/frames — src/game/art/fireballManifest.json и
art/generated/mage-fireball-v1/pixel-audit.json. Три runtime файла после rebuild
побайтно идентичны; proof рядом в reproduction.json. measurements.json содержит
точные alpha bounds каждого source кадра и размер при scale0.5.

Первая версия использует один scale0.5 на всех рангах и при эволюции: общая
прозрачная рамка56×42world, видимый idle максимум34×11, collide максимум36×25.
Это базовый размер для пользовательского просмотра. Рангового увеличения нет.

Формирование проигрывает все24source позы с ускорением×6 за0.2s на старте уже
летящего projectile. Существующий запуск, cadence и скорость270 сохраняются.
После него idle12frames циклом0.996s. Реальный collision создаёт однократный
explosion12frames/0.852s на позиции попадания, с направлением исходного выстрела.
Общий pivot исключает скачок головы при смене forming→idle и смещение взрыва.

Урон, радиусы, количество снарядов, pierce, эволюционный AOE и RNG прежние.
Новый fireball-impact получает cosmeticSerial, использует effectCap96 и общий
effect pool. Пробивающий снаряд создаёт collide при каждом реальном hit;
Miss/TTL не порождают фальшивое попадание. На pause/upgrade World.elapsed
стоит, эффекты не продвигаются. clearTemporaryState/death очищает их, собственный
sprite pool FireballArt освобождается со сценой. Нет новых timers/listeners/tweens.

Старый Graphics хвост/capstone halo Fireball удалены. Старый служебный meteor
эволюции помечен source fireball и не рисует второе кольцо поверх native collide;
сам эволюционный урон сохранён. Остальные spells и герой/руки прежние.

Изменены GameArt preload/entity selection/render/teardown/diagnostics,
assetRegistry, MageMagic/CombatFeedback, Effect type и World collision/cleanup.
Добавлены FireballArt/fireballPack/manifest/builder и unit/Canvas E2E. Старые
ранговые тесты Graphics обновлены под фиксированный native размер, сохраняя
проверки velocity/damage/pierce и отсутствия побочных записей в simulation.

Проверено:

- npm.cmd run check PASS:842unit/103files, typecheck/lint/build.
- Целевые browser scenarios7/7 PASS(37.4s): четыре native Fireball при rank1/5
  на1280×720 и844×390, camera Fireball I/III/V/evolved, HD integration и4restart.
- Нагрузочные два сценария150regular+3boss+3Guardian PASS, плюс повтор четырёх
  native Fireball:6/6 PASS(57.1s). За15s медиана59.15FPS/1.20ms sampled p95 update
  на1280,59.30FPS/1.00ms на390. HP/invulnerability изменены только в stress fixture.
  Caps и5restart/viewport без роста ресурсов проверены.
- Production4176:9/9 PASS(40.2s), включая обычные забеги и обе тренировки меню,
  resize, controller-only UI, отсутствие внешних requests и ошибок.
- Финальная native матрица после расположения review targets:4/4 PASS(23.0s).
- Повторная сборка трёх outputs byte-identical;9sources unchanged. git diff --check PASS.
- Ранний camera прогон на уже работавшем HMR server завис в старом scene hook;
  прерван после двух timeout. Повтор Fireball/HD на отдельном dev server5176
  прошёл без изменения hook или увеличения timeout. Геометрия камеры не менялась.

Canvas evidence: screenshots/mage-fireball-v1/, native forming/start/flight,
collision/flare/smoke, reverse/down, portrait; четыре evidence.json содержат
состояния и нулевые errors/404/Texture warnings. Также screenshots/camera-fireball-cleanup/
содержит I/III/V/evolved детали. Выбранные настоящие desktop/mobile PNG открыты
и просмотрены. Финальная review fixture приближает target, чтобы explosion
целиком помещался в landscape viewport; portrait flight снят ближе к запуску.

Следующий шаг — пользовательская оценка базового размера. Только после неё
согласовать рост от прокачки. Commit/push/deploy не выполнялись.
