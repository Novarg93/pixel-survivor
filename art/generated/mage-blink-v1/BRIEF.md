# Mage Blink V1 — production brief

Статус: пара принята пользователем и по отдельному поручению2026-11-09
интегрирована в игру с направленным casting. Ниже сохранён исходный brief
art-стадии; итог: docs/art/MAGE_BLINK_V1_INTEGRATION.md.

Запрос: два самостоятельных PixelLab VFX — departure A и arrival B — и локальное демо. Основа: docs/art/PIXEL_SURVIVOR_ART_STYLE_GUIDE.md; фазность и крупные кластеры Meteor C / Flame Strike C, собственная arcane-палитра.

- 128×128 RGBA, 8 кадров × 40 мс = 320 мс на каждую точку, non-loop.
- Общая точка стоп [64,104], без per-frame trim/recenter. Масштаб относительно текущего Mage V2: 46.35814889336016 world px на 96 source px.
- A: сходящиеся ленты и руны, тонкий разрыв схлопывается. B: короткая вспышка, расходящиеся ленты, разрыв распадается.
- Шесть indigo/violet/lilac тонов; редкий светлый пик, без blur/dither, дозированные осколки. Герой рисуется отдельно.
- Blink в игре мгновенный (MOBILITY.mage.duration=0), VFX cosmetic window=320ms. Демо переносит героя в B в момент активации, оба эффекта работают одновременно; подготовки, задерживающей телепорт, нет.
- Инструмент: PixelLab vfx_workbench, точная авторская recipe, бесплатный renderer (по tool documentation: nothing charged). Экспорт сохраняется в My effects по стандартному workflow PixelLab. Не подключать к production без отдельной инструкции; PLAYER_VISUALS остаются выключены.
- Поставка: неизменённые экспорты PixelLab, recipe/step/effect IDs, PNG/GIF/JSON, фиксированные pivot, офлайн viewer, unit/browser проверки, настоящие Canvas screenshots (preview, не gameplay).

