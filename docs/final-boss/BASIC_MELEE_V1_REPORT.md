# Ash Warden — Basic Melee South pilot, 2026-11-06

**Полный Basic Melee V1 не принят.** Сделаны две реальные генерации RetroDiffusion для South, по 8 кадров. Лучшее движение сохранено как **South draft, 8 кадров / 760 мс**. В нём есть работа корпуса, плеч и рук, но клинок деформируется, двуручный хват теряет ясность, возврат в стойку резкий. Это существенные дефекты атаки. По условию South pilot остальные направления не генерировались. North/East/West для Basic Melee отключены в viewer.

Все четыре направления Idle4/Walk8 теперь считаются принятыми пользователем как V1. Замечания по голеням/бёдрам оставлены в backlog; их изображения не изменялись. Принятый Infernal Great Cleave сохранён.

## Генерации и расходы

Источник обеих попыток: `art/generated/ash-warden-directions-v1/bases/south.png`. Подготовлен отдельный непрозрачный вход `inputs/south.png` на фоне #808080; исходный RGBA не менялся. Общий холст 192×192, pivot (96,154), наследуемый scale 0.6548310811. Никакого подгона масштаба по каждому кадру.

| Попытка | Фактический style | Оценка при списании денег | Фактически USD | Starter после get_balance | Итог |
| --- | --- | ---: | ---: | ---: | --- |
| south-01 | `rd_advanced_animation__custom_action` | $0.25 | $0.00 | 81% | Лучшее движение; меч и хват нестабильны |
| south-02 | `rd_advanced_animation__attack` | $0.14 | $0.00 | 79% | Лучше сохраняет броню, но клинок укорачивается и нет убедительного swing |

Баланс **$10.00 → $10.00**, расход **$0.00**. Starter **84% → 81% → 79%**, то есть **5 процентных пунктов по get_balance**. В receipts задач были временные значения 80% и 78%: худшее наблюдавшееся снижение — 6 п.п.; оно также ниже лимита 10 п.п. Проценты API целые, более точный расход квоты не сообщён. Условная сумма цен при billing=balance — $0.39; это **не** фактическое списание. Обе задачи billed `source=plan`, `balance_charged=0`. Поле `credit_cost=1` в результате не трактуется как долларовая стоимость. Денежный лимит $2.00 сохранён полностью. Завершённых генераций 2, незавершённых jobs 0, повторных запросов после timeout нет.

До запросов проверены баланс, актуальные animation styles, get_style_usage и estimate_inference_cost. Оба режима требуют `input_image`, допускают 32–256 px, максимум одно изображение, не поддерживают дополнительные `reference_images`. Backend в обоих результатах назван **`rd_fast`**; RD Pro не заявляется как использованная анимационная модель. Каталог моделей и требования сохранены в `model-style-metadata.json`.

Общие параметры: width=192, height=192, num_images=1, frames_duration=8, seed=6110631, bypass_prompt_expansion=true, remove_bg=true, return_spritesheet=false, upload_outputs=true. Доставка — async jobs; originals GIF по 8×150 мс, 1200 мс каждый. `frames_duration=8` передавался как параметр API, фактические кадры/длительности проверены декодером.

Полные тексты обоих prompt, input path, estimates, request/task IDs и обезличенные receipts находятся в `generation-manifest.json`. Лучший по движению prompt:

> ONE complete compact two-handed DIAGONAL MELEE SLASH, then recover to the starting guard. Facing south, low top-down camera. Briefly draw the greatsword to the LEFT HIP with both hands, twist shoulders and torso slightly, then drive BOTH arms and shoulders through a fast short diagonal cut ACROSS THE FRONT at waist-to-chest height, follow through to the opposite low side, then return to the original idle guard. Feet stay grounded with a small weight transfer. This is an ordinary close-range sword attack, NOT an overhead slam: NEVER raise the blade above the helmet. Exactly one broad heavy greatsword, constant size and thick crossguard, BOTH gauntlets remain closed on ONE handle. Keep this same massive charcoal Ash Warden, helmet, shoulder armor, moderate dry branches, roots, tabard and orange cracks. No spinning, jumping, extra sword, fire trail, ground fissure, flash, scenery or effects. Entire figure and blade inside the canvas. Transparent background.

