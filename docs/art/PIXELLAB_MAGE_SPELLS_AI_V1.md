# PixelLab AI Mage spells — отдельное демо, 2026-11-10

**Последующее одобрение:** пользователь выбрал эти AI-анимации и разрешил
подключение. Fireball/Meteor теперь используют их в игре. Интеграция и её
проверки описаны в [PIXELLAB_MAGE_SPELLS_RUNTIME_V1.md](PIXELLAB_MAGE_SPELLS_RUNTIME_V1.md).
Ниже сохранён отчёт о первоначальном этапе отдельного демо.

Запрос: сделать AI-генерации PixelLab для фаербола и метеорита, показать демо,
**не интегрировать в игру**. Результат изолирован в
`art/generated/mage-spells-pixellab-ai-v1/`. Существующие FireballV2/MeteorV3
продолжают использоваться; src/public/package/lock/Vite и прежний арт не менялись.

## Подтверждённая AI-генерация

Это не procedural vfx_workbench и не локальная отрисовка. Модели сделаны
create_image_pro_flash,пятьциклов/попаданий/света — animate_image_pixminimax,
уточнённый удар метеорита — animate_image. В качестве общего style reference
передан96²crop принятого героя; ни один прежний программный spell не использован
как drawing input. Canvas всех результатов128², прозрачность spell-состояний
получена от PixelLab. Белый/чёрный ending pins — только ограничения анимации.

|Результат|PixelLab job ID|Генерации|
|---|---|---:|
|Fireballmodel|6daa7422-dbec-47a1-8f17-382823e28bd9|6|
|Meteormodel|e9c46c01-5289-4fc6-8848-a7f5a7113dd5|6|
|Lightmodel|a60aa674-c449-46a0-82c3-90bc6e32672f|6|
|Fireballflight|b5f5d94e-95e2-4111-96b0-c6a6d949b197|1|
|Meteorflight|53188356-f9ef-4420-8b20-46634b20cd4c|1|
|Fireballimpact|46bc95ea-e613-4915-9662-d3d4135be419|1|
|Meteorimpactcandidate1|437c3dee-116e-49c2-8c4d-1bbf15fc1419|1|
|Lightfade|35fc30e1-14d2-4125-af9c-b5dbb168e045|1|
|Meteorimpactwithgreychips|f6086dfc-9a43-4708-8603-f7d6670fdecb|2|

Все9заданий completed/saved в PixelLab gallery. Receipt totals25, subscription
balance1483.95→1458.95,credits$0→$0. New payments/credentials не запрашивались.
Seeds:2026111001–1003models,1011–1015MiniMax,1021refinedimpact.
Все запросы/ответы/download audits сохранены в source и raw.

## Арт и подготовка

Новые AI-силуэты выдержаны в тёплом медно-янтарном семействе. Meteor slate
с узким хвостом, меньше метеора Ash Warden; угол≈48.8° измерен по его оси и
применён к preview movement. Полёт и удар независимы. Свет — самостоятельный
AI-generated black light pass, не программный radial gradient.

3AIмодели и6анимаций (input+8generated) дают57rawPNG,54animationframes.
PNG sheets/contact sheets собраны только копированием, без trim/recenter/tint/
quantization/redraw. Все54preparedframes совпадают сrawRGBA, включая скрытыйRGB.
Сам PixelLab поменял скрытыйRGB входных прозрачных кадров, видимоеRGBA/alpha
сохранилось. Manifest считает эти provider-normalized pixels отдельно.

GIF/Aseprite экспортированы локальным Aseprite batch. Flight loops играют8
сгенерированных кадров1–8@80ms,impacts9кадров0–8@70ms,light9@80ms.
Эти timings заданы для preview: API отдаёт orderedPNG без embedded duration.
Свет композитится Screen@0.4, обратная последовательность показывает
предвосхищение, прямая — затухание. Исходный чёрный фон не вырезался и не
подменялся локально рассчитанной альфой.

Ограничения AI видны в покадровом инспекторе: первый meteor-impact дал яркое
кольцо, поэтому создана отдельнаяV3версия. У неё осталась ранняя оранжевая дуга
и небольшие осколки перед завершением; финальный кадр имеет alpha0 во всех пикселях.
Свет приблизил blackpin равномернымRGB3,2,2.
Оба сырых варианта/ending сохранены без масок или скрытого дорисовывания.
Это art-review кандидаты, не утверждение художественной приёмки/готовности
к production. Встроенные тайминги игры и gameplay не проверялись ради интеграции,
поскольку интеграция прямо исключена запросом.

## Демо и QA

Viewer открывается HTTP/file:// безfetch и внешнихзависимостей. Есть общий/
отдельный просмотр spells, отдельный свет,все9rawframes,ссылкиPNG/GIF/sheet,
темп/zoom/background/seek/pause/restart. Сравнение показывает текущие code-art
effects и Ash Warden при одномworldscale. На390режимboth расположен вертикально;
844landscape тоже без горизонтальногоoverflow. Reduced motion стартует paused,
RAF останавливается hidden/pagehide; игровой runtime не импортирует viewer.

4targeted unit PASS:AIreceipts/nativepixelidentity/inputalpha/exportassets.
3browser PASS:HTTP/file/1280/390/844,пауза подтверждена screenshot bytes,
frame4 всехклипов,отдельныйсвет,настройки,downloadrefs,reducedmotion,
нулевыеerrors/externalrequests. Начальные ошибки globalconstdocument и
неоднозначных labelnames устранены изоляциейJS вIIFE/явнымиARIA-labels.
Тест endpoint света проверяет фактический output,а не выдуманный точныйblack.

Реально открыты Canvas PNG: screenshots/{compare-http,meteor-impact-http,
light-http,viewer-390-http}.png; просмотрены все6contact sheets, модели,
промежуточныеAIкадры. Остальные HTTP/offline/844 screenshots рядом.

`verify-pixellab-spell-review.mjs`:401protectedfiles,changed[],inventoryUnchanged.
Baseline охватывает всеsrc/public,package/lock/Vite и прежние два spell art-pass.
Постоянный unit-test не замораживает дальнейшие легитимные изменения игры:
проверка неизменности запускается отдельно для завершения этого поручения.
Полный check и окончательная проверка — в docs/PROGRESS.md.

Новые файлы:три scripts prepare/collect/build,verify script,новые unit/E2E,
пакетизображений/viewerиэтототчёт. Изсуществующихадминистративныхdocsобновляются
толькоPROGRESS/DECISIONS. Блокеров нет; следующий шаг — пользовательский просмотр
и выбор AI-варианта. Интеграция этим поручением не разрешена,done-marker нет.
