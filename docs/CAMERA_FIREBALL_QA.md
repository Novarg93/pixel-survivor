# Mobile camera / Fireball cleanup — готово к ручной приёмке

После отдельного запроса «пуш в мейн» опубликован commit
`49e17657dd3ba370c16d820c2e90563d07ca9d24`,5файлов. Origin/main SHA подтверждён
независимым ls-remote; HEAD совпадает с origin/main, дерево чистое.
Все269QA hashes сохранены. Deploy не выполнялся. Ниже — отчёт до публикации.

Работа в main отdbd04f9, без веток/commit/push/deploy.

## Изменения

- GameScene.ts: touch landscape currentZoom/1.3. При обычных настройках
  zoom1.66→1.2769230769; при3× zoom2.49→1.9153846154. Desktop и portrait прежние.
  World.width/height не изменены. Видимое поле расширено по каждой оси на30%.
- MageMagic.ts: удалена единственная строка двух боковых lineBetween у Fireball
  начиная сIIIранга. Обычная текстура, хвост, кольцоVранга и эволюция сохранены.
- tests/unit/fireball-cleanup.test.ts: отсутствие линий, сохранение хвоста/кольца,
  damage/speed/count/pierce и неизменность World после рендера.
- tests/e2e/camera-fireball-cleanup.spec.ts: реальные camera zoom, logical viewport,
  покрытие чанками при перемещении, NEAREST/pixelArt/roundPixels;844×390/1024×768,
  2×/3×, portrait/landscape и desktop1280×720. Реальные FireballI/III/V/evolved.

Только две существующие строки игрового src затронуты: выражение zoom и удаление
декоративных линий. Fireball ability, damage, speed, count, piercing, hitbox,
спавн, AI, баланс и остальные способности не изменялись. Новых listeners/таймеров нет.

## Проверки

- Финальный `npm.cmd run check`:491/491 в62файлах, typecheck/lint/build exit0.
- Финальный target: `npm.cmd run test:e2e -- camera-fireball-cleanup.spec.ts mobile-landscape.spec.ts mobility-hud.spec.ts`:
  27/27 за54.6s,exit0. Первый целевой14/14 также прошёл.
- `npm.cmd run test:e2e:production`:6/6 за28.8s,exit0.
- `npm.cmd run test:e2e -- --workers=2`:281/281 за27.7min,exit0;
  failures/skipped/retries0.
- `git diff --check`:exit0. Все269src/tests совпали с source-hashes.json после
  полного прогона; final-verification.json содержит changed[].

Логи, source-hashes.json и final-verification.json: docs/camera-fireball-cleanup/.
HTML: [полный281](camera-fireball-cleanup/playwright-full/index.html),
[целевой27](camera-fireball-cleanup/playwright-target/index.html),
[production6](camera-fireball-cleanup/playwright-production/index.html).
Проверенный код не менялся между финальными check/target/production/full.

Ранние ошибки типов в новом browser fixture исправлены: cleanup через публичный
clearTemporaryState, опциональный массив Projectile.hits. Типы не подавлялись.

## Скриншоты

Все13PNG из screenshots/camera-fireball-cleanup/ повторно открыты и просмотрены
после полного QA. Покрытие карты полное, новые боковые линии отсутствуют;
ядро/хвост/кольцоV сохраняются. HUD/контролы остались прежними.
Ниже штатная настройка2×; также проверены mobile/tablet при3× (zoom1.915385).

| Сценарий | Прежний zoom | Новый zoom | Реальный Canvas PNG |
| --- | --- | --- | --- |
| Phone844×390 | 1.66 | 1.276923 | [Поле боя](../screenshots/camera-fireball-cleanup/battle-844x390-scale2.png) |
| Tablet1024×768 | 1.66 | 1.276923 | [Поле боя](../screenshots/camera-fireball-cleanup/battle-1024x768-scale2.png) |
| Desktop1280×720 | 2 | 2 | [Контроль](../screenshots/camera-fireball-cleanup/battle-1280x720-scale2.png) |

Fireball, native128×96 screenshot crops реального Canvas, без масштабирования:

- [Обычный, I ранг](../screenshots/camera-fireball-cleanup/fireball-normal-detail.png).
- [III ранг: здесь раньше появлялись две боковые линии](../screenshots/camera-fireball-cleanup/fireball-rank-III-detail.png).
- [V ранг: сохранённое кольцо](../screenshots/camera-fireball-cleanup/fireball-rank-V-detail.png).
- [Эволюция: два снаряда и кольца](../screenshots/camera-fireball-cleanup/fireball-evolved-detail.png).

PNG — настоящие скриншоты браузера, не генерация/обработка изображений. Полные
Fireball-кадры также сохранены. Техническая fixture задаёт ранг/условия эволюции,
запрещает повторные автоатаки большим readyAt и останавливает время для съёмки;
большой cooldown в HUD этих кадров не является изменением игровых настроек.
Battle PNG используют настоящие автоматические casts и заданную тестовую группу18врагов.

Блокеров нет. Физические iOS/Android/Steam Deck не проверялись. Следующий шаг —
ручная приёмка результата пользователем. Commit/push/deploy не выполнялись.
