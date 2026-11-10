# Pixel Survivor — MVP UI Polish

Дата: 2026-11-04. Ветка: `feature/mvp-ui-polish`, база `main` — `4289bd7ffb20fe4039f11825904e9345e4478d4d`.
Работа начата с чистого дерева. UI-реализация: 47 source/test/README-файлов (36 изменённых, 11 новых).

После завершения QA пользователь отдельно запросил «пуш в мейн». Создан commit
`fc110958fc13a6828a6462f0a17e01fb51814c14`, main обновлена fast-forward и успешно
отправлена в origin/main без force. Независимый ls-remote подтвердил этот SHA,
рабочее дерево чистое. Все263 нормализованных SHA256 src/tests совпали с QA-кодом;
только Windows CRLF изменились у10файлов при переключении веток. Deploy не выполнялся.

## Результат

- В публичном меню доступен Mage. Warrior остаётся фокусируемым, показан в сером цвете с надписью «В разработке». Попытки выбора мышью, Enter, touch и A выводят «Warrior находится в разработке». App и Scene дополнительно исключают запуск Warrior из устаревшего состояния/команды интерфейса.
- Три карточки улучшений получили вертикальную компоновку на desktop, собственные пиксельные эмблемы, рамку, ранг, главный бонус и короткое объяснение. На mobile используются три компактные строки без обрезания. `projectiles` относится к Fireball по фактическому эффекту. Общие бонусы оформлены самостоятельно, Blink-специализации — тематически.
- HUD показывает текущий elapsed, прогресс до ближайшего события и запланированные события Director. Desktop отображает четыре следующих события, mobile — текущее время и ближайшее событие. Enrage и Phase II отмечены отдельно. Подсказки оговаривают свободные слоты; пропущенный спавн не изображается как состоявшийся.
- «Как играть» описывает доступность Mage, реальное управление, немедленно активного неподвижного Guardian с самонаводящимися сферами, награду за полную волну, отмену награды при уходе, Enrage и Phase II. Весь текст и кнопка видны в обоих проверенных разрешениях.

Код Warrior, его реальные gameplay-тесты, способности и баланс сохранены. Не изменены World, AI, spawn rate, HP, конфигурации способностей/Enrage/Endgame и экономика.

## Реализация и изменённые файлы

Публичная доступность персонажей:

- `src/game/bootstrap/publicCharacters.ts` — новая явная политика Mage-only; отдельный параметр для тестовой фикстуры.
- `src/ui/components/MainMenu.vue` — grayscale, `aria-disabled`, сообщение и единый обработчик попытки выбора; native `disabled` не используется.
- `src/App.vue` — защита выбора/старта и актуальная справка.
- `src/game/scenes/GameScene.ts`, `src/env.d.ts` — защита публичных команд; DEV-only `setTestCharacter`, доступный только при `?test=1`.
- `tests/helpers/character.ts` — явная фикстура для настоящего Warrior в существующих DEV E2E. Production не содержит `__PIXEL__`.

Карточки:

- `src/ui/components/LevelUpModal.vue` — новая разметка/адаптивные стили, исходные input/confirmation handlers сохранены.
- `src/ui/upgradeIdentity.ts` — типизированный явный реестр семейств upgrade ID.
- `src/ui/upgradeCards.ts` — представление бонуса, краткого текста и эмблемы; ранговые значения Frost/Armageddon и бонусы мобильности читаются из актуальных конфигураций.
- `src/ui/upgradeEmblems.ts`, `src/ui/components/UpgradeEmblem.vue` — 19 оригинальных эмблем, нарисованных SVG paths на целочисленной сетке.

Timeline:

- `src/game/systems/encounterSchedule.ts` — общее чистое вычисление окна Director и ограниченная проекция следующих событий, без накопления истории.
- `src/game/systems/EncounterDirector.ts` — использует вынесенную прежнюю арифметику времени с тем же epsilon и конфигурацией. Остальная логика не изменена.
- `src/ui/components/EventTimeline.vue` — snapshot-driven HUD без собственных timers/listeners.
- `src/ui/components/GameHUD.vue` — подключение Timeline, уведомление Enrage перенесено в её заголовок.
- `src/ui/hd-theme.css` — расположение радара/полос боссов и компактные desktop-отступы, сохраняющие свободную зону героя при трёх боссах.

Новые содержательные проверки:

- `tests/unit/public-characters.test.ts`.
- `tests/unit/encounter-timeline.test.ts`.
- `tests/unit/upgrade-cards.test.ts`.
- `tests/e2e/mvp-ui.spec.ts`.
- `tests/unit/upgrade-identity.test.ts` обновлён для корректной принадлежности `projectiles`.
- `tests/e2e/production.spec.ts` теперь проверяет отказ Warrior и фактический Mage, включая controller-only сценарии; прежние проверки Canvas, ресурсов, рекордов, паузы и resize сохранены.

