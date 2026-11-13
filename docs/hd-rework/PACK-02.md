# Пакет 02 — Mage, Grove, пять умений

Состояние: verified. База `03ae07a`, commit пакета — запись в PROGRESS и Git log.

## Изменения

AssetId: mage, grove, fireball, frost, lightning, meteor, shield.
`mage` сохранил logical16×20 ×1.5 = display24×30, origin(.5,.75);
исходник16×20/1idle+2walk заменён оригинальным64×80 с 3idle/6walk/3hurt/6death
на down/up/side. Редактируемый источник `scripts/mage-art-source.mjs`,
сборка `node --experimental-strip-types scripts/build-mage-art.mjs`.
Атлас58 кадров (54Mage+4fireball),1024×372; PNG137073B, JSON10576B на первой сборке
(точный окончательный размер см. Git/artifacts). NEAREST/alpha0,255.

Grove: source128×128 →256×256, logical128×128, scale1, origin0,0.
Координаты троп/декора из biomeTile сохранены, исходник `hdGrove.ts`.
Нет legacy генератора Grove и legacy Mage/fireball текстур в production.

MageMagic: одна Graphics depth14; отрисовка по настоящим effects/impacts/zones,
направлению projectiles, рангу и состоянию shield. Вражеские tells depth20.
Новые игровые эффекты, damage/timing/radii/slow/XP не добавлены.
World/abilities/config/entities/loot/radar без изменений.

## Свидетельства

В `../../screenshots/hd-rework/pack-02/` (от корня репозитория —
`screenshots/hd-rework/pack-02`): before/after-grove/forest-{1280,390}.png,
отдельные Canvas PNG, before/after-stress-{1280,390}.png,
magic-{0,0.35,0.85}-{1280,390}.png, mage-death-390.png, mage-evidence.json.
Просмотрены реальные PNG обоих viewport, обеих карт, нагрузки150, старта,
пика/затухания магии и смерти. Новый Mage отделяется шляпой/шарфом/фонарём,
фон Grove спокойнее; статика150 по-прежнему закрывает героя — separation не менялся.

## Сравнение до/после

Ryzen5 7500F, Chromium156.0.8078.4,31.6GiB RAM, headless DPR1.
Тот же harness,150 смешанных врагов с живыми AI/collision, отключённые автоатаки
и спавны, invulnerable hero;1s прогрева+6s RAF. Это синтетическая проба.
Итоговая пересъёмка использует seed12345, RTX4060/ANGLE D3D11 и тот же harness.
Срезы03ae07a→12dfd70 воспроизведены через git archive внутри .tmp,
по1/1 E2E на срез. Первые замеры до уточнения seed сохранены в истории Git;
здесь приведена уточнённая серия. RGBA = source.width×height×4, не VRAM.

| Метрика |1280×720 до→после |390×844 до→после |
|---|---:|---:|
|FPS |≈60→≈60 |≈60→≈60 |
|p95 frame,ms |16.8→16.8 |16.8→16.8 |
|p95 Scene.update,ms |0.7→0.8 |0.8→0.7 |
|Texture keys |84→74 |60→50 |
|RGBA source,B |5527312→16475152 |3954448→10183696 |
|GameObjects |378→378 |354→354 |

Текстурный рост преимущественно от density2 Grove (+3× площади чанков)
и Mage atlas; ключей−10 из-за удаления заменённых текстур.
Около60FPS при60Hz не доказывает равенство GPU-стоимости. Небольшое увеличение
updateCPU между повторениями не интерпретируется как значимый тренд короткого прогона.
Десять scene restarts: стабильные Texture keys/bytes/GameObjects/listeners,
Clock0/0/0,tweens0,canvas1. Сырые данные before/after-performance.json.

## Проверки и ограничения

- Baseline: новый benchmark1/1 до любых runtime-изменений.
- `npm.cmd run check`:123unit/25files, TypeScript/lint/build успешно на текущем срезе.
- Pixel QA58 кадров: нет пустых/обрезанных, alpha бинарная, clips различны.
- Targeted E2E2/2: seams/determinism, пять реальных автоумений, pause state,
  шесть death-фаз и немедленный Game Over.
- Полный dev E2E48/48,4.1min; production4/4,25.8s.
- Дополнительный live directional walk/hurt test1/1,5.8s после добавления:
  все6walk-кадров каждого ракурса, actual input, hurt/pause, display24×30.
  Повторные TypeScript/lint прошли. Текущий dev-suite содержит49tests.
- `git diff --check` прошёл. Исторические screenshots/hd-pixel-art и
  screenshots/runner-pack-01 восстановлены после генерации общей матрицей;
  новые свидетельства хранятся отдельно.
- Настоящий Android/highDPR/длительный VRAM soak не выполнялись.
- Side-ракурс отражается прежним управлением героя; источник освещён сверху слева.
- Это оригинальный программный арт, художественная оценка пользователем впереди.

| Сцена | Desktop | Mobile |
|---|---|---|
| Grove до |[PNG](../../screenshots/hd-rework/pack-02/before-grove-1280.png)|[PNG](../../screenshots/hd-rework/pack-02/before-grove-390.png)|
| Grove после |[PNG](../../screenshots/hd-rework/pack-02/after-grove-1280.png)|[PNG](../../screenshots/hd-rework/pack-02/after-grove-390.png)|
| Forest после |[PNG](../../screenshots/hd-rework/pack-02/after-forest-1280.png)|[PNG](../../screenshots/hd-rework/pack-02/after-forest-390.png)|
| Магия: пик |[PNG](../../screenshots/hd-rework/pack-02/magic-0.35-1280.png)|[PNG](../../screenshots/hd-rework/pack-02/magic-0.35-390.png)|
|150 mixed |[PNG](../../screenshots/hd-rework/pack-02/after-stress-1280.png)|[PNG](../../screenshots/hd-rework/pack-02/after-stress-390.png)|
