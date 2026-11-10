# Cinematics V1 — presentation contract, production не подключён

## Ресурсы

Все новые character/layer PNG192×192, pivot(96,154), worldScale0.6548310811.
Никакого fitting/изменения размера по bbox. Тело, меч после release, свечение,
угасание, энергия щита, пепел и камни — самостоятельные clips/layers.
`death-a-composite-review/` — только review export, в runtime не использовать
его одновременно с раздельными body/sword/extinction слоями.

2RDgeneration: Death A и Shield Break, оба из существующих принятых поз.
Original GIF12×150ms и все извлечённые PNG сохранены. Подготовленные timings
и mappings находятся в metadata.json и death-sword-cleanup.json.

## Общие шкалы событий viewer

|Сценарий|События, ms от начала сценария|
|---|---|
|Spawn|spawnStart0,spawnReveal500,spawnReady2300|
|Shield Break|shieldBreakStart300,shieldShatter300,staggerStart430,staggerEnd3300|
|Phase3|phase3Start600,phase3Overload1300,phase3Ready2400|
|Death A|deathStart0,swordRelease860,bodyCollapse1060,emberFade1480,deathAnimationComplete2200|

Для Phase3есть600ms обычной стойки перед клипом1800ms. Для Shieldесть300ms
Ritual Channel перед клипом1040ms, затем held stagger до2600ms и recovery700ms.
Эти offsets нельзя путать с relative clip time. `frameExclusive` отмечает
завершение клипа, а не несуществующий source frame. Все остальные frame —0-based.

## Spawn

Первые500ms — только ash/ground VFX, затем тёмная silhouette matte на теле.
Тело физически выходит из низкой braced позы и выпрямляется через новые RD
позы Shield7..11, ставит меч в принятый low guard и заканчивает acceptedIdle0.
Матт/частицы/короткая visor+magma вспышка отдельные. Длина body clip2300ms.
До spawnReady запретить hostile attacks/contact damage; intro не запускает
таймер дополнительных обычных волн. Выбор реального20:00 spawn остаётся runtime.

## Shield Break и3секунды

При последнем Guardian supportCount>0→0: снять иммунитет сразу, вызвать
shieldShatter и оборвать все оставшиеся лучи. Не ждать staggerEnd или конца GIF.
Один клип используется после3Guardian и облегчённой волны; количество лучей
берётся из support instances, не из спрайта тела. Viewer показывает3или2луча.
Presentation body: Channel→recoil/crouch1040ms→низкая опора→recovery→Idle.
В preview уязвимость300..3300ms, ровно3000ms. Held pose не растягивает
реакцию на весь этот интервал. Отмена/смерть должны очищать shield fragments.

## Transformation / persistence

Transform1800ms: brace и подъём двуручного меча из исходных ключевых поз,
overheat layer по текущему кадру, отдельный ash/fire burst. Ready pose —
предсуществующая напряжённая двуручная стойкаCleave1, не новая модель.
Никакого полного нового пакетаPhase3Idle/Walk/attack не создано.

`phase3-persistence.json` содержит191bindings к действующим позам:
Idle/Walk/Melee4directions, ChargeSouth3фазы, Cast4directions, CleaveSouth,
и принятые South ritual clips. Доступность направлений унаследована от пакетов.
Body source не меняется; overlay sparse, только существующие magma/visor/blade pixels.
137unique masks упакованы в atlas1024×2048RGBA=8MiB. Trim хранит original
offset/sourceSize192; сначала восстановить virtual canvas, затем единый world transform.

State — latch once per encounter при пересечении30%HP, включая большой burst.
Нельзя проверять только узкий HP range, который можно перескочить. Прерывание
анимации не сбрасываетPhase3. Body pose и overlay binding менять атомарно.
При freeze удерживать текущий pose/frame и соответствующий overlay, не продвигать
отдельный glow clock. В одном North Melee кадре нет открытых горячих пикселей:
overlay=null корректен, состояниеPhase3 остаётся активным; слабые отдельные ember
частицы поддерживают presentation. Не подставлять маску от предыдущей позы.
После HP0 death/extinction имеет приоритет надPhase3; снять постоянный glow/embers.

## Death A / weapon / corpse

12review кадров/2200ms:10исходных физических поз плюс2holds raw9. Raw10/11
слегка поднимали голову, поэтому не используются в prepared sequence.
Кандидат оседает на колени и выносит вес на руки; остаётся низкая броневая фигура,
а не повёрнутый на90° или уменьшенный спрайт. Полное падение плашмя не заявляется.

С860ms меч — отдельный object. Видимый floor blade/hilt и отдельные дальние
RDпиксели удалены из prepared body с сохранением occluding gauntlet. Новая weapon
sequence использует принятую фактуру клинка, локально выделенные guard/hilt,
не меняет scale и сохраняет форму при падении. Контакт меча970ms, перед телом1060ms.
Final sword frame остаётся на земле. С1480ms sparse extinction гасит только
трещины/визор и затем клинок. Alpha всего тела не уменьшается; corpse сохраняется.
Ash transient заканчивается1660ms, потухший corpse/sword — намеренный остаток.

HP0 future runtime: latch победу один раз; немедленно запретить новый hostile
урон/атаки и отменить или обезвредить созданные опасные угрозы. Не разрешать
player defeat после этого latch. Отдельный ending presentation держит corpse
до deathAnimationComplete, потом открывает экран победы. Не запускать второй
victory timer при каждом render/animation update. Текущий FinalEncounter.finish
сразу ставит status=over и очищает enemies — эта логика сейчас НЕ изменена.

## События / очистка

Все имена событий имеют ключ encounterId+eventName, dispatch один раз.
Pause/scrub/previous/next не эмитят событий. Restart viewer = новый preview encounter.
`presentation.mjs` даёт проверяемый idempotent latch/events helper, не World simulation.
На death/cancel/shutdown уничтожать emitter/weapon/beam objects по policy;
при corpse hold можно держать один static sword и corpse доUItransition.
Никаких глобальных интервалов и full-screen shaders.

## Бюджет и ограничения

Death B и Death North/East/West не созданы. После2jobs Starter51→44%,
осталось3п.п. до hard floor41; наблюдавшийся debit одного такого запроса — до4п.п.
Третий запрос небезопасен для потолка10п.п. Поэтому нет фиктивного recolor-B.
Все cinematic body clips сейчас South only. Новых персонажей не генерировали.

## Воспроизведение без paid calls

```powershell
node art/generated/ash-warden-cinematics-v1/decode.mjs death-a-rd
node art/generated/ash-warden-cinematics-v1/decode.mjs shield-rd
node art/generated/ash-warden-cinematics-v1/build.mjs
node art/generated/ash-warden-cinematics-v1/build-overlays.mjs
node art/generated/ash-warden-cinematics-v1/make-comparisons.mjs
node art/generated/ash-warden-cinematics-v1/verify.mjs
node art/generated/ash-warden-cinematics-v1/protect.mjs --verify
npm.cmd run check
```

HTTP/dev server нужен для ES modules viewer. Исходные prompts/seeds/cost
estimates/jobs/expenses сохранены. Runtime atlas budget в runtime-memory-validation.json;
это новые ресурсы, без прежних атласов/driver overhead. Gameplay E2E не требовались.
