# Ash Warden — подключение принятых Walk, 2026-11-07

В текущей ветке `main` подключены все четыре принятые анимации движения Ash Warden. Пользователь явно разрешил интеграцию East/West и предоставил новые North/South. Прежний запрет подключать экспериментальный RD V2 до приёмки выполнен: эта интеграция использует принятый East и новые пользовательские GIF, а не прежний неудачный RD North или Aseprite pilot.

## Источники и timing

| Направление | Канонический источник | Кадры / цикл | Runtime |
|---|---|---|---|
| East | `art/generated/ash-warden-walk-rd-v2/incoming/east/east-walk.gif` | 12 × 150 ms / 1800 ms | `east-walk` |
| West | Полное горизонтальное зеркало East | 12 × 150 ms / 1800 ms | `west-walk`, East textures + `flipX` |
| North | `art/generated/ash-warden-walk-manual-v1/north/walk/north.gif` | 12 × 150 ms / 1800 ms | `north-walk` |
| South | `art/generated/ash-warden-walk-manual-v1/south/walk/south.gif` | 12 × 150 ms / 1800 ms | `south-walk` |

Парные PNG (`east-walk-spritesheet.png`, `north.png`, `south.png`) проверены как reference sheets. Каждый sheet — 3072×2304, сетка 4×3. Порядок и alpha совпадают с GIF, но RGB различаются; точные числа различающихся пикселей записаны для каждого кадра в `metadata.json`. Цвета PNG и GIF не смешивались: runtime использует только GIF pixels и GIF durations. Исходные GIF/PNG не перезаписаны; SHA256 сохранены.

Каждый GIF имеет native canvas 768×768. Проверка всех кадров установила точные одинаковые блоки 4×4, поэтому выполнено одно фиксированное lossless уменьшение до logical 192×192, без фильтрации, изменения пропорций, bbox fitting и индивидуального центрирования. Pivot (96,154), world scale 0.6548310811 сохранены. Оригинальные native файлы остаются неизменными. Прозрачность сохранена; непрозрачных пикселей на границе исходных кадров нет. Сохранены 48 RGBA PNG движения и соответствующие emission masks в `art/generated/ash-warden-walk-integrated-v1/`.

## Подключение в игре

- `scripts/build-ash-warden-runtime.mjs` читает новый пакет, заменяет только четыре runtime Walk clip и исключает прежние Walk body/masks из сборки.
- `src/game/art/ashWardenManifest.json` и `public/assets/hd/ash-warden-v1/` пересобраны. Существующий выбор `${face}-walk` при движении уже использует эти clips; дополнительная логика AI не требуется.
- West переиспользует East body и emission textures, зеркалируя персонажа целиком. Сохранены руки, меч и ветви.
- Phase 3 emission masks рассчитаны по новым позам по прежнему правилу выделения магмы. Старые 8-кадровые маски не накладываются на новые 12 кадров.
- Цикл всех направлений одинаковый, используется существующий `bossClock`. Freeze и pause удерживают body/emission pose; при остановке выбирается прежний Idle. Переключение направления не создаёт отдельного сброса clock.

Атлас занимает 4 страницы, 16 MiB RGBA вместо прежних 14 MiB: в рамках существующего лимита 16 MiB. Всего 51 clip, 414 уникальных текстур. Позиции текстур в атласе изменились после упаковки; их logical offsets и pivot сохранены. Trim служит только упаковке прозрачных полей и не меняет размер персонажа в мире.

Сохранение 47 остальных clips и 348 используемых ими текстур проверено отдельно: clip descriptors и RGBA пиксели совпадают с pre-integration baseline. Не изменены AI, chase speed, фазы боя, Charge, Cleave, Meteor, Death, Idle или атаки. Проверены SHA256 всех 3401 защищённых файлов: прежние art-пакеты, Aseprite pilot, пользовательские originals, gameplay и существовавшие тесты не изменились вне явного integration allowlist.

