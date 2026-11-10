# Charge VFX V1 — интеграционный контракт

Пакет предназначен для ручной приёмки. Production runtime не подключён.
Принятый пользователем South Charge используется без изменения файлов.
Историческое поле rejected в его metadata не переписывается; актуальное решение
пользователя записано в metadata этого VFX-пакета и docs/DECISIONS.md.

|Событие|Эффект|Кадры|Длительность|
|---|---|---:|---:|
|chargeStart|charge-start-vfx|6|160ms|
|chargeStop|charge-stop-vfx|7|240ms|

Все PNG RGBA96×96. Source pixel scale совпадает с пикселями босса192×192.
Устанавливать scale0.6548310811, origin(0.5,0.5833333333), соответствующий
pivot(48,56). Не fit по bounds; sheets имеют фиксированную ячейку96×96,
без промежутков. Nearest filtering, без сглаживания. GIF — только preview,
PNG/sheets — интеграционный источник. GIF повторяется для просмотра, runtime
loop=false. Последний пустой кадр обеспечивает отсутствие остаточного отпечатка.

Spawn anchor = boss world root + (2.6193243244,-1.3096621622) world px,
то есть source offset(+4,-2). Снимок позиции делается в момент события:
эффект закрепляется в world, не становится дочерним спрайтом движущегося босса.
Старт остаётся на месте толчка, Stop — на месте торможения.

Предпочтительный порядок: ground → back debris → boss → front debris.
Ground размещать над terrain и под персонажами; back debris — непосредственно
перед boss в сортировке; front debris — сразу после boss. Если renderer использует
foot-depth, ориентиры depth boss−2/boss−1/boss+1, а не абсолютные global depth.
Учитывать локальный порядок соседних существ. Передние осколки маленькие,
перекрывают только область ног; не переводить весь combined слой поверх брони.
`combined/` предназначен для простого просмотра и варианта entirely-below-boss.
Не рисовать combined одновременно с отдельными слоями.

Один spawn на (attackInstanceId,eventName), тайминг каждого кадра брать из
metadata.durationsMs. Не выводить события из циклического GIF или FPS Walk.
При задержке кадра пересекать события один раз; очистка при animationcomplete,
прерывании атаки, despawn и shutdown сцены. Освобождать все3 слоя согласованно.
Эффекты не создают hitbox, damage, collision, stun или изменение скорости.
Camera shake не требуется и не включён в preview.

Эффекты ненаправленные, одинаковая земляная реакция подходит для будущих
четырёх combat directions без вращения спрайтов. Текущий preview показывает
только существующий South. Никакого нового directional boss art не создано.

В preview исходные события относительно Windup:650ms/1070ms. С учётом
Idle lead-in450ms это1100ms/1520ms на шкале viewer. World travel60px — только
демонстрация отдельного world anchor, не настройка скорости/дистанции gameplay.

Воспроизведение из корня:

```powershell
node art/generated/ash-warden-charge-vfx-v1/build.mjs
node art/generated/ash-warden-charge-vfx-v1/verify.mjs
npm.cmd run check
```

`protected-baseline.json` не перезаписывается при сборке. Проверка сравнивает
SHA256 принятых Charge/Directional B пакетов, src и public. Генерация полностью
локальная, детерминированная; external API calls0, расход$0.
