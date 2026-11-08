# Armored Briar Beast — интеграция пользовательских анимаций

2026-11-08. Charger («Терновый таран») использует выбранную модель B Armored Briar
Beast и новые walking/charge/attack из `art/armored-briar-beast`. Имя в интерфейсе:
**Терновый зверь**.

## Ассеты и воспроизведение

- Семь исходных файлов: исходная модель и три пары PNG/GIF. Исходники не меняются.
- Каждый GIF: 12 кадров 512×512 по 150 мс, 1.8 с. PNG: 2048×1536, четыре колонки.
- GIF задаёт порядок и длительности; PNG задаёт исходные цвета и прозрачность.
  Alpha GIF/PNG совпадает во всех 36 кадрах. Различия RGB из-за палитры GIF
  сохранены в manifest для аудита; итоговые цвета берутся из PNG.
- Builder проверяет каждый пиксель точной сетки 4×4 перед уменьшением 512→128.
  Индивидуальная подгонка кадров/размера тела отсутствует. Pivot (64,64), прозрачные
  поля по 2 px. Для right каждый пиксель left отражается горизонтально.
- Атлас: 74 кадра (36 анимационных + static idle, по два направления),
  1056×1320, 5 575 680 RGBA bytes, PNG 329 515 bytes. Только left/right.
- `node scripts/build-briar-beast.mjs` воспроизводит atlas.png/json и manifest.
  Повторная сборка трёх outputs побайтово идентична; SHA256 семи inputs сохранены.
  Локальное доказательство: `.tmp/briar-beast-v1/reproduction.json`.

## Поведение

- Walking зациклен во время движения. Attack играет при существующем ближнем
  контакте/жесте slam: все 12 кадров укладываются в прежние 0.6 с.
- Charge 0..2 — подготовка в прежние 0.5 с, 3..9 — реальный рывок, 10..11 —
  торможение в реальном recover. Последние фазы учитывают aggression/late modifiers.
- Нативная продолжительность клипов не меняет скорость симуляции. Сохранены HP,
  hit radius 23, display 57.6×57.6, скорость, дальность 240, одна swept collision
  на рывок, tracking до старта и фиксация направления после него, cooldown, урон,
  flash/локальные предупреждения и обычные награды.
- Hurt использует существующую вспышку. Отдельной death-анимации пользователь не
  предоставил: static выбранной модели затухает за прежние 0.6 с. Старое тело не
  появляется при смерти. Playback использует World time, pause/Ultimate freeze
  сдвигают часы анимации; нет новых Clock/tween/interval/listener.
- Попадания по charger не перезапускают текущую подготовку/charge/recover.
  Отдельная проверка воспроизводила сброс времени до исправления и проверяет
  непрерывный кадр после него; Eclipse сохраняет старое поведение hurt.

## Тестовый энкаунтер

Кнопка **«Бой с Терновым зверем»** заменила кнопку Rune Warden. Одна дуэль с
реальным charger, без regular/Guardian/других боссов и перехода к Ash после 20 min.
Mage54/200 HP, ледяная ульта и законные 53 улучшения — общая сборка тренировок.
Настоящие параметры босса на 630 с; таймер дуэли начинается с 00:00.

Победа/поражение, повтор той же дуэли и возврат к обычному забегу. Тренировка не
сохраняет рекорды; XP/chest/выборы улучшений не прерывают дуэль. Ash practice
сохранён. Сам Rune Warden и его анимации остаются в обычной игре, его внутренняя
practice-функция сохранена для регрессий без отдельной кнопки в меню.

## Проверки

- `npm.cmd run check`: 97 файлов / 789 unit, typecheck/lint/build PASS.
- Production smoke: 9/9 PASS, включая новую кнопку без DEV harness.
- Финальная Canvas-регрессия Briar/Rune/Ash/HD: **26/26 PASS (2.5 min)**, включая
  десять рестартов, совместный бой с 150 обычными мобами, оба biome состояния,
  нагрузку текстур/слушателей и отсутствие повторных загрузок 34 HD URL.
  Production после последней сборки: **9/9 PASS (40.1 s)**.
  Логи: `.tmp/briar-beast-v1/final-e2e/.last-run.json` и
  `.tmp/briar-beast-v1/final-production/.last-run.json`, status passed/failedTests[].
  Полный исторический E2E целиком не запускался.
- Первые Canvas desktop/mobile просмотрены: исходная модель, right mirror,
  ближняя атака, рывок на обычной/выжженной Роще и новая кнопка меню.
- Исторический replay helper нормализует только старое UI-имя charger для
  прежних golden hashes; сами fixtures, HP/damage/AI/RNG assertions не меняются.
  Новое отображаемое имя отдельно проверяется в unit/production.

Evidence: `screenshots/briar-beast-v1/` (позы, pause/freeze/death/restart) и
`screenshots/briar-beast-practice/` (меню, дуэль, результат, desktop/touch/gamepad).
Итого 98 PNG и 7 JSON новых evidence. Пять перегенерированных прежних Rune
review-файла сохранены в `.tmp/briar-beast-v1/regenerated-rune-review/`, затем
возвращены к исходной версии, чтобы не менять исторические принятые скриншоты.

[Меню](../../screenshots/briar-beast-practice/menu-1280.png),
[mobile duel](../../screenshots/briar-beast-practice/entry-canvas-844.png),
[атака](../../screenshots/briar-beast-v1/grove-1280/melee-hit.png),
[charge](../../screenshots/briar-beast-v1/burning-1280/left-charge-travel.png).

Основные файлы: builder, briarBeastManifest/Pack, assetRegistry/GameArt/
BossAnimation, bossPractice/startBriarPractice, World/FinalEncounter, Vue menu/HUD,
новые unit/E2E. Новых зависимостей нет.

## Финальная настройка скорости

Следующим запросом пользователь увеличил базовый movespeed на30%:24→31.2.
Это даёт преследование48→62.4ед/с и связанный рывок144→187.2ед/с до
aggression/late modifiers и существующего cap. Дальность240, предупреждение0.5s,
CD/recovery, HP/урон/radius и исходные/упакованные ассеты не менялись.

Исторический replay-helper локально возвращает старую базу24 только во время
исторической симуляции, восстанавливая spawn в finally. Реальная скорость31.2,
перемещение, направление, swept hit, pause, уклонение и победа проверяются live.
Финальные проверки настройки: check97файлов/790unit PASS, typecheck/lint/build
PASS; Briar art+practice8/8 E2E PASS(45.1s), production9/9 PASS(34.3s).
`.tmp/briar-beast-speed/{e2e,production}/.last-run.json`: passed/failedTests[].
Canvas desktop/mobile просмотрены; evidence.json содержит реальные walkStart/
walkEnd и скорости рывков. Работа со зверем завершена по запросу пользователя.
