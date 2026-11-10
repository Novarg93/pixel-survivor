# Guardian +50% и сегментированный электрический ультимейт, 2026-11-08

По запросу увеличена новая модель Guardian/Rootbound Totem и заменены
вторичные ветви ультимейта. Последующее уточнение пользователя выполнено
для основного и вторичных лучей: длинные связи собираются из нескольких
повторяющихся, изгибающихся сегментов с постоянной толщиной.

## Guardian

World scale изменён с 0.35 на 0.525: canvas 128×128 теперь отображается
как 67.2×67.2 world px вместо 44.8×44.8, то есть ровно +50% по двум осям.
Общий asset registry применяет размер к idle/cast, обычному Guardian,
тестовой дуэли, ритуальным support и затухающей death pose. Pivot 0.5/0.5
сохраняется. HP bar располагается выше текущей высоты модели с зазором 6 px.
Полоска остаётся шириной 44 px. Collision radius/HP/урон/тайминги/AI прежние.
Круговые overlays Guardian не возвращались. Исходные 4 PNG/GIF неизменны.

Файлы: `src/game/art/assetRegistry.ts`, `LootPresentation.ts`; текущие
guardian/registry/HD/browser проверки размеров обновлены на 67.2.

## Secondary chain и повторение сегментов

Новый clip `branch` использует `secondary-chain.gif/png/json` из
`art/main-hero-mage/abilities/ult-lightning/`. Все 16 кадров сохранены.
`ultimate-hand-lightning` остаётся основным лучом от руки. Sky и target impact
прежние. PNG/GIF совпали по alpha/цветам на всех кадрах; JSON даёт native
рамки/pivot/durations. Всего 10 источников, 74 кадра, atlas 1572×1716,
10 790 208 RGBA bytes, PNG 50 528 bytes. Atlas под 2048 по обеим осям.
Повторная сборка PNG/JSON/manifest побайтно одинакова; все sources unchanged.

`lightningBeamPath.ts` делит связь на короткую ломаную. Максимальная длина
сегмента 80 world px; базовый шаг 72 оставляет запас для изгиба до 6 px.
Последний сегмент подгоняется под конец связи. Сегменты повторяют один
native clip и поворачиваются вдоль своих участков, вместо растяжения одного
изображения на всю дистанцию. Source X=7 — начало, X=229 — конец основного
ствола; measurement проверен по source PNG, боковые искры не определяют конец.

Толщина постоянна при любом расстоянии: primary source Y scale 0.8,
branch 0.55. Меняется только число/длина коротких участков. Native source
сам анимирует внутреннюю линию. Изгибы дополнительно заданы детерминированно
по target id и не дрожат от времени/кадра/паузы; World RNG не используется.
Первый сегмент привязан к актуальной руке, далее точки стыкуются точно,
ветви следуют frozen chainStorm, каждый target сохраняет свой impact.

Бюджеты: до 32 сегментов одной связи, до 1024 лучевых сегментов на кадр;
image pool ≤1181 вместе с 156 target impacts и sky. При экстремальном
offscreen расстоянии визуальный путь ограничен 2304 world px, при общем
лимите лишние участки не рисуются; растянутого fallback нет. Это защита
рендеринга, не изменение боевого радиуса/урона. Нормальные связи укладываются
в лимиты; в максимальном тесте выделено 399/389 images на desktop/mobile.
Renderer использует World.elapsed, pause/expiry/restart/teardown прежние,
новых timers/listeners/emitters нет. Damage по-прежнему однократно в 0.52 s,
окно клипов 0.32 s, target cap 156. Reduced mode использует фиксированные
кадры primary/branch, сниженный alpha и те же неподвижные стыки.

Файлы: `build-lightning-ultimate.mjs`, lightningUltimateManifest/Pack,
`lightningBeamPath.ts`, `LightningUltimateArt.ts`; unit/native E2E уточнены
под сегменты и отдельные source frames. Никакие обычные lightning skills,
Fireball, герой или combat config в этом этапе не менялись.

## Валидация

- `npm.cmd run check`: typecheck/lint/build PASS, **856 unit / 105 файлов**.
- Целевые dev E2E: **23/23** (1.9 min): Guardian idle/cast/homing/reward,
  ритуальные support, дуэль из меню keyboard/touch/controller, HD integration,
  cinematic/pause/10 restarts/фон/reduced mode, 150+3+3 нагрузка.
- Дополнительный long ray E2E: **1/1**; основной луч разбит минимум на три
  участка, все ≤80 px, фиксированная толщина, разные углы, вторичный clip
  и 4 impacts. Повторный снимок убирает меню паузы, чтобы видны были стыки.
- Production E2E: **9/9** (41.5 s), текущая сборка без DEV harness.
- После нового browser test typecheck/lint дополнительно PASS.
- Source hashes, alpha/color audit 0 различий, rebuild byte-identical PASS.
- Геометрические unit: короткие/длинные/диагональные связи, точные joins/
  endpoints, детерминированный изгиб, постоянная толщина, нулевая/бесконечная
  длина, pathological range и общий rendering cap PASS.
- Нагрузка 150 regular + 3 boss + 3 Guardian: median 59.88 FPS и p95
  frame 16.8 ms на 1280/844; activation 2.0/2.1 ms. Clock [0,0,0].

Основные screenshots: `screenshots/guardian-scale-lightning-tiles-v1/`:
guardian-idle/cast/mobile, branch-chain/mobile, long-tiled-chain и JSON.
Настоящий Canvas просмотрен: desktop/mobile/portrait Guardian, короткая
паутина, длинный составной луч. HP bar выше увеличенной модели, сегменты
стыкуются, новые простые вторичные разряды отличаются от основного луча.
Остальные phase shots сохранены существующими E2E в rootbound-guardian-v1/
и lightning-ultimate-v1/. Ошибки native matrix 0. git diff --check PASS.

Исходники ultimate-hand-lightning снова доступны и совпадают с прежними
SHA; предыдущий blocker source hash test снят полным зелёным check.
Новых AI генераций, commit/push/deploy нет. Номерных done-маркеров нет;
следующий шаг — пользовательская оценка размера и нового поведения лучей.
