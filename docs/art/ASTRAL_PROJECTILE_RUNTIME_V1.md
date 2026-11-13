# Хранитель затмения — принятый снаряд и Blink

2026-11-10. Пользователь принял PixelLab из astral-projectile-review-v1 и попросил
взять Blink предыдущего минибосса. Подключены точные принятые кадры flight1–8
и dissolve0–8, отдельный atlas17native128²/padding2/1 393 920RGBAbytes.
Display56world,pivot75,62 постоянны во всех кадрах. Loop640мс,dissolve360мс.
Новых генераций для интеграции снаряда/Blink не было.

Blink Eclipse использует те же лиловые idle/fade PNG Rune Warden, без копии
ресурса и перекраски. Предупреждение читается все прежние450мс, затем оба
фиксированных конца затухают360мс. Печати у стоп (+23world), глубина ниже акторов
включая отрицательную Y. Телепорт, выбор места, безопасный вход и времена AI прежние.

Новый projectile/impact выбирается по ownerId только у Eclipse. Общий старый
Astral atlas остаётся у Guardian, его homing, масштаб40/48world и impact5–7
прежние. Скорость Eclipse до Enrage170world/s, после190 с прежними cohort
множителями; пользователь не просил ускорять его. Урон/число/TTL/World и
принятый Rune со скоростью×4 сохранены. Пламя Eclipse пока прежнее.

Изменены4визуальных runtime файла: GameArt,assetRegistry,AstralRevenantArt,
RuneWardenArt. Добавлены atlasPNG/JSON, astralProjectilePixellabPack и manifest.
Сборка проверяет SHA256 исходных файлов и точных RGBA. Scope guard подтверждает
333неизменных из337прежних файлов и4новых. Историческое доказательство
preview-only не перезаписано; старое демо помечено принятым.

Проверки: полный check PASS:1041unit/131files,typecheck,lint,build.
Runtime browser15PASS: новая интеграция1280/390, старый бой Eclipse4cases,
HD3, Guardian6. Проверены реальные попадания/скорости, Blink/пауза, смерть/
перезапуск, ресурсы ровноодинраз, память130,85MiB<144MiB, clocks/tweens0,
одиночные listeners. Unit проверяет все17RGBA, стабильныеpivots и разделение
Guardian/Eclipse без мутации World. Прежние боевые/балансовые тесты также PASS.

Canvas screenshots открыты:
`screenshots/astral-projectile-runtime-v1/1280/flight.png`,
`screenshots/astral-projectile-runtime-v1/390/blink-warning.png`.
Полная E2E suite и физический телефон не проверялись. Блокеров нет.
Production smoke3PASS: вход в практику босса и публичный Mage в двух биомах.
