# 2026-11-12 — Aseprite Whirlwind shield v5

Исправлена лицевая часть щита северного Whirlwind: сталь и одна жёлтая диагональная полоса как на южном. Реальная правка выполнена в Aseprite Lua API, без новых AI-заданий. Южный пользовательский стандарт и оригинальный рецепт генерации сохранены.

Демка: `art/generated/warrior-skills-directions-review-v5/viewer.html` (открывается прямо с диска, начинает с Whirlwind). Нативный исходник: `art/generated/warrior-skills-directions-review-v5/aseprite/north-whirlwind.aseprite`. PNG-листы и зеркало: `spritesheets/north-whirlwind.png`, `spritesheets/north-whirlwind-mirrored.png` внутри той же папки.

13 кадров по 75 мс. `Original - protected` — 13 cels, editable=false; `Shield - yellow stripe` — 3 cels, editable=true. 574 пикселя изменены в кадрах 6–8 (1-based). Точные маски/цвета до и после: `source/whirlwind-aseprite-repair.json`; create/apply Lua, решения и Aseprite receipt сохранены. Контур, alpha, позы, меч, слеш и тайминг не изменены. Прочие 143 body-кадра совпадают с v4. N/NE напрямую, NW зеркало.

Приёмка исправленного северного Throw v4 записана по фразе «piercing throw заменил отлично» (registry 46, pool v13); фронтальный Throw по-прежнему на оценке. Новая текстура Whirlwind ожидает приёмки. Оригинальная приёмка его движения не отменена.

Проверено:

- Native Aseprite readback: 192×192, 13×75 мс, два слоя, 13+3 cels; просмотрены увеличенные кадры 6–8 после правки.
- Source PASS: 156 body-кадров, 12 клипов; 574 guarded Whirlwind edits, alpha/outside delta 0; 143 других кадра равны v4; сохранены предыдущие 1104 пикселя Throw и 691 Cleave. Все PNG ↔ atlas ↔ зеркальные листы совпадают, clipping 0. 995 защищённых файлов без изменений.
- Browser PASS: 48 сочетаний навыков/проекций, просмотр всех 156 кадров, реальные Canvas N=NE/NW mirror, пауза/шаг/скраб, 48 карточек, 390px, file:// и cleanup; JS/HTTP ошибок 0.
- Canvas screenshot визуально просмотрен: `art/generated/warrior-skills-directions-review-v5/screenshots/whirlwind-eight-directions-1440.png`. Контакт всех кадров также просмотрен.
- `npm run check`: PASS (156 файлов / 1131 тест, typecheck, ESLint, production build). Лог: `.tmp/warrior-whirlwind-shield-v5-check.log`. Единственное предупреждение — существующий размер Vite chunks.

Первый native create через loadfile не увидел локальный args; исправлено явным Lua environment. Повторный запуск и все экспорты успешны. Блокеров нет. Runtime, баланс и игровые тайминги не менялись. Следующее действие — пользовательская оценка щита Whirlwind.
