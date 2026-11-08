# Runic Judgement — пользовательские ассеты V2

Дополнение 2026-11-08: по новому запросу удалён фиолетовый контур вокруг V2;
предупреждение использует только саму руну. Arcane Volley увеличен40→52units
(включая matching impact), скорость×2: early200 и Enrage210×late, также после
Blink. Check776/776, art+practice8/8, production9/9; новые screenshots:
`screenshots/rune-warden-volley-tuning/`. Исходные изображения не менялись.

2026-11-08. Подключены новые файлы из `art/rune-warden/skills/runic-judgement`:
статичная голубая руна `1072504761`, PNG sheet/GIF взрыва `1338804019`.
Старые rj/rune inputs больше не используются.

Новая геометрия: native128×128, центр(64,64), видимый диаметр94px. Руны теперь
круглые и совпадают по центру и радиусу с настоящей зоной попадания. Позиции не
сдвигаются между static/charge/impact; индивидуального fitting кадров нет.

| Фаза | Отрисовка |
|---|---|
| Предупреждение | Статичный PNG, до последних0.4s windup |
| Заряд | Кадры0..11 за оставшиеся0.4s, на полу |
| Настоящий hit | `landAt` и прежний однократный урон запускают кадр12 |
| Всплеск/исчезновение | Кадры12..15 за0.4s, квадратичный fade до0, без повторения |

Исходная GIF-анимация содержит16×150ms=2400ms, включая заряд и полностью светлый
финал. Её фазы ускорены раздельно, чтобы заметный взрыв совпадал с уроном.
Сила урона, radius, cooldown, AI, остальные навыки и дуэль1×1 сохранены.

PNG задаёт цвета/alpha, GIF — порядок и timings. В кадрах0..12 alpha совпадает,
в13/14/15 есть80/240/25072 отличающихся source pixels. Это проверено прямым
сравнением и явно закреплено в builder; любые другие расхождения отклоняются.
В этих3PNG frames непрозрачный прямоугольный фон занимает весь холст.

Для последних3 кадров renderer создаёт небольшой scene-owned cache384×128
(196608RGBA bytes), с фиксированной круглой feather-маской radius46..62.
Центральная область и RGB сохраняются, прямоугольные углы исчезают. Исходники
и упакованный atlas не маскируются/не перерисовываются. Cache создаётся один
раз, имеет NEAREST sampling, удаляется на shutdown; per-frame canvas операций нет.

Файлы: `scripts/build-rune-warden.mjs`, `runeWardenManifest.json`,
`runeWardenPack.ts`, `RuneWardenArt.ts`, `RuneJudgementFlash.ts`, GameArt,
`config/runeWarden.ts`, unit/E2E Rune Warden. Исправлена типизация удаления
style-node в screenshot helper Rune practice.

Проверки импорта:101 atlas frames,1056×1716,7 248 384RGBA bytes; PNG365736bytes.
Все84 остальных кадров побайтово совпадают с предыдущим atlas.16 текущих
пользовательских inputs неизменны при обработке. Повторная сборка3outputs
побайтово идентична. Proof: `.tmp/runic-judgement-v2/proof.json` и сравнение GIF/PNG.

Финальный `npm.cmd run check`:95 файлов/770 тестов, typecheck/lint/build PASS.
Совместный запуск check+browser дал один timeout старого180s simulation test
(5.4s против лимита5s). После завершения browser тестов последовательный check
прошёл целиком; timeout/assertions/эталонные gameplay hashes не менялись.

Rune Warden art + реальная menu practice:8/8 E2E PASS.48PNG/4JSON находятся
в `screenshots/runic-judgement-v2/`, дополнительно18PNG/3JSON дуэли —
`screenshots/rune-warden-practice/`. Выборочно просмотрены desktop/mobile,
normal/burning warning/hit/peak/fade; после fade на полу нет остатка.
Errors0, allocated VFX6, Clock0/0/0, tweens0; cache остаётся в одном экземпляре
после рестарта и texture bytes стабильны.

Production после финальной сборки:9/9 PASS. Полный исторический E2E набор
не запускался. Следующий шаг — пользовательская визуальная приёмка через
«Бой с Хранителем рун». Новых генераций/зависимостей/номерных done-маркеров нет.