Оригинальный цикл 1.8 s сохранён без ускорения и без изменения скорости босса. Эта задача не вводит Run или динамическое согласование cadence с world speed; отсутствие foot sliding на высоких скоростях не заявляется.

## Проверки

| Проверка | Результат |
|---|---|
| `node art/generated/ash-warden-walk-integrated-v1/verify.mjs` | PASS: 48 body/mask кадров, 11014 emission pixels, 47 non-Walk clips, 348 non-Walk textures, 3401 protected hashes |
| `npm.cmd run check` | PASS: typecheck, lint, 673/673 unit tests в 84 файлах, production build |
| `ash-warden-walk-approved.spec.ts --workers=1` | 2/2 PASS: 1280×720 и 844×390 |
| `ash-warden-integration-v1.spec.ts --workers=1` | 2/2 PASS: прежний сценарий полного боя на desktop/mobile |
| `git diff --check` | PASS |

Новый браузерный тест проверил реальное преследование во всех направлениях: фактическое перемещение boss entity, прохождение всех 12 индексов каждого цикла, freeze/pause, возврат Idle, Phase 3 pose и отсутствие JS/texture errors. Сохранены `game-validation-1280.json`, `game-validation-844.json` и 16 снимков игрового Canvas (`*-walk.png`, `*-phase3.png`). Это реальная Phaser сцена на Burning Grove с Mage, а не только DOM или отдельный viewer. Снимки остановленных поз скрывают pause dialog только CSS-стилем захвата; production UI не менялся. На мобильном размере верх персонажа может перекрываться существующим HUD; source/atlas clipping проверен отдельно и отсутствует.

Отдельно открыта production-сборка через локальный `vite preview` на `http://127.0.0.1:5200/`: тренировка Стража запускается, загружены все 4 atlas PNG/JSON, тестовый DEV bridge отсутствует, pause работает. Снимок: `screenshots/production-practice.png`.

Во время разработки новый E2E сначала прочитал ещё не обновлённую render pose. Ожидание исправлено на clip + frame index, затем оба viewport прошли. Один параллельный запуск unit suite превысил существующий 5 s timeout survival-теста; timeout и тест не менялись, полный последовательный `npm.cmd run check` прошёл 673/673. Проверки не отключались.

## Воспроизведение

В корне проекта:

```sh
node art/generated/ash-warden-walk-integrated-v1/import.mjs
node scripts/build-ash-warden-runtime.mjs
node art/generated/ash-warden-walk-integrated-v1/verify.mjs
```

`prepare.mjs` и pre-integration baseline сохранены для аудита. Их не следует заменять новым baseline после интеграции. Новые зависимости не устанавливались, платные генерации не вызывались. Commit, push, deploy и новая ветка не выполнялись.

## Публикация после приёмки

Пользователь принял движение в игре и отдельно разрешил commit/push в `main`. В публикацию входят runtime, финальная интеграция босса, тесты и точные исходники, необходимые для проверки и повторной упаковки атласов. Экспериментальные viewers, прочие арт-варианты и локальные screenshots/telemetry не нужны runtime и остаются в рабочем каталоге. Основная проверка `verify.mjs` теперь переносима: проверяет все source hashes из runtime manifest, новые позы/masks и прежние non-Walk clips. Дополнительный `--audit-originals` проверяет полный исходный baseline3401 на рабочей машине, где сохранены все исторические эксперименты. Эта опция не заменяет обязательные проверки runtime. Deploy не запрашивался.

Перед публикацией подготовленный Git index экспортирован в отдельную чистую копию без игнорируемых локальных экспериментов. В ней прошли обязательные 454 source hashes, 48 movement poses/masks и non-Walk regression; сборка атласов воспроизвела все PNG побайтово и JSON семантически. Полный `npm.cmd run check` в этой копии прошёл: 673/673 теста, typecheck, lint и production build. Таким образом, проверена именно публикуемая совокупность файлов, без зависимости от отсутствующих в Git арт-пакетов. `git diff --cached --check` также прошёл.
