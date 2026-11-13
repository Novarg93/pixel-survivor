# Одобренные PixelLab Fireball/Meteor в игре — 2026-11-10

Пользователь одобрил ранее показанные AI-анимации и явно попросил интеграцию.
В игру подключены те же PNG PixelLab, без новых генераций или перерисовки.
Архивные программные Fireball V2/Meteor V3 и босс Ash Warden сохранены.

- Fireball: 19 кадров в отдельном атласе,128²,anchor77,61,scale0.5.
  Forming2×100мс,полёт8×80мс,попадание9×70мс. Коллизия использует прежний
  радиус; новая длительность изображения попадания630мс.
- Meteor: 27 кадров,128²,anchor47,68. Полёт8×80мс,свет9×80мс,
  удар9×70мс,остаток — предпоследний AI-кадр на800мс. Финальный AI-кадр
  полностью прозрачен. Измеренный по модели угол48.814° применён к движению.
- Отдельная подсветка на чёрном фоне получает SCREEN сopacity0.4; остальные
  изображения NORMAL. До падения свет нарастает обратным воспроизведением,
  после затухает прямым. ReducedFlash учитывается. Размер подсветки следует AoE.
- Damage,cooldown,speed270,дистанция/задержка падения,RNG не менялись.
  Пулы144/96,World.elapsed и очистка сцены прежние. Новых clocks нет.

Сборка: `scripts/build-pixellab-spell-runtime.mjs`. Исходные SHA256 и точные RGBA
сверяются с одобренным manifest; страницы с padding2,без trim/покадрового сдвига.
Атласы: `public/assets/hd/mage-{fireball,meteor}-pixellab-v1/`.
Манифесты: `src/game/art/{fireball,mageMeteor}ManifestPixellab.json`.
Audit: `art/generated/mage-spells-pixellab-runtime-v1/audit.json`.
Общий размер распакованных RGBA страниц3345408байт,плюс прежний Frost atlas.

Изменены runtime pack loaders,asset registry,MageAbilityArt,MageMeteorPresentation
и только угол в mageAbilityTuning.json. Последующая генерация Shield/Nova защищает
все325текущих src/public файлов отдельным snapshot. Старый401file snapshot относится
к первоначальному preview-only этапу и сохраняется как историческая проверка.

Проверено: `npm.cmd run check` — typecheck,lint,1000unit/123files,build PASS.
15разных DEV браузерных проверок пройдены: Fireball,восемь направлений,
Meteor/Nova/ranks/Area,ground layers,HD ресурсы и restart. Отдельный Mage390 early
stress с150мобами,rankV,Guardian,mobility и10restart PASS; median58.50FPS,
p95update1.80мс на этой машине и fixture с неуязвимостью. Это не замер баланса
на физическом телефоне. Три production smoke на4181 PASS без DEV API.

Открыты и просмотрены реальные Canvas screenshots:
`screenshots/mage-fireball-pixellab-v1/rank-1-1280/flight.png`,
`screenshots/mage-meteor-pixellab-v1/grove-1280/approach.png`,
`screenshots/mage-meteor-pixellab-v1/burning-390/small-impact.png`.
14защищённых файлов босса/архивного Fireball сохранили SHA256. Ультимейт Frost
не менялся этим поручением. Существующие чужие изменения в workspace сохранены.

Первый DEV run выявил устаревшие ожидания360мс для нового630мс попадания;
исправлены только fixtures. Один HD run прервала HMR-навигация при обновлении
демо; чистый последовательный прогон5/5 PASS. Большая Vite chunk warning прежняя.
Полная E2E suite не запускалась. Блокеров интеграции нет,нового done-marker нет.
