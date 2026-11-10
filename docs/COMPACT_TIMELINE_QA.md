# Compact Carousel Timeline — QA

2026-11-04. Ветка `feature/compact-carousel-timeline`, база main `fc11095`.
Начальное дерево чистое. После QA пользователь принял результат и запросил push.
Commit `e28bbc58796295b6a0d6f476959b85a6219b9aab` опубликован в main
fast-forward сfc11095, без force; удалённый SHA проверен, дерево чистое.
Все264 QA-файла сохранены. Deploy не выполнялся.

## Что изменено

- `src/ui/components/EventTimeline.vue` — тонкая полоса, центральная риска,
  оригинальные пиксельные SVG и маленькие badges2/3. Удалены заголовки, времена,
  проценты, countdown, подписи, panel background и уведомление о занятых слотах.
- `src/game/systems/encounterSchedule.ts` — проекция окна±60секунд; тот же
  upcomingEncounters умеет включать текущее событие. Его прежнее строго будущее
  поведение по умолчанию сохранено; арифметика окна Director не менялась.
- `tests/unit/encounter-timeline.test.ts` — позиции, включительные границы,
  отсечение, несколько типов в одно время, freeze/reset и bounded projection.
- `tests/e2e/compact-timeline.spec.ts` — новые геометрические/визуальные и live
  Phaser/Vue/World проверки обоих размеров, pause/Level Up/death/restart.
- `tests/e2e/mvp-ui.spec.ts` — прежние Timeline ожидания обновлены под чистую
  карусель; реальные occupied-slot, пауза и десять рестартов сохранены.
- `tests/e2e/survival-enrage.spec.ts` — Enrage onset проверяет иконку вместо
  удалённой текстовой плашки. Остальные gameplay assertions не менялись.
- `README.md` — описание текущего UX и ссылка на этот отчёт.

GameHUD/hd-theme, World, Director, конфигурации баланса/способностей/Enrage,
spawn timings, keyboard/gamepad/touch-контроллеры не изменены. Документы/PNG/raw
остаются локальными согласно существующему `.gitignore`.

## Временное окно и иконки

Левый край соответствует `elapsed − 60`, правый — `elapsed + 60`, центр —
`elapsed`. Положение события в процентах: `50 + (event.at − elapsed) / 120 × 100`.
Событие ровно за60секунд до/после текущего времени включено; дальше отсутствует.
План берётся из существующего upcomingEncounters/encounterPlan. Не более пяти
временных отметок; список заново проецируется из времени, история не хранится.

| Тип | Силуэт | Цвет |
| --- | --- | --- |
| Boss | Скрещённые клинки | Золотистый |
| Guardian | Пиксельный кристалл | Голубой |
| Enrage start | Пламя | Оранжевый |
| Phase II на15:00 | Двойной шеврон | Фиолетовый |

Одновременные boss/Guardian/PhaseII стоят группой на одной координате.
Значки2/3 показывают количество запрошенных противников. Все иконки обозначают
**запланированные** события, включая прошлые; свободные слоты определяют фактический
спавн прежней логикой. Полное описание доступно в aria, видимого текста и tooltip нет.

Desktop: до420×24px, иконки18px. Mobile: до320×20px, иконки14px; временное окно
то же, все попавшие в него события доступны. Отступы по краям не дают обрезаться
совместным иконкам. Центральная риска видна сверху/снизу проходящей иконки.
Лента не получает фокус и не перехватывает pointer/gamepad/keyboard.

Сдвиг обновляется только существующими snapshots (до10Hz). CSS-анимаций,
transition, wall-clock интерполяции, отдельных RAF/interval/listeners нет.
На pause и Level Up координаты стоят; на Game Over прежний HUD скрывает ленту.
Restart возвращает раннее пустое окно.

## Проверки

Windows, Node22.16.0/npm10.9.2, Playwright1.64.1 и настоящий Chromium.
Тестовые порты5187/5188; пользовательский5173 не затрагивается.

