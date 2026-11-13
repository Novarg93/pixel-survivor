# Ash Warden — автоатаки A/B и South overhead

В текущем `main` выполнена новая схема автоатак и сохранено предыдущее ускорение второй половины Flame Strike.

| Направление | Basic melee body | Эффект |
|---|---|---|
| East | B → A → B → A… | Новый направленный RD slash |
| West | Зеркальные B/A, общий боковой счётчик | Полное горизонтальное зеркало RD slash |
| South | Overhead из Flame Strike | Мягкая подсветка/контакт, без огненных секций и без бокового slash |
| North | Принятый back-facing B | Мягкая подсветка; фронтальная модель не подставляется |

Счётчик меняется только после разрешённого старта боковой автоатаки и фиксируется на время всего удара. South/North и отменённые небезопасные попытки не расходуют чередование. В новом забеге первый боковой удар снова B. Дополнительный RNG не используется.

## Механика и тайминг

Все basic attacks сохраняют **32damage, попадание650ms, длительность1200ms, cooldown2.2s, сектор115world units/100°**, один контакт за атаку. В `FinalEncounter` добавлены только счётчик и latched presentation variant. Проверки урона и выбор момента попадания не переписаны.

В A используются12оригинальных поз192×192 из `ash-warden-melee-swing-experiment-01/A/frames/`, без перерисовки и bbox fitting, pivot(96,154), scale0.6548310811. Runtime durations: `110,110,130,150,150,80,80,90,80,80,70,70`: пятая поза (zero-based) приходится на650ms. Сохранён исходный разворот корпуса A, отличающийся от B. Для Phase3 подготовлены emission masks по существующему правилу; body/mask используют один кадр и зеркалируются вместе.

South использует существующие overhead pixels. Подготовка меча отображается в650ms обычной автоатаки, затем ускоренное завершение занимает450ms. Последняя поза удерживается оставшиеся100ms. Ни `swordActive`, ни fire instances для South basic не создаются: выбор идёт по типу атаки, а не только имени визуального клипа.

Специальный Flame Strike сохраняет **64damage, полосу280×44, замах900ms, окно150ms** и C fire chain. Ускорение его body остаётся: кадры0–5 по150ms,6–11 по75ms (900ms замаха +450ms завершения), без ускорения AI recovery. Подробности и отдельный trace: `FLAME_STRIKE_TIMING.md`.

## RetroDiffusion slash

Проверены MCP health, баланс, style usage/разрешение, стоимость и недавние jobs. Один async job `3ad17111-e4bc-439e-a604-edc186e8111c`, seed6110791, preset `rd_animation__vfx`,96×96, remove_bg=true. Расход **$0.07**, баланс **$7.49→$7.42**, повторных платных вызовов0. West получен локальным зеркалированием.

Raw GIF содержит16кадров по200ms с прозрачностью, без edge clipping. Модель выдала кольцевой вращающийся след вместо чистого одноразового crescent. Raw сохранён. Для игры оставлены исходные тёплые pixels в переднем120°секторе, добавлены угловой pixel-dither taper и temporal envelope с пустыми началом/концом. RGB оставленных пикселей не меняются. Это явно отделённая подготовка; исходный RD результат не выдаётся за точное выполнение prompt.

Runtime slash занимает320ms, пик подготовленного кадра8 совмещён с650ms попадания, West зеркалит x=95−x. Эффект привязан к атаке и не наносит отдельный урон. Базовая геометрическая линия дуги удалена. Вместо неё — слабая оранжевая floor illumination с мягкими радиальными/угловыми краями; essential cue остаётся при zero decorative FX.

## Ресурсы и проверки

Новый отдельный atlas512×1024 занимает **2MiB RGBA**, не меняя прежний16MiB Warden atlas. Вместе с ранее добавленным1MiB Flame Strike это19MiB для трёх наборов; diagnostics показывают сумму. Новый VFX renderer имеет ровно2картинки, без таймеров/твинoв/неограниченного спавна. Pause/freeze удерживают body/slash, смерть и смена сцены скрывают/уничтожают их.

- Typecheck, lint и production build PASS. **690/690 unit tests в87файлах** с `--maxWorkers=2`. Предел времени тестов не менялся; ограничение workers применено после двух известных5s timeout старого survival-enrage при обычной параллельности на этапе предыдущей правки.
- Новые8unit cases: реальное B/A чередование/отмена/lock/reset, source hashes, зеркальные A/body/emission, South overhead без C fire/slash, один32damage contact650ms, freeze/pause/expiry.
- Новый браузерный набор **2/2 PASS** (1280×720,844×390), отдельно регрессионный набор **9/9 PASS** (полный бой, ускоренный overhead, C Flame Strike, HD ресурсы/restart). Это два успешных прогона, всего11проверок.
- Проверено фактическое начало автоатак через World: B/A последовательность с вмешанными South/North, body/эффекты в кадре попадания, mirror, A Phase3 glow, zero FX, freeze/pause, death cleanup, два эквивалентных menu restart с одинаковыми object/texture counts и подписками1/1/1. JS/texture errors0.
- Реальный Canvas сохранён и просмотрен: `art/generated/ash-warden-melee-combo-v1/screenshots/`. На mobile близкий South-босс частично перекрывается прежним HUD; source canvas и размеры камеры не изменялись.
- Asset verifier PASS:12точных A body,12masks,16направленных/зеркальных slash кадров,53source hashes,779защищённых файлов; raw transparency и края подтверждены, prepared first/last полностью пусты. Все исходные accepted packs сохранены.
- При разработке E2E уточнено ожидание clip+frame для асинхронного рендера и заменено некорректное сравнение разных arena/menu object totals на два одинаковых menu restart. Проверки не отключались.
- `git diff --check` PASS. Новый production build доступен через локальный preview5200; отдельный public smoke записан рядом с артефактами.

Сборщик: `scripts/build-ash-warden-melee-combo.mjs`. Исходники, raw/подготовка, параметры, jobs, expenses, validation и инструкции: `art/generated/ash-warden-melee-combo-v1/`. Новых веток, commit/push/deploy нет.
