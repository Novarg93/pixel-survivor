# Mage casting / locomotion directions V2

Результат запроса на интеграцию новой модели мага, 2026-11-08.
46 PixMiniMax jobs, 92 subscription generations, credits $0.

requests.json — исходная очередь; requests-refined.json — все финальные
запросы с captions/seed/first/last frame refs. В каждом каталоге есть receipt,
completed result, raw PNG, audit и обзорный contact.png. Raw включает входной
кадр0 и16 новых кадров; для death — входной0 и12 новых. Оригиналы не удалены.

selection.json выбирает четыре повторных north, Fireball NE и Defensive NE.
frame-overrides.json выбирает точную PixelLab background repair для Lightning NW
frame6. Изменена только отдельная серая область; герой не ретушировался.

40 финальных новых клипов имеют native.png / native.json / native.gif:
native256×256 на кадр, lossless palette, PNG цвета, общая неподвижная рамка.
Для Walk/Run исключён входной кадр, чтобы он не задерживал цикл. Для кастов
и Death входной кадр сохранён. GIF задаёт темп просмотра; боевые тайминги
остаются за World и MageCastingController.

Игровая сборка: node scripts/build-mage-hero-v2.mjs (строгая, без пропусков).
Экспорт: node scripts/export-mage-hero-clips.mjs.
Обзор: art/generated/mage-hero-v2/viewer.html.
Отчёт: docs/MAGE_HERO_V2_REPORT.md.
