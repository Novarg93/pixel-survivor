# Mage · North Walk / Run · PixMiniMax

Открыть **[viewer.html](viewer.html)**: walk и run рядом с исходной северной
позой, пауза, переключение кадров, скорость и три фона. Просмотр работает
локально без сервера и сети.

| Клип | GIF | PNG, 4×4 | Редактируемый файл |
| --- | --- | --- | --- |
| Walk | [walk-north.gif](walk/walk-north.gif) | [walk-north.png](walk/walk-north.png) | [walk-north.aseprite](walk/walk-north.aseprite) |
| Run | [run-north.gif](run/run-north.gif) | [run-north.png](run/run-north.png) | [run-north.aseprite](run/run-north.aseprite) |

По 16 кадров 256×256, прозрачный фон. Первый кадр для генерации извлечён
без масштабирования и ретуши из `../8-directions.png`: центральная ячейка
второго ряда, x=256, y=256. Сохранён как `first-frame-north.png`.

Запущен `animate_image_pixminimax` с `frame_count=16`, `direction=north`,
`view=low top-down`, `enhance_prompt=true`, `no_background=true`.
Seeds: Walk 8110861, Run 8110862. Первоначальные промпты находятся в
`requests.json`, улучшенные сервисом — в `walk-receipt.json` и
`run-receipt.json`. В запросе первый кадр передавался как data URL.

Walk: ровные приземлённые шаги, спокойный корпус и покачивание плаща.
Run: согнутые локти, более энергичная работа рук и ног, наклон и более
активный плащ. Ракурс сохраняется со спины. К концу оба клипа возвращаются
к нейтральной позе: так промпт был расширен AI enhancement.

API возвращает **17 изображений: исходное + 16 новых**. В каждой папке
`raw/` сохранён полный ответ, frame-00 — исходный кадр. GIF/PNG/Aseprite
используют ровно 16 новых изображений frame-01…frame-16 без перестановки,
дорисовки, выравнивания или цветокоррекции. JSON описывает рамки кадров.
PNG strip нужен для импорта в Aseprite.

Темп GIF/просмотра выбран для оценки: Walk 80 мс/кадр (1.28 с), Run
60 мс/кадр (0.96 с); PixelLab вернул PNG без времени кадров. Это не
зафиксированные игровые тайминги. В Aseprite один слой с исходными
растровыми кадрами, не отдельные анатомические слои.

Проверки: 8 originals неизменны, 39 PNG CRC корректны, оба исходных
frame-00 совпадают с crop по RGBA, 32 новых кадра уникальны внутри клипов,
edge/clipping pixels 0, alpha только 0/255. PNG↔GIF цвета/alpha и
PNG↔спрайтлист: различий 0. Viewer playback, pause, кадры 1/8/16,
переход 16→1 и mobile layout проверены. Доказательства: `validation.json`;
9 review outputs воспроизводятся побайтно, см. `reproduction.json`.

Расход: **4.10 генерации подписки** (2×2 анимации + 2×0.05 enhance).
Баланс 1827.70→1823.60, USD credits 0→0. Повторных генераций нет.
IDs заданий/галереи и параметры: `generation-record.json`.

Это арт-кандидаты для оценки; текущая модель мага в игре не заменялась.
Полный отчёт: `docs/MAGE_NORTH_PIXMINIMAX_V1_REPORT.md` от корня проекта.
