# Frost Nova — интеграция авторских анимаций, 2026-11-09

По запросу пользователя подключены два набора исходников:

| Способность | Источник в art/main-hero-mage/abilities | Кадры | Длительность |
| --- | --- | --- | --- |
| Обычная Nova | frost-nova/frost-nov-flat.png + .json | 24×50ms | 1.2s |
| Frost Ultimate | frost-nova-ultimate/ultimate-nova.png + .json | 48×50ms | 2.4s |

JSON задаёт порядок и время каждого кадра, PNG сохраняет авторские RGBA.
Последние прозрачные кадры сохранены. Оба клипа воспроизводятся вперёд один
раз через World.elapsed; пауза останавливает кадры. Общая effectsIntensity
масштабирует alpha; прежний свет с alpha0.5 и ускорениемx2 заменён.

Обычная Nova появляется в настоящем ground target. Ультимейт начинается в
FrostUltimate.started, проходит авторскую руну и взрыв в точке каста, скрывается
через2.4s. Дымка поля и ледяные силуэты сохраняют игровые дедлайны. Игровые
радиус/урон/Root/Freeze/Thaw/перезарядка не изменены: ультимейт наносит swept
damage180 с прежним boss/Guardian cap8% и общей заморозкой. Meteor использует
прежние пиксели, тайминги, размеры и pivot.

Native canvas146² хранится как full canvas150² с прозрачным padding2. Lossless
trim удаляет только пустые поля, spriteSourceSize возвращает смещение кадра;
нет frame fitting. Display size2R×150/146 даёт исходному холсту диаметр2R.
groundImpactDepth помещает оба клипа ниже врагов, включая отрицательныеY.
Ультимейт использует один Image; обычные Nova — прежний bounded pool.
Новых Clock, tweens и listeners нет; destroy освобождает собственные Image.

Все72новых кадра находятся в существующем mage-ability-vfx-v1/atlas:
96frames,1024×1458,5971968RGBAbytes (~5.70MiB). Дополнительных URL и загрузок
нет; процедурные nova light/avalanche textures больше не создаются. Имена
кадров ультимейта явно отделены: его JSON содержит старые имена обычной Nova.
Исходные PNG/JSON/GIF не изменялись. Повторная сборка atlasPNG/JSON,manifest
и source-auditJSON дала4byte-identical выхода.

Изменённые runtimeфайлы: MageAbilityArt.ts, FrostUltimateArt.ts,
mageAbilityPack.ts, mageAbilityManifest.json, assetRegistry.ts,
mageAbilityTuning.json. Сборщики: build/inspect-mage-ability-vfx.mjs.
Тесты: новый unit frost-nova-art.test.ts и E2E frost-nova-art.spec.ts;
обновлены mage-ability-vfx, frost-seal/frost-avalanche и asset-registry contracts.

Проверки:

- Финальный `npm.cmd run check`: PASS,907unit/110files,typecheck/lint/build.
  Новые unitсверяют исходные хэши и реконструированные изtrimmedatlas72native
  RGBAкадра, авторские времена/порядок, pivot/масштаб, паузу, окончание,
  нулевую интенсивность, смерть и смену выбранного ультимейта.
- `npm.cmd run test:e2e -- tests/e2e/frost-nova-art.spec.ts tests/e2e/mage-ability-vfx.spec.ts`:
  9/9 PASS,57.3s. Все72кадра проходят настоящий Phaser renderer на1280×720,
  844×390,390×844; damage/freeze остаются реальными. По3scene restarts наviewport,
  стабильные texture keys/listeners, Clock0/0/0,tweens0,errors0, без повторной загрузки.
- `frost-avalanche.spec.ts`:2/2 PASS. `frost-seal.spec.ts`:7/7 PASS, включая
  shared thaw, late entrant, gamepad, guards, mute,10scene restarts и150+3+3stress.
  Итого подтверждены18различных целевых E2E; два Meteor cases также прошли
  в первом общем прогоне. Initial7failures были в exactlocator кнопки со
  стрелкой и ошибочных ожидаемых индексах кадра; после исправления9/9 PASS.
- `npm.cmd run test:e2e:production`:9/9 PASS,40.3s. Работают публичный старт,
  тренировки, атаки, пауза, resize, controller input; запросы ресурсов локальные.
- Один concurrent check превысил5000ms в существующей проверке большого
  набора Mage source hashes; финальный последовательныйcheck прошёл полностью
  с прежними таймаутами. Проверки не отключались.
- Stress150regular+3boss+3Guardian в текущем Chromium: median59.88FPS,
  p95frame16.7–16.8ms на1280/844/1024; это локальное измерение.
- `git diff --check`: PASS.

Новые артефакты: `screenshots/frost-nova-art/{1280,844,390}/` —27PNG и3JSON
с каждым показанным кадром, damagefixture, restartдиагностикой и запросами.
Просмотрены обычная normal-10 и ultimate-32 на1280/390, ultimate-24 на844,
а также screenshots/frost-seal/05-frozen-1280.png с настоящими боссами/хранителями.
Пиксели чёткие, фигуры и вражеские предупреждения видны поверх наземной анимации.
Дополнительные текущие stress/timelinePNG/JSON — screenshots/frost-seal и docs/frost-seal.

Блокеров нет. Следующий шаг — игровая оценка обеих анимаций пользователем.
Новые done-маркеры не создавались.
