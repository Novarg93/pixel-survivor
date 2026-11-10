# Rune Warden PixelLab runtime v1

Принятые эффекты подключены к игре 2026-11-10. Исходники и receipts:
`../rune-warden-vfx-review-v1/`, выбор: PixelLab AI.

26 точных native128² кадров, без ретуши: flight8, impact1, blink idle8, fade9.
Atlas: `public/assets/hd/rune-warden-pixellab-v1/`. Manifest/audit содержит
SHA256 исходных файлов и RGBA. Сборка:
`node scripts/build-rune-warden-pixellab-runtime.mjs`.

Скорость Rune projectile удвоена относительно принятой версии игры: scale2→4.
Отчёт: `docs/art/RUNE_WARDEN_PIXELLAB_RUNTIME_V1.md`.
Проверка области: `node scripts/verify-rune-warden-pixellab-integration.mjs`.
