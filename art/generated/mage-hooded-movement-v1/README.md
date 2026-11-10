# Mage B — ходьба и лёгкий бег

9 ноября 2026 · отдельный art preview, ожидает художественного просмотра.

[Открыть viewer](viewer.html) · [сразу бег](viewer.html?gait=run) ·
[руководство по стилю](../../../docs/art/PIXEL_SURVIVOR_ART_STYLE_GUIDE.md).

После принятого Idle подготовлены два отдельных действия из прежних front/north
баз. Корпус сохраняет исходную переднюю стойку B или вид строго со спины.
Противоположная сторона — точное отражение. Новые профили не создавались.

| Действие | Кадров | На кадр | Цикл |
| --- | --- | --- | --- |
| Ходьба | 8 | 120 мс | 960 мс |
| Лёгкий бег | 8 | 80 мс | 640 мс |

Четыре исходных цикла и четыре зеркала: 32 выбранных кадра, 32 зеркальных,
64 prepared PNG, 8 GIF и 8 полос PNG. Canvas96×96. Общий атлас768×384 содержит
только исходные позы, зеркала разделяют текстуры:1179648RGBA bytes.
Front pivot[46,84], north[48,84]; зеркальныйX=96−X. Размер героя в игре не менялся.

## Генерация и выбор

PixelLab: четыре text-animation jobs вернули input0+8motion; все36raw сохранены.
Северные циклы используют motion1–8. Передние text-циклы разворачивали грудь
в профиль и отклонены. Их атлас/GIF сохранены в `repairs/front-facing-rig-v1/`.
Две замены с фиксированными плечами, бёдрами и направлением головы дали по8поз
без входного эха. Эти16raw сохранены в той же repair-папке и выбраны через
`selection.json`. Всего52raw PNG, без удаления отклонённых результатов.

`generation-manifest.json` содержит первоначальные prompts/seeds/requests;
repair-manifest — COCO-позы и запросы замен; `generation-results.json` — завершённые
jobs/assets/URLs. `billing.json`:4×1+2×3=10единиц подписки,
1560.90→1550.90,$0cash. Один слишком длинный запрос отклонён до создания job,
не тарифицирован. Активных jobs нет.

Палитра каждого цикла сведена к своей canonical базе:front28/north10цветов.
Прозрачные пиксели очищены; размер/масштаб/регистрация не меняются покадрово.
Стопы не фиксировались: walk имеет8различных масок обуви на базу,
run-front7,run-north8. Сохраняются фазы шага, перенос веса и движение края мантии.
Idle и принятые cast/S repair не изменены.

## Просмотр

Viewer поддерживает file/HTTP, walk/run, четыре синхронных вида, pause,
скорости×0.25/.5/1/2, frame0–7 и шаги7↔0, исходные стойки, Grove и прокрутку.
Листы всех фаз и композиция игрового масштаба используют текущий игровой
Ash Warden как референс. Прокрутка фона иллюстративная, с настройкой темпа;
она не доказывает совпадение стоп со скоростью production-героя. Front/north
имеют разную проекцию шага. Точное согласование скорости, start/stop и переходов
Idle/cast выполняется при отдельной интеграции.

## Проверки

- Все raw и prepared PNG: CRC/canvas/alpha; clipping0, выбранный min margin9px.
  Северный капюшон без лица; длина рук в прежних пределах.
-32зеркальные пары exact RGBA;32atlas roundtrips PASS,8уникальных кадров в цикле.
-Chromium ImageDecoder:8GIF,по8кадров,960/640ms,бесконечный цикл;
  64декодированных RGBA-кадра совпали с prepared PNG, differences0.
-Viewer:file/HTTP×1280×720/390×844×walk/run —8/8PASS. Errors0,missing0,
  overflow0; проверены pause,4скорости,frame/loop wrap,source comparison,
  смена фона и движение/остановка прокрутки. Скриншоты в `screenshots/`:
  четыре вида,восемь фаз,game-scale,desktop/mobile. Реальные Canvas просмотрены.
-`npm.cmd run check`:112файлов/931тест,typecheck/lint/build PASS.
  Лог `.tmp/mage-hooded-movement-v1/check.log`. ESLint четырёх art scripts PASS.
-SHA2566941прежнего src/public/assets/art файла:changed0,added0.
  `protected-baseline.json`/`protected-validation.json`; `git diff --check` PASS.

Воспроизведение из корня: `node art/generated/mage-hooded-movement-v1/prepare.mjs`,
затем `node art/generated/mage-hooded-movement-v1/build.mjs`.
Browser-проверка: функция `validate(page)` из `validate-browser.mjs` для Playwright.

В runtime новый герой пока не подключён; gameplay E2E этому art-pass не запускались.
Следующий этап после просмотра — Hurt/Death из тех же баз, затем отдельная
интеграция и проверка переходов, release anchors, phantom и движения с кастом.
