# Mage · диагонали + South · PixMiniMax

**[Открыть просмотр всех пяти направлений](viewer.html)** — выбрать направление,
сравнить исходную позу, Walk и Run; пауза, кадры, скорость и фоны. Работает
локально без сети. [Ранее готовые North Walk / Run](../north-pixminimax-v1/viewer.html).

| Направление | Walk GIF | Run GIF |
| --- | --- | --- |
| South | [Walk](south/walk/walk-south.gif) | [Run](south/run/run-south.gif) |
| South-east | [Walk](south-east/walk/walk-south-east.gif) | [Run](south-east/run/run-south-east.gif) |
| North-east | [Walk](north-east/walk/walk-north-east.gif) | [Run](north-east/run/run-north-east.gif) |
| North-west | [Walk](north-west/walk/walk-north-west.gif) | [Run](north-west/run/run-north-west.gif) |
| South-west | [Walk, выбранный повтор](south-west/walk/attempt-02/walk-south-west.gif) | [Run](south-west/run/run-south-west.gif) |

Рядом с каждым GIF — PNG-сетка 4×4, strip, JSON и однослойный `.aseprite`.
Каждый выбранный клип: 16 кадров 256×256, прозрачность. Длительность preview:
Walk 80 мс/кадр, Run 60 мс/кадр. В игровую модель эти кандидаты не подключались.

Пять first frames извлечены без ретуши/масштабирования из `8-directions.png`:
South cell 0, SE 1, NE 3, NW 5, SW 7; ячейки считаются с нуля слева направо.
Проверено, что исходные восемь файлов и весь прежний пакет north неизменны
(69 защищённых файлов). Галерея PixelLab также содержит все 11 результатов.

Основные параметры: `frame_count=16`, соответствующий `direction`,
`view=low top-down`, `no_background=true`, `enhance_prompt=true`.
Сервис вернул input + 16 новых PNG; в `raw/` сохранены все 17, в экспорт
входят ровно новые frame-01…frame-16. Пиксели экспорта не дорисовывались,
не перекрашивались, не выравнивались и не зеркалились.

SW Walk сначала получился почти idle. Сделан один повтор с явным подъёмом
и чередованием стоп, `enhance_prompt=false`, seed 8110911; он выбран в
`selection.json`. [Первый SW Walk](south-west/walk/walk-south-west.gif) сохранён.
Во время диагонального бега корпус местами разворачивается ближе к профилю
(особенно SE/NE/NW); клипы к концу возвращаются в стойку. Перед игровой
интеграцией стоит оценить эти художественные особенности при зацикливании.

Промпты, настройки, receipts, gallery/job IDs и выбор версий сохранены в
`requests.json`, `jobs.json`, `generation-record.json`, `selection.json`.
Квитанции успешных вызовов: 22.50 generations (10×2.05 + повтор 2.00).
Снимки общего баланса: 1823.60→1795.05, то есть дельта 28.55. Разница 6.05
не объясняется квитанциями этой задачи; её причина по ответам API не
установлена. USD credits: 0→0. Один запрос отклонён лимитом 8 active jobs;
позже он выполнен с получением отдельного job ID.

Проверки арта PASS: 215 PNG CRC, 11×16 новых кадров, input equality,
PNG↔sheet/strip и GIF↔PNG без различий, прозрачность 0/255, edge pixels 0.
Viewer проверен для пяти направлений на 1280×800 / 390×844; playback,
pause, scrub 1/8/16, step 16→1, Canvas pixels и overflow PASS, JS errors 0.
45 outputs воспроизводятся побайтно без AI вызовов. Доказательства:
`validation.json`, `reproduction.json`, `screenshots/mage-directions-pixminimax-v1/`
от корня проекта.

Typecheck/lint/build PASS. Общий unit прогон: 853/854 — один прежний тест
ультимейта не может прочитать удалённый/перемещённый исходник
`art/main-hero-mage/abilities/ult-lightning/ultimate-hand-lightning.gif`.
К этим генерациям он не относится; исходники ультимейта не изменялись нами.
