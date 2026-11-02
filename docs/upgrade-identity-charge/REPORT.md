# Upgrade Card Identity / Aggressive Charge Boss

2026-11-02, feature/upgrade-identity-charge от локального c7ff2b5
(полностью сохранённый Encounter Director 2.0). Main57eb439 не менялся.
Push, merge в main и deploy не выполнялись.

## Карточки

| Способность Mage | Цвет | Способность Warrior | Цвет |
|---|---|---|---|
| Fireball | #F05252 | Cleave | #FFD091 |
| Frost Aura | #D9F3F7 | Whirlwind | #819CAE |
| Chain Lightning | #458FFF | Ground Slam | #D8B47E |
| Meteor | #F59E46 | Bladestorm | #E0EDF0 |
| Arcane Shield | #B58CFA | Iron Skin | #7C9CAC |

Общие характеристики/supplies: #A5B4C3, mobility: #9BCBC5.
Warrior следует стали, золоту и светлым лезвиям ART_STYLE_GUIDE/Rework03.
Рамка3px по всем сторонам, на selected дополнительный внутренний кант1px.
«34px» прочитано как3–4px. Цвет определяется ID навыка для unlock/rank/evolve,
не tier и не редкостью. IV/V усиливает свечение, не меняет цвет.
Мелкая подпись ранга светлая#DBE4E8 и отдельно проверяется на контраст>=4.5:1
(измеренный минимум9.49:1).
Исходный вариант красного текста Fireball давал4.24:1; заданный HEX сохранён
для рамки и свечения, доступность мелкого текста исправлена.
Hover/focus сохраняют цвет навыка; keyboard focus имеет светлый outline2px.
Selected отличается outline3px, внутренним кантом, подложкой, ослаблением остальных
карт и aria-pressed. На desktop видна галочка, на mobile сохранён компактный layout.

Подтверждение выбора240ms проходит на существующей upgrade-паузе. Повторное
нажатие не выбирает вторую карту. Timer отменяется при unmount/смене offer;
после restart старая команда не применяется к новому миру. 1/2/3, Tab/Shift+Tab,
native Enter/Space, click и touch сохранены. CSS уважает prefers-reduced-motion.

Файл UpgradeSystem.ts не изменён (проверено сравнение с baseline с нормализованными LF
и SHA256 в [BASELINE.json](BASELINE.json)). Сохранены eligibility, три уникальных
случайных предложения, RNG, max ranks, несовместимость mobility и эффекты улучшений.
Новые unit-тесты сравнивают последовательности предложений после вызова UI-функции
на нескольких seed и обоих героях; старые regression tests продолжают работать.

## Charger

| Параметр | До, базовый | После, базовый | После, 10:00+ |
|---|---:|---:|---:|
| Преследование | 24px/s, stop150px | 48px/s, stop16px | 76.8px/s |
| Подготовка | 1.1s | 0.5s | 0.5s |
| Charge speed | 400px/s | 144px/s | 230.4px/s |
| Charge distance/duration cap | 260px/.65s | 172.8px/1.2s | 240px/1.042s |
| Recovery | 1.6s | 0.6s | 0.3s |
| Попытка после конца Charge | recovery1.6 + cooldown2.6 | 5s, recovery включено | 2.5s, recovery включено |
| Начальное ожидание | 2s | 2s | 1s |
| HP / обычный damage | 4500 / 28 | 4500 / 28 | прежний time scaling |
| Charge damage multiplier | 1.25 | 1.25 | 1.25 |

Данные вынесены в config/chargeBoss.ts. Movement Director масштабирует pursuit и
charge от базы, frequency делит cooldown/recovery, предупреждение остаётся.5s.
Движение между атаками активно; во время recovery босс кратко останавливается.
Частота попыток означает начало подготовки через5/f после конца прошлого рывка;
сам рывок начинается ещё через.5s. До260px разрешена попытка, путь ограничен240px.
Мир бесконечен, отдельной стены арены нет. HP/damage scaling сохранён, Sorcerer и
Eclipse имеют прежнее поведение.

