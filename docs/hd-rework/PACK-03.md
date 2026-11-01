# Пакет 03 — Warrior и общий feedback

Состояние: verified. База `12dfd70`, ветка `feature/hd-art-rework-02-08`.

AssetId: whirlwind, slam, blades, iron, hit, death. Cleave/core PNG не менялись.
Все новые эффекты — оригинальный программный Graphics art переменного радиуса,
поэтому registry сохраняет source.kind=graphics, logicalSize=null, scale1,
origin(.5,.5), без фиктивных PNG/clips.

`WarriorMagic.ts`: стальные дуги, клинки с гардой и двумя гранями, парные пластины
Iron Skin, разметка/ударная волна/трещины/пыль Slam. `SlamPresentation` читает
типизированный Impact.source до step, сохраняет до24 burst .5s. World/abilities,
AI/HP/radii/knockback/timing и игровые caps не изменены. Тот же Graphics batch14,
вражеские предупреждения20; отдельных частиц GameObjects/таймеров/RAF нет.
Hit tint теперь умеренный MULTIPLY вместо заливки; смерть — до6 гранёных осколков
в прежнем cap96. EffectsIntensity и damageNumbers сохранены; новой тряски нет.

## Проверка

- До изменений снят baseline одинаковым `hd-rework-performance.spec.ts`,1/1.
- `npm.cmd run check`: TypeScript/lint/build,124unit/26files — успешно.
- Targeted Warrior1/1: четыре реальных источника урона, Iron, порядок слоёв,
  pause/expiry/settings, PNG warning/impact/fade обоих viewport.
- Полный dev50/50,4.1min; production4/4,31.6s.
- Дополнительно расширена та же художественная fixture до150мобов и обеих карт:
  targeted2/2,9.3s; повторные TypeScript/lint успешны. Текущий suite51dev.
- git diff --check чистый; исторические PNG/JSON прошлых пакетов восстановлены
  из checkpoint после генерации полным E2E.
- Пробная SCREEN реакция оказалась слишком светлой на PNG и заменена MULTIPLY;
  финальные изображения сохраняют материал врага. Скрывающий overlay CSS теста
  удаляется перед открытием настроек; это исправление harness, не игры.

## Производительность и ресурсы

Тот же ПК/Chromium/DPR1 и сценарий пакета02:150 mixed с живыми AI,
autoattacks off, invulnerability,1s warmup+6s RAF. Не нагрузка всех Warrior FX.
Десять scene restarts проверяют стабильность текстур/объектов/listeners/clock.
До/после ~60FPS; source RGBA16475152B desktop/10183696B mobileviewport,
keys74/50, GameObjects378/354 — без изменений. p95 frame16.8→16.7ms;
updateCPU p95 desktop0.8→0.8ms, mobileviewport0.7→0.7ms;
сырые результаты в before/after-performance.json.
Уточнённая серия: seed12345, RTX4060/ANGLE D3D11. Срезы12dfd70 и93bd8ff
воспроизведены git archive внутри .tmp. Общая контрольная точка12dfd70
переиспользует честно тот же замер, что pack02after;93bd8ff — pack04before.
JSON содержит sharedMeasurement/checkpoint, timestamps сохранены. Первоначальные
нефиксированные RNG-замеры доступны в истории Git, не используются в этой сводке.
Проба не измеряет VRAM и не доказывает равную GPU-стоимость при60Hz.

Финальные warning/impact/fade PNG crowd150 обеих карт и viewport лично просмотрены.
Истинный Android/highDPR/длительный soak не проверялись.

| Фаза |1280×720 |390×844 |
|---|---|---|
| Подготовка |[PNG](../../screenshots/hd-rework/pack-03/warning-1280.png)|[PNG](../../screenshots/hd-rework/pack-03/warning-390.png)|
| Удар |[PNG](../../screenshots/hd-rework/pack-03/impact-1280.png)|[PNG](../../screenshots/hd-rework/pack-03/impact-390.png)|
| Затухание |[PNG](../../screenshots/hd-rework/pack-03/fade-1280.png)|[PNG](../../screenshots/hd-rework/pack-03/fade-390.png)|
| Forest150: подготовка |[PNG](../../screenshots/hd-rework/pack-03/forest-warning-1280.png)|[PNG](../../screenshots/hd-rework/pack-03/forest-warning-390.png)|
| Forest150: удар |[PNG](../../screenshots/hd-rework/pack-03/forest-impact-1280.png)|[PNG](../../screenshots/hd-rework/pack-03/forest-impact-390.png)|
