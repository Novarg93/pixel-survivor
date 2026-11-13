# Mage Meteor V3 — отдельная подсветка, модель и падение — 2026-11-10

По запросу пользователя переработан метеорит мага под общий dark-fantasy HD
pixel art. Вместо прежнего детализированного лавового валуна — небольшой
серо-медный обломок с тремя крупными гранями, коротким янтарным следом и одним
нагретым краем. Это оригинальный программный рисунок, а не копия/уменьшение
Ash Warden. Камень мага около13world px, у принятой модели босса около28.
Попадание мага — сухая пыль и пять мелких осколков, без тяжёлого кольца,
лавовых трещин, большого светлого взрыва и дымового столба.

## Пакет и независимая подсветка

`art/generated/mage-meteor-v3/` содержит source sheets,30отдельных PNG,
четыре редактируемых Aseprite и четыре GIF, авторский Lua export и provenance.
Рисунок воспроизводим из `scripts/mage-meteor-art-source.mjs`; сборка —
`scripts/build-mage-meteor-v3.mjs`. Экспорт выполнен Aseprite1.3.18.6/API41
в batch, без установки/изменения системных настроек. AI inference и затрат нет.

|Клип|Число кадров / source timing|Pivot|
|---|---|---|
|flight|4×50мс, цикл|64,80|
|illumination|12×40мс|64,64|
|impact|6×60мс, one-shot|64,80|
|ground|8×100мс, one-shot|64,80|

Canvas128²,pixel clusters2²,NEAREST. Камень и пол имеют бинарную альфу.
Освещение — отдельный RGBA-клип: мягкое радиальное затухание альфы0..69/255,
без жёсткого края/кольца/LINEAR/blur/additive. Максимум27%до настройки intensity;
reducedFlash дополнительно×0.6. Во время полёта используются кадры0..7 по его
прогрессу, после удара8..11 за160мс. Свет фиксирован на target и соответствует
настоящему radius; прокачка Area меняет только его масштаб, не камень и удар.
Никакой игровой урон не берётся из пикселей подсветки.

GIF не хранит дробную альфу: illumination-grove-preview.gif намеренно
композитится на Grove. Точные прозрачные источники — PNG и illumination.aseprite.
GIF timing проверен независимо:flight4/200мс,light12/480мс,impact6/360мс,
ground8/800мс. SHA256 всех15экспортов — source/export-sha256.json.

## Угол, время и игровая интеграция

Хвост модели смотрит вверх-вправо, камень летит вниз-влево под45°.
Model manifest и tuning согласованы; path определяется из того же угла.
Не используется runtime rotation или изменение ракурса между кадрами.
Прежняя длина192.4world и flight duration≈218мс сохранены. Contact pivot
неподвижен во всех кадрах, не центрируется по bbox. Удар начинается в точке
реального damage, не в точке хвоста или центра исходного canvas.

`MageMeteorPresentation` наблюдает World.impacts/effects/zones, хранит копии
координат/radius/time, переживает повторное использование pooled Effect,
держит96landing records; общий лимит presentation144Images прежний. Полёт
depth14.2, земля/свет ниже всех enemies даже при отрицательном worldY. Данные
не меняют RNG, radius, урон, count/interval, freezes, cooldown или boss attack.
Пауза читается из World.elapsed; menu/death/run/restart/destroy очищают pool.
Глобальных clocks/tweens/RAF/emitters в игровом коде не добавлено.

GameArt preload/nearest включает новый atlas792×660/2090880RGBAbytes
(PNG19035bytes). MageAbilityArt переиспользует общий pool и передаёт reducedFlash.
Реестр указывает настоящий Mage Meteor atlas. Прежний общий Frost atlas оставлен
побитово: его исторические Meteor-cels не выбираются; обе принятые Nova сохраняют
пиксели/тайминг.14boss/Fireball файлов защищены независимыми SHA256 assertions,
включая FinalBossArt, config и четыре boss atlas pages. Они не менялись.

## Проверки и скриншоты

- `npm.cmd run check` PASS:122unit-файла/996тестов,typecheck,lint,build.
  Vite large-chunk warning прежний. Начальный full run выявил старый prefix
  meteor-fall в счётчике future-launch regression; prefix обновлён на V3,
  все проверки числа будущих/активных камней и RNG сохранены.
-26targeted presentation/ability tests PASS на раннем этапе; после registry
  24targeted asset/Meteor/Frost PASS. Проверены30SHA cels,padding,alpha,
  stablebody,loop/one-shot,45°,прежний damage/landing,Area,pooled-effect reuse,
  reduced/zero intensity,negativeY и cleanup.
-12разных DEV browser PASS:6новых Meteor/Nova/rank/Area1280/390,
  2ground-depth/fireball,3HD preload/resource/restarts,1HTTP/file viewer.
-2HD Nova boss-practice browser PASS (1280/390): принятый Frost сохранён.
-1live stress Mage/390/early PASS:12реальныхсекунд,150HP-heavy regulars,
  rankV spells,Guardian encounter,mobility,square pilot и10restart.
  Фикстура с неуязвимостью проверяет ресурсы, не человеческий баланс.
  Median58.77FPS,p95update1.40ms на этой машине — измерение этой короткой
  фикстуры, не гарантия производительности на телефоне.
-Atlas PNG/JSON/manifest/light-sheet rebuild byte-identical; GIF durations
  и14protected SHA подтверждены.
-3production4181 browser PASS: настоящий boss practice и два publicMage
  run smokes, атаки/score/pause/resize, безDEVAPI/внешнихресурсов; ожидаемый
  preload включает новый atlas. Полный список — в PROGRESS.

Реально открыты и просмотрены: `screenshots/mage-meteor-v3/`
`grove-1280/approach.png`, `burning-390/landing.png`,
`ranks-1280/{light-rank5-area2,impact-rank1-area1}.png`, а также
`art/generated/mage-meteor-v3/screenshots/{comparison-http,light-http}.png`.
Метеорит узнаваем по камню и направлению хвоста, подсветка плавно греет пол и
не закрывает врагов; Nova остаётся отдельным холодным VFX. Все стадии/JSON рядом.

Viewer открывается HTTP и file://, содержит сравнение старого мага/нового/
реального Ash Warden при одном мировом масштабе, отдельный режим illumination,
пауза/seek/step/speed и настоящие Grove/Forest backplates. Только этот внешний
viewer имеет RAF, останавливающийся hidden/pagehide. Пауза подтверждена
Canvas screenshots; HTTP пиксели подтверждают рост света в центре при
неизменном крае. Offline QA использует screenshots вместо tainted toDataURL.

Полная E2E suite и физический телефон не проверялись. Блокеров нет; следующий
шаг — пользовательская художественная оценка. Done-marker стадий не создавался.
