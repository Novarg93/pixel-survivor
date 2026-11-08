# Rune Warden — принятый пакет для main

2026-11-08. Ancient Rune Archmage A подключён к обычному `sorcerer`; главное меню
также предлагает отдельную тренировку **«Бой с Хранителем рун»**1×1 с Mage54.

## Итоговое поведение

- Пользовательские12-кадровые Walk/Cast, только right/left с точным отражением.
  Каст следует реальному windup, pause и Ultimate freeze; отдельные
  Idle/Hurt/Death отсутствуют, используются первый Walk frame/вспышка/затухание.
- Arcane Volley: анимированный полёт и impact, размер52world units (+30%),
  early speed200 и Enrage210×late projectile modifier (×2). Направляющие tick-линии
  перед Rune volley удалены, в том числе после Blink; предупреждения Eclipse прежние.
- Runic Judgement V2: круглая голубая руна без дополнительного фиолетового круга,
  затем charge0..11 в последние0.4s и impact12..15 в настоящий landAt за0.4s.
  Завершающая вспышка имеет фиксированную круговую feather-маску и fade.
- Blink: неподвижные руны в from/target и быстрое свечение обеих точек при
  настоящей релокации. Сами снаряды/урон/owner cleanup остаются в World.
- Тренировка: единственный Rune Warden, без regular/Guardian/других боссов,
  без перехода к Ash Warden после20min. Победа/поражение, повтор той же дуэли,
  выход к обычному забегу, отсутствие записей в рекорды. Keyboard/touch/gamepad.

Damage/contact radii, количества/углы залпов, cooldown, TTL и HP сохранены;
Eclipse/Guardian не ускоряются. Дополнительные VFX имеют отдельные cosmetic IDs,
bounded image pool и явный scene teardown. Основной atlas101 frames,
1056×1716/7 248 384RGBA bytes; flash cache196608bytes на сцену.

## Исходники и воспроизведение

Включены16 PNG/GIF из `art/rune-warden`, runtime PNG/JSON,
`scripts/build-rune-warden.mjs`, manifest/pack/renderers, gameplay integration,
меню, практика и тесты. Зависимости и lockfile не изменялись.

Builder запускается через `node scripts/build-rune-warden.mjs`, используя
проектный Chromium из Playwright и уже существующие PNG helpers Ash Warden.
PNG задаёт цвета/alpha, GIF — последовательность/timings; точная4×4 source grid
проверяется перед сведением512→128. Известные alpha-различия последних3 кадров
Judgement явно проверяются. User inputs не перерисовывались.

Исторические replay hashes проверяются с локальным legacy-speed adapter только
в тестовом helper; реальная скорость200/210×late проверяется отдельно, включая
выстрел после Blink. Assertions/эталоны/timeout не отключались.

## Проверки

- `npm.cmd run check`:95 файлов/777 unit, typecheck/lint/build PASS.
- `rune-warden.spec.ts rune-practice.spec.ts boss-practice.spec.ts`: 12/12 PASS;
  финальная browser проверка обеих тренировок и Rune art.
- Production smoke:9/9 PASS, включая обе кнопки без DEV harness.
- Ранее пройдены HD/Mage VFX9/9 и boss/Guardian15/15, включая реальные45s
  survival trials и10 рестартов. Полный исторический E2E целиком не запускался.

В репозиторий включены выбранные Canvas evidence:
[меню](../../screenshots/rune-warden-practice/menu-1280.png),
[каст без указателей](../../screenshots/rune-warden-volley-tuning/burning-1280/casting.png),
[увеличенные болты](../../screenshots/rune-warden-volley-tuning/grove-1280/projectile-collision-and-rune-fade.png),
[mobile](../../screenshots/rune-warden-volley-tuning/burning-844/casting.png).
Два JSON evidence содержат текущие кадры/ресурсы/errors. Полные локальные серии
и глобальные исторические PROGRESS/DECISIONS/TEST_REPORT остаются ignored.

Пакет соответствует прямому запросу пользователя на push в main. Сторонние
root diagnostic/spec файлы, другие art experiments и внутренние временные
логи не включаются. Force-push и deploy не выполняются.
