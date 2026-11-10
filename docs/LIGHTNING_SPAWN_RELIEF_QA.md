# Lightning: тишина после зачистки

2026-11-05, main поверхb1d47fe. Вариант2 пользователя:2игровые секунды полной
паузы обычных рождений после Release, затем.7s линейного возврата частоты.
Настройки — spawnQuiet/spawnRecovery в src/game/config/ultimates.ts.

UltimateSystem хранит время фактического Release отдельно от анимации. World
применяет окно уже в кадре удара и блокирует обычные рождения, включая потомство
Splitter. SpawnClock.reset убирает старый credit; recovery масштабирует dt,
не создавая очередей и не обходя прежние лимиты. Boss/Guardian schedule продолжается.
Pause/Upgrade замораживают срок, смерть/scene cleanup/restart сбрасывают его.
Новых таймеров, listeners, объектов Phaser и изменений renderer нет.

Проверки:

- npm.cmd run check:526unit в67файлах, TypeScript/ESLint/build exit0.
- npm.cmd run test:e2e -- tests/e2e/lightning-spawn-relief.spec.ts
  tests/e2e/lightning-cinematic.spec.ts tests/e2e/ultimates.spec.ts
  tests/e2e/ultimate-practice.spec.ts --workers=2 --reporter=list:
  23/23 за59.2s,exit0, без повторов/пропусков.
- npm.cmd run test:e2e:production -- --reporter=list:7/7 за30.8s,exit0.
- git diff --check:exit0.
- Полный прежний315E2E-набор не повторялся в этом узком follow-up.

В новых unit-тестах: точные границы2s/.7s, момент Release, отсутствие потомства
и долга спавна, рост частоты/квота150, повторное применение, Pause/Upgrade,
GameOver/cleanup, независимость Frost/Fire и приход1boss+3Guardian на11:00.
В cinematic E2E также повторно прошли held input,10рестартов, reduced effects,
восстановление освещения и постоянная нагрузка150+3+3.

Browser fixture:24настоящих tank/Splitter, автоматические навыки отключены,
игрок бессмертен для изоляции проверки. После настоящей Q-активации молнии
естественный спавн включён с обычным коэффициентом1.3.24родительских смерти,
ноль потомков;120RAF samples за первые2s — spawnedRegular24/live0,42sample
в ramp с коэффициентом между0и1. Первый batch — на+2.815s после Release
на обоих viewport. Это ожидаемая дискретность: помимо возврата коэффициента
должен накопиться штатный интервал. Новые группы не создают catch-up толпу.

Снимки настоящего Canvas и JSON:

- [Desktop: тишина](../screenshots/lightning-spawn-relief/quiet-1280.png)
- [Mobile: тишина](../screenshots/lightning-spawn-relief/quiet-844.png)
- [Desktop: возврат](../screenshots/lightning-spawn-relief/return-1280.png)
- [Mobile: возврат](../screenshots/lightning-spawn-relief/return-844.png)
- В том же каталоге before/ash на обеих раскладках; все8PNG открыты и просмотрены.
- Логи check.log/e2e.log/production.log, live-1280.json/live-844.json:
  docs/lightning-spawn-relief/.

Ограничения: это Chromium viewport1280×720/844×390, не физический телефон.
Существующие выжившие враги продолжают входить в экран и атаковать. Отсутствие
новых рождений не удаляет их и не даёт дополнительную неуязвимость.

Блокеров нет. Правка оставлена для ручной приёмки; без commit/push/deploy.
