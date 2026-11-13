# Ash Warden — Sound Effects prompts

Дата: 2026-11-10. Статус всех вариантов: **Awaiting Review**.

Документ подготовлен по текущим исходникам Pixel Survivor. На первоначальном этапе ElevenLabs MCP не вызывался и аудио не генерировалось. Затем 2026-11-10 пользователь разрешил генерацию четырёх основных промптов A: получены16 дублей, доступно [локальное демо](../../art/generated/ash-warden-sfx-v1/viewer.html). Варианты B и дополнительные фазы не генерировались. Художественная приёмка ещё не выполнена. Новые события и параметры подключения ниже остаются предложениями, без изменений игры.

## 1. Основание: что действительно реализовано

Проверены:

- [FinalEncounter.ts](../../src/game/systems/FinalEncounter.ts) — состояния атак, контакты, события, серии Meteor и отдельные часы босса/арены.
- [finalBoss.ts](../../src/game/config/finalBoss.ts) — актуальные длительности и размеры атак.
- [FinalBossArt.ts](../../src/game/art/FinalBossArt.ts), [ashWardenPack.ts](../../src/game/art/ashWardenPack.ts), [meleeComboPack.ts](../../src/game/art/meleeComboPack.ts) — выбор анимаций, ускорения и визуальный контакт меча.
- [flameStrikePack.ts](../../src/game/art/flameStrikePack.ts), [flameStrikeManifest.json](../../src/game/art/flameStrikeManifest.json), [FlameStrikeArt.ts](../../src/game/art/FlameStrikeArt.ts) — распространение огня и его затухание.
- [ashWardenPixellabPack.ts](../../src/game/art/ashWardenPixellabPack.ts) — падение Meteor, удар и текущая простая прицельная метка.
- [catalog.ts](../../src/game/audio/catalog.ts), [AudioPresentation.ts](../../src/game/audio/AudioPresentation.ts), [AudioController.ts](../../src/game/audio/AudioController.ts), [mageSamples.ts](../../src/game/audio/mageSamples.ts) — реальные аудиособытия, громкость, приоритеты и ограничения воспроизведения.
- [flame-strike-timing.test.ts](../../tests/unit/flame-strike-timing.test.ts) — существующие проверки ускоренной анимации, контакта и заморозки; вместе с `final-boss.test.ts` и `melee-combo.test.ts` выполнен адресный запуск: **3 файла, 21 тест passed**.

### Реальные фазы и опорные моменты

Здесь время отсчитывается по симуляции. При заморозке босса его фазы задерживаются; это не гарантированное время настенных часов. Переходы происходят на шаге симуляции, поэтому десятичные значения — расчётные ориентиры, а не обещание точности аудио до миллисекунды.

| Attack | Подготовка и контакт | Завершение и важные детали |
| --- | --- | --- |
| Basic Melee | Боковые B/A чередуются. У A контакт через `0.65 / (1.15 × 1.3)` ≈ **0.435 с**, у B и overhead через `0.65 / 1.15` ≈ **0.565 с** от начала `basicMelee`. | Полная атака A ≈ **0.803 с**, B/overhead ≈ **1.043 с**; после контакта остаётся ≈0.368/0.478 с. Северная анимация подгоняется под реальный контакт. Не использовать старые 650 мс из метаданных как текущее время удара. |
| Charge | `chargeWindup` **0.650 с** → `chargeTravel` **0.323 с** → `chargeBrake` **0.300 с**. | Затем начинается подготовка Flame Strike. Есть проверка контакта с игроком на пути, но нет отдельного столкновения со стеной, анимации врезания или звука collision. `chargeStop` означает торможение. |
| Flame Strike | После торможения: `swordWindup` **0.600 с** → `swordActive` **0.150 с** → `recovery` **0.750 с**. `cleaveImpact` испускается на входе в `swordActive`. | От начала всей подготовки Charge до Flame Strike ≈ **1.873 с** без остановок. Контакт с игроком проверяется в активной фазе; эффект удара звучит независимо от попадания. |
| Meteor | От начала предупреждения конкретного метеорита: метка **0–1.300 с**, видимое падение только **1.000–1.300 с**, удар на **1.300 с**. | После удара визуальный след живёт **0.500 с**. `meteorCast` длится **1.440 с**, его `meteorRelease` на **0.550 с** не совпадает с началом видимого падения. |

