# Роща осколков: художественная эволюция

2026-11-06, текущая main. Отчёт для ручной приёмки.

Обновление по следующей ручной приёмке: текущие окна —05:00–05:05,10:00–10:05,
15:00–15:05 с текстовыми анонсами. Подробности и свежие проверки:
[biome-notice/REVIEW.md](../biome-notice/REVIEW.md).
Ниже сохранён отчёт исходной арт-итерации с30-секундными окнами;
её старые временные окна и результаты общего прогона являются историческими.

## Что изменилось

Один непрерывный Grove имеет четыре состояния: normal до 5:00, dusk до 10:00,
dying до 15:00, burning после 15:00. Плавные 30-секундные окна начинаются на
4:30,9:30,14:30. Smoothstep даёт blend=0 на начале,0.5 посередине,1 на конце.
Отдельной карты Dark Forest в меню и активном каталоге больше нет.

Все картинки оригинальные, рисуются кодом в том же runtime Canvas pipeline,
без внешних ресурсов/зависимостей. Создано 116 atlas frames: восемь вариантов
почвы и семь категорий декора по три варианта для каждого из четырёх состояний.

| Состояние | Фактический рисунок |
| --- | --- |
| Normal | Исходная зелёная/земляная палитра Grove, гранёные живые кроны, кусты, вертикальная трава, лишайник, светлые грибы |
| Dusk | Холодная почва, глубокие тени крон, свисающие листья, более густая трава, опад, приглушённые грибы/камни |
| Dying | Редкие остатки листвы, голые искривлённые ветви, сухие кусты/трава/корни, разломы почвы, осыпавшийся декор |
| Burning | Обугленные деревья/кусты/пни, прожжённые пятна, пепел, тлеющие трещины/стволы, небольшие очаги огня |

Существующие veil/vignette/fog/glow/embers/ash сохранены. Их интенсивность
уменьшена, чтобы не затемнять уже нарисованные тени второй раз. Огонь окружения
остаётся ниже акторов, тусклее/меньше Fire Ultimate и не наносит урон.

## Как сохраняется мир

WorldChunkSystem получает только presentation time и карту представления.
Phaser World, игрок, враги, снаряды, лут, таймеры, способности и RNG при переходе
не пересоздаются. groveDecoration вычисляет постоянные id/category/variant/root
из координат. Фаза выбирает другой atlas frame для того же root. Косметика
не обращается к gameplay RNG. Карта, как и раньше, использует фиксированный
координатный layout, а не новый layout для каждого seed забега.

Следующий рисунок чанка готовится по одной поверхности за кадр в течение пяти
секунд перед окном. При переходе opaque base + alpha target смешиваются на GPU.
Никаких перерисовок Canvas/загрузок/декодирования каждого кадра. Вновь видимый
чанк сразу получает текущие source/target и blend. После окна target становится
base, старые Image и Texture удаляются. За пределами camera cache нет мира.

MapDefinition отделяет доступный MapId от исторического BiomeId. Presentation
содержит artPack и расписание. Контроллер принимает собственный массив фаз,
включая другое число состояний/тайминги; новая карта потребует своего renderer
и определения. В этой задаче добавлен только Grove art pack.

## Старые результаты

Валидатор storage по-прежнему принимает details.biome=dark-forest. Схема,
исторические records, lastPlayed (это ID результата), totals и прежний top10
не мигрируют. Подпись локации в LocalRecords различает старый Dark Forest и
Grove. Старый/неизвестный launch ID нормализуется только для нового World.
Отдельного persisted selected-map в существующей схеме нет. Legacy URL не
открывает удалённую карту. Рекорды Dark Forest не становятся рекордами Grove.

## Текстуры и память

Общий CPU art atlas 512×896 = 1,75MiB RGBA. Он создаётся один раз на сцену и
освобождается при shutdown. Все четыре фазы сразу дешевле отдельного загрузчика.
Только текущий camera cache имеет чанковые GPU textures: одна поверхность в
установившейся фазе, максимум две во время prewarm/crossfade. Каждая 256² RGBA.
TextureManager.create(Canvas) исключает ImageData-копию CanvasTexture.
TextureManager.remove действительно уничтожает GL texture/source/frames:
проверено по локальным исходникам Phaser и счётчикам после travel/restart.

| Viewport | Чанки в контрольной камере | Установившаяся фаза | Максимум при смешивании |
| --- | ---: | ---: | ---: |
| 1280×720 | 48 | 25,75MiB | 49,75MiB |
| 844×390 touch | 24 | 13,75MiB | 25,75MiB |

Это расчёт atlas + Canvas backing + RGBA GPU allocation для окружения,
не измерение полной памяти GPU/драйвера/браузера. Actor atlases и служебные
объекты не входят в эти числа. Cache count зависит от положения/масштаба камеры.
Дополнительно собран usedJSHeapSize Chromium в combat JSON. Нет новых timers,
callbacks на деревья, шейдеров и сетевой загрузки в момент перехода.

## Скриншоты

Реальный Canvas, одна позиция Mage и камеры, одинаковый zoom. Все PNG открыты
для визуального осмотра. Состояния выставлены через DEV presentation override;
для снимка timer HUD выставлен в указанное время существующей тестовой
фикстурой при paused World. Gameplay не прогонялся пятнадцать реальных минут.
Отдельно подтверждена неизменность сериализованного World при одном только
override. Production не имеет этого hook; URL visualTime игнорируется.

