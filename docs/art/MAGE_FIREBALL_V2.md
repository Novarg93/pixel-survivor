# Fireball V2 — компактный огонь, 2026-11-10

Пользователь попросил новый, менее детализированный фаербол с более простой
анимацией по арт-гайду проекта. Создан и подключён один оригинальный вариант:
тёплое янтарное ядро, медный край, короткий хвост, пять плоских цветов.
Перекадрового шума, размытия, ореола, дыма и длинного взрыва нет.

## Ресурсы и интеграция

Flight нарисован авторскими пиксельными кластерами в JSON и отрендерен через
PixelLab vfx_workbench. Инструмент документирует бесплатный рендер без AI
inference; cost$0. Сохранён редактируемый эффект
[40afe127-b8a8-4180-aff5-37871bbb7e30](https://pixellab.ai/create-vfx?effect=40afe127-b8a8-4180-aff5-37871bbb7e30).
Recipe/seed202611/provenance/raw PNG/GIF/JSON/ZIP находятся в
`art/generated/mage-fireball-v2/source/`, SHA256 — в pixel-audit и manifest.

| Клип | Было V1 | Стало V2 |
|---|---|---|
| Появление |24 кадра, playback200мс|2×100мс|
| Полёт |12×83мс|4×100мс циклом|
| Попадание |12×71мс|6×50мс, последний прозрачный|
| Всего |48кадров|12кадров|
| Atlas RGBA |1959936bytes|489984bytes (−75%)|

Появление и попадание создаёт новый `scripts/build-mage-fireball-v2.mjs`
в той же палитре. Source56×42/anchor33,21 увеличивается2× с общим сдвигом−1px
X к прежней рамке112×84/pivot65,42/scale0.5. В полёте видимо≤23×12world px;
центральный светлый кластер одинаков во всех четырёх кадрах. Atlas464×264,
padding2, бинарная альфа. Rebuild PNG/JSON/manifest byte-identical.

`fireballPack.ts` выбирает новый `fireballManifestV2.json` и texture
mage-fireball-v2. Реестр, preload, projectiles и FireballArt используют этот
существующий контракт. Новые images/timers/listeners/emitters не добавлены.
Сохранены9нативных исходников V1, V1atlas и builder; браузер загружает толькоV2.
Исправлен float modulo на точной границе цикла (.6s→idle0).

Повреждения, скорость270, collider, ранг, pierce, evolution AOE и RNG остались
прежними. Сокращена только длительность cosmetic collision effect:.852→.3s.
Тесты pierce проверяют все столкновения до истечения этого короткого окна;
ground-depth тест проверяет раннее попадание/паузу, затем его своевременный конец.

## Проверки

- `npm.cmd run check` — PASS: typecheck, lint,121unit-файл/998тестов, build.
- `npm.cmd test -- --maxWorkers=2` —998/998PASS ещё до финального check.
- Два default full-unit прогона превысили прежний5s timeout большого Blink
  pixel audit (5.58/5.70s) при конкуренции CPU. Установлен maxWorkers:2 в
  vite.config.ts; assertions/timeout/test selection сохранены. Финальный check
  зелёный. Vite large-chunk warning прежний, не подавлялся.
-12разных DEV browser tests PASS:4mage-fireball (рангиI/V,1280/844 с390
  portrait),2ground-impact-layers,3HD integration/resource/restart,
  3новыхV2 (8направлений,normal/burningGrove,150врагов,1280/390,
  pause,3restart,ровно2V2assets безV1,offline/HTTPviewer).
- Viewer file:// не разрешает toDataURL после локальных image sources:
  проверка паузы/шага использует реальные screenshots, как и весь Canvas QA.
- Проверены SHA256 источниковV1/V2,12точныхuntrimmedframes,padding2,hardalpha,
  ровно5цветов,4разныхflightframes с одним устойчивым brightcore и прежний pivot.

- `npm.cmd run test:e2e:production -- --grep 'built public Mage attempt'
  --reporter=list` (отдельный local port4181) —2/2PASS: реальный Mage забег,
  атаки, score, pause/resume, desktop→390resize, безDEVAPI/внешнихресурсов;
  полный ожидаемый preload включает толькоV2.

Полная E2E suite и отдельный FPS benchmark в этом поручении не запускались.

## Визуальная проверка

Реально открыты и просмотрены PNG:

- `screenshots/mage-fireball-v2/rank-1-1280/flight.png`;
- `screenshots/mage-fireball-v2/rank-5-844/collision.png`;
- `screenshots/mage-fireball-v2/grove-directions-1280.png`;
- `screenshots/mage-fireball-v2/burning-crowd-390.png`;
- `screenshots/mage-fireball-v2/comparison-http.png`;
- полный новый atlas с12кадрами.

Силуэт огня отделён от пола и силуэтов врагов, ядро не прыгает, хвост короткий.
На390портрете фаербол различим в плотной группе; hostile warnings остаются выше
friendly effects. Это Chromiumdesktop/mobileviewport QA; физический телефон
отдельно не проверялся. Художественное предпочтение остаётся за пользователем.

Демо: `art/generated/mage-fireball-v2/viewer.html` — HTTP и двойной клик,
пауза/шаг/масштаб2×–4×/три фона/GIF. Viewer — самостоятельная инспекция,
его RAF не входит в игровой runtime и останавливается при hidden/pagehide.

Блокеров нет. Следующий шаг — пользовательская оценка нового вида в обычном бою;
обязательных шагов интеграции не осталось. Done-marker стадий не создавался.
