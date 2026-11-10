# Пламя Хранителя затмения — два варианта для приёмки

Обновление2026-11-10: PixelLab принят и подключён к игре. Далее сохранена
история сравнения. Начальный341file preview proof не перезаписывается;
последующая интеграция проверяется в astral-flame-runtime-v1/.

Относительный путь: `art/generated/astral-flame-review-v1/viewer.html`.
Открывается двойным кликом; вся папка должна сохраняться рядом с HTML.
Локальный HTTP: `http://127.0.0.1:5173/art/generated/astral-flame-review-v1/viewer.html`.
Пламя **принято и интегрировано**. Принятый снаряд PixelLab и Blink от Rune Warden
уже подключены к игре и входят в защищённый snapshot этого демо.

Три колонки: текущий игровой эффект, мой оригинальный рисунок кодом и новые
генерации PixelLab. Ориентир движения — принятый Flame Strike Ash Warden:
наземный выброс, языки растут вверх, силуэт живёт во время горения и опадает.
Новые варианты холодные мятные, компактнее финального босса, с прозрачными
промежутками между языками. Отдельная панель показывает настоящую анимацию босса
в исходных цветах; она не перекрашивалась и не заменялась.

Мой вариант нарисован кодом на сетке2px с ограниченной мятной палитрой:
8 кадров подъёма,8 горения,9 затухания. PixelLab: новая Pro Flash модель по
модели Eclipse как style anchor и три отдельные PixMiniMax-анимации. Мой рисунок
в AI не передавался. Все28AI PNG сохранены точно, включая RGB под alpha0.
Кадр0 сохранён в инспекторе; AI idle играет generated1–8, spawn/vanish0–8.
Никаких ручных масок, перекраски или подгонки отдельных AI-кадров нет.

Все4jobs completed/saved;9 подписочных генераций,1408.95→1399.95,credits$0.
Prompts/seeds/receipts/results/balance/download-audit находятся в source/raw.
Каталог9клипов/93кадра:25code+27AI+41current. Есть9PNG-листов/contact sheets,
9GIF и9Aseprite. Manifest содержит SHA256 файлов/точных RGBA и timings.

Контекст: мягкая общая подсветка1с → подъём600мс → горение3с → затухание600мс.
Общая подсветка нарисована кодом и явно отделена от AI-пикселей. Время warning1с
условное; остальные длительности и spacing34world соответствуют существующей
стенке. AI/мой idle loop800мс, текущий2400мс. Native128²/display62world:
мой/текущий pivot64,104, AI60,116 измерен по опоре модели, фиксирован во всех фазах.

Управление: все три/один вариант, полный цикл/отдельная фаза, стенка/одна секция,
кнопки перехода к фазе, pause/restart/seek/кадр, темп/масштаб, фон Рощи/Леса,
показ модели/pivot, инспектор и скачивание каждого PNG/GIF/Aseprite.
Current spawn/vanish fitted to600ms with cumulative1ms rounding; GIF uses
cumulative10ms rounding, preserving total duration rather than shortening clips.

Сборка: `node scripts/prepare-astral-flame-review.mjs`, затем collector
`node scripts/collect-pixellab-spell-review.mjs art/generated/astral-flame-review-v1`
и `node scripts/build-astral-flame-review.mjs`. GIF/Aseprite экспортируются Aseprite
batch через source/export.lua и параметр root.

Проверки и открытые Canvas screenshots: `screenshots/` и
`docs/art/ASTRAL_FLAME_REVIEW_V1.md`. Baseline341src/public и полный inventory
не изменены с момента интеграции принятого projectile/Blink.
