# Обычная Chain Lightning — один native clip

Дата:2026-11-08. Запрос: заменить обычную молнию с помощью
art/main-hero-mage/abilities/regular-lightning, сохраняя ультимейт.

Одной анимации достаточно: chain-lightning.gif уже содержит появление, полный
разряд и затухание. Для каждого фактического звена цепи используется отдельный
экземпляр того же клипа. Поворот и длина следуют from/target; отдельные стороны,
idle и collide для текущего короткого zap не нужны.

Оба оригинала сохранены без изменений. Builder scripts/build-regular-lightning.mjs
декодирует GIF через Chromium ImageDecoder:32frames262×72 по50ms,1.6s source.
PNG задаёт RGBA; GIF/PNG color/alpha различий0. Source sheet6×6, последние4слота
не входят в32GIF frames. Native кадры упакованы без crop/resize/квантования;
padding2, atlas1596×456/2911104RGBA bytes/PNG23722bytes.
Manifest: src/game/art/regularLightningManifest.json. Hashes/audit/reproduction:
art/generated/regular-lightning-v1/. Три runtime outputs rebuild byte-identical,
оба source SHA-256 прежние.

Source anchors17..239 по X, axisY49. X scale равен длине звена/222, поворот
atan2(target-from), Y scale0.5 постоянен на всех расстояниях и рангах. Длина
первого удара и переходов может отличаться, толщина не растёт на коротких звеньях.
Все32source позы проигрываются за существующее время lightning effect0.22s,
secondary evolution0.18s. Это визуальное ускорение source, без изменения урона,
cooldown, порядка/уникальности целей, chain count или радиусов.

RegularLightningArt только читает существующие effects. Live список и pool
ограничены общим effectCap96; новых timers/listeners/tweens/RNG нет. Pause/upgrade
замораживают World.elapsed, после expires images скрываются, при scene teardown
pool уничтожается. Старый Graphics bolt/дополнительные rank circles удалены.
Число целей по-прежнему растёт с рангом. Ultimate lightning pipeline и его
файлы не менялись (git diff отдельно проверен). В unit/browser отдельно запущен
только ультимейт при выключенной обычной молнии: RegularLightningArt пуст.

Изменены GameArt preload/filter/render/teardown/diagnostics, MageMagic,
assetRegistry и asset request catalogs. Добавлены regularLightningPack/Art/
Manifest, builder, unit/E2E. Общий ранговый тест теперь сравнивает native
single-bolt style, а новый настоящий chain тест проверяет рост3→7целей,
сохранение damage и secondary2links. Предыдущий Fireball реворк сохранён.

Проверки:

- npm.cmd run check PASS:850unit/104files,typecheck/lint/build.
- Production4176:9/9 PASS(37.5s), обычные забеги, обе тренировки, resize,
  controller-only UI и отсутствие внешних ресурсов.
- E2E7/7 PASS(59s): native rankI/V,1280×720/844×390 плюс390×844portrait,
  first/secondary links, source frame progression, fixed thickness,
  pause/expiry/restart и отдельный ультимейт; HD integration и stress2viewports.
- Stress150regular+3boss+3Guardian: медиана59.25FPS/1.90ms sampled p95 update
  на1280,59.39FPS/1.40ms на390. HP/invulnerability только для постоянной
  нагрузочной fixture; caps и5restart/viewport без роста ресурсов PASS.
- Canvas evidence: screenshots/regular-lightning-v1/,26PNG/4JSON. Desktop
  rankI и mobile rankV/portrait действительно открыты и просмотрены. Errors,
  404 и Texture/Frame warnings0.
- Ранний тест изоляции ультимейта требовал законный момент выбора: fixture
  перенесена на601s/level30+, без изменения игрового eligibility.
- Rebuild/source preservation и git diff --check PASS. Новых генераций нет.

Блокеров нет. Следующий шаг — пользовательская оценка обычной цепной молнии.
Commit/push/deploy не выполнялись.
