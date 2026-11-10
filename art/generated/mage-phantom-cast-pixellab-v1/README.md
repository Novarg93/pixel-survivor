# Arcane Phantom Cast — PixelLab Pilot V1

Пилот принят. Последующая игровая реализация всех направлений находится в
[mage-phantom-cast-production-v1](../mage-phantom-cast-production-v1/README.md).
Этот Viewer сохраняет первоначальный North Run / South Cast для сравнения.
Исходная проверка protected-before фиксирует состояние ДО игровой интеграции;
актуальная проверка защиты domain/атласов — `node scripts/inspect-mage-phantom.mjs`.

Viewer: [viewer.html](viewer.html)

HTTP: [открыть в Chromium](http://127.0.0.1:5173/art/generated/mage-phantom-cast-pixellab-v1/viewer.html).
Viewer также открывается двойным щелчком по `viewer.html`, без сервера. HTML,
`viewer.js`, `viewer-data.js`, CSS и папки изображений должны лежать вместе.
Для HTTP нужен локальный Vite проекта на порту 5173. Если сервер остановлен, из корня:
`npm.cmd run dev -- --host 127.0.0.1 --port 5173`.

Это отдельный художественный пилот для ручной приёмки. Игровая интеграция отсутствует.
Использован актуальный Mage с короткими каштановыми волосами, бородой, золотыми
наплечниками, синими рукавами и зелёной передней частью одежды.

## Просмотр

По умолчанию настоящий Mage бежит NORTH, а верхняя проекция кастует SOUTH.
Основной Run не останавливается. Фон — экспорт реального painter Рощи осколков,
движущийся относительно героя. Снаряд в Viewer только демонстрирует направление.

Доступны Run only, Phantom only, Run + Phantom, standing + Phantom и сравнение
«Обычный каст спиной / Phantom Cast». В сравнении используется та же новая модель
и её реальные северные Cast/Run с текущими waist landmarks.

Есть Play/Pause, скорости 0.25/0.5/1/2, Zoom 1/2/4, покадровый scrub, переключатели
фантома, anchor, направления, демонстрационного Fireball и повтора демо.
Каждую длительность можно менять отдельно и скачать обновлённый timing JSON.
Повтор демо — настройка Viewer; сам клип и GIF — one-shot.

Оценивать прежде всего при Zoom 1: номинальный полный холст Mage занимает 80 px
на desktop 1280×720 и около 51 px на landscape 844×390. Zoom 2/4 предназначен
для изучения пикселей, а не для оценки игрового размера.

## Кадры и редактирование

- 12 слотов, 340 мс; длительности: 20,20,20,30,30,30,40,40,30,30,30,20 мс.
- 10 видимых поз: две принятые directional-позы North/East для быстрого поворота
  при проявлении и восемь сгенерированных South-поз руки. Кадры 00 и 11 пустые.
- Release начинается на кадре 06, в 150 мс; короткая вспышка в 06–07.
- Native PNG 256×256, общий shoulder anchor (128,64), без подгонки bbox/масштаба
  по кадрам. Встроенное смещение проекции записано в `animation.json`.
- Pivot исходного полного Mage (128,252), runtime canvas 112×112,
  runtime pivot (56,110.25), display size 40 world units. Run: 8×60 мс, loop.

[phantom-cast.aseprite](phantom-cast.aseprite) содержит четыре редактируемых слоя:
Phantom Glow, Phantom Upper Body, Phantom Arm Hand, Small Cast Sparks.
Редактор может зацикливать предпросмотр тега; one-shot задаётся экспортом/metadata.
Ноги из исходной нейросетевой генерации отсутствуют во всех processed-кадрах и слоях.
Нижний край оформлен сужающейся alpha-маской и редкими возвращающимися частицами.
Голова восстановлена пиксель-в-пиксель из утверждённых directional-референсов,
после общего холодного цветового преобразования. Жест руки действительно покадровый.

Основные файлы:

| Файл | Назначение |
| --- | --- |
| `processed/frame-00.png` … `frame-11.png` | Полные RGBA-кадры, главный источник alpha |
| `phantom-cast.png` | Spritesheet 1024×768, 4 колонки × 3 ряда |
| `layers/*.png` | Четыре отдельных слоя, та же сетка и anchor |
| `animation.json`, `frame-timings.json`, `phantom-cast.json` | Тайминг, anchor, события, Aseprite metadata |
| `phantom-cast.gif` | One-shot 512×512 на реальном фоне с настоящим Run |
| `phantom-cast-alpha.gif` | One-shot 256×256, только фантом, ограниченная GIF-прозрачность |
| `reference/` | Копии принятой модели, directional/Idle/Run/Cast, reconstructed runtime и фон |
| `raw/` | Все 33 исходных PNG трёх запросов PixelLab и квитанции |
| `comparisons/` | Контактные листы и редактируемый композит GIF |
| `screenshots/` | Canvas desktop/mobile, все режимы и увеличение |
| `validation/` | Проверки PNG, GIF, Aseprite, Chromium и защищённых файлов |

GIF не поддерживает полупрозрачность RGBA. Поэтому основной GIF заранее скомпозирован
с фоном и Run, сохраняя видимую прозрачность фантома. Отдельный alpha GIF имеет
ограничения палитры и бинарной прозрачности; для оценки alpha использовать Viewer/PNG.

## PixelLab и расходы

Перед каждым платным запросом проверялась стоимость по официальной
[странице API PixelLab](https://www.pixellab.ai/pixellab-api), 2026-11-09.
Изучены image/reference editing, PixMiniMax, animation и skeleton v3.
Для сохранения одежды использована точная утверждённая модель как first frame,
для управления рукой — COCO skeleton. Новые другие направления не генерировались.

| Запрос | Реальный MCP-инструмент | Результат | Списано subscription generations |
| --- | --- | --- | --- |
| 01 | `animate_image_pixminimax` | 9 PNG; отклонён: боковой выпуск/большой шар | 1 |
| 02 | `animate_with_skeleton_v3` | 12 PNG; отклонён: шар закрывает ладонь | 3 |
| 03 | `animate_with_skeleton_v3` | 12 PNG; выбран: открытая ладонь без шара | 3 |

Фактически: **7 subscription generations**, баланс 1657.90 → 1650.90;
**$0 денежных API-кредитов списано**. Публикуемый API-эквивалент трёх запросов
оценивается в **$0.1257–$0.1475**, ниже лимита $2. Это оценка по прайсу, не счёт
в долларах за подписку. Подробности: `actual-expenses.json`, `generation-manifest.json`.
Private download/upload URLs и API-ключи не сохранены.

## Художественная приёмка

См. [ART_REVIEW.md](ART_REVIEW.md): сохранены конкретные дефекты отклонённых вариантов
и ограничения выбранного. Пилот не объявляется production-ready до ручной приёмки.

## Повторение бесплатной обработки и проверки

`process-phantom.lua` выполняется через Aseprite MCP batch с аргументами root,
input (`raw/attempt-03-empty-palm`), stabilizeHead=true и script. Затем из корня:

```powershell
node art/generated/mage-phantom-cast-pixellab-v1/finish-assets.mjs
node art/generated/mage-phantom-cast-pixellab-v1/validate.mjs
node art/generated/mage-phantom-cast-pixellab-v1/validate-loading.mjs
```

Композит GIF: `capture-preview.mjs`, затем `export-preview-gif.lua` через Aseprite,
затем `finalize-gif.mjs`. Это локальная обработка без новых запросов генерации.
После ручного изменения `animation.json` или `reference/runtime-clips.json` выполнить
`node art/generated/mage-phantom-cast-pixellab-v1/bundle-viewer-data.mjs` для обновления
локального data script. `finish-assets.mjs` вызывает его автоматически.
`prepare.mjs` — первоначальная фиксация источников; после создания expense ledger
он намеренно запрещает повторный запуск, чтобы не перезаписать исходный baseline.

Проверка Chromium прошла на 1280×720 и 844×390, все режимы/скорости/scrub/retiming,
без JS/HTTP ошибок. Протестированы фактические длительности обоих GIF, one-shot,
непрерывный Run, отсутствие обрезания/ног, fixed anchor и исходные головы.
SHA-256 **281 игрового/сборочного файла** совпали с baseline начала пилота.
Полный build и gameplay E2E не запускались: файлы сборки/runtime не изменялись.

Ветка `main`, commit/push/deploy не выполнялись. Следующий шаг — ручная арт-приёмка.

Исправление открытия с диска: module script и JSON fetch заменены обычными scripts
и локальным `viewer-data.js`. Проверены четыре открытия file/HTTP на desktop/mobile
и ошибки отсутствующих/зависших ресурсов. Загрузка ограничена10s на изображение;
ошибка содержит путь проблемного файла и не остаётся вечной надписью ожидания.
