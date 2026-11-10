# Magic Pack V1 — контракт для следующего этапа

Это отдельный арт-пак. Ни одно состояние FinalEncounter/World, здоровье,
скорость, hitbox, частота атак или фазовый переход здесь не изменены.

## Принятые источники

South Cast B: `../ash-warden-meteor-v1/cast-b/review/`,13кадров/1440ms,
release550ms. Все13PNG и durations совпадают с принятыми побайтно.
Meteor C:23PNG/4компонента из `../ash-warden-meteor-v1/meteor-c/`.
Новых Meteor PNG0; metadata содержит ссылки, а не копии.
Остальные кандидаты доступны через `candidates-archive.html`, не являются default.

Cast192×192, pivot(96,154), scale0.6548310811. East сохраняет верх/меч/кисти
South и меняет нижнюю опору; West — x'=191−x, без добавочной регистрации.
North получен одним RD Custom Action из принятого rear sprite; исходник и
неизменённый raw GIF/12PNG сохранены. Review North повторяет тайминг South,
с добавленным endpoint raw0. Ракурс и event North проверены вручную.

## Ритуал

Ritual Enter6/900ms: B0→B1→B2, постепенная широкая постановка ног,
усиление существующих magma цветов. Channel4/800ms loop: B2 с устойчивыми
ногами, пульсацией брони и1px движением верхней части. Armageddon Cast9/1200ms:
B2→B3→B4→B5 hold→B4→B3→B2, release330ms. Это самостоятельные производные
клипы с согласованными endpoints, не повтор обычного Cast B с иным названием.
Ритуальные клипы пока South only; другие ракурсы не подменены фронтальным PNG.

Enter last = Channel first = Armageddon first/last pixel-exact.
Standalone Enter и Armageddon preview продолжаются в Channel.
Shield/3луча — отдельная Graphics-презентация, параметры в
`guardian-shield-vfx.json`; в кадрах тела ни лучей, ни большого щита нет.
Guardian PNG/idle frames переиспользованы из существующего public atlas.

## Single timeline

Время относительно начала каста, без прежней общей viewer-шкалы900ms:

|Событие|ms|Смысл|
|---|---:|---|
|castStart / warningStart / targetLock|0|Начинается подготовка и сразу видна зафиксированная цель|
|meteorRelease|550|Высокая поза Cast B frame5|
|fallStart|600|Камень начинает падать через50ms после жеста|
|impact|900|Warning и fall заканчиваются ровно в момент контакта|
|aftermathStart|1080|Короткий остаточный след|
|VFX complete|1400|Все Meteor компоненты исчезли|
|castEnd|1440|Персонаж вернулся в боевую стойку|

Никакого ускорения всего Cast B. Relative Meteor offsets0/600/900/1080
сохранены. Поменяно только расположение начала warning в общей шкале:
он начинается с windup, а не после release как в старом candidate preview.
Этот выбор оставляет900ms видимого предупреждения и связывает жест с падением.

## Phase 2 / Phase 3

P2 preview: Enter0–900 → Channel900–1700 → Armageddon Cast1700–2900
→ Channel. Release2030ms. Первая группа6warning начинается1700ms,
вторая5 —3250ms, внутри групп шаг50ms. Падения последовательны по
тем же Meteor C offsets; последняя отметка исчезает4850ms. Босс не перемещается.
Повторная облегчённая Guardian-волна использует эти же клипы/лучи.

P3 preview: waves запускаются по arena time0/15000ms и не читают состояние
босса. Первая группа6, через1550ms вторая5. Персонаж независимо проигрывает
принятый Idle/Walk/Basic Melee B. При Walk preview траектория имеет world speed72,
соответствующий текущему config, направление показа выбирается по вектору движения.
Cast/Ritual не включаются. Это визуальная демонстрация, а не изменение boss speed.

## Danger footprint и безопасные промежутки

Принятый Meteor C содержит перспективное кольцо-эллипс, текущий runtime —
circle radius42 и warning1300ms. Их нельзя считать уже согласованными.
Preview использует дополнительную тонкую круговую границу radius39×scale
=25.5384121629world px. Она показывает точную зону, которую используют helper
и safe-gap проверка; C PNG неизменны. Граница живёт весь warning и исчезает
ровно при impact. Radius независим от размера viewport; Zoom умножает только
экранное представление. Каждый warning соответствует одному реальному impact
той же instance/target. Позиция не переназначается во время fall.

Перед production необходимо явно выбрать actual damage radius и согласовать
масштаб C/круговую границу с ним, затем заново проверить плотность. Текущий42
не менялся. Нельзя подключить этот пакет, молча считая25.54==42.

`timeline.mjs`: dangerIntersects, safeAt, reachableSafePoints, warningZones,
scheduleWave. Предел6active warnings и11active instances на wave; текущая
постановка достигает6. Две группы разделены1550ms, постоянный безопасный
коридор y∈[−18,18]. Safe samples учитывают playerPadding6 и reachable radius
speed72×warning0.9s; это проверка preview, не доказательство безопасности любых
будущих случайных размещений. Для новых групп/радиуса проверять reachable points
до публикации telegraphs и при отсутствии выхода откладывать/перестраивать группу.

Все23Cтекстуры общие для Single/P2/P3; instance хранит толькоid,group,target,
start time. Target snapshot должен жить до impact. Ограниченный pool, без
таймеров на каждый PNG, освобождение при complete/cancel/despawn/shutdown.
Шкала VFX не должна сбрасываться при смене атаки/анимации босса в Phase3.

## Различия текущего runtime для последующей интеграции

В FinalEncounter shielded сейчас вызывает одиночный meteorCast; новый P2
должен вызывать ритуальные группы. updateArena сейчас откладывает Phase3 wave,
когда charge/sword busy; принятый дизайн требует независимого запуска.
Config сейчас meteorWarning1.3/radius42, а арт-reference0.9/25.54; выбрать
и синхронизировать это отдельным решением, не скрытым изменением арта.
FinalBossArt уже рисует3support beams и отдельный shield; сохранить разделение.
World impact damage/lifecycle и Guardian rare orb attacks пока остаются прежними.

## Экспорты и воспроизведение

7clips:4Cast B +Enter/Channel/Armageddon. Все PNG/GIF/sheets/nearest×4 —
review exports, не будущая загрузка каждого дубликата. `textures/` содержит
уникальные RGBA textures по hash, `runtime` descriptors объединяют S/E upper;
West использует East+flipX без дополнительных runtime textures. Порядок
слоёв upper→lower проверен на точное восстановление PNG. C остаётся внешней
ссылкой на принятый pack, one texture set for all instances.

```powershell
node art/generated/ash-warden-magic-pack-v1/decode.mjs north-rd
node art/generated/ash-warden-magic-pack-v1/build.mjs
node art/generated/ash-warden-magic-pack-v1/make-comparisons.mjs
node art/generated/ash-warden-magic-pack-v1/verify.mjs
node art/generated/ash-warden-magic-pack-v1/protect.mjs --verify
npm.cmd run check
```

Ни одна команда не запускает paid generation. Viewer доступен через прежний
Meteor entry (переводит на Magic V1) или новый viewer.html через HTTP/dev server.
Архив сохраняет старый candidate viewer с прежними data/modules.
