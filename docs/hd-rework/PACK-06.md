# Пакет06 — три босса и вражеские снаряды

Состояние: verified. База6386d02, feature/hd-art-rework-02-08.

## Рисунок и размеры

AssetId charger,sorcerer,eclipse,hostile,hostileImpact. Оригинальный программный
рисунок, не ручная живопись: scripts/boss-art-source.mjs, build-boss-art.mjs.
Thorn Ram: земляная кора, тяжёлые корневые рукавицы, рога наклоняются перед
рывком. Rune Sorcerer: костяной гребень, лиловый плащ, подвешенные камни,
поднятые руки при залпе. Eclipse: пустотная грудная клетка, мятные пластины;
во второй стадии раскрываются дополнительные рёбра с лиловым акцентом.
Его death раскалывает оболочку на восемь нарисованных осколков внутри кадра.

Atlas2048×1884,204frames:200actors128² +4hostile32². Две выпеченные стороны
со светом сверху слева. Каждый набор50frames: idle3@3,walk4@7,hurt3@14,
death6@10,windup2@5,attack4@12,recover3@4; Eclipse имеет два набора стадий.
Logical32²×1.8=57.6², origin(.5,.5) прежние. Hostile logical8²/source32²,
origin.5/scale1. Boss shadow y+23 вместо+6 привязан к нарисованным стопам;
его размер и все игровые координаты/радиусы сохранены. Legacy6boss textures
иhostile не генерируются. Pink impact — кольцо с шестью мелкими shards,
заменяющее большие квадраты. Tells depth20 и их точная геометрия сохранены.

BossAnimation читает прежние фазы World, вторую стадию и shootingAt; отдельные
attack позы отражают мгновенные залпы без продления игровой фазы. Tracks<=3,
death pool<=3/.6s на World.elapsed. Смерть немедленно даёт XP/score/chest,
удаляет owner projectiles/impacts; art не откладывает награды. Despawn без corpse.
World/BossSystem/EclipseBoss/config/entities/abilities/loot/radar не менялись.

## Проверки

Микроциклы Charger→Sorcerer→Eclipse выполнены последовательно с check,
targeted E2E и личным просмотром PNG каждого. QA выявила дубликаты idle/walk
Sorcerer: исправлена вертикальная пластика и подъём противоположного края плаща.
Camera fixture после наблюдения реальной фазы центрирует мобильный снимок,
чтобы recovery Charger не оставался за экраном; runtime камеры не изменён.

- check136unit/29files: TypeScript,lint,unit,build успешны.
- Targeted7/7,59.4s: hardalpha/transparent borders/разные hash кадров,
  четыре walk и шесть death фаз в живом Phaser, hurt,windup/attack/recover
  обоих биомов и viewport. Eclipse stage2: четыре настоящих warning и второй
  залп; owner cleanup в том же вызове damageEnemy.
- Три одновременные смерти: immediate3chests,score>=3000,owned0; pool3,
  allocated0 после scene.restart.10циклов: постоянные keys/bytes/objects,
  Clock0/0/0,tweens0,listeners1/1/1,canvas1,blurListeners без роста.
- Mixed150 +3boss с реальными способностями обоих классов на обеих картах.
- Полный dev66/66,5.9min; production4/4,29.6s; diff check чистый.
  Уточнённые death ракурсы повторно проверены3/3,38.1s; TypeScript/lint
  повторно успешны, новые mobile death PNG лично просмотрены. Награды могут
  сразу перекрывать corpse по прежнему loot depth: появление сундука не задерживали.

## Ресурсы

Seed12345;150mixed +Guardian +3boss, тот же hardware/renderer/DPR1,
autoattacks off, invulnerability,1s warmup+6s RAF. Ryzen7500F, RTX4060 ANGLE
D3D11, Chromium156. PNG1686920B/JSON38347B. Source RGBA — не фактическая VRAM.

|Метрика|1280×720 до→после|390×844 до→после|
|---|---:|---:|
|FPS|≈60→≈60|≈60→≈60|
|p95frame,ms|16.8→16.8|16.8→16.7|
|p95Scene.update,ms|0.9→1.0|1.0→0.9|
|RGBA,B|20509408→35918304|14217952→29626848|
|Texture keys|67→61|43→37|
|GameObjects|402→402|378→378|

Source+15408896B (~14.7MiB), потому что настоящие200крупных кадров заменяют
шесть маленьких legacy textures. Нет дублированного boss atlas/текстур.
Корпуса выделяются только при смерти. FPS60 при60Hz не доказывает равную
GPU-стоимость. Настоящий Android/highDPR/VRAM/heap soak не проверены.
При150врагах исходные массовые rusher tells заполняют экран; их не скрывали
и не меняли реальные timings/AI ради кадра. Это ограничение плотной сцены.

## PNG, лично просмотренные

Все фазы лежат в screenshots/hd-rework/pack-06, evidence JSON для каждого вида.

|Набор|Desktop|Mobile|
|---|---|---|
|Charger|[windup](../../screenshots/hd-rework/pack-06/charger-grove-windup-1280.png)|[recover](../../screenshots/hd-rework/pack-06/charger-grove-recover-390.png)|
|Sorcerer|[windup](../../screenshots/hd-rework/pack-06/sorcerer-forest-windup-1280.png)|[attack](../../screenshots/hd-rework/pack-06/sorcerer-forest-attack-390.png)|
|Eclipse|[windup](../../screenshots/hd-rework/pack-06/eclipse-grove-windup-1280.png)|[attack](../../screenshots/hd-rework/pack-06/eclipse-forest-attack-390.png)|
|Eclipse stage2|[fourwarnings](../../screenshots/hd-rework/pack-06/eclipse-stage2-grove-windup-1280.png)|[secondvolley](../../screenshots/hd-rework/pack-06/eclipse-stage2-forest-volley-390.png)|
|Mixed|[Warrior](../../screenshots/hd-rework/pack-06/mixed-Warrior-forest-1280.png)|[Mage](../../screenshots/hd-rework/pack-06/mixed-Mage-grove-390.png)|