| Время | Desktop | Mobile landscape |
| --- | --- | --- |
| 04:00 Normal | [PNG](../../screenshots/grove-evolution/normal-1280.png) | [PNG](../../screenshots/grove-evolution/normal-844.png) |
| 05:15 Dusk | [PNG](../../screenshots/grove-evolution/dusk-1280.png) | [PNG](../../screenshots/grove-evolution/dusk-844.png) |
| 10:15 Dying | [PNG](../../screenshots/grove-evolution/dying-1280.png) | [PNG](../../screenshots/grove-evolution/dying-844.png) |
| 15:15 Burning | [PNG](../../screenshots/grove-evolution/burning-1280.png) | [PNG](../../screenshots/grove-evolution/burning-844.png) |

04:00 — живая роща:

![Normal, одна контрольная камера](../../screenshots/grove-evolution/normal-1280.png)

05:15 — сумерки:

![Dusk, та же контрольная камера](../../screenshots/grove-evolution/dusk-1280.png)

10:15 — умирающий лес:

![Dying, та же контрольная камера](../../screenshots/grove-evolution/dying-1280.png)

15:15 — обугленный лес:

![Burning, та же контрольная камера](../../screenshots/grove-evolution/burning-1280.png)

Дополнительно: transition-midpoint-1280/844.png, art-atlas.png,
fire-1280/844.png, frost-1280/844.png в той же папке.
Стресс-кадры: screenshots/atmosphere/stress-burning-1280/844.png.
Видео переходов: screenshots/atmosphere-fast/transitions-1280/844.webm.

Для локальной ручной проверки: `npm run dev`, открыть `/?test=1`, начать забег.
В консоли `window.__PIXEL__.setVisualTime(240)` показывает
normal,315 — dusk,615 — dying,915 — burning,302.5/602.5/902.5 — середины текущих переходов.
`window.__PIXEL__.setVisualTime()` возвращает часы представления к времени забега.
Таймер HUD не меняется от этого override; это намеренно отдельные часы проверки.
Новый забег автоматически сбрасывает override.

## Проверки и измерения

Финальная проверка завершена:

| Команда | Результат |
| --- | --- |
| `npm run check` | exit0; typecheck/lint,601/601 unit в73файлах, production build |
| `npm run test:e2e` | 350/355 за58,1min; exit1 из-за пяти старых сравнений имён texture keys в camera fixture |
| `npm run test:e2e -- camera-fireball-cleanup.spec.ts grove-evolution.spec.ts` | После исправления fixture:13/13 за52,4s,exit0; все пять сбоев устранены; дополнительно новый native fullscreen case |
| `npm run test:e2e:production` | 7/7 за33,2s,exit0; legacy URL/отсутствие DEV hook/без внешних ресурсов |
| `git diff --check` | exit0 |

Все356актуальных E2E-сценариев покрыты успешными прогонами. Одного полного
зелёного прогона356/356 не заявляется: полный набор выполнялся до правки camera
fixture, затем целиком повторены оба затронутых файла. Runtime после начала
полного набора не менялся. Ни один тест/skip/assertion не удалён и не ослаблен.
Camera fixture теперь сравнивает исходные логические chunk coordinates и
дополнительно требует normal у всех реальных texture keys в начальном забеге.

Native fullscreen действительно включён/выключен API браузера через доверенный
pointer gesture, без fullscreen mock. Отдельный тест удерживает level38,HP64,
XP13,готовность Fireball,Blink cooldown,ultimate charge,врага,снаряд и XP orb;
полная сериализация World совпадает до/после фаз и fullscreen. После этого
активируется Fire Ultimate и снова проверяется полное сохранение World при
переключении всех четырёх art states. Одноразовая audio queue обрабатывается
до фиксации baseline, а не исключается из сравнения.

Два60ssoak с150 обычными врагами и3боссами проходят переход dying→burning.
Установившийся burning: около60FPS, p95кадра16,8ms desktop /16,7ms touch viewport,
p95update1,0/0,9ms,errors[]. В дополнительных Fire/Frost150+3+Guardian сценах
получено около60FPS,p95кадра порядка16,8–16,9ms,p95update до1,6ms.
Оборудование: AMD Ryzen5 7500F,Chromium156.0.8078.4,headless. Эти показатели
относятся к настольному компьютеру, включая эмуляцию touch viewport.

Проверены также pause/resume/death,10обычных и10полных scene restarts,
перемещения±50000,resize,ориентация,масштабы2×/3×,читаемость HUD,
реальные Fire/Frost/Lightning эффекты и сохранение старого Dark Forest record.
Логи: CHECK.log,E2E-full.log,E2E-final.log,PRODUCTION.log в этой папке.

Артефакты: phases-1280/844.json, combat-1280/844.json в этой папке,
docs/atmosphere/soak-1280/844.json и lifecycle.json,
docs/atmosphere-fast/transitions-1280/844.json.

Ограничения: mobile проверяется как touch viewport на настольном Chromium,
а не на физическом телефоне. Пламя на декоре — неподвижные pixel frames;
движение дают сохранённые ограниченные частицы/дымка. Производительность и
нативный fullscreen на физическом мобильном устройстве требуют ручной проверки.
Блокеров и известных незавершённых исправлений нет.
Документация и screenshots локальные, согласно существующему .gitignore.
Commit/push/deploy, дополнительные ветки и done-маркеры не создаются.
