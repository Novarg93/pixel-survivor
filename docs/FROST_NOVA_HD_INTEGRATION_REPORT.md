# Frost Nova HD — принятый вариант в игре, 2026-11-09

Пользователь принял 512×512 вариант и попросил заменить обычную Frost Nova.
Runtime использует frost-nova-hd-v1/frost-nova-hd.png/.json, прежние keys
frost-nova-0..23. Нативные пиксели и alpha сохранены без уменьшения,24×50ms,
полная длительность1.2s, одноразовое прямое воспроизведение, центральный pivot.
Ультимейт использует прежний146² источник/48кадров. Meteor сохранён.

Радиус/таргетинг/урон/root/CD не изменены. Старый display-size helper использует
новые метаданные: fullcanvas516² с padding2 и размер2R×516/512. Поэтому исходный
холст по-прежнему имеет диаметр2R. В настоящей тренировке Mage54/NovaIV/area1.45:
radius127.02, диаметр254.04world units; при camera×2 он занимает508.08screen/CSSpx,
один nativeпиксель≈0.99234375px. На уменьшенном ранге эффект также просмотрен.

Сборщик scripts/build-mage-ability-vfx.mjs поддерживает512/146native canvases,
применяет lossless transparent trim с прежним sourceoffset/padding и выбирает
наименьшую по площади shelf-упаковку из1024/1536/2048width, height≤4096.
Результат1536×3630,96frames,22302720RGBAbytes (~21.27MiB); PNG767026bytes.
Остаются прежние atlas URL/key и bounded Image pool. Никаких новых timers,
tweens/listeners. Повторная сборка atlas PNG/JSON,manifest,source-auditJSON
даёт4byte-identical файла. Asset registry отражает новый fullcanvas516².

Приёмка высокой детализации добавляет16330752bytes (~15.57MiB) к прежнему
атласу. Поэтому проверки ресурса теперь ограничивают atlas24MiB и общий
texture-source RGBA budget144MiB вместо128MiB. Лимиты и проверки отсутствия
роста после рестартов сохранены. Это размер RGBAисточников текстур по диагностике,
не прямая телеметрия выделений GPUдрайвера.

Проверки:

- `npm.cmd run check`:PASS,908unit/110files,typecheck/lint/build.
  Новые/обновлённые unit сверяют approvedsource,source512/146,fullcanvas516/150,
  все72Frostnativepixel hashes, timing/pivot/радиус, невыход заграницы и
  отсутствие пересечений packedrects. Frost gameplay regression сохранён.
- Подтверждены15различных целевыхE2E: frost-nova-art3, frost-nova-hd-game2,
  mage-ability-vfx6, movingMage2, nativeMage mixed150+3+3/restarts1, viewer1.
  Первый общий прогон10/11: в portraitfixture босс стоял вне legalgroundviewport.
  В fixture герой подходит к цели, правила таргетинга не менялись. Повтор настоящей
  тренировки2/2 PASS(11.1s); all-frame и Meteor cases прошли в первом прогоне.
- `npm.cmd run test:e2e -- tests/e2e/mage-hero-v2.spec.ts tests/e2e/mage-moving-cast.spec.ts --grep 'mixed150|moving Mage keeps'`:
  3/3 PASS(46.6s). Все направления/составные касты сохраняют atlas keys;
 10scene restarts не накапливают объекты/текстуры/слушатели.
- Stress150regular+3boss+3Guardian в текущем Chromium:

| Экран | medianFPS | p95frame | p95update | RGBAtexture-source bytes |
| --- | --- | --- | --- | --- |
| 1280×720 | 59.88 | 16.8ms | 2.2ms | 148705984 |
| 390×844 | 59.88 | 16.8ms | 2.0ms | 136123072 |

Оба значения ниже144MiB.10restart дают одинаковые129831616bytes,
Clock0/0/0,tweens0,errors0. Это локальное измерение, не гарантия для любогоGPU.

- `npm.cmd run test:e2e:production`:9/9 PASS(43.0s), настоящий публичный запуск,
  тренировки, pause/resume, controller input, resize и набор локальных ресурсов.
- Финальные typecheck/lint и `git diff --check`:PASS.

Визуальная проверка выполнена по настоящим CanvasPNG: NovaIV в тренировке наPC
иportrait, NovaI на обоихviewport. Герой/враги/босс остаются поверх эффекта,
контуры и мелкие детали видны. Новые8PNG/2JSON:
screenshots/frost-nova-hd-game/{1280,390}/. Актуальные27PNG/3JSON всехFrostкадров:
screenshots/frost-nova-art/. Stress/10restart данные:
screenshots/mage-hero-v2/performance.json. Viewer сравнения помечает версии
как прежнюю и новую игровую; его pause/scrub/camera controls снова проверены1/1.

Блокеров нет. Следующий шаг — игровая оценка пользователем. Исходники сохранены,
новые done-маркеры не создавались.
