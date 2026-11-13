# 2026-11-13 — принятые ультимейты Warrior в игре

По поручению «давай интегрировать принятые варианты ультмейтов в игру» подключён полный набор из последней демки `art/generated/warrior-ultimates-animation-review-v1/viewer.html`: Banner A «Знамя авангарда», Earthbreaker A «Три ветви разлома», Spear of Ruin B «Таранное копьё».

Earthbreaker и Ruin уже имели боевую реализацию и body/VFX; их выбранные кадры и параметры сохранены. Banner получил показанный жест установки и циклическую анимацию вместо статичного флага. Все три ульты доступны через обычный выбор на уровне 30 после 5:00: первый заряд готов, Q/экранная кнопка, затем 10 успешных Dash для следующего заряда.

## Поведение Banner

- Замах 0,45 с; появление знамени и начало лечения совпадают с контактом. Движение удерживается до контакта, Dash и автоатаки — до конца жеста 0,81 с. Незавершённые Cleave/Throw и текущий Dash отменяются при активации.
- Установка на 38 игровых единиц вперёд по зафиксированному направлению, как в просмотре. Знамя и лечебная область закреплены в одной точке. После контакта сохраняются 15 с, радиус 140 и лечение 10% эффективного maxHP/с, без overheal и накопления лечения вне зоны.
- Пауза замораживает тело, флаг и лечение. Expiry, смерть и restart прекращают эффект. Renderer переиспользует прежние один Image и один Graphics; новых таймеров/объектов на каждый каст нет.

## Арт и история

`scripts/build-warrior-ultimates-v1.mjs` упаковывает 63 исходных RGBA-кадра шести клипов в один атлас 2048×1358, около 10,61 МиБ несжатых texels. Все пиксели сверены с оригиналами. Прежние 47 кадров не перерисованы. Banner сохраняет 9 кадров жеста по 90 мс и 7 кадров VFX по 75 мс; source VFX 3/4 исключены, как в принятом просмотре. В Ruin body сохраняется исключение source frame 6.

Front: S/SE/E напрямую, SW/W зеркало. N/NE: уже принятые north-block/stomp/throw от ячейки 4, NW зеркало, с прежним contact-retiming. Отдельных новых северных генераций нет. Источники, прежние пробы, исторические proofs и стандарт южного Whirlwind сохранены.

Приёмка и точные исходные tool/args/prompt/seed/job/reference добавлены в `PIXELLAB_ACCEPTED_GENERATIONS.json`, `PIXELLAB_PROMPT_JOURNAL.md`, `APPROVED_ANIMATION_POOL.json`, runtime manifest. Записаны только шесть выбранных jobs, включая Banner v3 и Ruin v2; отклонённые пробы не принимаются. Новых генераций нет. Программные границы/осколки/финальное кольцо отдельно обозначены без выдуманных AI-промптов.

## Файлы

Runtime: `WarBannerArt.ts`, `WarriorHeroAnimation.ts`, `warriorUltimatesPack.ts`, `warriorUltimatesManifest.json`, `config/ultimates.ts`, `UltimateSystem.ts`, `MobilitySystem.ts`, `tickAbilities.ts`, два файла атласа. Всего 10 изменённых из 459 runtime-файлов; остальные 449 побайтно сохранены. Baseline и точный поздний overlay: `docs/verification/warrior-ultimates-accepted-v1/`. Исторические проверки учитывают этот overlay и продолжают проверять оригинальные proofs.

Сборка/проверка/приёмка: `build-warrior-ultimates-v1.mjs`, `verify-warrior-ultimates-v1.mjs`, `warrior-ultimates-accepted-scope.mjs`, `record-warrior-ultimates-approval-v1.mjs`. Новые проверки: `tests/unit/warrior-ultimates-accepted.test.ts`, `tests/e2e/warrior-ultimates-accepted.spec.ts`; актуализированы прежние assertions тайминга Banner и исторических hashes.

## Валидация

- `npm.cmd run check` — PASS, 162 файла / 1168 unit tests, typecheck/lint/build, exit 0. Лог `.tmp/warrior-ultimates-accepted-check.log`. Предупреждение Vite о крупных chunks остаётся прежним.
- Целевые unit — 22/22 PASS. После финальной правки browser helper повторно прошли typecheck и ESLint этого файла; runtime после полного check не менялся.
- Общий DEV-регресс: 13 прежних сценариев прошли, два новых сначала завершились timeout из-за race тестового pause/Escape. Snapshot показывал paused overlay и disabled ultimate, до активации. Исправлен helper: обычный click, затем pause после подтверждённой активации. Во время первого прогона окончание параллельного production runner дополнительно вызвало Vite reload HTML-отчёта; итоговый повтор выполнен отдельно. Исходный лог `.tmp/warrior-ultimates-accepted-e2e.log` сохранён.
- Новый финальный DEV: 2/2 PASS за 43,0 с, `.tmp/warrior-ultimates-accepted-e2e-final.log`. Все 8 направлений Banner, настоящий выбор/экранная активация, отсутствие раннего лечения, анимация флага/пауза, возврат Idle, неподвижный якорь, expiry, restart/listeners и 390×844/844×390. Общий регресс выше проверил Q и 8 направлений Earthbreaker/Ruin, урон, мобильные кнопки, Banner healing, Shield Block, moving skills и Berserk. Это 13 успешных сценариев исходного прогона плюс отдельный успешный повтор двух новых, не непрерывный 15/15.
- Production: 13/13 PASS за 1,1 мин, exit 0, `.tmp/warrior-ultimates-accepted-production.log`. Оба героя/локации, локальные ассеты, pause/resize/controller, отсутствие DEV-harness. Прямые применения ульт проверены DEV на настоящем World/Canvas.
- `node scripts/verify-warrior-ultimates-v1.mjs` — PASS, 63 source↔atlas RGBA-identical; все 449 остальных runtime-файлов совпали с baseline. `git diff --check` — PASS.

10 новых PNG и JSON: `screenshots/warrior-ultimates-accepted-v1/`; восемь направлений и два размера экрана. Просмотрены южный/NW Banner и оба мобильных кадра. Повторные Earthbreaker/Ruin PNG находятся в `screenshots/warrior-ultimates-v1/`, просмотрены East Earthbreaker и North Ruin. JS errors в новых desktop-сценариях: 0.

Блокеров нет. Длинный баланс 15–20 минут, физический телефон и длительный VRAM soak не проверялись. Следующий шаг — пользовательский забег и корректировка по отзывам. Done-маркеры, commit/push/deploy не создавались.
