# Frost Ultimate — Печать вечной зимы

2026-11-05. Работа непосредственно в main после Lightning Devastation; только
Frost переработан в этом pass. Без commit/push/deploy. После QA — ручная приёмка.

## Уточнение после ручной проверки

2026-11-05: радиус уменьшен **ровно вдвое**. Текущее значение — диагональ
viewport в мировых координатах × 0.25, задано в
`ULTIMATE.frost.radiusDiagonalRatio`. Руна/дымка и игровая область заморозки
используют один радиус. Тайминги и работа остальных способностей прежние.

После этой настройки: check **548/548** + typecheck/lint/build, целевые
Frost/ultimates E2E **18/18**, production **7/7**, diff-check exit 0.
Полный набор 326 E2E ниже относится к исходной версии до уменьшения радиуса.
Новые unit проверяют дальнего подвижного врага и границу коллайдера на трёх
viewport. Обновлённые реальные кадры активной руны визуально проверены на
1280×720 / 844×390 / 1024×768; 150+3+3 median 59.88 FPS, p95 ~16.8 ms.
Подробные логи и замеренные радиусы: `frost-radius/verification.json`.

## Игровой контракт

| Время от активации | Фаза |
| --- | --- |
| 0–.45s | Invocation, поднятый посох, холодная дымка/частицы |
| .45–.70s | Посох вниз, тёмно-синяя руна строится наружу |
| .70–.90s | Вторая светлая cyan-волна перекрашивает геометрию |
| .90–4.90s | Полностью активная руна, любой вошедший враг получает freeze |
| 4.90–8.90s | Руны уже нет, ранее затронутые враги остаются во льду |
| ≥8.90s | Оттаивание и продолжение сохранённых боевых фаз |

Полная заморозка включается с завершением светлой волны: ранние цели получают
8игровых секунд, поздние — тот же общий thawsAt. Rune origin фиксируется при
активации, радиус=quarter-diagonal фактического viewport в мировых координатах.
Все часы — World.elapsed, pause/upgrade останавливают сроки. Урон ульты0.

Особый Enemy.ultimateFreeze не связан с обычными Frost Nova root/slow/resistance.
Freeze останавливает движение, контакт, новые касты и текущие phase clocks всех
типов врагов, включая3bosses/3Guardian. Pending floor warnings удерживаются;
ранее выпущенные снаряды продолжают полёт и обычное истечение. При разморозке
сохраняются remaining warning/cooldown, charge distance и teleport target;
пропущенные атаки не копятся. Защита/дополнительная неуязвимость Mage не добавлена.

## Реализация

- `ultimates/FrostUltimate.ts`: поле, последовательность, общий deadline.
- `systems/UltimateFreeze.ts`, `entities/types.ts`: особый статус и приостановка
  shoot/boss/rusher/Guardian clocks без остановки World/Enrage.
- `World`, `EnemySystem`, `RareGuardianSystem`, `BossSystem`, `ChargeBoss`,
  `GuardianEncounter`: применение freeze до AI, безопасный resume, удержание
  pending impacts и запрет knockback во льду; cleanup при death/restart.
- `art/FrostUltimateArt.ts`:2Graphics,364кэшированных авторских сегмента,
 12сигилов/4кольца/соединения,12полос тумана,≤24частиц, слой льда.
- `GameArt`, `GameScene`: frozen-frame cache≤156, tint с очисткой после thaw.
- `MageCastingController`, `mageCastingPoses`, авторский builder и casting PNG:
  поднятие/опускание посоха Frost.270других кадров попиксельно идентичны baseline.
- `AudioController`, `AudioPresentation`, `catalog`, `synthesis`: собственные
  Frost charge/impact/seal и один очень тихий frostAir loop, SFX/mute/pause cleanup.
  Сумма длины Frost PCM прежняя1.1s, общий budget<4MB, максимум3loops.

LightningGroundArt/lightningCinematic/chainStorm сверены SHA256; Lightning/Fire
кадры атласа и обычные жесты совпали с baseline. Их механика не перерабатывалась.

## Проверки исходной реализации до уменьшения радиуса

- `npm.cmd run check`: **545/545 unit/integration** в 69 файлах;
  typecheck/lint/build — exit 0 (`frost-seal/check-final.log`).
- `npm.cmd run test:e2e`: **326/326** за 28.6 минуты на чистом сервере 5187,
  exit 0; skipped/flaky/unexpected — 0. Все 336 исходников/тестов/ассетов/
  скриптов оставались неизменны до конца прогона (`full-verification.json`).
- После полного прогона исправлена Frost-поза удара посохом при взгляде вверх/
  вниз. Изменились только `mageCastingPoses.ts`, casting PNG и новый unit на
  четыре направления. Механика не менялась. Повторный check выше; целевые
  Frost/Mage casting E2E — **11/11** за 1.2 минуты, exit 0. Отдельно сняты и
  проверены реальные поднятая/опущенная позы во всех четырёх направлениях
  (`staff-directions.json`, `staff-{direction}-{0,1}.png`).
