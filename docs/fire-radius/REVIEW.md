# Fire Ultimate — двойной радиус и только огонь вокруг Mage

2026-11-05, main. Итерация по ручной проверке Living Inferno.

Радиус общей огненной ауры82→164 мировых единицы. Свет на земле увеличен ровно вдвое по обеим осям через тот же параметр. Новый радиус применяется к periodic damage и сгоранию вражеских снарядов. Урон62/0.5s,10секунд действия,24%boss/Guardian cap и существующий след сохранены. Радиус удвоен, площадь поражения увеличилась вчетверо.

На время ignition/form и cosmetic fade0.4s скрыты оболочки Arcane Shield, его cast/hit/evolution rings и боковые элементы Blink Absorb. Это только presentation: обе ёмкости Absorb, их сроки, расход при попаданиях, evolved shield damage и голубая индикация на HP сохранены. После исчезновения огня живые щиты снова рисуются. Правило вычисляется из текущей фазы World; нет таймеров, изменения альфы персонажа или отдельного скрытого состояния, которое могло бы залипнуть. Обычные атаки и анимации рук остаются прежними.

## Реальный Canvas

| Проверка | Desktop1280×720 | Mobile844×390 |
|---|---|---|
| До: меньший свет и пузырь | [кадр](../../screenshots/fire-radius/before/form-1280.png) | [кадр](../../screenshots/fire-radius/before/form-844.png) |
| После: свет×2, HP/Absorb и HUD | [кадр](../../screenshots/fire-radius/after/form-hud-1280.png) | [кадр](../../screenshots/fire-radius/after/form-hud-844.png) |
| Огненная форма с действующими щитами | [Canvas](../../screenshots/fire-radius/after/flame-only-1280.png) | [Canvas](../../screenshots/fire-radius/after/flame-only-844.png) |
| Fade без оболочек | [Canvas](../../screenshots/fire-radius/after/fade-no-shell-1280.png) | [Canvas](../../screenshots/fire-radius/after/fade-no-shell-844.png) |
| Огонь погас, живые щиты снова видны | [Canvas](../../screenshots/fire-radius/after/shields-restored-1280.png) | [Canvas](../../screenshots/fire-radius/after/shields-restored-844.png) |

В E2E сравниваются пиксели области персонажа без HP-полоски при одном и том же World.elapsed. Удаление действующих щитов во время формы и fade изменяет0компонент изображения в обоих viewport: оболочки действительно не рендерятся. После исчезновения огня удаление щитов меняет13867/5651компонент — проверен обратный переход. JSON: canvas-1280.json / canvas-844.json.

Новые цели в130мировых единицах спереди, сзади, сверху и снизу получают урон; цели в220 остаются вне ауры. Тесты проверяют half-second gate, сохранность Absorb/HP и evolved pulse damage, а также обычное отображение щитов при Lightning/Frost.

## Проверки

- `npm.cmd run check`:563/563 unit в71файле + typecheck/lint/build — exit0.
- Целевой `npm.cmd run test:e2e`:17/17 за50.9s — Fire radius/пиксели, полный Fire timeline/cleanup/input/audio и существующие performance-сценарии всех трёх ультимейтов на трёх viewport.
- Существующий stress с настоящим уроном и150+3+3:59.88FPS median, p9516.8ms на desktop/mobile/tablet. Новый радиус поджигает139целей в этом кадре; состав150мобов+3босса+3Guardian сохраняется. Измерение Chromium, не физического телефона.
- `npm.cmd run test:e2e:production`:7/7 за34.2s,exit0. `git diff --check`:exit0.

Проверки завершены, блокеров нет. Полная регрессия335/335 относится к предыдущей итерации Fire; после этой точечной правки выполнена указанная целевая выборка17/17 и полный unit/check. Логи и scope: check.log / e2e.log / production.log / verification.json.

Изменения только в main; без веток, commit, push и deploy. Работа остановлена для ручной приёмки. Проверить в http://127.0.0.1:5185/ → DEV «Погребальное Пламя».