**Flame Strike:** направленная огненная полоса длиной 280 world units; в phase1 одна волна, в phase2 три направления, в phase3 пять. В каждой полосе 10 сегментов с задержками 0–90 мс. Первые кадры ближнего огня появляются за 110 мс до `cleaveImpact`, дальнего — за 20 мс; начало яркого кадра 5 распространяется от контакта до +90 мс. Клип сегмента длится 600 мс; последний сегмент заканчивает выборку к +580 мс после контакта, финальный кадр уже прозрачный. Это визуальное распространение: код урона проверяет направленные полосы во время `swordActive`, а не отдельные летящие Fireball. Нужен единый быстрый выброс огня, без десяти отдельных звуков и без кругового взрыва.

**Meteor:** первоначального анимированного AoE-круга в текущем рендере нет. Используется простая метка с короткими штрихами и открытым центром. Звук не должен изображать расширяющийся магический купол. В phase2 обычный дальний каст создаёт 3 последовательных Meteor; ритуальный залп — 11, залп арены phase3 — 9. Интервал внутри серии 150 мс; одновременно допускается до 12 ещё не упавших метеоритов. Промпт описывает **один** метеорит, не весь дождь.

### Текущий каталог и маршрутизация

`FinalEncounter` отправляет строки через `w.sound(...)`. `AudioPresentation` переводит `final-*` в `final.*`, объединяет одинаковые cues за один проход и передаёт их в `AudioController`. События анимации `hitFrame`, `chargeStart`, `chargeStop`, `cleaveImpact`, `meteorRelease` сами по себе не являются `SoundEvent`.

| Действие | Строка мира → существующий SoundEvent | Текущий источник; priority / gain / gap |
| --- | --- | --- |
| Подготовка обычного меча и Flame Strike | `final-sword` → `final.sword` | procedural `threat`; 11 / 0.45 / 0.20 с |
| Контакт обычного меча | `final-slash` → `final.slash` | procedural `ashSword`; 11 / 0.45 / 0.20 с |
| Предупреждение Charge | `final-charge-warning` → `final.charge-warning` | procedural `threat`; 11 / 0.45 / 0.20 с |
| Начало движения Charge | `final-charge` → `final.charge` | procedural `stone`; 11 / 0.45 / 0.20 с |
| Начало торможения | `final-stop` → `final.stop` | procedural `slam`; 10 / 0.50 / 0.30 с |
| Контакт Flame Strike | `final-cleave` → `final.cleave` | procedural `ashSword`; 11 / 0.60 / 0.40 с |
| Жест каста Meteor / ритуала | `final-cast` → `final.cast` | procedural `shield`; 10 / 0.40 / 0.40 с |
| Начало предупреждения Meteor | `final-warning` → `final.warning` | procedural `threat`; 11 / 0.45 / 0.20 с |
| Приземление Meteor | `final-impact` → `final.impact` | procedural `meteor`; 11 / 0.45 / 0.20 с |

У босса пока нет отдельных подключённых WAV этих четырёх атак. Нельзя просто заменить общий patch `ashSword`: его используют и Basic Melee, и Flame Strike. Аналогично `final.sword` обслуживает подготовку обоих ударов, а `final.cast` — несколько видов каста.

Существующие файлы: `public/assets/audio/mage-sfx-uploaded-v1/` — 5 пользовательских звуков Mage; `public/assets/audio/mage-sfx-v1/` — прежние 11 Mage SFX; `public/assets/audio/music-v1/` — 5 принятых музыкальных тем. Исходники пользовательских звуков лежат в `art/main-hero-mage-v2/sounds/`. Для сравнения Meteor героя используется `mage-sfx-uploaded-v1/meteor.wav`, **1 с**, на событии `armageddon.impact`. `thunder.wav` относится к ульте героя, а не к Meteor босса.

## 2. Общий звуковой стиль

Dark fantasy pixel art средней детализации: сухой близкий звук, ясная атака, короткое естественное затухание. Тяжесть передавать движением воздуха, телом удара и фактурой материала. Не делать суббас основой эффекта. Без музыки, голосов, посторонней среды, длинного реверберационного хвоста и обязательного 8-bit/retro тембра.

