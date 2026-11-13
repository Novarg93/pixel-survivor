# Mage Blink V1 — интеграция принятой пары PixelLab — 2026-11-09

Пользователь принял [art-preview](../../art/generated/mage-blink-v1/viewer.html)
и поручил включить его в игру вместе с casting по направлению Blink.
Подключены точные departure A / arrival B из этого preview, без новой генерации.

## Поведение и представление

- Телепорт остаётся мгновенным. MobilitySystem, cooldown, protection, damage,
  viewport clamp, upgrades и World/RNG не изменялись.
- Оба VFX стартуют одновременно в `mobility.from` / `mobility.to`. Точки
  неподвижны, даже если маг продолжает бежать. В каждом эффекте8×40мс=320мс;
  последний кадр пустой, поэтому изображения скрываются с280мс.
- MageBlinkArt держит максимум4 Phaser Images: back/front для A/B. Якорь
  [64,104] на canvas128, displaySize61.81086519114688world px согласован с
  текущим Mage V2. Back depth9.99, маг10, moving-cast upper10.01, front10.02;
  оба слоя ниже hostile tells20. Не добавлены пути/кольца между точками.
- `effectsIntensity=0` скрывает изображения. Reduced Flash приглушает альфу
  до0.65×intensity и tint0xc3b3e5; обычный режим сбрасывает tint в0xffffff.
  Новых движений камеры, screen flash, RAF, tween или таймеров нет.
- `PLAYER_VISUALS.arcaneBlink=true`; отдельный `legacyArcaneBlink=false`
  сохраняет скрытыми прежние круги/частицы/линию и старую upgrade geometry.
  `arcaneShield=false` сохраняется; механики и Absorb HUD работают.

## Направленный casting

MageCastingController наблюдает `mobility.sequence` и сразу запускает
косметический жест `blink` длительностью320мс. Его origin — departure,
target строится из сохранённого `mobility.direction`, поэтому направление
не переворачивается после мгновенного переноса и не меняется из-за нового
ввода или ограничения конечной точки ареной.

Используются все13 принятых casting-кадров соответствующего ракурса Mage V2,
включая отражения W/SW и северные диагонали. Во время бега сохраняется
существующая композиция бегущих ног и casting-торса; движение не блокируется.
Blink вытесняет обычный body cast и его directional projection. Смерть,
hurt-interruption и активный Ultimate сохраняют приоритет. Это не шестое
автоматическое умение: `isMageSpell('blink')=false`, ability feedback не меняется.

Обработан Blink до первого presentation-кадра новой сцены/забега. Повторное
наблюдение той же sequence не запускает жест заново. Пауза замораживает
World.elapsed, обе анимации и casting; menu/death/restart очищают показ.

## Поставка и бюджет

- `scripts/build-mage-blink-runtime-v1.mjs` →
  `public/assets/hd/mage-blink-v1/atlas.png/json`,
  `src/game/art/mageBlinkManifestV1.json` / `mageBlinkPack.ts`.
- Один atlas1024×512 RGBA:32 неотримленных кадров двух depth-слоёв,
  **2,097,152 bytes = 2 MiB**. Каждый кадр побитово совпадает с prepared
  PixelLab-источником; SHA256 четырёх sheets закреплены в manifest.
- GameArt владеет preload/filter/render/destroy; atlas загружается один раз,
  nearest-neighbor. Регистрация `ASSET_REGISTRY.mageBlink`. Vue ничего
  не получает каждый кадр; diagnostics доступны только существующему DEV API.
- Source PNG/GIF/ZIP, recipes/seeds/effect IDs сохранены. Фоны и hero-sheet
  standalone viewer в игру не загружаются. Metadata art-preview обновлены
  на `productionIntegrated=true` и указывают runtime manifest.

## Валидация

- Полная unit suite: **121 файл / 998 тестов PASS** (`--maxWorkers=2`).
  После финального обновления статуса source art-pass дополнительно21/21
  asset/runtime unit PASS. Новых runtime-тестов14: все32 RGBA-кадра и anchors,
  восемь направлений ×13 cast-поз, приоритеты, первый кадр сцены, freeze,
  неподвижные endpoints, reduced flash/zero intensity, pool4/destroy.
- **14 разных DEV browser-сценариев PASS**: mage-blink-game(3),
  gameplay-mobility(4, Mage/Warrior keyboard + real multitouch),
  mage-moving-cast-v2(2), hd-integration(3), player-presentation-focus(2).
  Проверки выполнялись группами; полная E2E suite не запускалась.
- **11/11 production browser PASS**: существующие9 public smoke/controller/
  practice сценариев и2 новых реальных keyboard Blink NE на1280/390
  без DEV API. Новая пара atlas.png/json доступна локально, внешних ресурсов
  игра не требует.
- Typecheck, lint и production build PASS. Обычное предупреждение Vite о
  крупном chunk сохранено; типы/проверки не отключались.
- HD resources:54 разных preload-запроса ровно по одному после4 scene
  restart и16 переносов камеры. Texture bytes initial=max147,710,656
  (**140.87 MiB** в этом fixture); clocks[0,0,0], tweens0, listeners стабильны.
  Новый pool остаётся4 после20 повторных активаций в unit и3 restart на
  каждом viewport. FPS отдельно в этой интеграции не измерялся.
- Обновлены устаревшие HD fixture: прежний Mage sprite/размер заменены текущим
  V2, ручная арифметика preload — точным списком ресурсов. Checks проверяют
  прежние radii/Warrior/отсутствие повторных загрузок, gameplay не подгонялся.

Настоящие Canvas screenshots просмотрены:

- [Grove NE](../../screenshots/mage-blink-v1/game/1280/normal-north-east.png)
- [Burning Grove NE](../../screenshots/mage-blink-v1/game/1280/burning-north-east.png)
- [Смешанная толпа, mobile](../../screenshots/mage-blink-v1/game/390/burning-mixed-encounter.png)
- [Production desktop](../../screenshots/mage-blink-v1/production/1280/north-east-paused.png)
- [Production mobile](../../screenshots/mage-blink-v1/production/390/north-east-paused.png)

Остальные направления и JSON evidence рядом. Проверены normal/burning текущей
Рощи; исторический Dark Forest не является доступной картой, его не включали
ради этой задачи. Блокеров нет. Следующий шаг — пользовательская проверка
темпа320мс в обычном бою; дополнительное изменение баланса не требуется.
