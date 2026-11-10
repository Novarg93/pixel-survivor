# Mage Blink V1 — departure A / arrival B

**Принято и подключено к игре 2026-11-09**, вместе с направленным casting.
[Контракт интеграции и gameplay screenshots](../../../docs/art/MAGE_BLINK_V1_INTEGRATION.md).
Production использует отдельный atlas из точных back/front кадров; viewer остаётся
самостоятельным и открывается с диска.

Открыть **[viewer.html](viewer.html)** двойным щелчком. Интернет и Vite для демо не нужны. Можно также открыть через локальный Vite: `/art/generated/mage-blink-v1/viewer.html`.

Два оригинальных эффекта созданы через **PixelLab VFX Workbench** по [production brief](BRIEF.md) и [актуальному art style guide](../../../docs/art/PIXEL_SURVIVOR_ART_STYLE_GUIDE.md): крупные пиксельные ленты разрыва, разорванная печать у стоп, немного осколков, indigo/violet/lilac. Это точный авторский renderer PixelLab, не AI image generation; по документации инструмента списаний нет. Расход: **$0**. Принцип фаз и краткого пика сверялся с Flame Strike C; цвет и рисунок остаются arcane.

- **A / Departure:** печать и ленты сходятся в тонкий разрыв; частицы втягиваются.
- **B / Arrival:** светлый разрыв раскрывается, ленты расходятся и распадаются.
- Каждый клип: **128×128, 8×40 мс = 320 мс, one-shot**, последний кадр прозрачный.
- Общий якорь стоп: **[64,104]**. Первый светлый пик — кадры 1–2. Альфа бинарная; до 7 фактически использованных RGB-цветов в кадре, без blur/dither и пикселей на границе canvas.
- Герой: точные 13 idle-поз текущего Mage V2, canvas96, pivot[46,84]. Плотность и дистанция112 следуют текущим данным игры. Оба эффекта запускаются одновременно, герой сразу находится в B: `MOBILITY.mage.duration=0`. Задержки телепорта нет.

В viewer есть общий Blink, сравнение и отдельные A/B, Grove / Dark Forest / checker / neutral, три масштаба, скорость, пауза, повтор, шаги и 16 миниатюр. Пробел переключает паузу, если фокус не в элементе управления. В reduced-motion показ начинается с паузы. На скрытой странице RAF останавливается; pagehide отменяет кадр, BFCache pageshow возобновляет его. Таймеров нет.

Фоны — PNG, захваченные из настоящих runtime terrain painters (`backgrounds.json`), по 2048×1024, 2 texels/world unit. Масштаб земли и героя меняется совместно; 1:1 — один world unit на пиксель внутреннего canvas, CSS может уменьшать canvas на узком экране. Это **art-preview, не gameplay screenshot**. Стандартное увеличение — ровно 2× исходные пиксели спрайтов, nearest-neighbor.

## Ассеты и воспроизведение

`source/` хранит неизменённые PNG/GIF/JSON/ZIP PixelLab и распакованные game packs, recipe/seed/step/effect IDs и download SHA256. `source/departure.recipe.json` — ранний просмотр; финальный A — `source/departure-final.recipe.json`, финальный B — `source/arrival.recipe.json`. [Provenance](source/pixellab-provenance.json) содержит ссылки My effects. В PixelLab доступны sliders палитры и toggles лент/осколков.

`prepared/` содержит компактные 512×256 sheets: целый эффект, back и front отдельно для каждого клипа. Каждый кадр восстановлен в исходный canvas128 по общему offset из game pack, без индивидуального центрирования. Прозрачный кадр8 восстановлен из полного экспорта: game pack опускает пустой хвост. Сумма back+front **побитово совпадает** с whole для обеих анимаций. Между ними viewer рисует героя. Whole-клипы удобны для простого проигрывания, back/front — для будущей интеграции с сортировкой глубины.

```powershell
node scripts/build-mage-blink-v1.mjs
# Только для повторного захвата фонов при работающем Vite на5187:
node scripts/capture-mage-blink-backgrounds.mjs
# Повторное скачивание оригиналов требует доступа к PixelLab download URLs:
node scripts/collect-mage-blink-v1.mjs
```

`animation.json` — метаданные, кадры и SHA256; `viewer-data.js` — тот же контракт для file:// без fetch. Для будущего движка воспроизводить 8 кадров по40мс с якорем[64,104]; очищать эффект после320мс. Файлы `source/*/game/manifest.json` описывают оригинальные trimmed offsets. Не брать их семь непустых кадров за полную длительность клипа.

## Проверки — 2026-11-09

- `npm.cmd test -- --maxWorkers=2 tests/unit/mage-blink-v1.test.ts tests/unit/player-visuals-boss-bar.test.ts`: **11/11**, в том числе7 новых asset/timeline тестов и4 регрессии выключенных Mage VFX/HP-фокуса.
- `PIXEL_E2E_PORT=5187 node scripts/e2e.mjs mage-blink-v1.spec.ts`: **4/4**. HTTP + file://; viewport1280×720,390×844,844×390; мгновенное A→B, one-shot/повтор, пауза/шаги/seek,16 миниатюр, режимы, фоны, переключение героя, масштаб и отсутствие overflow/console errors. Отключение героя проверено сравнением настоящих Canvas screenshots; file:// запрещает toDataURL для загруженных с диска изображений, самому viewer readback не нужен.
- Typecheck, lint и production build: **PASS**. Обычное предупреждение Vite о крупном chunk осталось. Полная unit/E2E suite игры в этой art-задаче не запускалась.
- [Desktop](screenshots/viewer-1280.png), [mobile](screenshots/viewer-390.png), [1:1](screenshots/world-scale-1280.png), отдельные Canvas кадры и JSON evidence лежат в `screenshots/`; финальные screenshots просмотрены.
- Размеры декодированных PNG viewer дают 20,512,768 RGBA bytes (19.56 MiB), включая обе большие backplates; это арифметика поверхностей, **не замер VRAM/FPS игры**. Игра загружает отдельный 2 MiB atlas эффектов; backplates и hero-sheet viewer ей не нужны.

После приёмки эта пара подключена через MageBlinkArt:32 точных depth-кадра,
pool4, направления casting, pause/restart и reduced flash проверены. Arcane
Shield и прежний примитивный Blink overlay остаются скрытыми. Новые проверки:
998 unit и25 разных browser-сценариев (14 DEV +11 production); подробности
и ограничения замеров — в отчёте интеграции выше.