Направление фиксируется в конце подготовки, после начала Charge не меняется.
Убраны линия и широкий коридор будущей траектории. Вместо них используются
существующие windup-кадры (не прерываются hurt), локальные пиксельные искры,
вспышка силуэта последние.12s и новый cue в существующем синтезаторе AudioSystem.
Восьми локальным rect-пикселям не передаётся endpoint траектории.

При большом delta движение ограничено бюджетом distance и проверяется swept
segment, исключая туннелирование через неподвижную цель. Один контакт на Charge,
включая поглощение Shield/i-frames/Dash/Blink. За пределами Charge действует
прежний обычный contact damage/cooldown. World сохраняет предел raw delta50ms;
AI не воспроизводит задним числом очередь атак после длинного кадра.
Pause замораживает состояние, смерть обоих участников/restart/teardown очищает его.

Реальный изолированный AI-прогон за60s: на3/5/7/9/10минуте Charger начинает
9/11/12/14/15 атак, pursuit48/55.2/62.4/69.6/76.8px/s. Все warning=.5s.
Другие два босса сохраняют предыдущие измерения.
[BOSS_MEASUREMENTS.json](BOSS_MEASUREMENTS.json) содержит реальные переходы AI;
поле cooldown в нём — остаток approach после recovery, не полный5/f.

## Проверки

`npm.cmd run check` — TypeScript/lint, **259 unit / 43 файла**, production build:
успешно. Существующее предупреждение большого Phaser chunk сохранено.
Целевые dev E2E **18/18** (1.1min): новые6 сценариев +12 предыдущих mobility.
Полный dev-прогон: **126 passed / 1 failed**, 23.2min. Единственный сбой — гонка
старого теста сундуков: он повторно нажимал selected-карту во время подтверждения
и затем ждал уже закрывшийся dialog. Тест исправлен ожиданием aria-pressed=false
и смены offerId после каждого выбора; assertions сохранены.

После исправления ожидания и последней CSS-правки контраста выполнены **19/19**
за1.6min: весь loot.spec, весь hd-ui.spec и весь новый upgrade-identity-charge.spec.
Таким образом, все127 сценариев проверены успешно хотя бы в одном актуальном
прогоне; полный набор одним запуском завершился126/127, это явно не скрывается.
После полного прогона gameplay-код не менялся, изменены только подпись ранга и тесты.
Финальные production E2E **4/4**, 33.9s; финальный check снова **259/259**.
`git diff --check` проходит. Отключённых тестов нет.

Фактические команды (dev5195, preview5196 через PIXEL_E2E_PORT):

```powershell
npm.cmd run check
npm.cmd run test:e2e -- --max-failures=3 --reporter=list --output=.tmp/e2e-upgrade-charge-full
npm.cmd run test:e2e -- tests/e2e/upgrade-identity-charge.spec.ts tests/e2e/hd-ui.spec.ts tests/e2e/loot.spec.ts --reporter=list --output=.tmp/e2e-upgrade-charge-final-ui
npm.cmd run test:e2e:production
git diff --check
```

Unit покрывают точные цвета всех10 навыков и трёх ID-prefix, neutral/mobility,
сохранение RNG/state/eligibility, все5 стадий агрессии, cooldown от конца Charge,
0.5s warning, фиксацию направления, отсутствие homing, bounded delta, один hit,
реальные walk/Dash/Blink, HP/damage, pause/death/cleanup и локальность графики.
Браузер проверяет computed border/focus/selected, все цвета на1280x720/390x844,
эволюции, 1/2/3, Tab, touch, отмену pending selection, windup/flash, уклонение
и по5 scene restarts на viewport с неизменным числом listeners и clock[0,0,0].