В следующих существующих DEV E2E изменён способ подготовки персонажа: прямой выбор в публичном меню заменён явным `selectTestCharacter`. Gameplay-проверки Warrior сохранены:

`audio.spec.ts`, `combat-balance-2.spec.ts`, `encounter-director.spec.ts`, `final-qa.spec.ts`,
`gamepad.spec.ts`, `gameplay-guardian.spec.ts`, `gameplay-mobility.spec.ts`, `gameplay-stress.spec.ts`,
`gameplay-visuals.spec.ts`, `hd-bosses.spec.ts`, `hd-integration.spec.ts`, `hd-live-stress.spec.ts`,
`hd-performance.spec.ts`, `hd-rework-performance.spec.ts`, `hd-ui.spec.ts`, `hd-warrior.spec.ts`,
`loot.spec.ts`, `mobility-hud.spec.ts`, `mobility-specialization-stress.spec.ts`, `phase2.spec.ts`,
`phase3.spec.ts`, `runner-art.spec.ts`, `runner-performance.spec.ts`, `upgrade-identity-charge.spec.ts`.

Все перечисленные `.spec.ts` находятся в `tests/e2e/`. В `hd-ui.spec.ts` добавлен вывод прямоугольников при ошибке для диагностики; исходный запрет перекрытия зоны героя не ослаблен. `gamepad.spec.ts` проверяет новое публичное сообщение Warrior и отдельно использует DEV-фикстуру для реального Warrior gameplay.

Также обновлён `README.md`. Локальная документация: этот отчёт, `docs/DECISIONS.md`, `docs/PROGRESS.md`, `docs/TEST_REPORT.md`. Документация, raw QA и PNG остаются локальными согласно существующему `.gitignore`.

## Проверки

Среда: Windows, Node 22.16.0, npm 10.9.2, Playwright 1.64.1, настоящий Chromium из `.browsers`. Размеры — 1280×720 и 390×844. Тестовые серверы используют 5187/5188, чтобы не затрагивать пользовательский сервер 5173.

| Команда | Результат |
| --- | --- |
| `npm.cmd run check` | exit 0; 483/483 unit/integration, 61 файл; typecheck, lint и production build прошли |
| Целевые E2E карточек/HD/UI | 31/31, exit 0 после окончательного исправления компоновки |
| `npm.cmd run test:e2e:production` | 6/6, 33.1 с, exit 0 |
| Изолированный `gamepad-performance.spec.ts`, один worker | 2/2, 27.8 с, exit 0 |
| `npm.cmd run test:e2e -- --workers=2` | 258/258, 27.2 мин, exit 0; failures/skipped/retries — 0 |
| `git diff --check` | exit 0 после полного прогона |

В расширенном промежуточном наборе обнаружено перекрытие защищённой зоны героя тремя полосами боссов. Исходные assertions оставлены, уменьшены только desktop-отступы полос; затем 12/12 HD+новых UI и итоговые 31/31 целевых E2E прошли. История этой диагностики не скрывается и не считается успешным полным прогоном.

Тесты Timeline сверяют минуты 3/4/5/6/7/8/9/10, интервалы **30 секунд** после 10:00, запрос трёх боссов с 15:00, реальный Director при занятых слотах, остановку при pause/Level Up и сброс при restart. Имеется проверка десяти scene restarts и отсутствия роста подписок/списка событий.

Карточки проверены для рангов, unlock/evolution, `projectiles`, общих бонусов и Blink. E2E проверяют три целиком видимые карточки и SVG, неизменную геометрию при selected, 200 мс подтверждения, игнорирование повторов/Space, keyboard/gamepad/touch и удерживаемый WASD/стик через модалку. Новые controller-тесты используют mock **только браузерного Gamepad API**; дальше работают настоящий input controller, Phaser, Vue и World. Это не проверка физического контроллера.

Изолированная нагрузка: игровой elapsed 1080 с, Mage с пятью способностями V, 150 обычных врагов + 3 босса + 3 Guardian. Только тестовые HP/invulnerability удерживают нагрузку; рендер и игровой цикл настоящие, standard pad замокан.

| Viewport | Медиана FPS | p95 sampled update | p95 gamepad poll |
| --- | --- | --- | --- |
| 1280×720 | 59.08 | 1.50 мс | 0.10 мс |
| 390×844 | 59.07 | 1.40 мс | 0.10 мс |

Это измерения данной машины/Chromium и конкретной фикстуры, не обещание FPS на всех устройствах. Raw: [desktop](mvp-ui/performance-1280.json), [mobile](mvp-ui/performance-390.json). Логи: [production](mvp-ui/production.log), [performance](mvp-ui/performance.log), [полный E2E](mvp-ui/e2e.log). `mvp-ui/source-hashes.json` фиксирует 263 файла src/tests до финального QA. После завершения всех команд SHA256 всех 263 файлов совпали; новых source/test-файлов вне manifest нет. Конфигурации баланса/способностей и World/EnemySystem/MobilitySystem не имеют diff.

