# Пользовательский Walking V2

9 ноября 2026. Подключить только пользовательские walking PNG/GIF из
`art/main-hero-mage-v2/animation/walking/`. Новых генераций и расходов нет.

| Направление | Файл/вид | Отражение |
| --- | --- | --- |
| S / SE / E | south / pixellab-Step-forward-toward-the-camera-1794239830649 | нет |
| W / SW | тот же south | flipX |
| N / NW | north / pixellab-Step-forward-with-alternating--1794238864376 | нет |
| NE | тот же north | flipX |

Диагонали продолжают схему двух видов, уже используемую в Idle. Все13кадров
каждого source PNG384×384 сохранены точно в порядке row-major4×4; GIF задаёт
13×130ms=1690ms при обычной скорости135world units/s. Это прямой импорт
пользовательского набора, а не сокращение до стандартного бюджета6–8кадров.
PNG — источник цветов, без quantization,resize,repaint,foot-pin или регистрации
каждого bbox. GIF/PNG исходники не изменяются, их SHA256 входят вmanifest.

## Сборка и представление

Команда: `node scripts/build-mage-walk-v2.mjs`. Выход:
`public/assets/hd/mage-walk-v2/atlas.png/json`,
`src/game/art/mageWalkManifest.json`.26кадров96×96,atlas384×672,
1032192RGBA bytes; зеркала используют общие текстуры. NEAREST фильтр.

Обе стартовые позы walking точно совпали с соответствующим первым Idle кадром.
DisplaySize46.358149,pivots south[46,84]/north[48,83] перенесены изIdle;
они фиксированы на весь цикл, зеркальныйX=96−X. Масштаб между Idle иWalk не меняется.
Настоящий шаг и подъём стоп исходной анимации сохраняются.

`MageHeroAnimation` выдаёт новый walk сразу при движении, Idle — сразу после
остановки. Прежние run-start/run-stop не показываются в обычном движении.
Часы walk зависят от пройденного расстояния/referenceSpeed135:analog иhaste
масштабируют шаг. Поворот сохраняет фазу, новая прогулка начинается снулевой,
pause/upgrade замораживают часы,сменаrunId очищает их. Blink-подобный скачок
ограничен текущимdt×effectiveSpeed×1.5,чтобы не прокручивать несколько циклов.
Collider,физическая скорость/управление иspell timings не меняются.

Idle продолжает использовать собственный пользовательский набор. Следующим
поручением подключены [семь новых cast-клипов](MAGE_CAST_V2_INTEGRATION.md).
По следующему поручению [каст на ходу разделён на два слоя V2](MAGE_MOVING_CAST_V2_INTEGRATION.md):
низ Walking продолжает шагать, верх Cast выполняет жест по независимому таймеру.
При наведении ноги используют ту же проекцию мантии, что и торс; темп берётся
из текущего счётчика расстояния / 135. Стоящий Cast остаётся цельным. Старые
phantom и legacy split-body не показываются. Death пока прежний.
Origin/flip/crop/size соответствуют действию.

Rest-hand fallback работает ивwalking:источником служит видимая кисть конкретного
PNG-кадра с учётомorigin/flip/scale; новыйframe не ищется встаромwaist-map.

GIF timing parser вынесен в`scripts/lib/gif-frame-durations.mjs` ииспользуется
обоими builders. ПересборкаIdle иWalk даёт теже6выходных файлов;8source файлов
не изменяются. Старые отклонённые staging-пакеты не используются.

## Проверки

Unit проверяет 26 RGBA atlas roundtrips, четыре walking source SHA, 13 фаз и
тайминги, восемь направлений и зеркала, Idle pivot/scale, аналоговую скорость,
поворот, pause, немедленную остановку, restart и ограничение Blink displacement.
Старые unit legacy cast/run paths сохранены. E2E проверяет 13 различных кадров
и два замыкания цикла в каждом из восьми направлений, скорость 135, pause во время
шага и Idle после остановки, desktop 1280×720 / mobile 390×844.
Скриншоты: `screenshots/mage-walk-v2/`.

Результат: 114 unit files / 940 tests PASS при `--maxWorkers=2`;
typecheck/lint/build PASS. Движение и Idle E2E 7/7, moving cast/origins/phantom
6/6, production 9/9 PASS — всего 22. Проверены десять scene restarts, очистка
crop/phantom, отсутствие накопления объектов/текстур/слушателей. Реальные Canvas
четырёх видов на desktop/mobile открыты и просмотрены. `git diff --check` PASS.
Логи: `.tmp/mage-walk-v2/`. Полный E2E suite не запускался; компоненты check
выполнены отдельно с bounded workers из-за ранее подтверждённых default timeouts.

Следующая замена — только из новых ассетов пользователя или по отдельному
поручению. Автоматическое производство cast/hurt/death не запускать.
