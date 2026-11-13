# Пакет 05 — элиты и Rare Guardian

Состояние: verified. База b1d604f, feature/hd-art-rework-02-08.

## Рисунок и контракт

AssetId: gruntElite,runnerElite,tankElite,casterElite,rusherElite,splitterElite,
guardian. ELITE_ART перечисляет все6семейств. Grunt сохраняет отдельный
утверждённый core рисунок; остальные используют base HD clips плюс индивидуальные
программные накладки EliteAdornment: медный гребень, кварцевые плечи, костяной
полумесяц, терновый воротник, позолоченные сегменты. Registry.adornment честно
фиксирует reuse, не выдаёт накладки за новые нарисованные PNG-клипы.
Один Graphics depth2, count<=150, без отдельных GameObjects для каждого элитного.
Scale1.4, исключение tank1.6, logical16×16, origin(.5,.5) сохранены.
Frenzy/shielded/volatile остаются исходными, tells20 выше friendly14.

Guardian — Sun Seal Sentinel: известняк, широкий ореол, грудная солнечная печать,
распёртые руки и каменный постамент. Оригинальный программный источник
scripts/guardian-art-source.mjs; сборка build-guardian-art.mjs.
12 кадров96×112, atlas502×350, idle3@3/hurt3@14/death6@10, walk0: герой
действительно неподвижен. Logical24×28 ×1.4, display33.6×39.2, origin(.5,.5).
GuardianAnimation: одна retained ссылка/corpse max1/.6s, World.elapsed,
без задержки kill/XP/artifact, без corpse при abandonment/run change.
Legacy guardian texture не создаётся; прежний artifact пока сохранён до07.
Никаких изменений World/HP/spawn/RNG/drop/radar/баланса.

RunArtifacts.vue изменяет только mobile CSS: уведомление справа внизу,
bottom84px/right15px/maxwidth calc(100%-158px). На проверенной позиции Guardian
(-65,-55) текст больше не перекрывает голову. Полный UI polish остаётся08.

## Проверка

- Seed12345 baseline150+Guardian1/1 и before matrix1/1 до изменений.
- check: TypeScript/lint/build,131unit/28files — успешно.
- Targeted2/2:18элит6×3modifiers, обе карты/viewport;12разных hard-alpha
  кадров с прозрачными краями; live hurt/death6, немедленный артефакт без
  сундука, реальный keyboard pickup health ровно1раз, pause frame, scene teardown.
- QA поймала совпадение idle0/death0; death0 теперь начинает складывание(.98).
  Asserts сохранены, повтор2/2 успешен. PNG atlas и игровые PNG лично просмотрены.
- Полный dev59/59,4.7min; production4/4,31.4s; check131unit/28files,
  TypeScript/lint/build успешно. git diff --check чистый. Исторические
  hd-pixel-art/runner-pack-01 восстановлены после генерации тестами.

## Ресурсы

Тот же seeded12345 harness,150 mixed с живыми AI + Guardian, autoattacks off,
invulnerability, DPR1,1s warmup+6s RAF. Ryzen7500F, RTX4060/ANGLE D3D11,
Chromium156. Источники RGBA, не VRAM. Guardian PNG74486B+JSON2473B.

| Метрика |1280×720 до→после |390×844 до→после |
|---|---:|---:|
|FPS |≈60→≈60 |≈60→≈60 |
|p95frame,ms |16.7→16.8 |16.7→16.8 |
|p95Scene.update,ms |0.8→0.8 |0.8→0.8 |
|RGBA,B |19809296→20509408 |13517840→14217952 |
|Texture keys |67→67 |43→43 |
|GameObjects |380→381 |356→357 |

Source+700112B (~.668MiB);1Graphics для всех элит. Corpse1 выделяется только
при смерти Guardian.10restart test фиксирует постоянство keys/bytes/objects,
Clock0/0/0,tweens0,canvas1,listeners. FPS60 не доказывает равную GPU-стоимость.
Настоящий Android/highDPR/длительный VRAM/heap soak не проверялись.
В crowd150 исходные рамки модификаторов и скопление AI всё ещё закрывают героя;
баланс и separation ради картинки не менялись. Мелкая резьба вторична на32px.

| Набор |Desktop |Mobile |
|---|---|---|
|Элиты Grove |[PNG](../../screenshots/hd-rework/pack-05/after-elites-grove-1280.png)|[PNG](../../screenshots/hd-rework/pack-05/after-elites-grove-390.png)|
|Элиты Forest |[PNG](../../screenshots/hd-rework/pack-05/after-elites-forest-1280.png)|[PNG](../../screenshots/hd-rework/pack-05/after-elites-forest-390.png)|
|Guardian до |[PNG](../../screenshots/hd-rework/pack-05/before-guardian-forest-1280.png)|[PNG](../../screenshots/hd-rework/pack-05/before-guardian-forest-390.png)|
|Guardian после |[PNG](../../screenshots/hd-rework/pack-05/after-guardian-forest-1280.png)|[PNG](../../screenshots/hd-rework/pack-05/after-guardian-forest-390.png)|
|Death |[PNG](../../screenshots/hd-rework/pack-05/guardian-death-1280.png)|[PNG](../../screenshots/hd-rework/pack-05/guardian-death-390.png)|
