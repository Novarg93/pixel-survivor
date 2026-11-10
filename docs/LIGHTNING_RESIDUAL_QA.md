# Lightning Ultimate — residual crackling only

## Небольшое увеличение яркости после приёмки

2026-11-05: peak .38→.44 (+15.8%), остальные параметры прежние. Check549/549
с typecheck/lint/build; residual E2E3/3 за27.7s, diff-check exit0. Визуально
сравнены desktop/mobile Canvas кадры screenshots/lightning-residual-brightness/.
Контроль scope:1runtime и2test-файла, docs/lightning-residual-brightness/verification.json.
Остановлено для ручной приёмки, без push/deploy.

## Настройка после приёмки:26точек,5проходов

2026-11-05: по запросу пользователя количество зон увеличено ровно на30%
(20→26), повторов2→5. Residual длится1.6s вместо.54s. Повтор320ms, stagger10ms,
жизнь дуги65ms; проходы не пересекаются, одновременно≤7дуг. Старт385ms после
Release прежний; hard clear1.985s укладывается в старый World-record2s.
Первый проход имеет прежний пик, все последующие — прежнюю слабую амплитуду
второго. Основной разряд/урон/радиус и другие способности не менялись.

Проверки этой настройки: check549/549 + typecheck/lint/build; связанные E2E11/11;
дополнительно расширенный тест150+3+3 на всю длительность2/2, typecheck/lint0.
Все26точек отрабатывают во всех5проходах на обоих viewport. Median59.88FPS,
p95~16.8ms в Chromium viewport-эмуляции. Production7/7 за35s,exit0;
diff-check exit0. Итоговая сверка scope/посещений/таймингов:
lightning-residual-density/verification.json. Полный329E2E ниже относится к
предыдущему residual pass и для этой настройки повторно не запускался.

Новые кадры: screenshots/lightning-residual-density/; отдельные файлы
pass-one/pass-two/pass-three/pass-four/pass-five-{1280,844}.png. Логи:
docs/lightning-residual-density/. Исходная двухпроходная версия описана ниже.

## Исходный residual:20точек,2прохода

2026-11-05, main. Точечная замена остаточного VFX в LightningGroundArt.
Основной каст, небесная/толстая молния, web, flash и gameplay не перерабатываются.

## Поведение и время

Большая процедурная радиальная геометрия заменена20невидимыми зонами:
14точек сетки5×3 без центра и6ближних точек. В каждой — короткая авторская
ломаная примерно10–17World px из4вариантов. Сетка/круги не рисуются, дуги не
связаны друг с другом и не исходят лучами из героя. Каждая зона проигрывается
дважды с той же геометрией и одинаковым порядком стартов.

Тайминг отсчитывается от фактического Release в World time:

| Срок | Поведение |
| --- | --- |
| 0–.320s | Прежний главный удар/web; residual полностью отсутствует |
| .320–.385s | 65ms паузы после основной электрической паутины |
| .385–.640s | Pass1, соседние старты разнесены на10ms |
| .665–.920s | Pass2 по тем же20точкам, на28% слабее |
| ≥.925s | Полностью пустой Graphics, cached geometry удалена |

«После завершения основного разряда» трактуется буквально:65ms отсчитываются
после конца основной web, а не после начала Release. Поэтому residual не
перекрывает пик главной молнии. Его собственное окно —540ms, жизнь дуги65ms,
старт второй волны сдвинут на280ms. Максимум7дуг одновременно.

Пик alpha≤.38×intensity, бело-голубое ядро/голубая линия/очень слабое синее
свечение. Reduced motion/flash дополнительно снижает alpha до55%; stagger и
две волны сохранены. Нет добавленной вспышки, аудио-атаки, телеграфа или урона.
Прежние кружки попаданий основной web остаются в её старой фазе; residual
окружностей вокруг целей не рисует.

## Область и ресурсы

Шаблон расположен в фактическом viewport в World-координатах на момент Release,
центр — прежний GroundDischarge.origin. Точки ограничены исходным радиусом
`hypot(viewport.width,viewport.height)/2+24`; игровой радиус не меняется.
Круговое испепеление обычных мобов, отдельная дальняя chain-web и heavy caps
прежние. В кадрах восемь shielded элитных tank с1M HP, включая disconnected
цели сзади и по углам, получают те же восемь уникальных попаданий в один Release.

Один существующий Graphics.20shape arrays используются обоими проходами,
40лёгких записей расписания. RNG полностью отсутствует. Новых GameObjects,
RAF, timers, listeners или shaders в игре нет. Кэш очищается по World time;
pause останавливает его. Прежний двухсекундный GroundDischarge-record остаётся
доменным состоянием без видимых следов после925ms.

