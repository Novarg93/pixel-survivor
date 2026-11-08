# Astral Revenant — визуальный реворк Eclipse

2026-11-08. Модель B и пользовательские анимации из `art/astral-revenant` подключены
к настоящему Хранителю затмения. Тестовая кнопка Briar заменена на
**«Бой с Хранителем затмения»**. Ash Warden остаётся отдельной тренировкой.

## Импорт и воспроизведение

15 исходных PNG/GIF,2 511 857bytes, сохранены без изменений. Walking/casting имеют
по16кадров150ms; flight12кадров150ms, impact8кадров150ms. Цвет/alpha берутся из PNG,
порядок и длительности — из GIF. Все соответствующие alpha сравнения дают0.
512px source frames уменьшаются до128px только после проверки точной4×4 grid.

Тело использует исходную фронтальную форму: left/right — две зеркальные
проекции. Новых ракурсов нет. Все32body poses отражаются попиксельно, pivot64,64,
display57.6×57.6; нет индивидуальной подгонки размера/центра кадров.

`ground-blast/pulsating` и `explode` одинаковы по SHA256. Использован один набор
texture frames с alias для второго клипа. GIF объединил4 прозрачных PNG frames
в600ms hold: его12кадров соответствуют sourceIndex0,4..14. Оставшиеся cells1,2,3,15
пустые и проверяются. Impact PNG содержит3rows против2rows GIF; запасные4cells
имеют видимость0/576/0/0 и не входят в GIF playback. Это явно закреплено в builder
и unit, без произвольного игнорирования несовпадений.

Runtime atlas98frames,1056×1716,7 248 384RGBA bytes,PNG216073bytes,2px padding.
`node scripts/build-astral-revenant.mjs` воспроизводит PNG/JSON/manifest; повторная
сборка побайтово идентична. Proof: `.tmp/astral-revenant-v1/reproduction.json`.

## Привязка к игре

- Walking loop и casting16frames следуют simulation time. Каст нормализуется к
  настоящему windup, подготовке после Blink и второму залпу phase2. Попадания не
  перезапускают каст; pause и Ultimate freeze сохраняют его прогресс.
- Снаряд40world units, pivot100/128,.5, static при запуске, затемflight loop.
  Столкновение/TTL показывают impact5..7, начиная с реальной белой вспышки,
  с fade0.36s. Направление текстуры соответствует vx/vy во всех углах кольца.
- Ground-blast: static → видимые pulse1..6 в последние0.45s до landAt →
  explosion7..11 на настоящем ударе с fade0.45s. Прозрачный пре-ролл не скрывает
  предупреждение. Размер привязан к прежнему radius27, старый круг не рисуется.
- Blink использует Rune Warden atlas без копирования: static from/target и
  быстрый glow обеих точек0.36s при реальном перемещении. Старый duplicate
  teleport/cast overlay удалён. Eclipse volley direction ticks сохранены.
- Phase2 ≤50%HP: прежние4floor impacts, второй залп и ускоренный AI. Тело получает
  мягкое зелёное ADD свечение, исходные pixels не меняются. Hurt — существующий
  flash; отдельной death-анимации нет, новая модель затухает0.6s.

Eclipse HP5040,damage24,speed26,radius24,projectile speeds85/95×late,TTL2.5,
углы/числа залпов/два прохода, радиусы/время урона/CD/телепорт safety/rewards
сохранены. До Enrage10снарядов, после — штатная birth/late scaling (на915s7).
Новые effects не меняют RNG; collision VFX используют cosmetic IDs и owner cleanup.
Shader ADD поддерживается закреплённым Phaser4.2.1, API сверено с локальным исходником.

Presentation pool ≤128images, общие simulation budgets прежние. Предупреждения
идут первыми. Нет Clock/tween/interval/listener; scene destroy очищает images,
run restart сбрасывает playback, повторная загрузка atlas не требуется.

## Дуэль и проверки

Реальный Eclipse на630s с полным HP и нормальной AI; Mage54/200HP/53 обычных
улучшения/ледяная ульта. Относительный таймер00:00, одна цель, без иных спавнов,
despawn или Ash перехода после20min. Победа/поражение, повтор того же боя, выход
к обычному run. Рекорды и профиль не изменяются, XP/chest picker не прерывают бой.
Прежние Briar/Rune остаются в обычной игре и внутренних practice функциях.

- Финальный check99файлов/808unit PASS, typecheck/lint/build PASS.
- Финальный production9/9 PASS(38.6s), включая новую дуэль без DEV harness.
- Новые unit проверяют импорт/alias/mapping/mirror, все фазы/cast/freeze/hit,
  реальные ring speeds/counts/TTL, landAt/HP, Blink anchors, cleanup/пулы/IDs,
  терминальные состояния и победу обычной сборкой с обеими фазами и всеми skills.
- Первая browser-проверка: меню4/4 и обычная Роща2/2 PASS. Ожидание3снарядов
  в late тесте исправлено: настоящая конфигурация на915s задаёт7. Скорости/counts
  теперь сверяются с birth/late profile. Игровой баланс не изменялся.
- Все30целевых browser-сценариев Astral/Briar/Rune/Ash/HD проверены в целевых
  прогонах. Общий прогон:29/30 PASS; найдено наложение best/footer при сохранённом
  рекорде. Минимальная CSS-правка уменьшает отступ records-link только при best;
  измеренный gap−6.42→10.58px. После неё8/8 UI-сценариев PASS(40.4s), включая
  обе кнопки с сохранённым рекордом. После финальной проверки ранних warning ticks
  отдельно повторены Astral art4/4 PASS(25.0s) и production9/9. Остальные18
  browser-регрессий прошли в общем прогоне: Rune/Briar, HD/Guardian/150mobs,
  десять рестартов и36уникальных HD URL без повторной загрузки.
  Логи: `.tmp/astral-revenant-v1/{final-e2e,final-menu,final-art,release-production}`.
  Полный исторический E2E не запускался.

Canvas/menu доказательства: `screenshots/astral-revenant-v1/` и
`screenshots/astral-revenant-practice/`:92PNG/7JSON, включая диагностические
before/candidate menu. Просмотрены desktop/mobile меню, меню с рекордом,
walking/cast/ticks, flight/impact/dissolve, floor pulse/hit и Rune teleport.
Пять перегенерированных прежних Rune review-файлов сохранены в
`.tmp/astral-revenant-v1/regenerated-rune-review/` и восстановлены к исходной версии.

[Меню](../../screenshots/astral-revenant-practice/menu-1280.png),
[кольцевой залп](../../screenshots/astral-revenant-v1/burning-1280/ring-flight.png),
[ground blast](../../screenshots/astral-revenant-v1/grove-1280/floor-hit-and-second-cast.png),
[телепорт](../../screenshots/astral-revenant-v1/burning-844/teleport-arrival.png).

Основные файлы: builder/manifest/pack/AstralRevenantArt, config/astralRevenant,
GameArt/assetRegistry/BossAnimation/RuneWardenArt, EclipseBoss/BossMagic/World,
legacy overlay guards, startAstralPractice/bossPractice, MainMenu/App/HUD, unit/E2E.
Новых зависимостей/commit/push/deploy нет.
