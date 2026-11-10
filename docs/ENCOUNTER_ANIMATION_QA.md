# Boss / Guardian animation pass — 2026-11-04

Работа в main от49e1765, без веток, commit, push или deploy. Финальная ручная
приёмка остаётся за пользователем. Номерные done-маркеры не создаются.

## Изменения

**Thorn Ram.** Более тяжёлая walk-анимация с переносом веса и движением рук.
Новая последовательность ближнего slam: подъём кулаков, удар, кольцо, трещины,
debris и короткое восстановление. Charge windup поднимает руки и наклоняет голову;
под стартовой точкой расходятся трещины. Charge использует низкую агрессивную
позу и короткую дорожку пыли. На реальном charge→recover возникает отдельный
impact с ударной волной и трещинами, руки опускаются после приземления.

Slam — оформление прежнего contact damage, без нового AOE-урона. Существующий
контактный урон продолжает работать в прежние моменты; косметический замах не
добавляет invulnerability или безопасное окно перед ним.

**Guardian.** Новые боковые солнечные пластины в прежнем кадре, движение halo
на idle, поднятие рук и свечение печати на cast, отдельный release, сохранённая
hit-реакция. Death сочетает разрушение корпуса, осколки и расширяющуюся волну.
Три цвета осколков подготавливают visual payoff под будущие speed/damage/CDR,
но не меняют награду: прежний артефакт выдаётся сразу, дополнительные бафы не выдаются.

**Sorcerer / Eclipse.** Более высокий подъём рук в windup, раскрытие/опускание
на release, руны и короткий release burst. Существующий teleport получает парные
departure/arrival-кольца. Фаза2 Eclipse и Enrage не меняются.

**Тайминги.** Добавлены только визуальные: slam .6s с impact на.3s, повтор жеста
через1.2s при близости; release Guardian .25s; VFX не дольше.6s. Existing animation
rates и боевые сроки сохранены. Границы показанных AOE-кругов не являются новой
геометрией попаданий и не окрашиваются как красные danger zones.

## Файлы

- `scripts/boss-art-source.mjs`, `scripts/guardian-art-source.mjs` — оригинальные рисунки поз.
- `public/assets/hd/bosses.png`, `bosses.json` —216 кадров вместо204, атлас2048×2016 вместо2048×1884.
- `public/assets/hd/guardian.png`, `guardian.json` —19 кадров вместо12, атлас502×466 вместо502×350.
- `src/game/art/bossPack.ts`, `guardianPack.ts` — новые clips/layout.
- `src/game/art/BossAnimation.ts`, `GuardianAnimation.ts` — наблюдение за позами/фазами.
- `src/game/art/EncounterFeedback.ts` — ограниченный observer и один переиспользуемый Graphics.
- `src/game/art/GameArt.ts` — подключение, диагностика, cleanup.
- `tests/unit/encounter-feedback.test.ts` — pause, однократный impact, read-only, cap24, despawn/death/restart, reward.
- `tests/unit/guardian-art.test.ts`, `encounter-director.test.ts` — актуальный atlas и awakening cast.
- `tests/e2e/encounter-animation.spec.ts` — настоящие attack phases и13 скриншотов.
- `tests/e2e/hd-elites.spec.ts` — проверка всех19 кадров Guardian.
- `docs/DECISIONS.md`, `docs/PROGRESS.md`, `docs/ART_STYLE_GUIDE.md`, этот отчёт — решения, актуальный art contract и фактический QA.

World, systems, config, balance, abilities, loot, buffs, storage, input, Vue UI,
package.json/lockfile не изменены. Геометрия игровых объектов, pivot и display size прежние.

## Проверки

- `npm run check` —exit0: typecheck, ESLint,494 unit tests в63файлах, production build.
- Целевой `npm run test:e2e -- tests/e2e/encounter-animation.spec.ts tests/e2e/hd-bosses.spec.ts tests/e2e/hd-elites.spec.ts --workers=2` —13/13,56.6s,exit0.
- `npm run test:e2e:production` —6/6,35.6s,exit0.
- Полный `npm run test:e2e -- --workers=2` —285/285,27.1min,exit0; failures/skipped/retries0.
- `git diff --check` —exit0. Все272src/tests SHA-256 совпали с manifest начала финального QA; новых/пропавших файлов нет.

Целевой набор проверяет каждый кадр атласов на hard alpha, прозрачный край и
уникальность поз; реальные walk/windup/attack/recover/hurt/death, обе карты,
1280×720 и390×844, stage2, три одновременные смерти с прежними наградами,
десять перезапусков, обеих героев и150мобов.

Один Graphics на сцену, не более24 коротких bursts; нет новых Clock, tween,
interval, listener. Две расширенные текстуры добавляют1 314 272B исходного RGBA
(около1.25MiB); количество texture keys не растёт. Фактический стресс150mixed+3boss+3Guardian с5skillsV дал
median FPS59.70 /59.48 и максимум среди наблюдений update1.70 /1.80ms
для1280×720 /390×844. Пять перезапусков каждого viewport дали одинаковые
ресурсы и listeners. Это измерение в Chromium на текущем компьютере под
автоматизированным QA, не обещание FPS на физических мобильных устройствах
и не контролируемое сравнение с предыдущей версией.

## Реальные Canvas-снимки

Все снимки ниже получены из настоящей Phaser-сцены. Тест задаёт начальные
fixtures и замораживает World на фактической фазе; изображения не перерисованы.
Финальные PNG осмотрены после изменения радиуса impact.

| Момент | Снимок |
| --- | --- |
| Thorn windup | [charge windup](../screenshots/encounter-animation/thorn-charge-windup.png) |
| Thorn arrival | [charge impact](../screenshots/encounter-animation/thorn-charge-impact.png) |
| Guardian cast | [cast](../screenshots/encounter-animation/guardian-cast.png) |
| Guardian death | [death](../screenshots/encounter-animation/guardian-death.png) |
| Sorcerer telegraph | [telegraph](../screenshots/encounter-animation/sorcerer-attack-telegraph.png) |
| Eclipse telegraph | [telegraph](../screenshots/encounter-animation/eclipse-attack-telegraph.png) |

В той же папке: melee windup/impact, charge travel, Guardian release/hit,
release обоих магических боссов. Короткие реальные записи:
[Thorn](../screenshots/encounter-animation/charger-animation.webm),
[Guardian](../screenshots/encounter-animation/guardian-animation.webm).

Логи/HTML/manifest — `docs/encounter-animation/`; полный HTML в `full-report/index.html`,
target и production в одноимённых report-каталогах. WebM7.08s/4.52s,1280×720,
проверены загрузкой и seek/decode в Chromium без ошибок.
Блокеров нет; работа остановлена для ручной приёмки.
PNG/WebM/docs остаются
локальными по действующему `.gitignore`. Физические телефон/геймпад не тестировались;
автоматизированная эмуляция управления входит в полный и production наборы.
