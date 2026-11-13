# Хранитель рун: принятые эффекты в игре

2026-11-10. Пользователь принял PixelLab-снаряд и Blink из
[демо](../../art/generated/rune-warden-vfx-review-v1/viewer.html) и попросил
увеличить текущую скорость projectile на 100%.

В runtime подключён отдельный atlas `rune-warden-pixellab-v1`: 26 кадров128²,
528×924, padding2, 1 951 488 RGBA bytes. Скрипт
`scripts/build-rune-warden-pixellab-runtime.mjs` сверяет SHA256 исходных файлов
и декодированных RGBA перед упаковкой. Unit-тест сравнивает каждый пиксель atlas
с принятым исходником и проверяет прозрачные отступы.

| Эффект | Принятый источник | Воспроизведение |
|---|---|---|
| Полёт | raw/projectile-flight/01–08.png | 8 кадров, 640 мс, loop, pivot95,61 |
| Попадание | raw/projectile-model/00.png | Исходный PNG, alpha fade за прежние550 мс |
| Blink warning | raw/blink-idle-soft/01–08.png | Idle виден все450 мс предупреждения |
| Blink tail | raw/blink-fade/00–08.png | 9 кадров, 360 мс, оба фиксированных конца |

Руна расположена у стоп (+23 world), под персонажами, центр пустой. Урон,
число снарядов, TTL2,5 с, тайминги кастов/телепорта, тело и Judgement сохранены.
`ARCANE_VOLLEY.speedScale:2→4` даёт 200→400 world/s до Enrage и 210→420 после,
с прежними поздними множителями. Eclipse использует прежние скорость и Blink.
Новых AI-запросов нет; отклонённые варианты не подключались.

Проверки: полный check — 1029 unit/128files, typecheck, lint, build; браузерная
выборка — 16 cases (Rune runtime2, прежний Rune4, Eclipse4, HD3, preview3);
production smoke — 3 cases. Новые тесты проверяют действительную скорость,
реальный урон, swept collision, паузу, рестарты, лимит памяти и загрузку atlas
ровно один раз. Canvas PNG открыты и осмотрены, пути:
`screenshots/rune-warden-pixellab-v1/{1280,390}/` и `legacy/`.
Stress Mage/390/early также PASS: 150 мобов, 12 реальных секунд, 10 рестартов;
median58,79FPS, p95update2,1мс. Игровые текстуры129,52MiB при лимите144MiB.

После Blink появляются также прежние бирюзовые предупреждения Judgement:
они принадлежат отдельной следующей атаке, не новой руне перемещения.

Область runtime сверяется скриптом
`scripts/verify-rune-warden-pixellab-integration.mjs`: 5 изменённых и 4 новых файла,
328 исходных файлов неизменны. Результат —
`art/generated/rune-warden-pixellab-runtime-v1/integration-verification.json`.
Первоначальное доказательство preview-only не перезаписывается.

Полная E2E suite и физический телефон не проверялись. Блокеров нет.
