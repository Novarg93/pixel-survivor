# Pixel Survivor — итог HD Rework 02–08

Дата: 2026-11-01. Ветка: `feature/hd-art-rework-02-08`. База: `main@2a3bfde`.
Все семь пакетов **02–08 реализованы и проверены**. Работа остановлена для ручной художественной приёмки.

## Пакеты и локальные коммиты

| Пакет | Результат | Проверки в checkpoint | Коммит |
|---|---|---|---|
| 02 | Mage: 54 кадра; Fireball: 4; Grove HD; пять способностей мага | check: 123 unit; dev: 48 + walk 1; production: 4 | `12dfd70` |
| 03 | Пять Warrior FX, Slam observer, мягкие hit/death эффекты | check: 124 unit; dev: 50 + expanded 2; production: 4 | `93bd8ff` |
| 04 | Tank, Caster, Rusher, Splitter: 176 кадров; death pool 24 | check: 129 unit; dev: 57; production: 4 | `b1d604f` |
| 05 | Индивидуальные накладки элит; Guardian: 12 кадров | check: 131 unit; dev: 59; production: 4 | `6386d02` |
| 06 | Три босса, две стадии Eclipse, 204 кадра; hostile FX; death pool 3 | check: 136 unit; dev: 66; production: 4; targeted: 7 + camera 3 | `e49605f` |
| 07 | 39 кадров лута, пять разных артефактов, общие Canvas/HUD иконки | check: 139 unit; dev: 70; production: 4; targeted: 6 + expanded 4 | `37bdc2b` |
| 08 | Единый Vue UI, XP pickup FX, полная матрица scale 3, живой стресс | check: 141 unit; dev: 76; production: 4; финальный targeted: 6 | `cf3eb29` |

Входной план и разрешённые материалы сохранены коммитом `03ae07a`. Исключение B3.2 разрешено пользователем; неизвестных изменений при повторном аудите не было. `main` не изменялась. Push, merge и deploy не выполнялись. Соседние проекты не открывались.

Подробные отчёты: [02](PACK-02.md), [03](PACK-03.md), [04](PACK-04.md), [05](PACK-05.md), [06](PACK-06.md), [07](PACK-07.md), [08](PACK-08.md).

## Ассеты и воспроизводимые источники

Все новые рисунки оригинальные и **программные**. Они не выдаются за профессиональную ручную живопись. Коммерческие спрайты, новые зависимости, внешние шрифты и внешние ресурсы не использовались.

| Атлас | Размер PNG | Кадры | Редактируемый источник |
|---|---:|---:|---|
| core, утверждённый | 1024×364 | 37 | `hdCoreLayout.ts`, `import-hd-core.mjs`; PNG не изменён |
| runner, пакет 01 | 512×408 | 36 | `scripts/runner-art-source.mjs`; сохранён |
| mage | 1024×372 | 58 | `scripts/mage-art-source.mjs` |
| enemies | 1024×816 | 176 | `scripts/enemy-art-source.mjs` |
| guardian | 502×350 | 12 | `scripts/guardian-art-source.mjs` |
| bosses | 2048×1884 | 204 | `scripts/boss-art-source.mjs` |
| loot | 480×408 | 39 | `scripts/loot-art-source.mjs` |

Всего семь атласов, 562 кадра; из них 489 новых кадров в пакетах 02–08. PNG и JSON находятся в `public/assets/hd`. Сборка новых наборов:

```powershell
node --experimental-strip-types scripts/build-mage-art.mjs
node --experimental-strip-types scripts/build-enemy-art.mjs
node --experimental-strip-types scripts/build-guardian-art.mjs
node --experimental-strip-types scripts/build-boss-art.mjs
node --experimental-strip-types scripts/build-loot-art.mjs
```

Используется локальный Chromium из `.browsers`. Loot build также создаёт `src/game/art/generatedLootIcons.json`: 11 точных PNG-вырезок idle0 для HUD. Их совпадение с пикселями Canvas проверено в Chromium. Это малые иконки, а не второй Phaser-атлас.

Grove строится в `hdGrove.ts`, сохранённый Dark Forest — в `hdForest.ts`. Магия и обратная связь: `MageMagic.ts`, `WarriorMagic.ts`, `CombatFeedback.ts`. Накладки элит: `EliteAdornment.ts`. UI: `src/ui/hd-theme.css` и существующие Vue-компоненты. Старые генераторы 16px сохранены как reference, но больше не вызываются и не загружаются в production. Runtime запрашивает ровно 14 PNG/JSON-ресурсов семи атласов.

## Сохранённая игровая логика

