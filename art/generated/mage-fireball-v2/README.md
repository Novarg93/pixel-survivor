# Fireball V2 — тлеющая искра

Оригинальный программный pixel art по `docs/ART_STYLE_GUIDE.md`. В игре подключён
вместо прежнего детализированного native V1; старые девять исходников и V1 atlas
сохранены. Сравнение открывается прямо с диска: [viewer.html](viewer.html).

- Палитра: пять медно-янтарных цветов, узкое светлое ядро, короткий хвост.
- Появление: 2 кадра / 200 мс. Полёт: 4 кадра / 400 мс, 10 fps, цикл.
- Попадание: 6 кадров / 300 мс, последний прозрачный; четыре огненных лепестка
  расходятся в угольки. Ни дыма, ни большого светлого диска, ни кольца.
- Source 56×42 / anchor33,21. Runtime112×84 / pivot65,42 / scale0.5:
  точное увеличение2× NEAREST и один общий сдвиг−1 source pixel по X.
  Нет индивидуальной обрезки, центрирования или масштабирования кадров.
- Flight bbox ≤46×24 source =23×12 world px при любом ранге/эволюции/area.
- Atlas464×264,12кадров,padding2,489984 RGBA bytes (−75% к V1).

Четыре flight-кадра нарисованы авторским JSON recipe и отрендерены через
PixelLab vfx_workbench. Это программный рендер, не AI inference. По документации
инструмента стоимость $0. Рецепт, seed202611, IDs, оригинальный PNG/GIF/JSON/ZIP
находятся в `source/`; покадровые PNG — в `prepared/`, SHA256 — в `pixel-audit.json`.
Появление и попадание нарисованы локальным builder в той же палитре.

[Открыть редактируемый полёт в PixelLab](https://pixellab.ai/create-vfx?effect=40afe127-b8a8-4180-aff5-37871bbb7e30).
В сохранённом эффекте нет пользовательских sliders: правки через recipe.

Пересборка из корня проекта: `node scripts/build-mage-fireball-v2.mjs`.
Runtime выбирает `src/game/art/fireballPack.ts`, новый manifest —
`src/game/art/fireballManifestV2.json`; V1 builder и manifest не перезаписываются.
Анимация читает World.elapsed: пауза/перезапуск/очистка прежние, новых игровых
таймеров или emitters нет. Повреждения/скорость/уровни/коллизии/RNG не меняются.

QA: `docs/art/MAGE_FIREBALL_V2.md`; Canvas screenshots —
`screenshots/mage-fireball-v2/`.
