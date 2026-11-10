# Ash Warden Directions V1

South принят, новые North/East/West ожидают ручной приёмки. Для каждого ракурса idle4 и walk8; PNG192×192, pivot96/154.

Просмотр: [существующий viewer](../ash-warden-locomotion-rd-01/viewer.html), режим Directions V1. [Сравнение](comparison-sheet.png), [West mirror](west-flip-review.png). В подпапках направлений — кадры, preview.gif, strips, sheets, nearest-x4 и frames.json.

Воспроизведение из корня проекта:

```powershell
node art/generated/ash-warden-directions-v1/prepare-bases.mjs
node art/generated/ash-warden-directions-v1/build-pack.mjs
node art/generated/ash-warden-directions-v1/make-previews.mjs
node art/generated/ash-warden-directions-v1/verify.mjs
```

Это локальная сборка из сохранённых результатов, платные MCP-вызовы не выполняются. Принятые South файлы берутся из ash-warden-south-polish-01. Сырой результат ротации сохранён; повторять generation для воспроизведения не требуется.

Темп auto-preview ограничен20FPS. При100/144world units/s контакт не полностью согласован; viewer это отмечает. Не менять gameplay speed для сокрытия ограничения.

[Полный отчёт](../../../docs/final-boss/DIRECTIONS_LOCOMOTION_V1_REPORT.md).
