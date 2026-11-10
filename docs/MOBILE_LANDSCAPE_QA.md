# Landscape-only Mobile + Fullscreen

После отдельного запроса пользователя «пуш в мейн» опубликован commit
`dbd04f965d8e65904721787da50f24ae008105d1`,18файлов; origin/main SHA подтверждён
независимым ls-remote. HEAD/origin/main совпадают, дерево чистое,267QA hashes
сохранены. Deploy не выполнялся. Ниже — отчёт до публикации.

Main, база e28bbc5, исходное дерево чистое. Без новых веток, commit, push и deploy.

## Изменения

`src/ui/mobileViewport.ts`: определение touch/coarse, контроллер fullscreen с pending/
dispose, синхронным requestFullscreen и последующим orientation.lock, catch всех отказов.
`src/App.vue`: portrait overlay и inert, start gesture, resize/fullscreen/orientation/
visualViewport subscriptions с cleanup; сохранение joystick через Level Up.
`src/game/scenes/GameScene.ts`: запрет step в portrait, pause/resume только поворота,
ограничение команд и gamepad UI; сохранение touch input после upgrade, visual zoom .83.
`WorldChunkSystem.ts`/`worldTiles.ts`: отдельный render padding0 для touch, обычный1
сохранён. Логические размеры World остаются прежними, механики Blink/spawn не меняются.
`VirtualJoystick.vue`: stop только для своего pointerId. `mobile-layout.css`/`main.ts`:
safe-area landscape layout, HUD/Timeline, 80px Blink, joystick и пять auto icons.
Touch overlays имеют z-index4 над controls3: joystick не перекрывает upgrade-карты,
но сохраняет захваченный pointer, оставаясь смонтированным.
`LevelUpModal.vue`: подтверждение вторым touch по pointerup, сверка начала касания,
pointerId и смещения ≤12px, отмена по pointercancel. Compatibility click отсутствует
у второго touch в Chromium при удержании первого; это воспроизведено и исправлено.

Legacy E2E audio/gameplay-mobility/hd-ui/levelup-hotfix/mobility-hud/mvp-ui/
upgrade-identity-charge используют landscape вместо прежнего touch portrait.
Сохраняются HP/cooldown/abilities/lifecycle assertions; изменены только viewport,
ожидаемая ширина и число видимых slots5 вместо6. Новый `mobile-landscape.spec.ts` —
13 случаев: четыре размера, пять комбинаций API, native fullscreen, desktop,
ручная pause/upgrade при повороте и lifecycle listeners через десять рестартов/unmount.

## Проверки

- `npm.cmd run check`:487/487,61files,typecheck/lint/build exit0 (check-final.log).
- Усиленный финальный mobile набор:13/13,17.5s,exit0 (target-final3.log).
- `npm.cmd run test:e2e -- --workers=2`:275/275,26.8min,exit0 (e2e-final.log),
  failures/skipped/retries0. HTML: [полный набор](mobile-landscape/playwright-full/index.html).
- Повтор после финальной CSS-строки: `npm.cmd run test:e2e -- mobile-landscape.spec.ts levelup-hotfix.spec.ts mobility-hud.spec.ts hd-ui.spec.ts`:
  39/39,1.4min,exit0 (ui-final.log), [HTML](mobile-landscape/playwright-ui-final/index.html).
- `npm.cmd run test:e2e:production`:6/6,34.5s,exit0 (production-final.log),
  [HTML](mobile-landscape/playwright-production-final/index.html).
- `git diff --check`:exit0. После финальных UI/production все267src/tests SHA256
  совпали с final-validated-source-hashes.json; final-verification.json:changed[].

Логи/manifest267файлов: `docs/mobile-landscape/`. Ранние ошибки теста селектора/mock/
CDP pointer end исправлены по диагностике. Два старых случая выявили60render chunks:
покрытие расширенного поля сохранено, offscreen padding убран только в touch;
исходный лимит48 оставлен и целевые тесты прошли. Ранний параллельный запуск
нескольких Chromium вызвал OOM; финальные прогоны идут последовательно.
Во время полного финального QA дополнительно просмотрен upgrade before-390.png:
найден и исправлен одной CSS-строкой overlay stacking. Vite подтвердил CSS HMR,
без перезагрузки сцен. После этого check повторно прошёл487/487; затронутые UI
кейсы повторно прошли39/39, production6/6 после полного набора. Игровой код неизменён.

Fullscreen проверен как настоящим Chromium request/exit, так и API mocks для
success/failure/unsupported и lock failure/unsupported. Моки не являются проверкой
физического телефона. Проверены trusted user activation, отсутствие вызова при
загрузке и отсутствие повторного запроса после fullscreen exit/resize.
Два пальца идут через CDP в реальные PointerEvents → Vue → commands → Phaser/World;
проверяются одно Blink и одна команда, затем повторный mouse pointerdown/click
с принудительно готовым cooldown выявляет возможное дублирование команды.
Второй touch реально выбирает карточку, пока первый удерживает стик.
Поворот останавливает
elapsed, landscape возобновляет собственную pause. Старые lifecycle/input E2E
входят в полный набор. Через десять scene restarts реальный CDP listener baseline
стабилен; после Vue unmount и кадра Phaser все viewport listeners сняты.
AI/HP/CDR/способности/коллизии/конфигурации не менялись.

## PNG (открыты и просмотрены)

- [Phone landscape 844×390](../screenshots/mobile-landscape/844x390.png)
- [Phone portrait 390×844](../screenshots/mobile-landscape/390x844.png)
- [Tablet landscape 1024×768](../screenshots/mobile-landscape/1024x768.png)
- [Tablet portrait 768×1024](../screenshots/mobile-landscape/768x1024.png)
- [Desktop 1280×720](../screenshots/mobile-landscape/1280x720.png)
- [Landscape upgrade, без наложения joystick](../screenshots/frost-audio-levelup/before-390.png)

## Ограничения и приёмка

Реальные iOS/Android/планшеты/Steam Deck не проверялись. Поддержка fullscreen/lock
зависит от браузера; при отказе можно играть в landscape без fullscreen. См.
[requestFullscreen](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen)
и [orientation.lock](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock).
Touch-layout определяется основным coarse pointer и touch capability; подключение
мыши, меняющее primary pointer, следует проверить на реальном устройстве.

Ручной тест: открыть portrait → заглушка; повернуть → Start → fullscreen или fallback;
держать левый палец и нажать Blink правым; получить уровень, выбрать карточку с
удержанием; повернуть во время забега/паузы/Level Up; выйти из fullscreen; повторить
рестарты и убедиться, что автоматического fullscreen повторно нет.
Публикация до ручной приёмки не разрешена.
