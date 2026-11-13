# Rune Warden — Ancient Rune Archmage A / Gameplay Art V1

2026-11-08. Пользовательские Walk/Cast и три набора VFX подключены к существующему
Хранителю рун (`sorcerer`). Приняты только left/right; left является точным
зеркальным отражением предоставленного right. Up/down не используются.

## Поведение

| Состояние | Реализация |
|---|---|
| Ходьба | 12 кадров, исходные150ms/кадр, повтор только при движении |
| Ожидание | Первый кадр новой ходьбы |
| Каст | 12 кадров из основной директории, полный клип укладывается в реальный windup; отдельный старт на Blink prepare |
| Попадание по боссу | Прежняя вспышка; windup не перезапускается |
| Смерть | Новая модель затухает0.6s, награды/удаление угроз сразу |
| Arcane Volley | Направление по velocity, повтор11 живых кадров; отдельный11-кадровый impact за0.55s при столкновении/истечении TTL/дальности |
| Runic Judgement | Статичный rune.png на предупреждённой точке; rj.png начинается в настоящий landAt,12 кадров за0.9s; последние0.2s убирают оставшуюся в исходнике руну |
| Blink | Две статичные руны в from/target в signal; после релокации обе проигрывают быстрое12-кадровое свечение за0.36s и исчезают |

Размер тела57.6world units и его игровой радиус прежние. Runic Judgement сохраняет
тонкий круговой контур настоящего damage radius. Перспективный рисунок руны не
подменяет геометрию урона. Blink не создаёт лучей/урона между точками.

Сохранены AI, cooldown, предупреждения, скорость, HP, урон, спавны и награды.
Пауза останавливает кадры по времени World; Ultimate freeze удерживает body cast
и сдвигает предупреждения, ранее выпущенные снаряды продолжают движение.

## Импорт и файлы

- `scripts/build-rune-warden.mjs`: воспроизводимый импорт GIF/PNG, проверка
  совпадения alpha, точной сетки4×4 и неизменности16 исходников.
- `public/assets/hd/rune-warden-v1/atlas.png` и `atlas.json`:97 кадров,
  1056×1716,7 248 384bytes base RGBA, PNG327252bytes.
- `src/game/art/runeWardenManifest.json`: все исходные пути/SHA256/timings.
- `runeWardenPack.ts`, `RuneWardenArt.ts`, registry/GameArt/GameScene:
  выбор кадров, поворот снарядов, фиксированные pivots и bounded renderer.
- `config/runeWarden.ts`, BossSystem/BossMagic/World/entities:
  семантические appearance, события реального попадания/релокации, owner cleanup.

PNG задаёт цвета, GIF — порядок и150ms timings. GIF-палитра отличается от PNG,
alpha совпадает. 512×512 сведены в128×128 только после проверки, что каждый блок
4×4 одинаков. Перерисовки и подгонки отдельных кадров нет. Pivot body(64,64),
volley(104,64), Judgement(64,98);2px atlas gutters не включены в display rectangle.

Source rj начинается уже с активного столба и оставляет руну в финале. Поэтому
предупреждение использует отдельный статичный PNG, а исчезновение — явный fade.
Касание верхнего края столбом сохранено как в источнике; gutters исключают bleed,
не восстанавливают отсутствующую часть рисунка. Отдельные Idle/Hurt/Death не
создавались. Дополнительные генерации и новые зависимости не использовались.

## Жизненный цикл

Общие caps projectile/effect сохранены; новые VFX занимают максимум160images,
переиспользуемых внутри сцены. Нет новых Clock events, tweens или подписок.
Owner death/despawn отменяет pending руны/снаряды/свечение без ложных impact.
Scene shutdown уничтожает images, повторный старт использует загруженный атлас.

Дополнительные Arcane impact/Blink events имеют отдельные отрицательные ID.
Runic Judgement заменяет прежний impact effect с прежним gameplay ID. Replay
исключает только additive appearance/started, а прежние SHA256 fixtures сохранены.

## Проверки

- Финальный `npm.cmd run check`:94 файла,762 теста, typecheck/lint/build PASS.
- `npm.cmd run test:e2e:production -- --output .tmp/rune-warden-production-final --reporter=list`:8/8 PASS после финальной сборки.
- `npm.cmd run test:e2e -- hd-integration.spec.ts mage-ability-vfx.spec.ts --output .tmp/rune-warden-regression --reporter=list`:9/9 PASS.
- `npm.cmd run test:e2e -- rune-warden.spec.ts --output .tmp/rune-warden-final --reporter=list`:4/4 PASS.
- Boss+Guardian/HD regression:15/15 старых сценариев PASS, включая шесть настоящих
  45-секундных RAF-прогонов и10 рестартов сцены. Первый общий запуск19 сценариев
  дал17 PASS и2 ошибки нового теста: поздний босс успевал начать следующую руну.
  Fixture ограничен одним кастом для проверки его исчезновения, после чего все
  четыре целевых сценария прошли. Проверки игрового урона/AI не ослаблялись.
- При финальном review добавлена защита от создания owner-VFX после смертельного
  Judgement и отдельный тест этого случая. После неё check762/762 и production8/8.
- Сохранность16 пользовательских PNG/GIF проверена SHA256, изменений0.
- Повторный builder: все3 outputs побайтово идентичны.

Реальные Canvas screenshots и JSON evidence: `screenshots/rune-warden-v1/`,44PNG.
Выборочно просмотрены desktop/mobile casting, warning, impact, fade, Blink и
ходьба в обычном и горящем лесу. Runtime errors0, Clock0/0/0, tweens0,
один canvas/один атлас после рестарта; в целевых сценариях allocated VFX6.
Старые tracked Mage evidence, перезаписанные регрессионным прогоном, возвращены
к исходным версиям; новые результаты сохранены в `.tmp/rune-warden-mage-regression/`.
Полный исторический E2E набор целиком не запускался; проверки ограничены
затронутыми сценами, графикой и production. Новых номерных done-маркеров нет.