Ниже каждый блок самодостаточен для копирования в ElevenLabs Sound Effects. A — основной вариант; B — альтернативная фактура той же атаки. Это **альтернативы**, их не следует накладывать друг на друга. Длительность также следует выставить в настройке генерации. Указанные внутренние акценты — ориентир для последующей ручной приёмки: текстовый промпт не гарантирует точного положения транзиента.

## 3. Четыре основных эффекта

### A1. Basic Melee: Prompt A

```text
A single heavy two-handed sword strike. A fast, weighty blade whoosh and a low steel whistle lead into a short, solid impact, with a little metal rattle and a quickly fading ring. Keep it dry, punchy and clear enough for repeated attacks. No voices, music, background ambience, long reverb or retro game tones. Duration: 0.6 seconds.
```

### A2. Basic Melee: Prompt B

```text
A single heavy greatsword swing and strike. A sharp steel scrape and a rough air swish lead into a compact metallic thud, followed by a brief hilt rattle. Make the impact firm and close, with very little ringing. No flesh sounds, stone breaking, voices, music, background ambience or long reverb. Duration: 0.6 seconds.
```

**Разница:** A — более чистый свист большого клинка и короткий металлический звон; B — более шероховатое движение стали и глухой удар. Оба подходят для частых автоатак. Удар здесь — стилизованный акцент оружия, не подтверждение попадания в тело и не обязательное разрушение земли.

**Файлы для выбора:** `ash-warden-melee-a.wav`, `ash-warden-melee-b.wav`. После приёмки один выбранный файл: `ash-warden-melee.wav`.

**Синхронизация:** главный транзиент должен совпасть с `hitFrame` / `final.slash`, а свист — предшествовать ему. Ориентир: 120 мс свиста до транзиента. Для цельного файла предлагается **новое**, пока отсутствующее событие `final.melee-swing` (`final-melee-swing` в мире) при пересечении `attack.age = meleeHitTime − 0.120`: ≈0.315 с для A и ≈0.445 с для B/overhead. Реальный offset измерить по принятой записи, не считать его гарантированными 120 мс.

Не запускать весь composite на существующем `final.slash`: тогда свист и пик запоздают. Если использовать composite, его удар заменяет нынешний звук `final.slash`, а не дублирует его. Для точной поддержки заморозки между свистом и контактом полезно разрезать принятую запись на свист и акцент: свист — на предложенном событии, акцент — на существующем `final.slash`. Отдельная генерация третьего Melee не обязательна. Подготовительный `final.sword` в начале замаха — другое событие, не точка воспроизведения всего этого файла.

### B1. Charge: Prompt A

```text
One sudden forward charge by a heavily armored warrior. A sharp push-off leads into heavy armor rattle and an aggressive air whoosh for about a third of a second, then a firm foot plant and a short scrape as the warrior brakes. Fast and forceful, with no collision or explosion. No voices, music, background ambience or long reverb. Duration: 0.7 seconds.
```

### B2. Charge: Prompt B

```text
One short armored dash. A dry boot kick and a tight clank of armor launch a dense rush of air, followed after about a third of a second by a gritty braking scrape and a brief gear rattle. Make the movement feel heavy but quick, with a controlled stop. No crash, weapon strike, voices, music, background ambience or long reverb. Duration: 0.7 seconds.
```

**Разница:** A — больше воздушного напора и плотности брони; B — более сухая атака, акцент на обуви и скольжении при торможении. Завершение мощное за счёт опоры ног и массы, без выдуманного столкновения.

**Файлы для выбора:** `ash-warden-charge-a.wav`, `ash-warden-charge-b.wav`. Это composite движения и торможения для художественной проверки, без 650 мс подготовки и без следующего Flame Strike.

**Синхронизация:** начало движения — `chargeStart` / `final.charge`; через ≈0.323 с начинается `chargeStop` / `final.stop`, торможение заканчивается ещё через 0.300 с. Визуальные акценты старта и остановки живут 160 и 240 мс соответственно. Лучше подключать два коротких файла к уже существующим двум cues: так остановка останется на своей фазе при заморозке. Для цельного composite потребуется согласовать offset остановки и убрать повторный звук `final.stop` только для этого варианта подключения. Не назначать торможение факту урона игроку.