`World`, `EnemySystem`, `BossSystem`, `EclipseBoss`, конфигурация, сущности, способности, лут и радар не изменены относительно `2a3bfde`. Проверена команда:

```powershell
git diff 2a3bfde --exit-code -- src/game/systems/World.ts src/game/systems/EnemySystem.ts src/game/systems/BossSystem.ts src/game/systems/EclipseBoss.ts src/game/config src/game/entities src/game/abilities src/game/loot src/game/radar
```

Phaser по-прежнему управляет игрой и временем; Vue получает ограниченные snapshots. Новых runtime-интервалов или отдельных RAF-циклов нет. Art читает состояния и не начисляет награды. Смерть, score, XP, сундук, артефакт и очистка эффектов владельца происходят немедленно; визуальная смерть проигрывается отдельно.

Сохранены размеры и pivot: герой 24×30, origin (.5,.75); обычный враг 16², элита 22.4², tank 25.6², Guardian 33.6×39.2, босс 57.6²; лут 16², артефакт 18.4², сундук 20², XP 6². Тень босса смещена к нарисованным стопам на y+23; сущность и hitbox не перемещены. Лимиты 150 regular, 3 boss, 1 Guardian, 96 projectiles, 240 XP, 96 effects и лимиты лута 6/4/3 сохранены.

## Проверки и PNG

Финальная реализация прошла:

- TypeScript, ESLint, **141 unit-тест в 30 файлах**, Vite build.
- **76/76 dev E2E**, 7,6 минуты, включая исходную 60-секундную пиковую волну.
- **4/4 production E2E**, 32,8 секунды: оба героя и биома, без test hook, внешних ресурсов и ошибок.
- После усиления travel-проверки и добавления нижних снимков Game Over — **6/6 targeted E2E**, около 1,5 минуты; повторные TypeScript и lint успешны.
- `git diff --check` чистый. Проверки не отключались и не ослаблялись ради успеха.

Матрица 08: Mage/Warrior × Grove/Dark Forest × 1280×720/390×844, pixelScale 3 через настоящие настройки. Проверены 150 врагов с элитами, Guardian, три босса, лут, пять артефактов, бафы и все десять способностей. Реальные Canvas PNG всех восьми сочетаний лично просмотрены, как и меню, настройки, пауза, три карточки, Game Over сверху и снизу, статистика и рекорды.

Проверены focus, Tab/Shift+Tab, 1/2/3, Escape, blur, пауза времени, рестарты, сохранение рекордов и эмуляция касаний. Native CDP touch drag действительно двигает героя; taps работают в настройках, паузе и карточках. Эмуляция не является проверкой телефона. Нет горизонтального overflow; интерфейс не пересекает проверяемую центральную область героя.

Исправления по результатам QA включают дубли кадров ходьбы, обрезание Mage death, мобильные ракурсы боссов, перекрытие уведомлений и бафов, импорт JSON в Vite и декоративный символ в accessible-имени кнопки. Travel fixture дополнен проверками фактических 150 врагов, 151 спрайта и 151 тени: стартовый лимит 35 больше не может дать ложный успех этой проверке.

| Свидетельство | Ссылка |
|---|---|
| Все финальные PNG и raw JSON | [pack-08](../../screenshots/hd-rework/pack-08) |
| Mage, Grove и магия | [pack-02](../../screenshots/hd-rework/pack-02) |
| Warrior FX | [pack-03](../../screenshots/hd-rework/pack-03) |
| Четыре вида врагов | [pack-04](../../screenshots/hd-rework/pack-04) |
| Элиты и Guardian | [pack-05](../../screenshots/hd-rework/pack-05) |
| Три босса и двойной залп | [pack-06](../../screenshots/hd-rework/pack-06) |
| Лут и пять артефактов | [pack-07](../../screenshots/hd-rework/pack-07) |
| Меню 390 | [PNG](../../screenshots/hd-rework/pack-08/after-Mage-grove-390-menu.png) |
| Карточки 390 | [PNG](../../screenshots/hd-rework/pack-08/after-Warrior-grove-390-upgrade.png) |
| Живая пиковая сцена 390 | [PNG](../../screenshots/hd-rework/pack-08/live-Warrior-forest-390.png) |
| Полная статистика и кнопки Game Over | [PNG](../../screenshots/hd-rework/pack-08/after-Mage-forest-390-death-bottom.png) |

Исторические `screenshots/hd-pixel-art` и `runner-pack-01` восстановлены после перегенерации тестами. Свидетельства каждого пакета сохранены отдельно; последующие регрессии их не перетирают.

## Производительность и ресурсы

