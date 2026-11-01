# Gameplay Pacing / Guardian / Mobility — готово к ручной проверке

Работа по новому прямому запросу в `feature/gameplay-pacing-guardian-mobility`
от актуального main@0c1a50e; первоначальное рабочее дерево чистое. Main/push/deploy
не затрагиваются. Реализованы:

- `config/pacing.ts`, DifficultyDirector/BossSystem/EnemySystem: поминутные волны,
  боссы3/6/9, накопительная скорость5% с общим/быстрыми/абсолютными caps, cap150.
- `GuardianEncounter.ts`, RareGuardianSystem/World: пассивный Guardian до удара,
  неподвижный луч/три метеора/паузы, разведение встреч и owner cleanup.
- `MobilitySystem.ts`, GameScene/bridge/MobilityControl: Dash/Blink, Space без
  repeat, настоящий multitouch с удержанием джойстика, защита, HUD cooldown.
- `abilityVisual.ts`, MageMagic/WarriorMagic/GameArt: все10 навыков rankI/V,
  ограниченные декоративные параметры и существующие Graphics batches.
- Новые unit/E2E сценарии и seed12345 replay600 s. Старые accessibility-тесты
  Mage/Warrior сохранены. Пик в replay71; bosses180/360/540; Guardian overlaps0.

Baseline: check141unit, dev76/76, production4/4. Финальный check:186unit/36files,
TS/lint/build успешно. Полный dev E2E94/94 (9.9min), production4/4 (26.7s).
После точечной правки ориентации стрелки луча Guardian6/6 повторены успешно;
геометрический unit проверяет4 квадранта. Keyboard/touch mobility также прошли.
Реальные PNG в screenshots/gameplay/ получены Playwright, парыI/V и опасные
области лично просмотрены. Скриншоты локальны/ignored. Найденные по Canvas
перекрытие notice/mobility и дублированная HP-полоса исправлены.

Отчёт, таблица темпа и сырые данные: [REPORT.md](gameplay/REPORT.md).
Блокеров нет. При150 высоко-HP врагах/Guardian/rankV на этой машине измерены
59.4–59.7 median FPS, .8–1.1ms p95 update. Физические Android/iOS, highDPR и
длительный heap/VRAM soak не проверены. Автоматический replay использует
неуязвимость и не доказывает выживаемость обычного игрока10 минут.
Следующий шаг: ручная оценка баланса пользователем. Реализация остановлена;
push, merge в main и deploy не выполнялись. Номерные done-маркеры не создавались.

# Main и локальные скриншоты — 2026-11-01

Пользователь запросил исключить screenshots из индекса и отправить весь итоговый
HD-пакет в main. Для публикации подготовлен единый снимок поверх origin/main
2a3bfde: весь код, ассеты, тесты и отчёты пакетов 02–08. Промежуточная feature-история
с новыми скриншотами сохраняется локально и не входит в родителей main-коммита.

- `.gitignore`: добавлено `/screenshots/`; из индекса исключены 1059 файлов.
  Все 1059 PNG/JSON сохранены на диске, совпадение SHA256 с исходными файлами проверено.
- `docs/DECISIONS.md`: записаны разрешение на push, способ переноса и дальнейшая
  работа в main. Старые ссылки на screenshots указывают на локальные свидетельства.
- `npm.cmd run check`: TypeScript, ESLint, **141 unit / 30 файлов**, build — успешно.
- `PIXEL_E2E_PORT=4187 npm.cmd run test:e2e:production`: **4/4**, 28.7 s;
  Mage/Warrior, обе карты, старт/атаки/пауза, desktop/mobile, без внешних ресурсов.
  Свежие браузерные PNG: `docs/screenshots/19-production-*.png`, локально.
- Проверены отсутствие screenshots в индексе, правило ignore и diff без ошибок
  пробелов. Блокеров проверок нет. Push выполняется обычным обновлением main,
  без force push и без изменения файлов соседних worktree.

Следующий этап — художественная приёмка; новые feature-ветки автоматически не создавать.
Ниже сохранена история до переноса в main.

# HD-переработка 02–08 — все семь пакетов проверены

Пакет08 завершён: единый Vue UI, XP pickup FX, полный registry audit.
TypeScript/lint/build, **141 unit / 30 файлов, 76 dev E2E, 4 production E2E**
прошли. Усиленные travel и UI проверки: ещё6/6, затем TS/lint/diff успешны.
Реальные Canvas и UI PNG лично просмотрены; матрица обоих героев и карт,
двух viewport и реального Settings scale3 пройдена. Живой стресс с автоатаками
и десять рестартов/перемещений не показали роста проверяемых ресурсов.
Все пакеты02–08 verified, локальные коммиты в feature/hd-art-rework-02-08.
Main, gameplay/balance/AI/loot/radar не менялись; push/merge/deploy нет.
Следующий шаг — **художественная приёмка**, автономная реализация остановлена.
Полный отчёт: [FINAL_REPORT.md](hd-rework/FINAL_REPORT.md).
Android/highDPR/длительный VRAM/heap soak не проверены; ограничения указаны в отчёте.