`final.charge-warning` остаётся ранним предупреждением на начале `chargeWindup`; дополнительный звук подготовки для этой задачи не нужен. Collision SFX не предлагается: отдельного события столкновения в этой атаке нет.

### C1. Flame Strike: Prompt A

```text
One heavy greatsword strike that releases a broad wave of fire forward. A solid weapon impact triggers instant ignition, followed by a fast spreading rush of flames and a short crackling tail. Keep the strike crisp and the fire low and wide, with controlled bass and a quick natural decay. No fireball launch, explosive boom, voices, music, background ambience or long reverb. Duration: 0.7 seconds.
```

### C2. Flame Strike: Prompt B

```text
One powerful sword strike sending a fan of fire across the ground. A dry metallic thud and a brief steel scrape lead immediately into a coarse rolling flame whoosh, ending with a few sharp fire crackles. Make the fire sweep outward quickly rather than burst in one place. No projectile whistle, meteor crash, voices, music, background ambience or long reverb. Duration: 0.7 seconds.
```

**Разница:** A — резкий чистый удар и гладкий широкий огненный выброс; B — более зернистая фактура стали и катящегося по земле пламени. Вариант B особенно поддерживает веер поздних фаз, но не требует отдельного звука для каждой полосы.

**Файлы для выбора:** `ash-warden-flame-strike-a.wav`, `ash-warden-flame-strike-b.wav`. Принятый файл: `ash-warden-flame-strike.wav`.

**Синхронизация:** существующий `cleaveImpact` / `final.cleave` на входе в `swordActive`. Удар должен быть у самого начала записи, за ним сразу воспламенение и короткое расширение огня примерно за 90 мс. Не откладывать удар на конец звука и не запускать его в начале 600 мс подготовки. Слабые ранние VFX-кадры уже существуют до контакта; они не требуют отдельного мощного аудиособытия.

**Один эффект достаточен.** Удар и огонь образуют одно быстрое действие. Для 1/3/5 направлений — один cue на атаку, без наложения одинаковых записей по числу полос или сегментов. Новые события sword impact / fire wave здесь не обязательны.

### D1. Meteor: Prompt A

```text
A single flaming meteor drops fast and strikes the ground. About 0.3 seconds of deep hot-air whistle leads into a heavy rocky impact, cracking stone and a brief burst of fire, then a short gritty decay. Give it solid weight without a cinematic sub-bass boom. No repeated impacts, long rumble, voices, music, background ambience or long reverb. Duration: 0.8 seconds.
```

### D2. Meteor: Prompt B

```text
A single burning boulder falls and hits hard ground. A rough rushing-air hiss builds for about 0.3 seconds, then ends in a blunt low thud, a dry stone crack and a compact flare of crackling fire. Make it dense and punchy, with a short debris tail. No lingering bass drone, repeated explosions, voices, music, background ambience or long reverb. Duration: 0.8 seconds.
```

**Разница:** A — глубже свист падения и более отчётливое раскалывание камня; B — более грубый воздушный шум и тупой плотный контакт. Босс должен ощущаться немного тяжелее Meteor героя за счёт каменного тела и огненной фактуры, без длинного взрыва и гипертрофированного баса. Финальное сравнение громкости возможно только после прослушивания обоих файлов.

**Файлы для выбора:** `ash-warden-meteor-a.wav`, `ash-warden-meteor-b.wav`. Это composite одного падения и одного удара для проверки, не многократный метеоритный дождь.

**Синхронизация:** `m.age = 1.000 с` — начало падения; `m.age = 1.300 с` — удар. Для цельного файла нужен **новый**, пока отсутствующий cue `final.meteor-fall` (`final-meteor-fall` в мире) при пересечении `m.age = m.warning − 0.300`, один раз на `m.id`. Его собственный пик должен прийти через 300 мс; в этом варианте существующий `final.impact` нельзя дополнительно озвучивать тем же ударом.