Hardware: Ryzen 5 7500F, 31,6 GiB RAM, RTX 4060 / ANGLE D3D11, Chromium 156, DPR 1. Внутри каждого пакета до/после используется одинаковый сценарий с seed 12345. Между пакетами состав нагрузки расширялся — это не одна эквивалентная CPU-серия. Протокол и уточнённые исторические измерения 02–04: [BENCHMARK.md](BENCHMARK.md).

| Пакет | p95 Scene.update desktop, мс | p95 mobile viewport, мс | Рост RGBA источников |
|---|---:|---:|---:|
| 02 | 0,7→0,8 | 0,8→0,7 | +10947840 B desktop / +6229248 B mobile |
| 03 | 0,8→0,8 | 0,7→0,7 | 0 |
| 04 | 0,8→1,0 | 0,7→0,8 | +3334144 B |
| 05 | 0,8→0,8 | 0,8→0,8 | +700112 B |
| 06 | 0,9→1,0 | 1,0→0,9 | +15408896 B |
| 07 | 1,0→1,1 | 1,1→1,1 | +777072 B |
| 08 | 1,1→1,1 | 1,0→1,1 | 0 |

Во всех синтетических сериях около 60 FPS, p95 frame 16,7–16,8 мс. В пакете 08 до/после не изменились источники RGBA, keys и GameObjects: desktop — 36695376 B / 55 / 430, mobile viewport — 30403920 B / 31 / 406. Семь атласов декодируются в 24112464 B, примерно 23 MiB; остальное — ограниченные чанки. HUD crops дают до 166144 B отдельно от Phaser-суммы.

Это **оценка источников RGBA, не измеренная VRAM**: драйвер, framebuffer, render buffers, DOM textures и CPU heap в неё не включены.

Отдельный живой стресс использует пять rank-3 автоатак, настоящий AI и движение WASD; тест дополняет 150 врагов после убийств. Восемь сочетаний при pixelScale 3, прогрев 0,5 с и 6 с RAF. Неуязвимость и refill явно относятся к нагрузочному fixture, а не к нормальному прохождению. Финальный [live-stress.json](../../screenshots/hd-rework/pack-08/live-stress.json): **59,5–60 FPS**, p95 Scene.update **1,4–1,9 мс**, пиковые GameObjects **517–557**.

Десять scene restart с 150 tank и перемещениями ±50000→0 подтвердили постоянные 151 спрайт, 151 тень, 330 GameObjects, 24 чанка, 30403920 B источников, Clock 0/0/0, tweens 0, один Canvas и стабильные listeners. Пулы очищены. Проверки смерти и подбора отдельно подтверждают ограничения пулов.

## Что осталось и ограничения

- В registry ровно две записи `legacy`: **guardianTell** — точная runtime-полоса HP и золотая печать; **bossTell** — точные пути, кольца, радиусы, метки модификаторов и указатели вне экрана. Причины записаны в `retainedReason`. Важных legacy PNG, акторов, предметов или UI-заглушек из охвата 02–08 нет.
- В утверждённом core у Warrior и Grunt нет отдельного death clip. Их смерть использует общий ограниченный FX; новые кадры им не приписываются. Этот ранее утверждённый набор не перерисовывался.
- При 150 врагах исходные телеграфы, elite/freeze-рамки и толпа перекрывают друг друга и героя. Их не скрывали ради снимка. Проверка свободной центральной области относится к UI и не обещает отсутствие перекрытий каждого объекта карты угловыми панелями.
- Реальный Android, high DPR и длительный VRAM/heap soak не проверены. Viewport и touch-эмуляция не равны мобильному железу; 60 FPS при 60 Hz не доказывают равную GPU-стоимость.
- Vite сохраняет предупреждение о крупном Phaser chunk, около 1,39 MB. Сборка успешна; предупреждение не подавлялось.
- Финальная художественная оценка требует личного просмотра и живого забега пользователя.

## Ручной запуск

Из текущей папки ветки `feature/hd-art-rework-02-08`:

```powershell
npm.cmd run check
$env:PIXEL_HD_PACK='08'
$env:PIXEL_E2E_PORT='5191'
npm.cmd run test:e2e
$env:PIXEL_E2E_PORT='5192'
npm.cmd run test:e2e:production
npm.cmd run dev -- --port 5190 --strictPort
```

Игра: http://127.0.0.1:5190 . Для обычного запуска `?test=1` не нужен.
Провести по забегу обоими классами на обеих картах, посмотреть масштабы 2×/3×, десять способностей, элиты, Guardian, три босса, пять артефактов, карточки 1/2/3, паузу и полную статистику. Для аппаратной оценки отдельно нужен настоящий телефон.

Автономная реализация завершена. Push, merge и deploy не выполняются; следующий этап — художественная приёмка пользователем.
