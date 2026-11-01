# Пакет07 — предметы и пять артефактов

Состояние: verified. База e49605f.

## Комплект и контракт

AssetId xp,healing,haste,fury,magnet,chest,artifactHealth,artifactDamage,
artifactSpeed,artifactCooldown,artifactExperience,buffHaste,buffFury,lootGlow.
Все реальные ArtifactId health/damage/speed/cooldown/experience перечислены
в ARTIFACT_ART; общего placeholder artifact больше нет. Названия и эффекты
берутся из ArtifactSystem, баланс не дублируется в artwork.

Оригинальный программный рисунок, не ручная живопись. Healing — красная колба
с холодным стеклом, haste — крылатые сапоги, fury — раскалённый меч,
magnet — синяя подкова, XP — самостоятельный малый кластер. Постоянные:
Сердце дуба — сердцевина с листьями, Печать пламени — шестигранный медальон,
Перо ветра — светлое перо, Песочные часы — стеклянный песочный корпус,
Кристалл памяти — лиловый кристалл на книге. Сундук — дерево/латунные скобы,
отдельный поднятый lid и внутренний лут в фазах открытия.

scripts/loot-art-source.mjs +build-loot-art.mjs создают480×408 atlas39frames:
11образов×3idle/sheens +6chestopen@12. Кадры64², XP24²; NEAREST/hardalpha,
свет сверху слева. Logical16², artifact×1.15=18.4²,chest×1.25=20²,XP6²,
origin.5 сохранены. HUD — точные idle0 PNG crops того же рисунка, зашитые
в generatedLootIcons.json: это11малых вырезок, не второй Phaser atlas.
Исходный old16×16 lootPixels и старые actor generators сохранены как reference,
GameScene их больше не вызывает. В production остаются7HD атласов/14ресурсов.

GameScene сохраняет прежний birthpop/bob. LootPresentation рисует компактные
ступенчатые seals, короткую birth рамку, отдельные золотые метки редкости,
крылатые следы haste (cap12) и боковые всполохи fury. Guardian tell оставлен
прежним. PickupAnimation читает исчезновение живого предмета при контакте,
rejects expiry/cap replacement/run cleanup. GameArt pool<=24/.5s: flyup/fade
и6openframes, без grant/score/loot calls и без задержки фактической награды.
Вся логика World/config/loot/artifacts/XP остаётся исходной.

GameHUD run-extras размещает5артефактов, бафы и уведомления последовательно;
они больше не перекрывают друг друга. Все timers/stacks/percent/name/aria
сохранены. Это согласование лута, полный визуальный UI polish относится08.

## Проверка

- До runtimeизменений baseline07:2/2,32s, фиксация seed12345 икомплекта.
- check139unit/30files: TypeScript/lint/unit/build успешно.
- Targeted6/6,24.2s, затем расширенный loot4/4,15.5s. Атлас:39разныхкадров
  по группам, binaryalpha/transparentborders; Canvas pixels11idle0 точноравны
  HUD crops. Сундук реально открывается при движении клавиатурой:6кадров,
  HP20→50 одинраз, pause кадрзаморожен. Все5артефактов подобраны при контакте,
  HUD имеет5разныхPNG.13одновременныхподборов→13images,10scenerestarts→0,
  caps6/4/3, постоянные keys/bytes/objects,clock0/0/0,tweens0,listeners1/1/1.
- Реальные PNG обоихбиомов/viewport иchestopen лично просмотрены. В основной
  сравнительнойmatrix координаты до/после одинаковы. Дополнительныеclear-artifacts
  mobilePNG показывают дропы надгероем: нижнюю частькарты закономерно занимаетHUD.
- Исправлены выявленные ошибки интеграции: JSONcrops перемещён изpublic вsrc
  для Vite; Node22 E2E читаетJSONчерезfs. Asserts не ослаблялись, resourcecount14
  соответствует добавленному единственному атласу; внешних ресурсов не добавлено.
- Полный70/70dev,6.1min;4/4production,28.9s; итоговыйdiffcheck чистый.
  Исправлены только лишние пустые строкиEOF; историческиеtestoutputs восстановлены.

## Ресурсы и PNG

До/после: fixture07=150mixed+Guardian+3boss+4consumables+chest+3artifacts+20XP.
Ryzen7500F/RTX4060ANGLE D3D11/Chromium156/DPR1;1s warmup+6s RAF, invulnerability,
autoattacks off. RGBA source, не VRAM; desktop mobileviewport, не Android.
PNG37695B/JSON6954B +HUD crops25992B(JSONbase64),11малыхкартинок.
|Метрика|1280×720 до→после|390×844 до→после|
|---|---:|---:|
|FPS|≈60→≈60|≈60→≈60|
|p95frame,ms|16.8→16.8|16.8→16.8|
|p95Scene.update,ms|1.0→1.1|1.1→1.1|
|RGBA,B|35918304→36695376|29626848→30403920|
|Texturekeys|61→55|37→31|
|GameObjects|430→430|406→406|

Source+777072B (~.741MiB),6legacykeysудалены. В этом fixture pickups не
собираются, дополнительныеpoolimagesневыделены; их cap24и13реальныхподборов
провереныотдельно. FPS60при60Hz неравно доказательствуодинаковойGPUстоимости.
НастоящийAndroid/highDPR/длительныйVRAM/heapsoakнепроверены.
HUD crops отдельно не входят в Phaserbytes:
максимум10×64²+1×24²=166144B декодированныхRGBA приодновременном показевсех.

|Набор|Desktop|Mobile|
|---|---|---|
|ДоForest|[PNG](../../screenshots/hd-rework/pack-07/before-items-forest-0-1280.png)|[PNG](../../screenshots/hd-rework/pack-07/before-items-forest-0-390.png)|
|ПослеForest|[PNG](../../screenshots/hd-rework/pack-07/after-items-forest-0-1280.png)|[PNG](../../screenshots/hd-rework/pack-07/after-clear-artifacts-forest-0-390.png)|
|Последваартефакта|[PNG](../../screenshots/hd-rework/pack-07/after-items-grove-1-1280.png)|[PNG](../../screenshots/hd-rework/pack-07/after-clear-artifacts-grove-1-390.png)|
|Открытие|[PNG](../../screenshots/hd-rework/pack-07/chest-open-1280.png)|[PNG](../../screenshots/hd-rework/pack-07/chest-open-390.png)|
