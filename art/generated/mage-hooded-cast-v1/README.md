# Hooded Mage B — общий боковой каст

9 ноября 2026 · выбранный пользователем B · отдельный art-pass.

Открыть [viewer.html](viewer.html) двойным щелчком или по адресу:
`http://127.0.0.1:5173/art/generated/mage-hooded-cast-v1/viewer.html`.

## Что готово

Одна **правая боковая проекция** мага в длинной индиговой мантии и её точное
горизонтальное зеркало влево. Три общих жеста без встроенной стихии/VFX:

| Жест | Правая версия | Левая версия |
| --- | --- | --- |
| Каст прямо | [GIF](exports/forward-east.gif) | [GIF](exports/forward-west.gif) |
| Каст выше | [GIF](exports/high-east.gif) | [GIF](exports/high-west.gif) |
| Каст ниже | [GIF](exports/low-east.gif) | [GIF](exports/low-west.gif) |

Каждый клип содержит6уникальных поз: стойка → подготовка → замах → выпуск →
follow-through → возврат. Всего18генерированных правых кадров и18зеркальных левых.
Native96×96, фиксированный pivot48,82, прозрачность0/255. В подготовленных
анимациях9цветов на кадр, крупные массы ткани, без добавленного декора. Все позы
имеют одинаковые верх/низ силуэта13/83; низ мантии/ног не скачет по высоте.

Для выбора направления используются две стороны корпуса и три дискретных
высоты жеста. Режим «Цель» показывает этот принцип на произвольной учебной метке.
Это не непрерывный IK и не подтверждение точного игрового palm/muzzle origin.
Для будущей интеграции actual hand landmarks размечаются по принятым кадрам.

## Тайминги и просмотр

`70,70,80,90,70,100ms`,480мс всего. Выпуск — кадр3 с220мс. Это предлагаемый
art-timing, не изменение timestamp/cooldown/урона игры. Gameplay-события останутся
источником истины при последующей интеграции.

GIF одноразовые, без loop extension. Viewer повторяет клип после400мс в общей
rest-позе из первого подготовленного forward-кадра. Доступны скорости×0.25/0.5/1/2,
pause, scrub, покадровые стрелки, сравнение обеих сторон и переключение цели.
Есть фон Grove и отдельная статичная композиция с актуальным игровым Ash Warden
в действующем масштабе. Новым магам только в preview назначена видимая высота
нынешнего героя34.6875world px; runtime scale не записывался.

## Исходники и обработка

- `source/selected-b.png` — неизменённый выбранный исходник из предыдущего pass.
- `source/east.png` — PixelLab Pro Flash side edit того же существующего asset ID;
  `source/west.png` — точное зеркало стойки.
- `generation-manifest.json` — запрос side edit, seeds, COCO-18 rigs по6поз,
  исходные job receipts. Принятые Ash Warden/Hound PNG не загружались в PixelLab.
- `raw/<forward|high|low>/frame-00..05.png` —18неизменённых PixelLab skeleton-v3
  результатов, включая отклонённые мелкие фрагменты.
- `prepared/east/` — подготовленные правые кадры; `prepared/west/` — их точные
  горизонтальные отражения. Порядок кадров при отражении сохранён.
- `cleanup-receipt.json` — только3локально исправленных кадра: удалены2отделённых
  серых фрагмента в windup; в forward-recovery маленькая область груди восстановлена
  из resting-позы того же клипа. Палитра/размеры не менялись, исходники сохранены.
- `exports/` —6PNG-листов,6GIF, правый атлас576×288 и JSON. Для будущего runtime
  достаточно18правых текстур плюс flipX. Расход RGBA у правого атласа663552байта.
- `animation.json`, `viewer-data.js` — фиксированные canvas/pivot, фазы, timings,
  rest-pose, metadata обоих направлений.
- `frame-validation.json`, `browser-validation.json`, `protected-validation.json`,
  `screenshots/` — проверки и визуальные материалы.

Локальная сборка без новых генераций, из корня проекта:

```sh
node art/generated/mage-hooded-cast-v1/prepare.mjs
node art/generated/mage-hooded-cast-v1/build.mjs
```

`validate-browser.mjs` экспортирует `validate(page)` для существующей Playwright
page. В MCP script body передаётся код валидатора без `export`, поскольку его
VM не поддерживает dynamic import; результат сохраняется как browser-validation.json.

## Проверки и расход

- PixelLab:4успешных jobs — side edit5 +3cast×3 = **14единиц подписки**,
  баланс1606.90→1592.90, денежных API-кредитов$0. Повторных генераций нет.
-18правых поз различимы, в каждом клипе6;18/18зеркал проверены по RGBA.
-PNG CRC/96×96/alpha/отступы PASS; минимальный отступ12px, clipping0.
-Atlas roundtrip18/18 PASS;6GIF в Chromium:6кадров/480мс/one-shot,
  все36декодированных GIF-кадров совпали с prepared PNG по RGBA.
-Viewer file/HTTP × desktop1280×720/mobile390×844:4/4PASS, errors0,
  missing images0, body overflow0, pause не продвигает время, frame controls,
  все4скорости,24проверки выбора стороны/высоты цели.
-Canvas pose sheets всех3жестов и обе стороны, release previews, game-scale и
  mobile capture открыты и визуально просмотрены. Это preview, не новая модель в игре.
-SHA256 **6614** существующих src/public/assets/art файлов:changed0,added0.
-Полный `npm.cmd run check`:112файлов/931тест,typecheck/lint/build PASS;
  финальный ESLint новых standalone scripts PASS. Лог `.tmp/mage-hooded-cast-v1/check.log`.

## Границы готовности

Касты подготовлены для художественного просмотра. Герой ещё не заменён в игре,
новые idle/walk/hurt/death не производились, прежний Phantom/runtime не удалён.
Нужны просмотр пользователем, затем остальные действия и отдельная интеграция
с actual hand origins и проверкой коллизий/таймингов/lifecycle.