## Скриншоты настоящего Canvas

PNG открывались и проверялись визуально, помимо DOM/geometry assertions.

| Состояние | 1280×720 | 390×844 |
| --- | --- | --- |
| Warrior Coming Soon и сообщение | [PNG](../screenshots/mvp-ui/menu-coming-soon-1280.png) | [PNG](../screenshots/mvp-ui/menu-coming-soon-390.png) |
| Как играть | [PNG](../screenshots/mvp-ui/help-1280.png) | [PNG](../screenshots/mvp-ui/help-390.png) |
| Fireball / Frost / Lightning | [PNG](../screenshots/mvp-ui/cards-0-1280.png) | [PNG](../screenshots/mvp-ui/cards-0-390.png) |
| Projectiles / Armageddon / Shield | [PNG](../screenshots/mvp-ui/cards-1-1280.png) | [PNG](../screenshots/mvp-ui/cards-1-390.png) |
| Unlock и evolution | [PNG](../screenshots/mvp-ui/cards-2-1280.png) | [PNG](../screenshots/mvp-ui/cards-2-390.png) |
| Три эволюции | [PNG](../screenshots/mvp-ui/cards-3-1280.png) | [PNG](../screenshots/mvp-ui/cards-3-390.png) |
| Общие damage / health / cooldown | [PNG](../screenshots/mvp-ui/cards-4-1280.png) | [PNG](../screenshots/mvp-ui/cards-4-390.png) |
| Общие speed / pickup / area | [PNG](../screenshots/mvp-ui/cards-5-1280.png) | [PNG](../screenshots/mvp-ui/cards-5-390.png) |
| Blink-специализации | [PNG](../screenshots/mvp-ui/cards-6-1280.png) | [PNG](../screenshots/mvp-ui/cards-6-390.png) |
| Анимация подтверждения | [PNG](../screenshots/mvp-ui/confirmation-1280.png) | [PNG](../screenshots/mvp-ui/confirmation-390.png) |
| Timeline до Enrage, 09:50 | [PNG](../screenshots/mvp-ui/timeline-590-1280.png) | [PNG](../screenshots/mvp-ui/timeline-590-390.png) |
| Timeline после 10:00 | [PNG](../screenshots/mvp-ui/timeline-600-1280.png) | [PNG](../screenshots/mvp-ui/timeline-600-390.png) |
| Timeline после 15:00 | [PNG](../screenshots/mvp-ui/timeline-900-1280.png) | [PNG](../screenshots/mvp-ui/timeline-900-390.png) |

## Ограничения и ручная приёмка

Локальная игра для приёмки: `http://127.0.0.1:5173/` (HTTP 200, Pixel Survivor проверен). Существующий пользовательский сервер оставлен работающим.

Исходный референс Azeroth Survivor в проекте не найден и не просматривался; дизайн выполнен по текстовым требованиям, эмблемы оригинальные. Физические Xbox/PlayStation и реальные телефоны/Safari в этой сессии не проверялись. Gamepad зависит от браузерного `standard` mapping, разрешения Gamepad API и HTTPS/localhost; браузер может показать устройство только после первого нажатия. Старые ограничения управления описаны в [GAMEPAD_QA.md](GAMEPAD_QA.md).

Timeline — план запросов Director, а не история состоявшихся спавнов. При занятых лимитах фактическое появление определяется прежней логикой World/Director. Mobile намеренно показывает только ближайшее событие; полные названия доступны в aria, на desktop оставшееся время/оговорка о слотах также есть в native title.

1. Открыть игру, проверить Mage по умолчанию. На Warrior использовать мышь, Enter, touch и D-Pad→A: сообщение появляется, Mage остаётся выбранным. Начать забег — должен быть Mage.
2. Вызвать обычный Level Up сбором XP. Проверить три карточки, читаемость и фокус; 1/2/3 выбирают напрямую, Tab/Enter подтверждают фокус. Space ничего не выбирает. Проверить мышь/touch и отсутствие двойного применения.
3. На физическом Xbox/PlayStation использовать левый стик, X/Square для Blink, D-Pad или LB/RB для карточек, только A/Cross для выбора; B/Circle, X/Square, Y/Triangle и Start/Options не выбирают карточки. Удерживать/менять стик во время Level Up — движение должно продолжиться после анимации.
4. На 3–10 минутах сверять Timeline с фактическими событиями; на 10:00 и после 15:00 проверить обозначения Enrage/II и интервалы 30 с. При занятых слотах отсутствие нового врага допустимо и не означает ошибку шкалы.
5. Поставить паузу Start/Options или Esc/P: время и прогресс стоят. Продолжить, затем restart — время и ближайшее событие сброшены. Проверить HUD 1280×720 и 390×844: радар, здоровье, способности и touch-кнопки доступны.

Автоматический QA завершён. По отдельному последующему запросу результат опубликован
в main коммитомfc11095; остаётся ручная пользовательская проверка.