**Предпочтительно разделить падение и удар:** новый `final.meteor-fall` для воздуха, существующий `final.impact` для контакта. Так сохраняются реальные удары при заморозке, задержках серии и отмене метеорита. Не использовать для падения `final.warning` на age=0, `final.cast` или `meteorRelease` на 550 мс: все они происходят раньше видимого полёта. При отрицательном `m.age` будущий метеорит ещё не должен звучать.

## 4. Дополнительные короткие промпты для разделённых фаз

Нужны только для рекомендованного подключения Charge и Meteor по фазам. Сначала можно попробовать разделить выбранные composite-записи; дополнительные генерации — лишь если границы не удаётся получить чисто. Для Basic Melee достаточно разделения принятой записи при необходимости; Flame Strike оставляем единым.

### Charge movement — `ash-warden-charge-move.wav`

```text
A sudden push-off into one short armored rush. A tight boot kick, heavy armor rattle and a forceful air whoosh, with the movement concentrated in the first third of a second and a quick fade. No braking, collision, weapon impact, voices, music, background ambience or long reverb. Duration: 0.5 seconds.
```

Запуск: `final.charge` / `chargeStart`. Полезное движение ≈0.323 с, остальное — короткое затухание. Предлагаемые priority **11**, gain **0.40–0.45**.

### Charge brake — `ash-warden-charge-stop.wav`

```text
A heavily armored warrior plants a foot and brakes to a stop. One firm boot thud, a short gritty scrape and a little armor rattle, fading quickly. Heavy and controlled, with no collision, crash, sword hit, voices, music, background ambience or long reverb. Duration: 0.5 seconds.
```

Запуск: существующий `final.stop` / `chargeStop`, начало `chargeBrake`. Основной акцент сразу, скольжение и дребезг преимущественно в первые 0.24–0.30 с. Предлагаемые priority **10**, gain **0.30–0.40**.

### Meteor falling — `ash-warden-meteor-fall.wav`

```text
One flaming rock rushing downward through hot air. A deep air whistle and a rough fiery hiss swell quickly for about 0.3 seconds, then fade out cleanly. Keep it tense and compact. No ground impact, explosion, rock breaking, voices, music, background ambience or long reverb. Duration: 0.5 seconds.
```

Запуск: предложенный `final.meteor-fall`, `m.age` пересекает `m.warning − 0.300`. Целевой полёт 0.300 с; при будущей подготовке файла подогнать воздушную часть к этой фазе. Предлагаемые priority **9**, gain **0.20–0.30**. Воздух ниже по приоритету, чем предупреждение и контакт.

### Meteor impact — `ash-warden-meteor-impact.wav`

```text
One heavy flaming rock strikes the ground immediately. A compact low thud and a sharp stone crack are followed by small rocky fragments and a brief flare of crackling fire. Punchy and weighty, with a short natural decay. No falling lead-in, repeated impacts, long bass rumble, voices, music, background ambience or long reverb. Duration: 0.5 seconds.
```

Запуск: существующий `final.impact`, когда Meteor становится `landed` на `m.age ≥ m.warning`. Транзиент у начала файла, затухание в пределах существующих 0.500 с после контакта. Предлагаемые priority **11**, gain **0.45–0.55**.

## 5. Предложения по подключению и миксу

Ничего из этого раздела сейчас не реализовано.

| Основной эффект | Рекомендуемый priority | Начальный cue gain | Примечание |
| --- | --- | --- | --- |
| Basic Melee | 11 | 0.35–0.45 | Плотный, но самый спокойный из трёх ударов меч/огонь/камень; не утомлять повторением. Для отдельного свиста достаточно priority 8 и gain 0.20–0.25. |
| Charge composite | 11 | 0.40–0.45 | Держать старт читаемым; для разделённых movement/stop использовать значения выше и не воспроизводить composite одновременно. |
| Flame Strike | 11 | 0.50–0.60 | Акцент сильнее обычного меча; одна запись на весь веер. |
| Meteor composite | 11 | 0.45–0.55 | При разделении падение тише удара. Вес относительно героя проверять на сопоставимой воспринимаемой громкости. |

