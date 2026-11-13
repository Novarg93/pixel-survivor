# Northern Piercing Throw shield — Aseprite material repair v4

По просьбе пользователя лицевая часть щита северной анимации броска изменена в Aseprite:
стальная поверхность и одна жёлтая диагональная полоса по южному образцу. Прежняя центральная
эмблема удалена. Использован настоящий Aseprite batch/Lua API через подключённый Aseprite MCP.
Новые AI-задания не запускались.

## Результат

- `art/generated/warrior-skills-directions-review-v4/aseprite/north-throw.aseprite` —48483байта,
  192×192,RGB,13кадров по75мс, тег north-spear-throw.
- Слой Original - protected:13оригинальных cels,editable=false. Shield - yellow stripe:6cels,
  normal/opacity255,editable=true. Отключение второго слоя возвращает исходную текстуру.
- Изменены1104RGBA-пикселя в кадрах Aseprite6–11 (PNG05–10). Проверка expected-value
  выполнялась внутри Aseprite перед записью каждого пикселя. Alpha и все пиксели вне маски
  совпадают с исходником. Другие7кадров Throw полностью совпадают; прочие143кадра навыков
  совпадают с v3. Положение тела, контуры, копьё и тайминг сохранены.
- Экспортированы13PNG, native/mirrored spritesheets и обновлены атлас/контакты демки.
  N/NE используют один исправленный источник, NW — зеркало. Южный Throw сохранён как эталон.
- Демкаv4 открывается сразу на Throw; native-source download есть в шапке и северных карточках.
  Остальные навыки и их статусы сохранены. Poolv12 обновляет только pending-источники;
  registry45 не изменён. Приёмка самой анимации Throw остаётся отдельной.

## Воспроизводимость

`source/aseprite-inputs.json` перечисляет13исходников. `source/plan-shield-repair.mjs` формирует
покадровые полигоны/expected/replacement в `source/aseprite-repair.json`; изображения локально
этот Node-скрипт не редактирует. `source/create-aseprite.lua` создаёт native с двумя слоями,
`source/apply-shield-repair.lua` применяет правку/экспорт внутри Aseprite. API-receipt сохранён
в source/aseprite-receipt.json. Сохранённые before/after-crops тоже отрисованы Aseprite.

## Проверки

- Source verifier PASS:13native frames,1104shield pixels в6кадрах,outside/alpha0,
  остальные143кадра неизменны,все156raw↔atlas↔native/mirroredPNG,clipping0.
  SHA731файла (runtime430 + предыдущаяv3) совпадают; source.job/registry45 сохранены.
- Aseprite get_sprite_info подтверждает13×75мс,2слоя,13+6cels,lock на оригинале.
  Render_preview и before/after-strip просмотрены. Native HTTP-download200,magicA5E0,
  frameCount13,48483байта проверены.
- Viewer browser PASS:48skill/direction combinations,156frames,realCanvasN=NE/NWmirror,
  pause byte-freeze,step,scrub,48cards,mobile390,file links,file://,cleanup;JS/HTTP errors0.
  Скриншот Throw восьми проекций просмотрен.
  Лог `.tmp/warrior-skills-directions-v4-browser-final.log`; validation.json.
- `npm run check` PASS:types/lint,156файлов/1131unit tests,build;exit0.
  Лог `.tmp/warrior-skills-directions-v4-check.log`. Прежнее предупреждение chunk>500KB.
- При первом browser-прогоне Vite5173 был выключен. Локальный Vite запущен в том же проекте,
  повтор прошёл; сервер оставлен доступным для просмотра демки.

Блокеров нет. Изменений game runtime,баланса,зависимостей нет. Done/commit/push/deploy нет.
