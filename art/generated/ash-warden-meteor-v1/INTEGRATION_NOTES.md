# Ash Warden Meteor V1 — кандидаты, без production integration

## Разделение

`cast-a/frames` и `cast-b/frames`: оригинальные12RD кадров по150ms.
`cast-*/review`: подготовленные для просмотра последовательности PNG/GIF/sheet,
без перерисовки исходных поз. A добавляет3,2,1,0 для опускания руки; B добавляет
только0, поскольку его исходник уже завершает жест. Длительности1200ms и1440ms.
Отдельные source GIF и job manifests сохраняют происхождение и исходный timing.

`meteor-{a,b,c}/{telegraph,fall,impact,aftermath}`: независимые прозрачные клипы.
Ни одного метеора, warning circle или эффекта удара нет в cast PNG.
Победитель не назначен; выбранная позднее пара может сочетать любой Cast и Meteor.

## Координаты и события

Cast:192×192, pivot(96,154), scale0.6548310811, South only, без fitting.
Все VFX:128×128, тот же source-pixel scale. Ground pivot(64,96),
fall pivot(64,89) — центр камня. Origin вычисляется как pivot/canvas.
Sheets имеют фиксированную ячейку, без padding. Использовать nearest filtering.

Предварительные cast events:

|Кандидат|castStart|meteorRelease|recoveryEnd|
|---|---:|---:|---:|
|A|0/frame0|400ms/frame5|1200ms|
|B|0/frame0|550ms/frame5|1440ms|

Событие meteorRelease создаёт новый strikeInstanceId и фиксирует targetWorld.
Это подготовленный контракт, не изменение AI. Shield/invulnerability принадлежат
боевой системе, не кадрам; checkbox щита в viewer — лишь контур для осмотра.

Относительно начала одного warning:

|Компонент|Start|Duration|Поведение|
|---|---:|---:|---|
|telegraph|0|900ms|Неподвижная мировая цель, граница не следует за игроком|
|fall|600ms|300ms|От target+(-14,-95)worldpx до target, локальная анимация камня|
|impact|900ms|400ms|Один контакт, затухание, последний кадр пустой|
|aftermath|1080ms|320ms|Необязательная короткая отметка, финал пустой|

Длительности — review defaults, не принятый баланс и не контракт урона.
VFX и перемещение fall независимы: спрайт не содержит перелёт через весь экран.
Позицию вычислять через Phaser scene time/tween. Не перемещать target warning.
Telegraph/fall перестают отображаться при начале impact. Короткий overlap
aftermath с последними impact frames допустим. Aftermath можно отключить.

Telegraph radius в metadata — визуальный ориентир, `damageRadius=null`.
Не выводить hitbox, урон или неуязвимость из пикселей/размера canvas.
Warning и aftermath рисовать над terrain, ниже actors. Fall/impact — как отдельные
world effects с подходящим foot-depth; не прикреплять их дочерними к boss body.
Не растягивать A в B: варианты имеют свои камни, кольца и debris.

## Single и будущий Armageddon

Один Single Meteor = один набор4компонентов, собственный strikeInstanceId,
фиксированная позиция и стартовое scene time. Armageddon повторно использует
те же клипы: массив таких strike instances, без нового уникального atlas/гигантского GIF.
Preview `multi` использует ровно3instances, задержку220ms и три позиции.
Это демонстрация повторного использования, не реализация Phase3/AI.

Рекомендуется общий ограниченный pool и верхний предел активных strikes в будущем,
дедупликация по(attackInstanceId,strikeInstanceId,eventName), освобождение всех
компонентов после завершения/отмены, death/despawn и shutdown. Не создавать
глобальные интервалы. В loop-preview время лишь повторяется для ручного осмотра.

Viewer выравнивает release всех кандидатов по900ms общей шкалы, не ускоряет
кадры и не меняет animation timing. После2600ms одиночный strike уже чист;
цикл заканчивается3100ms, включая multi. Никаких gameplay side effects.

## Воспроизведение

```powershell
node art/generated/ash-warden-meteor-v1/decode.mjs cast-a
node art/generated/ash-warden-meteor-v1/decode.mjs cast-b
node art/generated/ash-warden-meteor-v1/build.mjs
node art/generated/ash-warden-meteor-v1/make-comparisons.mjs
node art/generated/ash-warden-meteor-v1/verify.mjs
node art/generated/ash-warden-meteor-v1/protect.mjs --verify
npm.cmd run check
```

Ни одна команда не запускает платную генерацию. Исходные prompts/seeds,
free estimates, task ids и расходы находятся в generation-manifest/expenses/job JSON.
Для viewer нужен HTTP/dev server, а не file:// (ES modules).
