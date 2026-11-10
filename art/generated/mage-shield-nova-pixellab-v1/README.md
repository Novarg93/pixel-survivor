# PixelLab AI — арканный щит и обычная Frost Nova

[Открыть демо](viewer.html): работает двойным кликом и через локальный Vite
`/art/generated/mage-shield-nova-pixellab-v1/viewer.html`.

Модели созданы **PixelLab Pro Flash**, движение — **PixMiniMax**. Стилевой
reference —96²crop принятого мага. Это настоящие AI-генерации,локально собраны
лишь PNG-листы/GIF/Aseprite и проигрыватель,без перерисовки исходных пикселей.
Пользователь принял оба эффекта; новая пара подключена к игре вместе с ранее
одобренными AI-фаерболом и метеоритом.
Ультимейт Frost не менялся.

- Щит: тонкие лавандовые сегменты,полностью прозрачный центр. Поддержание
  использует8AI-кадров по90мс. Отдельное затухание9кадров по60мс; появление
  проигрывает его в обратном направлении. Фиксированный anchor64,108,scale0.5.
- Обычная Nova: входной seed+16AI-кадров,1200мс,anchor64,64. Одна короткая
  ледяная волна с открытым центром. Worldscale1.5 в демо. Первый вариант
  упирался кристаллами в края128²canvas; сохранён,выбран компактный повтор
  с минимум16pxпрозрачного поля. Локального уменьшения/ретуши не применялось.

Все54исходных PNG сохранены в `raw/`,включая первый Nova candidate и2модели.
Выбранные35animationframes побитово совпадают с PNG-листами. Отдельные3GIF,
3Aseprite и contact sheets в `prepared/`; первые Nova exports тоже сохранены.
Провайдер нормализовал RGB под alpha0 во входных кадрах; альфа и видимый
рисунок моделей не менялись. Пустые финалы имеют alpha0 во всех пикселях.
Число кадров API включает отдельный input0. Темп GIF/demo выбран локально.

6AI-заданий/18подписочныхгенераций;balance1458.95→1440.95,денежныеcredits$0.
Всеjob IDs,seeds,prompts,receipts,results,download SHA иpixelSHA в `source/`,
`raw/*/download-audit.json` и `manifest.json`. Предыдущий balance сохранён в
`../mage-spells-pixellab-ai-v1/source/balance-after.json`,новый — в source.

Демо:пауза/seek/темп/фон/масштаб/маг/всекадры/PNG/GIFссылки;HTTP/file://,
1280/390/844,reduced-motion,отсутствиевнешнихзапросов проверены браузером.
Реальные Canvas screenshots просмотрены: `screenshots/both-http.png`,
`screenshots/viewer-390-http.png`,`screenshots/nova-native-http.png`.

Повторная сборка без новой генерации: `node scripts/build-shield-nova-review.mjs`.
GIF/Aseprite export — локальный Aseprite batch с `source/export.lua` и rootparam.
Историческаяпроверка325неизменённыхruntimeфайлов сохранена вsource/runtime-verification.json.
`verify-shield-nova-review.mjs` относится к этапу до одобрения интеграции;не повторять
его после подключения. Текущаяпроверка: `node scripts/verify-shield-nova-integration.mjs`.
Runtime rebuild: `node scripts/build-shield-nova-runtime.mjs`.

Первоначальный demo check:type/lint/1004unit/124files/build PASS;3новыхpreviewbrowser+
3предыдущихpreviewbrowserPASS. GIF timings720/540/1200мс подтверждены.
Первоначальный отчёт: `docs/art/PIXELLAB_SHIELD_NOVA_V1.md`.
Интеграция: `docs/art/PIXELLAB_SHIELD_NOVA_RUNTIME_V1.md`.