| Команда | Результат |
| --- | --- |
| `npm.cmd run check` | 487/487, 61 файл; typecheck/lint/build exit0 |
| Целевые Timeline+MVP UI E2E | 11/11, 25.9s после исправления двух тестовых ожиданий |
| Финальные `compact-timeline.spec.ts` | 4/4, 16.2s, включая видимость центральной риски |
| `npm.cmd run test:e2e:production` | 6/6, 33.3s, exit0 |
| `npm.cmd run test:e2e -- --workers=2` | 262/262, 27.5min, exit0; failures/skipped/retries0 |
| Дополнительные Enrage onset после усиления assertion | 2/2, 14.4s, exit0; повторные typecheck/lint exit0 |
| `git diff --check` | exit0 |

Логи и SHA-manifest264src/tests: `docs/compact-timeline/`.
[Полный HTML всех262сценариев](compact-timeline/playwright-full/index.html),
[check](compact-timeline/check.log), [E2E](compact-timeline/e2e.log),
[production](compact-timeline/production.log), [усиленный onset](compact-timeline/enrage-onset.log).
Все264SHA совпали после полного прогона. Затем в существующий onset-тест добавлен
assert `ENRAGE · 0`: будущая иконка не доказывает начало режима. Два затронутых
сценария повторно прошли с этим усилением; остальные263файла, включая весь src,
не менялись. Итоговый manifest — `source-hashes-final.json`. Полный HTML сохранён
до целевого прогона, чтобы результат262сценариев не затёрся его отчётом.

Первые четыре падения
целевых E2E были двумя ошибками в новых ожиданиях: `Забег окончен` вместо реального
`Игра окончена` и неверный падеж в aria regex. Gameplay не исправлялся и assertions
не отключались. После исправления целевой набор прошёл. PNG затем выявили, что
риску в центре перекрывала иконка: риска удлинена, добавлен assertion её выступания
над/под иконкой; четыре финальных carousel-сценария прошли.

## PNG настоящего Canvas

Все восемь PNG открыты и проверены визуально, помимо DOM/geometry assertions.

| Состояние | 1280×720 | 390×844 |
| --- | --- | --- |
| До события | [PNG](../screenshots/compact-timeline/1280-before.png) | [PNG](../screenshots/compact-timeline/390-before.png) |
| У центра | [PNG](../screenshots/compact-timeline/1280-center.png) | [PNG](../screenshots/compact-timeline/390-center.png) |
| После события | [PNG](../screenshots/compact-timeline/1280-after.png) | [PNG](../screenshots/compact-timeline/390-after.png) |
| После15:00, несколько типов/количеств | [PNG](../screenshots/compact-timeline/1280-endgame.png) | [PNG](../screenshots/compact-timeline/390-endgame.png) |

Скриншоты получены после подготовки elapsed в реальном World и кадров Phaser,
через его обычный snapshot → Vue. Playwright clock удерживает кадр для PNG;
центр проверен с допуском менее1px, точное50% в момент события проверено unit-тестом.
Отдельные live-тесты без mock clock проверяют реальное движение и заморозку.

## Ограничения / приёмка

- События отображают план, а не историю успешных спавнов. Занятые слоты не создают
  дополнительную плашку. Первые две минуты после старта окно может быть пустым:
  первый Boss на3:00 ещё дальше60секунд.
- Лента движется с частотой snapshots, без независимой анимации. Это обеспечивает
  точную остановку вместе с elapsed; на большом увеличении заметен шаг обновления.
- Проверены Chromium и viewport1280×720/390×844. Реальные телефоны, Safari и
  физические Xbox/PlayStation в этой сессии не проверены; controller-регрессии
  используют mock браузерного Gamepad API и настоящий controller/Phaser/Vue/World.
- Vite сохраняет прежнее предупреждение о размере Phaser chunk; зависимости и
  сам Phaser chunk не изменены.

Ручная приёмка: наблюдать приближение первого события с2:00, прохождение через
центр на3:00 и уход влево; pause/Level Up должны остановить полосу. Проверить
restart, события Enrage/PhaseII и badges, читаемость с геймпада и на узком экране.
Автоматический QA завершён, работа остановлена для ручной приёмки.
После отдельной пользовательской приёмки опубликовано в main коммитомe28bbc5.
Локальная игра — http://127.0.0.1:5173/.
