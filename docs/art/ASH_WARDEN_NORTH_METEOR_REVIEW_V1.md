# Ash Warden — PixelLab north overhead slam / meteor review v1

Дата:2026-11-10. Запрос: заменить северный боковой замах на overhead slam
по аналогии с Flame Strike и переработать метеорит/место приземления с анимациями.
Принято пользователем и интегрировано. Отдельный итог:
`ASH_WARDEN_PIXELLAB_RUNTIME_V1.md`. Ниже сохранено описание подготовки демо;
исходный baseline/proof не переписывается, последующая приёмка фиксируется
отдельным approval и integration-verification.

Путь: `art/generated/ash-warden-north-meteor-review-v1/viewer.html`.
Слева текущий арт, справа новые PixelLab PNG.6режимов: северная автоатака,
полный метеорит, южный Flame Strike как ориентир, отдельные flight/warning/impact.
Пауза/seek/шаг/скорость, native downloads,4листа PNG/GIF/Aseprite,2биома,
опоры/траектория, HTTP/file, reduced motion, один управляемый RAF.

## Итоговый арт

- North21cels native256², pivot128,202, scale0.6548310811. Подъём/удар/возврат
  с тремя AI-анимациями и двумя AI-опорными позами. Темп1043мс,
  опорный контакт565мс. Вид со спины удержан. Исходник192² дополнен прозрачными
  полями32,48 без resample; никаких ручных правок AI-пикселей.
- Meteor flight8cels native128²,640мс отдельно/300мс в собранной сцене,
  scale1,pivot29,103. Камень крупнее магического снаряда, тёмный базальт,
  ограниченные расплавленные грани и медно-оранжевый хвост. Траектория вниз-влево
  50.673° вычислена по оси tail97,20→tip29,103.
- Warning8cels/800мс, открытый контур, прозрачный центр, NORMAL alpha0.5,
  native128²,pivot61,65,scale6/7. Без runtime blur/bloom.
- Landing23cels/500мс:15кадров AI-удара/следа и8AI-dissolve. Последний PNG
  действительно прозрачен по всем alpha. Опора/scale общие с warning.

13завершённых и сохранённых в галерее PixelLab заданий,89исходных PNG,
60выбранных кадров в4клипах,108уникальных PNG всего вviewer.
Расход47subscription generations,1399.95→1352.95,USD0→0.
Source requests/receipts/results/seed/audits и отбор хранятся рядом с демо.
Отложены: первый белый наземный диск; первый северный клип с поворотом вбок;
два последних кадра impact с серым остатком. Сами исходники сохранены.

## Область изменений

Новые scripts prepare/build, HTML template, review folder,
`tests/unit/ash-warden-north-meteor-review.test.ts`,
`tests/e2e/ash-warden-north-meteor-review.spec.ts`, документация.
Ни один из345src/public файлов не изменён и не добавлен; сохранена и проверена
точная инвентаризация. Принятые ранее эффекты Mage/Rune/Eclipse и библиотека
босса сохранены. Арт-гайд не объявляет эти варианты принятыми.

## Проверка

Новые unit4 + библиотека4 PASS: SHA/инвентаризация, точные AI RGBA/байты и
offline dataURLs, native подготовка,21кадр/565мс/пивоты, направление падения,
открытость метки, общий anchor и500мс с прозрачным финалом, Aseprite header,
13заданий/47списаний.

Browser3 PASS: HTTP и file://, все6режимов,4набора исходников/native PNG
downloads, пауза сохраняетCanvasbytes, шаг по кадрам, viewport1440/1280/390/844,
2биома, нет горизонтальногоoverflow, console/page ошибок и внешних запросов;
reduced motion и завершение one-shot. Исправлены найденные проверки seek
(pause/render сбрасывал ввод до чтения значения) иfavicon404.

Реальные Canvas screenshots открыты и просмотрены:
`screenshots/north-overhead-http.png`, `north-http.png`, `meteor-1280-http.png`,
`meteor-390-http.png`, `impact-http.png`, `warning-http.png` внутри reviewfolder.
Позы не обрезаны, опоры совпадают, движение метеорита следует хвосту,
тонкая наземная подсветка и короткий удар читаются на игровых фонах.

Полная проверка проекта и итог зафиксированы в `docs/PROGRESS.md`.
Блокеров нет. Следующий шаг — приёмка этих двух изменений; done-marker отсутствует.
