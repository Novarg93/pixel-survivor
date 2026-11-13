# Frost Nova Audio / Level-Up UX Hotfix

2026-11-03. Ветка `feature/frost-audio-levelup-ux`, HEAD `3e5febf` с сохранением
ранее принятых незакоммиченных изменений Audio MVP. Ветка создана отдельно;
старые staged изменения .gitignore/docs сохранены. Ничего не закоммичено/не опубликовано.
Исходное состояние файлов до хотфикса: `BASELINE_FILES.json`.

## Реализация

- `src/game/audio/synthesis.ts`, `catalog.ts`: новый оригинальный Frost PCM .48s.
  Короткий холодный импульс, четыре кристаллических всплеска, округлый низкий слой
  и ледяной хвост. Нет скачанных сэмплов/Warcraft-аудио. Gain .45, категория SFX,
  существующие mute/Master/SFX и rate/concurrency limits сохранены.
  Peak .39836, RMS .05153, RMS хвоста .00100. WAV: `frost-nova.wav`;
  спектральные/амплитудные измерения: `FROST_PCM.json`.
- `src/ui/upgradeInput.ts`, `App.vue`: снимаемый capture guard Space down/up,
  действующий даже до монтирования Vue-карточек. Повторные Space также блокируются.
  Modal дополнительно предотвращает Space/Enter default на down/up.
  Обычный Space в gameplay остаётся Blink/Dash.
- `LevelUpModal.vue`: цифры Digit/Numpad1/2/3 непосредственно выбирают индекс,
  независимо от фокуса; key repeat/модификаторы/IME игнорируются. Enter выбирает
  сфокусированную карточку. Tab/Shift+Tab, mouse/touch сохранены.
- `UpgradeConfirmation.ts`, `upgradeIdentity.ts`: один UI-таймер **200ms**,
  выбор блокируется немедленно, commit однократный и привязан к offer;
  смена offer/unmount отменяют таймер. World остаётся upgrade до commit.
- Scoped CSS карточек: обводка/импульс в цвет способности, другие карточки
  плавно получают brightness(.35). Геометрия не меняется. Reduced motion
  убирает transitions/pulse, сохраняет 200ms понятного статического выбора.

## Проверки

`npm.cmd run check`: **352 unit /50 файлов**, TS/lint/build прошли.
Целевые новые E2E: **14/14** (13 input/selection +1 Frost output); прежние
6 upgrade-identity/charge также прошли. Полный прогон: **172/172 за27.4min**,
Playwright `.last-run.json`: status passed, failedTests[]. Production:
**4/4 за24.4s**, exit0. `git diff --check` прошёл. Финальные SHA и инварианты:
`FINAL_FILES.json`, `VALIDATION.json`; исходники этого этапа сохранены перед
следующей задачей в `.tmp/frost-audio-levelup/source-after.zip`.

PowerShell-обёртка полного прогона вернула1 из-за NativeCommandError на stderr
предупреждениях NO_COLOR, хотя все172теста прошли. Это воспроизведено отдельным
Node-процессом с явным exitCode0 и stderr warning: обёртка снова дала1.
Явный `exit $LASTEXITCODE` исправляет возврат оболочки; production с ним вернул0.
Этот нюанс не скрыт и не выдаётся за падение либо повторный зелёный запуск.

Реальные RAF (без подмены часов): симуляция заморожена во время выбранного
состояния; UI-таймер200ms проверен точно unit-тестом. Первый commit наблюдался
в RAF через216ms в целевом и263.3ms в полном прогоне (включая задержки браузера),
после этого время мира снова идёт. Повторный Digit1/другой Digit2 не удваивает
эффект. Удержание цифры не выбирает карточку следующего offer.
10scene restarts:9window listeners и bridge1/1/1 во всех циклах; старый World
не получает ожидающий upgrade после рестарта. Unit отдельно проверяет удаление
обоих App capture listeners и отсутствие оставшихся UI-таймеров.

Frost E2E проверяет реальный RMS при включённом звуке и тишину при SFX0,
mute и Master0; после восстановления звук снова идёт. Высокий CDR ограничен
существующим множителем .35: FrostV примерно .833s, это не менялось.

PNG просмотрены: `screenshots/frost-audio-levelup/before/selected/after-{1280,390}.png`
(имена реально before-1280.png и т.д.) плюс Canvas-after. Выбор хорошо виден,
соседние карточки затемнены, layout/overflow не меняются. Для воспроизводимого
снимка confirmation тестовые часы остановлены, CSS закреплён на фазе170ms;
отдельный тест с настоящим RAF проверяет реальное время/паузу.
JSON timeline/listener/output лежат там же.

Начальные целевые тесты выявили две ошибки проверок: CSS transition ещё не
достиг brightness .35 в замороженных часах, и тест ошибочно считал .35 абсолютным
cooldown. Исправлены сами сценарии под фактическую CSS-фазу и существующий
cooldown floor; gameplay/balance не менялись, тесты не отключались.

## Дальше

Технический QA завершён, инварианты подтвердили отсутствие изменений игровых
файлов за пределами audio. Остальные25звуков совпали по размеру/peak/RMS,
полный PCM-каталог3 580 044B. Ручная оценка нового звука остаётся пользователю.
Пользователь отдельно поручил затем сразу начать
Mage Casting Animations в новой feature-ветке; задание сохранено в
`../NEXT_TASK_MAGE_CASTING.md`. После анимаций остановиться для художественной
приёмки. Новых номерных done-маркеров нет.

Последующее задание Mage выполнено в `feature/mage-casting-conductor`;
см. [отчёт](../mage-casting/REPORT.md). Общий финальный набор после обеих работ:
365unit,178/178devE2E,4/4production, diff-check прошёл. Исходники UI/audio этого
хотфикса совпадают по SHA с сохранённым состоянием до Mage. Остановка для ручной
приёмки обеих работ.
