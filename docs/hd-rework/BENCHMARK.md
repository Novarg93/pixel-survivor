# Воспроизводимый протокол сравнения

`tests/e2e/hd-rework-performance.spec.ts` управляет настоящей Phaser-сценой.
Seed12345 явно установлен через отдельный SeededRandom для тестового World RNG;
позиции150 врагов и состав задаются одинаково. UI-start использует обычную игру;
после старта тест отключает autoattacks/new spawns, делает героя неуязвимым,
задаёт elapsed1200.08. Сохраняются реальные pursuit/separation/caster/rusher AI.
Оба viewport при DPR1,1s прогрева+6s RAF, затем10scene restarts.
Вражеские снаряды могут немного отличаться на границах кадров, не выдаются
за одинаковый GPU command stream. Scene.update и frame p95 — короткая проба.

Файлы называются before/after. Метаданные содержат seed, timestamp, CPU/RAM,
Chromium, ANGLE renderer, полные диагностические ресурсы и ошибки.
Texture bytes — сумма размеров RGBA source, без оценки драйверной VRAM,
буферов/backbuffers/JS heap. FPS60 при60Hz не означает равную GPU-стоимость.
390×844 на ПК не является тестом Android.

Обычный запуск после выбранного checkpoint:

```powershell
$env:PIXEL_E2E_PORT='5191'
$env:PIXEL_HD_PACK='04'
$env:PIXEL_HD_PHASE='after'
npm.cmd run test:e2e -- hd-rework-performance.spec.ts
```

Во время проверки04 обнаружено, что первоначальный harness фиксировал состав
и позиции, но не RNG элит. Это исправлено, и все контрольные версии02–04
пересняты последовательно тем же уточнённым harness без параллельной нагрузки:

| Код | Использование серии | Результат |
|---|---|---|
|03ae07a |pack02before |1/1 |
|12dfd70 |pack02after и pack03before |1/1, общий замер |
|93bd8ff |pack03after и pack04before |1/1, общий замер |
|рабочий04 после полного gate |pack04after |1/1 |

Для старых версий использован `git archive --format=tar --output <path> <hash>`
с распаковкой только в `.tmp/hd-pre02-baseline`, `.tmp/hd-post02-baseline`,
`.tmp/hd-pack04-baseline` внутри проекта. В копии заменён только benchmark
тест текущим harness, node_modules подключён junction к node_modules этого же
проекта; Chromium путь задан абсолютным `.browsers` проекта, порты5194/5195.
Git branch/main, чужие каталоги и игровые исходники при этом не переключаются.
Архивы/копии/профили не коммитятся. ESLint игнорирует `.tmp/**` как временные
артефакты, а все реальные src/tests/config остаются под проверкой.

Соседние серии используют один и тот же snapshot общей контрольной точки.
Копирование PNG не изменяет пиксели; JSON пакета03 явно содержит checkpoint
и sharedMeasurement с ссылкой на исходную серию, timestamps не меняются.
Первоначальные замеры без явного seed доступны в Git12dfd70/93bd8ff.
Полные игровые gate этих пакетов не подменены новым benchmark.

## Дополнительная нагрузка05–08

05 добавляет Guardian;06 — ещё3boss;07и08 — ещё4расходника,1chest,
3artifact,20XP в фиксированных местах. Внутри каждого пакета fixture до/после
совпадает. Разные пакеты с разными fixture не выдаются за прямую performance
серию. PNGsources/RGBA/Texturekeys можно сравнивать отдельно при том жеviewport,
но GameObjects/CPU зависят от состава.10scene restarts проверяют отдельный
одинаковый150tankfixture; death/pickup pools проверяются своими тестами.
HUDPNGcrops07 —11малыхidle0изтого жеatlas, не второйPhasertexture; их DOMdecode
не учитывается в TextureManager.bytes и отдельно оговорён вPACK07.
