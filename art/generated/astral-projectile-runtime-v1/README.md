# Принятый снаряд Хранителя затмения

2026-11-10. PixelLab-вариант из `../astral-projectile-review-v1/` подключён
к игре. Отдельный atlas `public/assets/hd/astral-projectile-pixellab-v1/`:
17native128² кадров — 8flight и9dissolve, padding2, 1 393 920RGBAbytes.
Исходные принятые пиксели сохранены точно. Blink переиспользует уже загруженные
idle/fade кадры `rune-warden-pixellab-v1` с наземным смещением+23world.

Новый projectile показан только у Eclipse. Guardian сохраняет прежний
astral-revenant-v1 и homing. Скорости, урон, число/TTL снарядов, AI/World,
тайминги и геометрия телепорта, остальные способности не менялись.

Сборка: `node scripts/build-astral-projectile-runtime.mjs`.
Аудит области: `node scripts/verify-astral-projectile-integration.mjs`.
Из337 прежних runtime файлов изменены только4визуальных, добавлены4файла.
Отчёт: `docs/art/ASTRAL_PROJECTILE_RUNTIME_V1.md`.
