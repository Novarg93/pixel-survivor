# Пакет 04 — обычные враги

Состояние: verified. База `93bd8ff`; commit пакета — Git log и PROGRESS.

## Микроциклы

- Tank / Iron Cairn: оригинальная каменная кираса, отдельные плечевые плиты,
  утопленная голова, низкий центр массы.44frames64×64, обе стороны,
  idle3/walk4/hurt3/death6 и2windup/2attack/2recover (запасные позы без нового AI).
  check126unit/27files, targeted2/2 прошли, игровые PNG обеих карт и viewport
  лично просмотрены. Frame hard alpha/borders/unique QA успешен.
- Caster / Bone Cantor: костяной лик в лиловом капюшоне, рунический крюк/фокус.
  После исправления подъёма краёв плаща все4walk-кадра различаются. check127,
  targeted3/3; реальный windup/fire проверен, игровые PNG просмотрены.
- Rusher / Thorn Hound: низкий четырёхлапый силуэт, бронзовые спинные пластины,
  костяные рога и вытянутая морда. check128, targeted4/4; реальные
  windup/charge/recover, death6, PNG просмотрены до Splitter.
- Splitter / Seam Scarab: три раздельных нефритовых панциря, шесть конечностей,
  светлый шов. check129, targeted6/6 (включая10рестартов burst150), PNG просмотрены.
  Два ребёнка создаются только World; тело/XP могут частично перекрываться
  настоящими детьми — симуляция не задерживается ради рисунка.

## Контракт

AssetId tank/caster/rusher/splitter, исходные16×16 логические рамки,
scale1.6 tank (также elite),1 others/elite1.4, origin(.5,.5).
Новыйsource64×64 компенсирован только setDisplaySize. Enemy definitions,
World, AI, score/XP/loot, collision и caps не меняются.

Редактируемый оригинальный источник: scripts/enemy-art-source.mjs,
build: node --experimental-strip-types scripts/build-enemy-art.mjs.
Два нарисованных ракурса с компенсированным верхним левым светом.
Атлас hd-enemies грузится1раз и переиспользуется при restart; заменённые
legacy-текстуры больше не генерируются. Фактические clips/fps — enemyPack.ts.

EnemyAnimation — отдельный наблюдатель новых семейств с retained Enemy refs
до step, hp=0 после исчезновения. Визуальные тела не участвуют в World.
Общий пул24 для новых типов, треки150; Runner сохраняет свой прежний пул24.
Despawn/runId/scene restart очищают наблюдение без фиктивных наград/смертей.
Трупы затухают за.5s по World.elapsed, drop/score доступны в исходный тик.

Итоговый атлас176frames64×64,1024×816. На сторону: idle3@3fps,walk4@7,
hurt3@14,death6@12,windup2@5,attack2@12,recover2@4. Idle/walk loop;
hurt/death clamped, .5s corpse. Дополнительные состояния Tank/Splitter
подготовлены, но их AI новых атак не получил; registry честно хранит4общих clips.

Полный gate: check129unit/27files, TypeScript/lint/build; dev57/57,4.6min;
production4/4,30.5s. Targeted6/6: hard-alpha/borders/unique все176кадров,
движение/урон/смерть четырёх видов, immediate rewards, pause, Caster/Rusher
фазы, Splitter2детей; mixed150death→pool24→10scene restarts со стабильными
ресурсами и subscriptions, allocatedDeaths0 после restart.

Дополнительно benchmark переснят с явным seed12345: baseline93bd8ff внутри
.tmp/git archive1/1 и текущий срез1/1. Это уточняет исходный fixture, в котором
состав/позиции были фиксированы, но elite RNG зависел от UI Date.now.
Renderer capture теперь корректно читает WebGL1: RTX4060/ANGLE D3D11.
Отдельно уточнены метрики02–03 на соответствующих исторических срезах;
прежние результаты сохранены историей Git. Игровые файлы main не переключались.

## Ресурсы до/после

Тот же harness/ПК/Chromium156/DPR1,150mixed с живыми AI, autoattacks off,
invulnerability,1s прогрева+6s RAF, оба viewport. Исходные RGBA источников,
а не фактическая VRAM. Renderer RTX4060/ANGLE D3D11, seed12345.
PNG429081B + JSON32115B; сеть461196B.

| Метрика |1280×720 до→после |390×844 до→после |
|---|---:|---:|
|FPS |≈60→≈60 |≈60→≈60 |
|p95frame,ms |16.7→16.8 |16.7→16.7 |
|p95Scene.update,ms |0.8→1.0 |0.7→0.8 |
|Source RGBA,B |16475152→19809296 |10183696→13517840 |
|Texture keys |74→67 |50→43 |
|GameObjects |378→378 |354→354 |

Память источников+3334144B (~3.18MiB), keys−7. Короткий CPU-замер показал
рост.1–.2ms;60Hz не доказывает отсутствие GPU-издержек. Ten restarts без deaths
и отдельно10burst-death restarts стабильны, Clock0/0/0,tweens0,canvas1.
Техническое ограничение остаётся: неподвижного героя толпа закрывает;
separation/AI не менялись. Реальный Android/highDPR/VRAM soak не проверены.

| Сцена |Desktop |Mobile |
|---|---|---|
| До смешанной сцены |[PNG](../../screenshots/hd-rework/pack-04/before-forest-1280.png)|[PNG](../../screenshots/hd-rework/pack-04/before-forest-390.png)|
| После смешанной сцены |[PNG](../../screenshots/hd-rework/pack-04/after-forest-1280.png)|[PNG](../../screenshots/hd-rework/pack-04/after-forest-390.png)|
|150mixed после |[PNG](../../screenshots/hd-rework/pack-04/after-stress-1280.png)|[PNG](../../screenshots/hd-rework/pack-04/after-stress-390.png)|
|Tank |[PNG](../../screenshots/hd-rework/pack-04/tank-grove-1280.png)|[PNG](../../screenshots/hd-rework/pack-04/tank-forest-390.png)|
|Caster |[PNG](../../screenshots/hd-rework/pack-04/caster-grove-1280.png)|[PNG](../../screenshots/hd-rework/pack-04/caster-forest-390.png)|
|Rusher |[PNG](../../screenshots/hd-rework/pack-04/rusher-grove-1280.png)|[PNG](../../screenshots/hd-rework/pack-04/rusher-forest-390.png)|
|Splitter |[PNG](../../screenshots/hd-rework/pack-04/splitter-grove-1280.png)|[PNG](../../screenshots/hd-rework/pack-04/splitter-forest-390.png)|
