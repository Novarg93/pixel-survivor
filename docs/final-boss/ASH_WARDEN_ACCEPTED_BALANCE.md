# Ash Warden — принятый баланс

Пользователь принял текущее состояние и разрешил публикацию в main: «пойдёт, оставляем пока баланс в текущем состоянии, пушь в мейн».

| Настройка | Принятое значение |
|---|---|
| Постоянная скорость ходьбы | 256world units/s |
| Начало автоатаки | 50world units |
| Автоатаки | East/West B/A по очереди, South overhead, North B |
| Момент попадания basic | A434.783ms, остальные565.217ms |
| Basic damage / cooldown / radius | 32 /2.2s /115units |
| Charge cooldown по фазам1/2/3 | 8 /4 /8s от начала каста |
| Charge cast / travel / distance | 650ms /323.077ms /до300units |
| Наведение Charge | До последнего шага каста, затем фиксированная точка |
| Flame Strike | 600ms windup,150ms active,750ms recovery,64damage раз на fan |
| Flame фазы1/2/3 | 1луч /3луча45° /5лучей90° |
| Метеориты | Цель в текущих x/y героя при каждом выпуске; warning1.3s, шаг150ms |
| Обычный Meteor во второй фазе | 3последовательно;54damage максимум на группу |

Разворот Flame Strike влево после Charge зеркалит body/emission. Сохраняется исходный поворот корпуса в кадрах overhead. Walking-route guard может отменить небезопасный широкий каст; отмена другой атаки больше не сокращает Charge cooldown. Первичные фазовые задержки3s сохраняются.

Код, runtime atlases, исходники для воспроизводимой сборки и тестов публикуются вместе. Принятые Walk/Idle/исходные Melee/Cleave packs не перерисовываются. Новые source frames сохраняются из подготовленного пакета без изменения пикселей.

Проверено до приёмки:736unit/92файла,12E2E,typecheck/lint/build/git diff --check; настоящие Canvas1280×720/844×390. Подробности и ограничения: [PHASE_FLAME_FAN_TEST_V1.md](PHASE_FLAME_FAN_TEST_V1.md).

Перед публикацией проверена отдельная копия всех staged-файлов: оба build-script воспроизвели принятые атласы1MiB/2MiB, audit554art/data hashes прошёл до/после сборки,736unit/92файла с2workers,typecheck/lint/production build PASS. Обязательные исходники включены несмотря на ignore-правила art/docs; loose Aseprite diagnostics и корневая черновая спецификация исключены.

Воспроизводимая сборка новых атласов из включённых исходников:

```sh
node scripts/build-ash-warden-flame-strike.mjs
node scripts/build-ash-warden-melee-combo.mjs
```

Это фиксация принятого состояния. Deploy не запрашивался.
