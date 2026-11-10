# Принятое PixelLab-пламя Хранителя затмения

Подключено2026-11-10 после приёмки пользователя. Источник:
`../astral-flame-review-v1/`.26точных native128² кадров:spawn9,idle8,vanish9.
Atlas528×924,padding2,1 951 488RGBAbytes. Display62world,pivot60,116.
PNG/RGBA сохранены без ретуши, кадр0idle пропущен как в принятом демо.

Подъём600мс,loop800мс,затухание600мс; игровое горение3с. Предупреждение,
урон/тик, четыре секции/spacing34, геометрия, freeze/pause и очистка прежние.
Новых генераций для интеграции нет. Старый атлас остаётся для тела/Guardian.

Сборка: `node scripts/build-astral-flame-runtime.mjs`.
Scope guard: `node scripts/verify-astral-flame-integration.mjs`.
Из341прежнего runtime файла изменены только GameArt/AstralRevenantArt;
добавлены4файла,339прежних неизменны. Отчёт:
`docs/art/ASTRAL_FLAME_RUNTIME_V1.md`.