## Покадровая оценка и обработка

| Область | Наблюдение |
| --- | --- |
| Образ | Общая масса, шлем и ветви узнаваемы. В кадрах 2–4 первой попытки меняются детали брони и цветовые кластеры; второй вариант спокойнее, но почти не атакует. |
| Корпус/плечи | У custom_action есть настоящее изменение позы, работа локтей и поворот плеч. Это полезный motion reference. |
| Хват | Две кисти читаются в нейтрали. При отводе и ударе перчатки/гарда сливаются, уверенный контакт обеих кистей с одной рукоятью не доказан во всех ключевых кадрах. |
| Меч | Кадр 3 становится тоньше, 5 выгибается/заостряется иначе, 6 превращается в широкую плоскую форму с другой гардой. Главная причина отклонения. Во второй попытке кадры 3–4 заметно сокращают клинок. |
| Ноги | Нет прыжка и общего перемещения спрайта. В первой попытке нижняя граница меняется на 1 px, во второй сильнее. Перенос веса скромный; ноги не являются главным блокером этого теста. |
| Направление | Компактное движение перед корпусом, без overhead slam, гигантской проекции и наземного разлома. Однако траектория клинка недостаточно чистая для production. |
| Recovery | RD возвращает позу слишком резко. Длительная выдержка последнего кадра не заменяет недостающую промежуточную позу. |

В выбранном черновике оставлены оригинальные RD кадры **1–6 без изменения пикселей**. Кадры **0 и 7** заменены принятой статичной South-базой для проверки технических стыков с locomotion. Это не устраняет скачок 6→7 и прямо отражено в статусе draft. Никакой сборки неподвижного корпуса с отдельно вращающимся мечом нет; внутреннее движение корпуса/рук осталось сгенерированным. Клинок и кисти программно не дорисовывались. PixelLab и другие генераторы не применялись.

Ретайминг по кадрам: **[70,60,60,60,40,40,60,370] мс**. Подготовка 250 мс, предполагаемая активная фаза 140 мс, конечная выдержка/recovery 370 мс. Общая длина 760 мс. Это предложение для изучения, а не подтверждение качества движения. Равномерное ускорение всего клипа не использовалось. Первый/последний кадры одинаковы; внутренний переход к последнему остаётся дефектным.

## События для будущего Phaser

Все индексы с нуля; метаданные имеют статус `draft-not-production-approved` и пока не подключены к урону/AI.

| Событие | Время | Кадр | Назначение |
| --- | ---: | ---: | --- |
| attackStart | 0 мс | 0 | Начало экземпляра атаки |
| directionLock | 0 мс | 0 | Один раз зафиксировать aim/facing, без доворачивания за целью |
| windupEnd | 250 мс | 4 | Начало предлагаемой активной фазы |
| hitFrame | 330 мс | 6 | Один запрос попадания на attackInstanceId |
| activeEnd | 390 мс | 7 | Конец активной фазы, граница исключительная |
| recoveryEnd | 760 мс | 8 exclusive | Разрешён визуальный выход в locomotion |

Передняя область: south vector [0,1], сектор ориентировочно 90°. Радиус намеренно не назначен: это будущая настройка gameplay, не новый хитбокс. `maxApplicationsPerAttack=1`, никогда не наносить урон на каждом активном кадре. Окно визуального возврата 390–760 мс, gameplay exit только после 760 мс. Точки событий нужно переутвердить после исправления поз/траектории меча.

## Отличие от Infernal Great Cleave

| | Basic Melee draft | Принятый Cleave motion reference |
| --- | --- | --- |
| Длина | 760 мс после ретайминга | 1800 мс, исходный клип |
| Движение | Низкий боковой отвод и короткое движение поперёк передней области | Долгий высокий замах и удар вниз/вперёд |
| Назначение | Частая ближняя атака | Мощная отдельная атака с будущей длинной узкой огненной проекцией по земле |
| VFX | Нет увеличения клинка, вспышки или разлома | Будущие Phaser VFX, сейчас не добавлялись |
| Готовность | Отклонён для production из-за меча/хвата/recovery | Принят ранее как художественная основа, не переделывался |

