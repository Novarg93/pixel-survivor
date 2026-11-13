# Страж Пепельной Рощи — фактический дизайн

База: main@0388cf49015d89cb241c5142db81dd3bfc6b9930. Входной файл ТЗ разрешён
пользователем. Зависимости не обновляются, Git-операций записи нет.
SHA256 неизменённого входного ТЗ:
0C0FC3535AD286246DF02F392A03B5DC2790D8E42D03CCBE8E4DBDFC17E5D0DD.

## Контракты и часы

World продолжает управляться Phaser Scene. Vue получает прежние100ms snapshots.
Отдельный FinalEncounter: inactive → intro → phase1 → ritual1 → phase2 →
ritual2? → phase2 → phase3 → defeated. Pending70/30 синхронно закрывает общий
damage/target gate. Attack.kind взаимоисключающий: approach, chargeWindup,
chargeTravel, chargeBrake, swordWindup, swordActive, recovery, ritualEnter,
ritualChannel, meteorCast, shieldBreak, phaseTransition, death.

World.elapsed не обрезается. Encounter.clock идёт с World.step; bossClock,
attack.age и boss meteor.age используют unfrozenDelta. У каждой опоры свой
clock. Аренные meteor.age идут независимо от заморозки владельцев.
Нет догоняющих циклов. Новое расписание ставится от фактического начала.

Терминальный snapshot отправляется сразу в кадре исхода; обычные UI snapshots
сохраняют100ms cadence. Летальная Nova из карточки снабжения тоже завершает
бой из статуса upgrade: selectUpgrade не возвращает завершённый World в playing.
ScheduledBossKind отделяет старые три атласа/расписания от общего BossKind,
включающего ashGuard. Общий predicate нужен скорингу и ultimate caps.

## Вход и владение

На пересечении1200s — один вход перед старым директором. Старые враги исчезают
из gameplay, остаются короткие presentation ghosts. clearHostileThreats
освобождает hostile projectiles/impacts/owned zones, RareGuardian registry
очищается без complete/kill. Friendly projectiles/zones, XP и лут сохраняются.
Ранги, HP, Absorb, buffs, artifacts, RNG, cooldown, charge и активная ульта
остаются в том же World. Новые ульты во вступлении не расходуют заряд.

finalRole у сущностей исключает их из legacy AI/expiry/награды артефактами.
Опоры зарегистрированы по ID. Каждый meteor имеет id/group и явного owner
boss|arena, без фиктивного Enemy ownerId арены. Сферы имеют реальный ownerId
опоры и используют прежний projectile pool, homing steering и Fire absorption.

## Параметры

| Параметр | Реализовано |
|---|---:|
| HP |108000, фиксировано до встречи|
| Intro / первая атака после intro |2.5s / не раньше3s|
| Arena / Guardian triangle radius |800 /550 world units|
| Body / sword radius |28 /280|
| Sword sector |170°|
| Approach speed |72|
| Combo start interval |12s незамороженных часов|
| Charge windup / travel / max distance / brake |0.7s /0.45s /300 /0.25s|
| Sword windup / active / recovery |0.9s /0.15s /2s|
| Shield break / repeat window |3s /50s открытого незамороженного боя|
| Ritual supports |3, затем максимум один повтор2|
| Support HP |1800 /1350 при повторе|
| Orb first shots / interval / warning |2,4,6s /8s /0.65s|
| Orb speed / turn / TTL / per-owner cap |86 /0.65rad/s /20s /1|
| Boss meteor interval / warning / radius |8s /1.3s /42|
| Arena volley interval / first delay |15s /3s от phase3|
| Groups |5 в0s,4 в1.55s; impact через1.3s каждой|
| Absolute damage: charge/sword/meteor/orb |48 /64 /54 /24|
| Death presentation |1.8s, safe render clock|

Тело не наносит контактный урон. Нет дополнительного recover-множителя:
legacy BossState.phase остаётся approach, новый recovery управляется
отдельно, итоговый урон обычный×1. Существующие ultimate caps сохранены.

## Геометрия и безопасность

Charge фиксирует направление и допустимый endpoint. Collision — swept segment
с радиусом тела. Sword фиксируется после brake и использует сектор с9px
padding тела игрока, включая край. Контакт потребляется даже при Absorb/Blink.
Арена ограничивает фактическое движение и endpoint Blink до создания следа.
Размеры не зависят от viewport/zoom. Опоры сохраняются за камерой.

Армагеддон и новое combo взаимно исключают опасные окна; уже объявленные
маркеры не двигаются. Используется шаблон с центральной меткой и наружным
веером. Общая группа даёт максимум один impact. Новые метки имеют
зарезервированный bounded массив до10активных записей. Декоративный след
после impact не имеет DoT.

## Балансные корректировки

| Предложено/первая проба | Реализовано | Причина |
|---|---|---|
|36000HP, первая локальная проба|108000HP|Типичный законный билд заканчивал за48–55s; целевой ритм около2мин|
|ТЗ:800/550/280/42|без изменений|Уклонение и путь по опорам проверяются отдельными пилотами|
|Урон ТЗ: относительные ориентиры|48/64/54/24 абсолютных|На200HP это24/32/27/12%, без наследования Enrage|

Это измерения локальных детерминированных пилотов, не доказательство
удовольствия игрока или сложности на физическом телефоне.