Уклонение проверено обычным реальным input после старта Charge с исходной
дистанции210 world pixels при поздней агрессии. Mage сохранил100/100HP,
Warrior150/150HP, invulnerableUntil=0 во всех6 случаях. Blink/Dash использовали
обычную игровую защиту, тестовая неуязвимость не включалась.
Это не доказательство уклоняемости из каждой ситуации вплотную к боссу.

## Производительность

Реальные12s на условие:150 regular +3boss +3active Guardian, пять уменийV,
мобильностьIII, обычное перемещение. Неуязвимость используется исключительно
для удержания постоянной нагрузки в performance fixture.

| Герой / ширина | FPS до → после | p95 update до → после |
|---|---:|---:|
| Mage/1280 | 59.6 → 59.8 | 0.80 → 0.80 ms |
| Mage/390 | 59.8 → 59.7 | 0.70 → 0.70 ms |
| Warrior/1280 | 60.0 → 59.3 | 0.80 → 0.90 ms |
| Warrior/390 | 59.7 → 60.0 | 0.90 → 0.80 ms |

Windows/Chromium, Ryzen7500F,32GiB. Сравнение с сохранённым Encounter Director;
это короткая выборка кадров/10 поздних samples, не аппаратная гарантия для телефона.
Все samples удерживали150/3/3; caps projectile96/effect96/hazard24 соблюдены.
Публикация Vue остаётся10Hz, радар5Hz, pools и лимиты обычных объектов не менялись.
Clock[0,0,0], browser errors отсутствуют. Исходные samples, computed UI colors
и шесть настоящих уклонений: [QA_EVIDENCE.json](QA_EVIDENCE.json).

## Скриншоты

Реальные Playwright PNG, Canvas и UI выборочно просмотрены лично:

- [Mage, desktop focus](../../screenshots/upgrade-identity-charge/cards-Mage-1280-0-focus.png)
- [Mage, desktop selected](../../screenshots/upgrade-identity-charge/cards-Mage-1280-0-selected.png)
- [Mage, mobile](../../screenshots/upgrade-identity-charge/cards-Mage-390-0-focus.png)
- [Meteor/Shield и neutral](../../screenshots/upgrade-identity-charge/cards-Mage-1280-2-focus.png)
- [Эволюции и mobility](../../screenshots/upgrade-identity-charge/cards-Mage-390-3-focus.png)
- [Warrior, desktop](../../screenshots/upgrade-identity-charge/cards-Warrior-1280-0-focus.png)
- [Warrior, mobile selected](../../screenshots/upgrade-identity-charge/cards-Warrior-390-1-selected.png)
- [Charger windup desktop, Canvas](../../screenshots/upgrade-identity-charge/charger-preparation-canvas-1280.png)
- [Charger windup mobile, Canvas](../../screenshots/upgrade-identity-charge/charger-preparation-canvas-390.png)
- [Краткая вспышка, Canvas](../../screenshots/upgrade-identity-charge/charger-flash-canvas-390.png)

Геометрической траектории в показанной настоящей windup-сцене нет; босс виден
целиком и подготавливает атаку, последующая вспышка хорошо различима.
Эти visual fixtures имеют полное настоящее HP; для фиксации кадра использована
обычная игровая pause, её Vue overlay временно скрыт только на снимке Canvas.
PNG/raw JSON локальны и ignored, как в предыдущих пакетах проекта.

## Ручная проверка

Оценить реакцию на полусекундную подготовку без линии в плотной поздней встрече,
удобство близких уклонений, громкость cue при нескольких боссах/выключенном звуке,
различимость стальных цветов Warrior и яркость свечения на физическом телефоне.
Hardware mobile/длительный heap/VRAM soak этой задачей не измерены.
Локальная игра: http://127.0.0.1:5194/ . Разработка остановлена для ручного теста.
Main остаётся57eb439; push, merge и deploy не выполнялись.
