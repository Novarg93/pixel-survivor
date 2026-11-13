# Projectile Хранителя затмения — приёмка

Последующая приёмка2026-11-10: PixelLab-снаряд интегрирован, Blink перенесён
от Rune Warden. Скорость Eclipse не менялась. См.
[runtime-отчёт](ASTRAL_PROJECTILE_RUNTIME_V1.md). Ниже — история preview-only этапа.

2026-11-10. Продолжение rework двух минибоссов-кастеров: после Хранителя рун
подготовлены два предложения для Eclipse / Astral Revenant (Хранитель затмения).
Обычный caster в enemyDefinitions — Рунный стрелок, regular mob; здесь показан
второй минибосс-кастер. До приёмки runtime не менялся.

Демо: `art/generated/astral-projectile-review-v1/viewer.html`.
Текущий эффект показан рядом с независимым оригинальным рисунком кодом и новым
вариантом PixelLab. Подписи раскрывают происхождение, условный темп сцены,
постоянные pivots и компенсацию прозрачных полей AI рамкой56world.

Мой вариант: сетка2px,8цветов, короткий след, тёмное ядро и открытый мятный крюк.
Полёт8×80мс, осколки8×45мс. После просмотра Canvas немного увеличен крюк и
подсвечено верхнее ребро в рамках той же палитры.

| PixelLab job | ID | Стоимость | Выбор |
|---|---|---:|---|
| Pro Flash model | f8c66252-c254-4598-b85b-9bc507171e57 |6|Да|
| MiniMax flight | a3fe0afa-b6cd-4fd9-a799-630368f85a1c |1|Да|
| MiniMax impact | 039cb37d-1add-42aa-a4f8-c86c7f2b0719 |1|Нет: широкое светлое кольцо|
| Animate Image dissolve | 8e725f7c-ab46-475c-9aa1-9b33d555d595 |2|Да|

Все4completed/saved. Баланс1418.95→1408.95, credits$0. Вход — модель минибосса128²,
локальный рисунок не использовался как AI input. PNG сохранены целиком без
перекраски/маскирования/подгонки по кадру. Входной кадр0 есть в инспекторе;
loop играет1–8, dissolve0–8 до полностью прозрачного конца.

Сборщик создаёт6 PNG-листов/contact sheets,6GIF и6Aseprite, manifest/viewer-data,
сверяет исходные RGBA и неизменность337runtime файлов. Каталог55кадров:
16code+18AI+21текущих. Не выбранная AI-попытка также сохранена. Старые игровые
ресурсы, модель/касты/Blink/пламя Eclipse, принятый Rune и Guardian не изменялись.

Файлы реализации: `scripts/prepare-astral-projectile-review.mjs`,
`scripts/astral-projectile-code-art.mjs`, `scripts/build-astral-projectile-review.mjs`,
viewer.html/js/css; используется существующий collector с root argument.

Проверки: `npm.cmd run check` PASS:1033unit/129files,typecheck,lint,build.
Четыре новых unit проверяют AI provenance, все55точных RGBA, сетку2px, палитру,
постоянные pivots, пустые окончания, exports и неизменность337runtime файлов.
Три browser cases PASS: HTTP/file://,1280/390/844, все6клипов, шагкадра/seek,
пауза поPNG bytes, сменанаправления/модели/фона,reducedmotion,нетoverflow/ошибок/
внешнихзапросов. После уточнения локального ребра4unit/3browser повторены.

Открыты и визуально осмотрены настоящие Canvas screenshots в папке демо:
screenshots/{compare-http,compare-390-http,impact-http,diagonal-http}.png.
Runtime baseline и полный inventory совпали; изменения не интегрированы.
Физический телефон и полная E2E suite не проверялись. Блокеров нет.
Следующий шаг — художественная приёмка пользователем. Done-marker не создавался.
