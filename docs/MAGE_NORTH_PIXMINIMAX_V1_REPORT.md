# Mage north — Walk / Run через PixMiniMax, 2026-11-08

По запросу пользователя проверены и реально использованы `first_frame_url`,
`frame_count=16`, `direction=north`, `view=low top-down`,
`enhance_prompt=true`, `no_background=true` в PixelLab
`animate_image_pixminimax`. Созданы два отдельных клипа без перегенераций.

Результаты: `art/main-hero-mage/abilities/hero-model/north-pixminimax-v1/`.
Главная точка просмотра — `viewer.html`: self-contained, работает без сети;
исходная поза и оба клипа, кадры/пауза/скорость/три фона. Каждый клип имеет
PNG-сетку 4×4 (1024×1024), strip, JSON, прозрачный GIF и `.aseprite`.

## Исходник и параметры

Из 3×3 листа `8-directions.png` (768×768) извлечена северная поза: row 2,
column 2, x=256/y=256/w=256/h=256. Crop сохраняет исходные RGBA и полную
рамку; BBox x54…196/y31…252. Камера `low top-down` выбрана по визуальному
ракурсу спрайта; это художественная оценка. Все 8 исходных PNG/GIF в папке
hero-model защищены SHA-256, изменений нет.

| Клип | Seed | Job ID | Gallery asset |
| --- | --- | --- | --- |
| Walk | 8110861 | ab7716b0-63f2-4f39-90ce-b49d6bcde64f | d00b4e9a-f712-56a9-8dd9-49ecf07a10e6 |
| Run | 8110862 | 52439d10-7ab4-40a5-8894-05e4ca2fddf2 | 1e29fce8-d3a6-5da9-abca-e5f1ccf6bcff |

Оба задания completed, asset_status saved. Поздняя ETA сервиса была
неточной, повторных платных запусков/отмен не делалось.

Промпты описывают in-place ходьбу/бег от камеры, неподвижную камеру,
сохранение костюма/масштаба/направления, всю фигуру внутри canvas и
возврат к начальной позе. `subject_description` и `initial_pose` переданы
явно. Улучшенные сервисом motion captions:

- Walk: “Step forward with alternating feet, maintaining a rhythmic vertical
  bob with each grounded stride. Swing arms in natural opposition to the
  gait while the coat tails sway rhythmically behind, settling back into a
  neutral standing stance to complete the cycle.”
- Run: “Drive knees upward in a rhythmic, energetic stride. Lean forward
  slightly while pumping elbows in opposition, lifting the coat tails with
  each airborne phase. Land firmly on each foot in sequence, settling back
  into the initial stance to complete the cycle.”

Полные исходные промпты и ответы API сохранены рядом с файлами.

## Экспорт и просмотр

PixelLab вернул для каждого задания 17 PNG: неизменённый input и 16 новых.
Все 34 raw-файла сохранены. Финальные PNG/GIF/Aseprite используют только
новые frame-01…frame-16, то есть ровно 16 кадров. Исходник хранится отдельно.
Никаких ручных исправлений пикселей/положения/цветов не делалось.

PNG скомпонованы без изменения RGBA. Aseprite batch импортировал strip,
задал кадрам длительность и экспортировал GIF. `.aseprite` имеет один
растровый слой и 16 кадров; не заявляется разбиение на части тела.
Для просмотра выбран Walk 80 мс, Run 60 мс на кадр; исходный API выдаёт
PNG без таймингов. Пользователь может менять скорость в viewer.

По просмотренным полным раскадровкам и Canvas: оба клипа держат north,
цвета синего плаща и золотой брони узнаваемы. Walk использует спокойные
шаги и меньшую амплитуду корпуса; Run — согнутые локти, более высокие
подъёмы стоп, наклон/боб и активный плащ. Усиленный промпт возвращает оба
клипа в нейтральную стойку на конце; для будущего непрерывного движения
стоит отдельно оценить эту фазу возврата при художественной приёмке.
Технический переход 16→1 работает, это не доказательство идеального
ритма locomotion. Рабочая модель/игровые движения в Phaser не менялись.

## Проверки

- 8 source hashes unchanged; оба raw frame-00 полностью совпадают с crop.
- 39 PNG: CRC/dimensions PASS. 16 уникальных новых кадров в каждом клипе.
- Прозрачный фон, alpha 0/255; на границе canvas непустых пикселей 0.
- PNG↔sheet/strip: RGBA differences 0. GIF decoded через Chromium:
  по 16 кадров, 80/60 мс, alpha/color differences 0 на всех кадрах.
- Viewer: playback более двух циклов обоих клипов, pause, scrub 1/8/16,
  step 16→1, светлый/шахматный фон, 1280×760 и 390×844 PASS.
  Отрисованные Canvas pixels совпадают с raw PNG; page errors 0,
  mobile horizontal overflow 0.
- 5 настоящих screenshots: `screenshots/mage-north-pixminimax-v1/`.
  Desktop frame 8 / light и mobile checker открыты и просмотрены;
  полные 16-frame Walk и Run PNG также открыты и просмотрены.
- 9 review outputs rebuilt byte-identical из сохранённых raw frames,
  без новых обращений к генерации. `validation.json`, `reproduction.json`.
- Финальный `npm.cmd run check`: typecheck/lint/build PASS,
  854 unit / 105 файлов PASS. Первый lint нашёл пропущенный import URL
  в двух локальных builders; исправлен обычным import из node:url.

Расход: 1827.70→1823.60, **4.10 subscription generations**. Каждый клип
2.00 + enhancement 0.05; USD credits 0→0. Saved gallery assets доступны
в учётной записи пользователя. Номерные done-маркеры не создавались.
Блокеров нет. Следующий шаг — оценка пользователем пары north clips;
подключение новой модели и остальных направлений будет отдельной задачей.