Basic Melee по амплитуде не превосходит Cleave. Сравнение использует один world scale, один pivot и Mage; каждому кадру отдельный размер не подбирался.

## Материалы и проверка

Все новые материалы: `art/generated/ash-warden-basic-melee-rd-01/`.

- `south-01-original.gif`, `south-02-original.gif`: полные оригиналы; соответствующие подпапки содержат все 16 raw PNG, strips, sheets, nearest×4 и измерения.
- `south/frames/00..07.png`, `south/preview.gif`, `best-attempt.gif`: выбранный **черновик**, не approved pack. `idle-attack-idle.gif`: переход с принятым South Idle.
- `animation-strip.png`, `spritesheet.png`, `nearest-x4.png`: выбранные кадры. `comparison-sheet.png`, `comparison-nearest-x4.png`: обе попытки и выбранные ключевые кадры до/после обработки.
- `comparison-desktop.png` **1280×720**, `comparison-mobile-landscape.png` **844×390**: Mage, база, windup/hit Melee, hit Cleave на фоне существующей Burning Grove. `viewer-desktop.png`, `viewer-mobile-landscape.png`: настоящие Canvas screenshots viewer.
- `events.json`, `south/frames.json`, `selection.json`, `generation-manifest.json`, `expenses.json`: параметры, события, pivots, тайминги и расходы. Секретных URL/ключей нет.
- `prepare-inputs.mjs`, `decode.mjs`, `publish.mjs`, `review.mjs`, `viewer-template.html`, `README.md`: воспроизводимая локальная подготовка. Повторный запуск локальных скриптов не вызывает платную генерацию.

Viewer: `art/generated/ash-warden-locomotion-rd-01/viewer.html`. Сохранены режимы исходного South, принятого South polish и Directions V1. В V1 доступны Idle/Walk всех четырёх направлений; Basic Melee только South с явной маркировкой DRAFT. Добавлены play/pause, scrub, FPS с сохранением относительных длительностей кадров, Idle→Attack→Idle, ограниченный журнал визуальных событий. Это отдельный art viewer, не интерфейс production-игры.

PNG: все выбранные кадры 192×192 RGBA, прозрачные, alpha только 0/255, нет пикселей на границах холста. Общий pivot (96,154), без автоматического центрирования. Это подтверждает техническую целостность, но не исправляет морфинг цветовых кластеров. GIF проверен обратным декодированием: 8 кадров, 760 мс, ноль отличающихся видимых пикселей от PNG, все длительности совпадают. Результаты в `png-validation.json`, `gif-validation.json`.

`review.mjs` проверил оба viewport, все 8 кадров scrub, два перехода Idle→Attack→Idle с одним событием каждый, два цикла с двумя событиями, отсутствие событий при scrub, пропорциональное изменение тайминга FPS, отключение неготовых ракурсов, сохранение четырёх Walk при 72/100/144 world/s и отсутствие ошибок браузера. Результат `viewer-validation.json`. Ограничение старой походки на высокой скорости осталось в backlog, не исправлялось этим заданием.

`npm run check`: typecheck, ESLint, **82 test files / 655 tests**, build успешно; остаётся прежнее предупреждение Vite о размере Phaser chunk. `git diff --check` и сверка SHA-256 защищённых исходников/ассетов выполнены. E2E игры не запускались: игровые runtime-файлы не изменялись; для art viewer проведена отдельная проверка Chromium с screenshots. Создания production-интеграции не было.

**Следующий шаг:** ручная художественная приёмка South-черновика. Если движение подходит как основа, нужно покадрово исправить рукоять, две кисти и прямой широкий клинок в 3–6, добавить промежуточный recovery в рамках 8 кадров и заново проверить стыки. Это потребует работы с самими позами, а не только FPS или регистрацией. До такого исправления размножать атаку на North/East/West и переходить к Charge не рекомендуется. Новых генераций или других атак автоматически не запускать.
