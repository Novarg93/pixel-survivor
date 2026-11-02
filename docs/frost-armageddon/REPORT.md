# Frost Nova / Armageddon

2026-11-02. Ветка `feature/frost-nova-armageddon` от`ba00925`.
Предыдущий HP/Blink hotfix сохранён. Новые параметры: `config/mageAbilities.ts`.

| Ранг | Root Nova,с | Радиус Nova,px | Base cooldown Nova,с | Meteor/count | Радиус Meteor,px | Общий базовый урон Meteor по одной группе |
|---|---:|---:|---:|---:|---:|---:|
| I | 1,2 | 73 | 2,8 | 1 | 55 | 80 |
| II | 1,2 | 87,6 | 2,8 | 1 | 62 | 105 |
| III | 1,2 | 87,6 | 2,38 | 2 | 69 | 227,5 |
| IV | 1,7 | 87,6 | 2,38 | 2 | 76 | 271,25 |
| V | 2 | 105,12 | 2,38 | 3 | 83 | 450 |

Общий area применяется к радиусу один раз. Дополнительные+20% рангаV:
`73×1.2×1.2`, затем`stats.area`. Прямой урон Nova16/22/28/34/40 прежний,
как и V+areaIII множитель1,3. Новое название в HUD, карточках и статистике —
«Морозная нова»; Meteor — «Армагеддон». ID`frost/meteor` и правила pool прежние.

Nova автоматически ищет плотную группу в310px с центром внутри текущего
viewport. Проверяет всех допустимых врагов, а не только первые16.
Root блокирует движение и separation, но caster продолжает warning/shot.
Rusher не перемещается в Charge подroot, его фазовые часы продолжают идти.
После окончания AI и прежние slow продолжают действовать; permanent speed
не меняется. Knockback других способностей сохранён.

Повторные попадания не продлевают active root: после него минимум2с свободного
движения. Существующая эволюция Frost:2попадания за4с усиливают следующий
**разрешённый** root на0,75с, не чаще раза в6с. Она не обходит gap2с;
максимальный усиленный rootV2,75с. Базовые значения в таблице без эволюции.

Боссы получают20%movement slow на1с с2с resistance после него. Root отсутствует,
атаки и cooldown не замораживаются. Для неподвижного Guardian slow действует
на вращение луча:1,4→1,12рад/с на1с. HP, damage, warning, phases, meteor и
damage ticks не меняются. Без Nova все базовые параметры прежние.

Shared CDR сохранён: сначала базовый cooldown Nova2,8/2,38, затем существующая
формула. При20%CDR:2,24с наI–II и1,904с наIII–V; floor0,98/0,833с.
Meteor5,6с, при20%CDR4,48с, floor1,96с. Deadlines уже начатых cooldown
не пересчитываются. Способности не принуждаются к совместному применению.

У Meteor первый landing через0,85с, следующие через0,15с игрового времени:
`0.85/1.00/1.15`. Launch также разнесён на0,15с; каждый камень имеет свою
анимацию. Первый удар80/105/130/155/180 базового урона, последующие×0,75.
Evolution burn дополнительных ударов тоже×0,75 (9 вместо12 базового урона/tick).
Всё проходит через прежние damage modifiers один раз.

При равной плотности приоритет у rooted группы, затем seeded RNG при равенстве.
Разные группы получают разные удары; при одной группе повторяется её область
со смещением<=8px. Центры не выходят за310px и viewport; AoE может пересечь
край экрана в существующем бесконечном мире. Координаты фиксируются при cast.
Общие impacts+zones<=24: при нехватке slots sequence укорачивается; queue нет,
вражеские warnings не удаляются. Один impact разрешается один раз.

До/после Meteor, средний урон **одного cast**, одинаковый сценарий:
5неподвижных прочных целей в каждой из1/3раздельных групп,3seed,
statsDamage1,5 и один damage artifact1,08, без эволюции. Входящий урон не
отключался; это изолированный damage benchmark, не тест выживаемости.

| Ранг | До | После | Рост |
|---|---:|---:|---:|
| I | 648 | 648 | 0% |
| II | 850,5 | 850,5 | 0% |
| III | 1053 | 1842,75 | +75% |
| IV | 1255,5 | 2197,125 | +75% |
| V | 1458 | 3645 | +150% |