---

## История выполнения02–07

2026-11-01, текущая папка `PixelSurvivor`, `main@2a3bfde`.
Пользователь разрешил входные материалы, блокер B3.2 снят. Создана
`feature/hd-art-rework-02-08` от main2a3bfde, checkpoint03ae07a.
Пакет02: оригинальный Mage54frames+fireball4, Grove2×, пять Mage FX;
World/abilities/config/entities/loot/radar не изменены. check123unit/25files,
dev48/48+дополнительный walk/hurt1/1, production4/4, diff check успешны.
Canvas PNG лично просмотрены, сравнение150mixed и10рестартов сохранено.
Пакет03: WarriorMagic, типизированный Slam observer, мягкий hit tint и
bounded death shards. check124unit/26files, dev50/50+расширенный crowd2/2,
production4/4; Canvas150crowd обеих карт просмотрен, ресурсы без роста.
Пакет04: Tank/Caster/Rusher/Splitter176frames64×64, отдельный bounded observer,
immediate rewards и реальные2детей Splitter. check129unit/27files,
dev57/57, production4/4, mixed150death/10restarts, PNG просмотрены.
Benchmark02–04 уточнён с seed12345 на исторических срезах внутри .tmp;
протокол hd-rework/BENCHMARK.md. Пакет02 сохранён12dfd70,03 —93bd8ff;
Пакет05: индивидуальные HD накладки элит, Guardian12frames96×112,
mobile notice. check131unit/28files, dev59/59, production4/4; PNG просмотрены,
immediate artifact/pickup/cleanup подтверждены. Пакет06:3босса204frames128²,
Eclipse2стадии,hostile4frames,deathpool3. Check136unit/29files,dev66/66,
production4/4,targeted7/7+уточнённыеракурсы3/3; PNG лично просмотрены,
immediate3chests/owner cleanup/10restarts подтверждены. Пакет07:39lootframes,
пять разныхartifact иexactHUDcrops,open/pickuppool24,согласованнаяHUDrail.
Check139unit/30files,dev70/70,production4/4,targeted6+expanded4 успешны;
CanvasPNG лично просмотрены,13simultaneouspickups/10restarts пройдены.
Следующий пакет08
выполняется автоматически. Полное состояние:
[BLOCKERS.md](hd-rework/BLOCKERS.md), [PROGRESS.md](hd-rework/PROGRESS.md).

---

# Прогресс — Runner Art Pack 01

2026-11-01. Текущий пакет реализован на feature/hd-pixel-art поверх b2cd57c.

- Оригинальный Runner 64×64: idle3/walk6/hurt3/death6 на двух сторонах,
  36 кадров в public/assets/hd/runner.png + runner.json; редактируемый источник в scripts.
- runnerPack.ts задаёт точные clips/rates/layout; assetRegistry.ts фиксирует HD,
  16×16, elite1.4 и отключает старые runner/runner-walk.
- RunnerAnimation.ts наблюдает движение/hitUntil/реальное удаление hp=0,
  ограничивает corpse pool24, не меняет World/AI/combat/balance/loot.
- GameArt.ts и две точки GameScene подключают наблюдение, показ/очистку тела.
- Pixel QA всех36 кадров прошёл; новая геометрия не обрезается, alpha0/255,
  фиксированный pivot0.5/0.5. Ранние обрезанные death-позы исправлены в исходнике.
- npm.cmd run check: TypeScript/lint/build и **121 unit / 24 файла** — успешно.
- npm.cmd run test:e2e: **45/45**, около 3.3 min.
- npm.cmd run test:e2e:production: **4/4**, 29.4 s.
- Проверены реальные walk/hurt/death, все6 death-фаз в живой сцене; XP/loot/kill
  доступны до создания визуального тела. Проверены pause, despawn и смена runId.
- 150 обычных Runner до/после: около60 FPS, p95 кадра ~16.8ms;
  источники текстур +833536B, TextureManager −1 texture, GameObjects без роста
  в живой нагрузке. Десять рестартов и отдельно десять burst150/pool24 прошли.
- PNG смешанных сцен Forest/Grove на1280×720 и390×844, hurt/death, до/после150,
  JSON производительности и анимаций: screenshots/runner-pack-01/.
- Старые свидетельства HD-интеграции сохранены, другие виды/карты не перерисованы.
- Пользователь дополнительно запросил локальные commit/merge в main по указанному
  пути. Состояние целевого main проверено: чистый, 23e832a, HD уже интегрирован.

Техническая часть завершена. Git-сохранение и слияние выполняются по уточнению
пользователя; точные хэши и состояние удалённой ветки сообщаются в финальном ответе.
Затем остановиться для художественной приёмки Runner; Tank/Caster/Mage автоматически не начинать.
Детали и ограничения — RUNNER_ART_PACK_01.md. Ни одного номерного done-маркера:
это художественный пакет01, не task01 из отсутствующего каталога tasks.