## Проверки

- `npm.cmd run check`:549/549 в69файлах, typecheck/lint/build exit0.
- Первичный целевой cinematic/devastation/residual набор11/11 за36.5s.
- После окончательного уточнения толщины ядра — повторный check и residual
  E2E3/3 за23.9s. Последующих изменений игрового исходника не планируется.
- Unit: фиксированная геометрия/короткая длина/границы зоны; повторное использование
  точек, разные старты обоих проходов,≤7дуг, слабая вторая волна, ноль residual
  в основной фазе даже при reduced, hard clear.
- Real Canvas: Q/touch, оба pass посещают все20ячеек, прежние unique hits/rear kills,
  один geometry build, World pause, intensity0, reduced и10scene restarts.
- Нагрузочный постоянный150+3+3/rankV/highCDR сценарий: median59.88FPS до/во время,
  p95~16.7ms на обоих viewport в целевом прогоне. Это Windows Chromium viewport
  эмуляция, не физические мобильные устройства.
- Production:7/7 за33.9s,exit0 (`production.json`).
- Первый полный прогон остановлен после227успешных проверок и1таймаута:
  старый Mage Space E2E нативно нажимал автоматически сфокусированный Restart
  после Game Over. Snapshot показывает уже новый забег сHP100/level1, пока
  тест ожидает кнопку Game Over. Исправлен только тест: дождаться видимой кнопки,
  blur, затем Space и новый assert status=over. UI/input/gameplay не менялись.
  Mage/Warrior —6/6 при трёх повторах (`mobility-audit.log`), check повторно exit0.
  Прерванные результаты сохранены как full-focus-race*, контекст как
  mobility-focus-race.md. Полный набор перезапущен с этой синхронизацией.
- Финальный `npm.cmd run test:e2e`: **329/329 за20.7минуты**, exit0, чистый
  сервер5201/3workers. Skipped/flaky/unexpected=0 (`full-results.json`, `full.log`).
- `git diff --check`:exit0. SHA256 всех337файлов из full-manifest.json прежние
  после полного прогона. Относительно baseline:1игровой source и4test-файла,
  добавленных src/tests/scripts/assets нет. Весь gameplay и основной Lightning
  cinematic, Frost/Fire, анимации и assets совпадают с baseline (`verification.json`).
- В полном наборе оба pass посетили все20ячеек на обоих viewport, максимум7дуг
  одновременно. Первый видимый crackle~399ms, последний~915ms, основной пик
  не содержит residual. Нагрузка: median59.88FPS до/во время, p95 desktop16.7ms /
  mobile16.8ms. Точные времена и состояния записаны в verification.json.

## Реальные кадры после изменения

| Фаза | 1280×720 | 844×390 |
| --- | --- | --- |
| Главный удар | [PNG](../screenshots/lightning-residual/after/main-strike-1280.png) | [PNG](../screenshots/lightning-residual/after/main-strike-844.png) |
| Поражение сзади/сбоку | [PNG](../screenshots/lightning-residual/after/rear-kills-1280.png) | [PNG](../screenshots/lightning-residual/after/rear-kills-844.png) |
| Пауза до residual | [PNG](../screenshots/lightning-residual/after/before-residual-1280.png) | [PNG](../screenshots/lightning-residual/after/before-residual-844.png) |
| Начало residual | [PNG](../screenshots/lightning-residual/after/residual-start-1280.png) | [PNG](../screenshots/lightning-residual/after/residual-start-844.png) |
| Pass1 | [PNG](../screenshots/lightning-residual/after/pass-one-1280.png) | [PNG](../screenshots/lightning-residual/after/pass-one-844.png) |
| Pass2 | [PNG](../screenshots/lightning-residual/after/pass-two-1280.png) | [PNG](../screenshots/lightning-residual/after/pass-two-844.png) |
| Полностью очищено | [PNG](../screenshots/lightning-residual/after/cleared-1280.png) | [PNG](../screenshots/lightning-residual/after/cleared-844.png) |

Такие же семь фаз исходного варианта: screenshots/lightning-residual/before/.
Точные World timestamps и активные ячейки: docs/lightning-residual/after-{width}.json.
Локальная приёмка: http://127.0.0.1:5185/ → DEV «Гнев Небес» → Q/Y/touch.
Все7фаз на обоих viewport и reduced визуально проверены. Основной удар сравнен
с прежним вариантом; после полного набора финальные main/pass1/pass2/clear
кадры повторно просмотрены. Блокеров нет. Сервер5185 отвечает200; перед
проверкой обновить страницу. Работа остановлена для ручной приёмки.
Без новых веток/commit/push/deploy.