Средние совпали в одно- и трёхгрупповом вариантах: при трёх группах урон
распределяется между ними. Реальный урон зависит от выхода врагов из областей,
щитов, восстановительных фаз боссов и времени действия общих buff.
Исходные30сценариев: [до](before-damage.json), [после](after-damage.json).

HD: кольцо и кристаллы в точке цели, лёд у ног исчезает вместе с root.
Каменные головы/огненные пиксельные хвосты падают отдельно, попадания дают
искры и краткую вспышку. Friendly depth14 ниже hostile tells20; герой видим.
Новых GameObjects/textures/timers нет. Root/slow/stacks, queued impacts и
ледяные/метеорные FX очищаются на death/restart/teardown; pause замораживает
игровые сроки. Пул effects<=96 и общие hazard budgets сохранены.

Итоговые проверки:

- `npm.cmd run check`:331unit/47files,TypeScript/lint/build прошли.
- `npm.cmd run test:e2e`:149passed/1failed,27,6min. Единственный fail —
  старый final-qa ожидал slowUntil вместо root.
- После обновления ожидания: `npm.cmd run test:e2e -- tests/e2e/final-qa.spec.ts
  tests/e2e/frost-armageddon.spec.ts --output=.tmp/frost-armageddon-rerun --reporter=list`:
  13/13,1,4min. Все150уникальных сценариев в сумме проверены успешно;
  одного полного зелёного150/150 запуска не заявляем.
- `npm.cmd run test:e2e:production`:4/4,30,1s, обе карты/оба героя,
  реальный build без DEV API и внешних runtime-ресурсов.
- `git diff --check`:чисто. Прежний warning о Phaser chunk>500KB сохранён;
  build134modules, app257,20KB/Phaser1387,44KB доgzip.

Первоначально3новых unit fixture ошиблись в раннем population cap, дальности
и моменте окончания Charge; исправлены с сохранением реальных ограничений.
Никакие тесты не отключались. Имена/описания/клавиши проверяются отдельными UI cases.
В полном dev найдена старая проверка final-qa, ожидавшая slowUntil от удалённой
ауры. Она обновлена на настоящий active root и прошла повтор. Игровой код
между полным и повторным прогоном не менялся.

PNG/Canvas/rawJSON: `screenshots/frost-armageddon/`:
`frost[-canvas]-rank{1|3|5}-{1280|390}.png`,
`meteor[-canvas|-impact]-rank{1|3|5}-{1280|390}.png`,
`frost-expired-rank*`, `cards-*`, `stress-*`.
Скриншоты desktop/mobile лично просмотрены, включая финальную вспышку попадания
и stress. [NovaV desktop](../../screenshots/frost-armageddon/frost-rank5-1280.png),
[MeteorV desktop](../../screenshots/frost-armageddon/meteor-rank5-1280.png),
[NovaV mobile](../../screenshots/frost-armageddon/frost-rank5-390.png),
[MeteorIII mobile](../../screenshots/frost-armageddon/meteor-rank3-390.png).
Финальный stress150+3+3 со всеми MageV и эволюциями:58,9/59,3FPS,
p95 update2,4/1,5ms наdesktop/mobile, maximum13hazards/96effects/40projectiles.
Проверены5scene restarts:55/31GameObjects наdesktop/mobile во всех5циклах,
постоянные textures/listeners/timers/Graphics counts. Три Guardian оставались
активными во всехsamples. Измерено в desktop Chromium/Windows; это не замер
физического телефона. В реальных RAF измерены gaps около0,150с между landing.
Invulnerability используется только для удержания нагрузки, не для выживаемости.
Подробные параметры, damage comparison и screenshot hashes:
[BROWSER_QA.json](BROWSER_QA.json), [DAMAGE_COMPARISON.json](DAMAGE_COMPARISON.json),
[INVARIANTS.json](INVARIANTS.json) —24файла совпали сbaseline.

Ручная проверка: темп контроля и выросший суммарный урон MeteorV в полном
забеге, читаемость при трёх Guardian и на физическом мобильном устройстве.
Push/merge/deploy не выполнялись. Разработка остановлена для ручного теста.