---

# История — HD Pixel Art Integration

2026-11-01, `feature/hd-pixel-art`, база `main@accf6d5`.
Работа продолжается в изолированном `PixelSurvivorVisual`.

## Git и сохранение

Проверены main, origin/main, удалённый main, история, diff и незакоммиченные файлы.
Все main refs соответствовали `accf6d5`; новых коммитов/расхождений не было.
Незакоммиченный A/B/C-эксперимент сохранён локальным checkpoint `01aa758` в
`experiment/visual-styles`. Затем создана новая feature от main без merge/cherry-pick
всего эксперимента. Соседние файлы main worktree не открывались и не менялись.
Main/push/deploy не затрагивались. Подробности — `docs/DECISIONS.md`.

## Реализовано

- `public/assets/hd/core.png`, `core.json`: только выбранный B, 37 кадров,
  побайтная сохранность исходного PNG проверяется SHA256 и unit-тестом.
- `assetRegistry.ts`: единый каталог акторов, предметов, эффектов, окружения,
  бафов и UI; статусы HD/legacy, источники, рамки, pivot, масштабы и clips.
- `hdCoreLayout.ts`, `scripts/import-hd-core.mjs`: проверенная раскладка и
  воспроизводимое извлечение выбранного PNG из сохранённого эксперимента.
- `GameArt.ts`: preload одного атласа, выбор/применение размеров и кадров,
  тени и Cleave с повторным использованием объектов; диагностика в dev/test hook.
- `hdForest.ts`: выделен только генератор B; исходные координаты biomeTile сохранены.
- `GameScene.ts`, `WorldChunkSystem.ts`, `CombatFeedback.ts`, `textures.ts`:
  узкая интеграция отображения и очистки; заменённые старые текстуры не создаются.
- HD по умолчанию в dev/production. App.vue, bridge, UI и профиль не расширялись.
  A/C, их runtime-атласы/генераторы, трёхстилевой переключатель не перенесены.
- `playwright.config.ts`, `scripts/e2e.mjs`: опциональный отдельный порт тестов.
- Новые unit/E2E по контракту ассетов, анимациям, коллизиям, состоянию, ресурсам,
  реальной сцене с Guardian/лутом/радаром и сравнимому benchmark.
- `ART_STYLE_GUIDE.md`: направление, палитры, размерность, свет, анимации,
  тени, редкости, боссы, магия, предметы, бюджеты, desktop/mobile.
- `ART_ROADMAP.md`: девять отдельных следующих пакетов с условиями приёмки.
- `HD_INTEGRATION_REPORT.md`: аудит, тесты, сравнение производительности,
  скриншоты и известные ограничения. README-RU содержит ссылки/запуск.

## Проверки

- TypeScript, ESLint, build и **117 unit / 23 файла** — успешно.
- Новый целевой browser-прогон: **4/4**.
- Весь dev E2E: **41/41**, около 2.9 минуты, включая исходную 60-секундную пиковую волну.
- Production: **4/4**, 27.4 секунды; обе пары персонажей и биомов,
  нет test hook/переключателя, только core PNG+JSON, нет внешних ресурсов.
- Проверены настоящий contact damage на границе радиуса и настоящий Cleave.
- Лут, бафы, артефакты, Rare Guardian, миникарта, её 5 Hz, bosses и рестарты
  прошли существующие E2E после интеграции.
- На повторных загрузках и перемещениях до ±50000: один canvas, стабильные
  текстуры/чанки/объекты/подписки, Clock 0/0/0, core не запрашивается заново.
- Baseline исходного main и HD одним harness: 150 grunts (2 элитных), Guardian,
  расходник, сундук, Cleave. Около 60 FPS на обоих viewport; p95 update ~0.8→0.9 ms.
- 8 настоящих PNG и 3 JSON в `screenshots/hd-pixel-art/`; PNG просмотрены.
- `git diff main` пуст для механик, баланса, entities, способностей, лута,
  радара, UI и bridge. Dependencies/lockfile не менялись.

## Ограничения и следующий шаг

Технических блокеров нет. Сохранены реальные ограничения: при стоящем герое
150 мобов скапливаются и перекрывают его; mobile-уведомление Guardian может
перекрывать часть головы; отдельные death-клипы и полировка B ещё впереди.
Тесты телефона/high DPR/pixelScale 3 и длительный VRAM soak не проводились.
Пока интегрирован ограниченный готовый набор, прочие записи честно legacy.

Следующий шаг — проверка и принятие интеграции пользователем. Только после
отдельного задания начинать первый пакет ART_ROADMAP (рекомендуется runner).
Полная перерисовка автоматически не начинается. Номерные done-маркеры не создавались:
каталог tasks отсутствует, задача задаётся текущим запросом пользователя.