- `npm.cmd run test:e2e:production` после правки: **7/7** за 36.3 секунды,
  exit 0, skipped/flaky/unexpected — 0 (`production-final.json`).
- `git diff --check`: exit 0 (`diff-check.log`). Финальное состояние:
  `delivery-manifest.json`, результаты и три изменения после полного прогона:
  `delivery-verification.json`. 270 не-Frost кадров попиксельно прежние;
  SHA256 трёх защищённых Lightning-файлов прежние.
- Первый полный прогон на reused-сервере 5185 остановлен после timeout старого
  camera prototype-hook: сервер накопил HMR class versions. Свежий сервер
  прошёл 6/6 camera/Fireball тестов без изменения кода/ожиданий, затем весь
  набор 326/326. Прерванный лог сохранён как `full-hmr-aborted.log`.

Новые unit/integration проверяют stationary origin/radius, обе волны,4+4сроки,
поздний вход, всех heavy, chase/melee/cast suppression, knockback, старые shots,
windup/charge/teleport resume и Guardian orb warning/lifetime. Отдельный audio
тест проверяет один тихий field loop, pause/mute/end. Старый Frost-wave тест
заменён контрактом нового seal; обычный Frost Nova resistance не ослаблен.

Browser tests используют настоящий Phaser RAF. Визуальные сцены:18обычных+
3boss+3Guardian, отключённые авто-навыки, test-only invulnerability игрока для
изоляции длительного захвата. Состояния/позиции/actor frames сравниваются во
время поля и residual; после thaw проверяется возобновление движения. Реальные
Q/Y/touch, pause/upgrade activation guard, late entrant, mute и10рестартов.

Нагрузка150+3+3/5rankV/highCDR: все156целей Frozen, median59.88FPS,
p95≈16.9ms во всех3viewport в финальном целевом прогоне. Ноль Clock/tweens,
руна364сегмента/2партии, без объектов на каждую частицу или врага.
Это Windows/Chromium viewport эмуляция (Ryzen5 7500F,32GB RAM), не physical mobile.

## Кадры

В `../screenshots/frost-seal/` сохранены8фаз ×3viewport плюс before/stress.
JSON с фазами, frozen frames и аудио: `frost-seal/timeline-{width}.json`.

| Фаза | 1280×720 | 844×390 | 1024×768 |
| --- | --- | --- | --- |
| Посох вверх | [PNG](../screenshots/frost-seal/01-staff-1280.png) | [PNG](../screenshots/frost-seal/01-staff-844.png) | [PNG](../screenshots/frost-seal/01-staff-1024.png) |
| Холод/подготовка | [PNG](../screenshots/frost-seal/02-cold-1280.png) | [PNG](../screenshots/frost-seal/02-cold-844.png) | [PNG](../screenshots/frost-seal/02-cold-1024.png) |
| Тёмная руна | [PNG](../screenshots/frost-seal/03-dark-rune-1280.png) | [PNG](../screenshots/frost-seal/03-dark-rune-844.png) | [PNG](../screenshots/frost-seal/03-dark-rune-1024.png) |
| Светлая волна | [PNG](../screenshots/frost-seal/04-cyan-wave-1280.png) | [PNG](../screenshots/frost-seal/04-cyan-wave-844.png) | [PNG](../screenshots/frost-seal/04-cyan-wave-1024.png) |
| Frozen | [PNG](../screenshots/frost-seal/05-frozen-1280.png) | [PNG](../screenshots/frost-seal/05-frozen-844.png) | [PNG](../screenshots/frost-seal/05-frozen-1024.png) |
| Frozen bosses | [PNG](../screenshots/frost-seal/06-boss-frozen-1280.png) | [PNG](../screenshots/frost-seal/06-boss-frozen-844.png) | [PNG](../screenshots/frost-seal/06-boss-frozen-1024.png) |
| Без руны/ещё во льду | [PNG](../screenshots/frost-seal/07-residual-1280.png) | [PNG](../screenshots/frost-seal/07-residual-844.png) | [PNG](../screenshots/frost-seal/07-residual-1024.png) |
| После оттаивания | [PNG](../screenshots/frost-seal/08-thawed-1280.png) | [PNG](../screenshots/frost-seal/08-thawed-844.png) | [PNG](../screenshots/frost-seal/08-thawed-1024.png) |

Логи и доказательства: docs/frost-seal/. Восемь фаз на трёх viewport визуально
проверены; отдельно проверены четыре направления удара посохом. Обнаруженных
блокеров нет. FPS измерен в Chromium с эмуляцией viewport, не на физических
мобильных устройствах.

Для приёмки: http://127.0.0.1:5185/ → DEV «Абсолютный Ноль» → Q/Y/mobile
ultimate. Работа остановлена для ручной визуальной приёмки Frost. Fire не начат;
новых commit/push/deploy нет.