Это стартовые коэффициенты для будущих подготовленных файлов, не измеренная громкость и не проценты общей громкости игры. Сначала выровнять воспринимаемую громкость выбранных кандидатов; не нормализовать их бездумно только по пику. Текущий gain процедурного patch нельзя напрямую считать эквивалентом gain новой записи. Сохранить SFX bus и пользовательские настройки. Для boss Meteor допустим ориентир на **1–2 dB** громче одиночного Meteor героя после сравнения в игре; большую часть тяжести передать тембром, а не общей громкостью.

Действующие ограничения: 12 one-shot voices, из них до 10 SFX и 2 UI; более высокий priority важнее. `player.death` имеет priority 12 — новым атакам его не присваивать. Сразу несколько одинаковых cues объединяются в `AudioPresentation`; `gap` у `final.impact` сейчас **0.20 с**, а шаг метеоритной серии — **0.15 с**. Поэтому текущая аудиосистема может пропускать часть отдельных ударов серии. При будущей интеграции надо отдельно выбрать: сохранить разреженное озвучивание или уменьшить gap, например до 0.12 с, вместе с проверкой voice budget. Одного нового WAV недостаточно для обещания звука каждого Meteor.

Не складывать несколько полногромких ударов в один кадр. Сохранять объединение одновременных cues, а для плотных серий проверить уменьшение gain отдельных ударов. Не умножать Flame Strike по количеству полос. Не запекать случайное стереопанорамирование в файлы: существующие cues не передают позицию источника.

Новые фазовые cues должны срабатывать по пересечению возраста в симуляции, с защитой от повтора; не через произвольный `setTimeout`. Для melee использовать экземпляр атаки, для падения — `m.id`, не общий id каста. Боссовые Meteor используют `bossDt`, Meteor арены — обычный `dt`; заморозка босса не останавливает аренные Meteor. Цельный уже запущенный буфер не сможет сам задержать будущий удар при такой заморозке — этим обосновано разделение падения и контакта. Остановку/отмену активных звуков при очистке боя потребуется проверить на этапе реализации.

Каталоги: исходные варианты после разрешённой генерации сохранены в `art/generated/ash-warden-sfx-v1/` как оригинальные MP3; будущие принятые игровые WAV предлагается размещать в `public/assets/audio/ash-warden-sfx-v1/`, этот runtime-каталог пока не создан. Преобразования, обрезки или изменения существующих аудиофайлов не выполнялось.

## 6. Художественная приёмка

После будущей генерации проверить: один понятный жест на запись; ясный транзиент; отсутствие клиппинга и посторонних событий; короткий естественный хвост; читаемость в бою с музыкой и атаками Mage. Для Melee сверить контакт обоих боковых вариантов; для Charge — торможение без crash; для Flame Strike — быстрый вынос огня вперёд; для Meteor — 300 мс падения и короткий каменно-огненный удар. Затем выбрать A **или** B отдельно для каждой атаки. Ни один вариант пока не одобрен и не прослушан.

| Attack | Prompt A | Prompt B | Duration | Trigger event | Status |
| --- | --- | --- | --- | --- | --- |
| Basic Melee | [A1: steel whistle + solid impact](#a1-basic-melee-prompt-a) | [A2: steel scrape + muted thud](#a2-basic-melee-prompt-b) | 0.6 s | Composite: proposed `final.melee-swing`, peak at `hitFrame`; split impact: existing `final.slash` | Awaiting Review |
| Charge | [B1: air rush + armor](#b1-charge-prompt-a) | [B2: boot kick + braking scrape](#b2-charge-prompt-b) | 0.7 s; split 0.5 + 0.5 s | Existing `final.charge` / `chargeStart`; brake: `final.stop` / `chargeStop` | Awaiting Review |
| Flame Strike | [C1: ignition + broad fire wave](#c1-flame-strike-prompt-a) | [C2: gritty rolling flames](#c2-flame-strike-prompt-b) | 0.7 s | Existing `final.cleave` / `cleaveImpact` | Awaiting Review |
| Meteor | [D1: deep whistle + rocky impact](#d1-meteor-prompt-a) | [D2: rough air + blunt stone hit](#d2-meteor-prompt-b) | 0.8 s; split 0.5 + 0.5 s | Proposed `final.meteor-fall` at warning − 0.3 s; existing `final.impact` at landing | Awaiting Review |
