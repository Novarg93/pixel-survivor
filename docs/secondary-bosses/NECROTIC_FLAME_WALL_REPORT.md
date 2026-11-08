# Astral Revenant: Segment Necrotic Flame Wall

2026-11-08. Запрос заменяет четыре Ground Blast на четыре соседних сегмента
некротического пламени. Тестовая дуэль остаётся в главном меню.

Цикл: мягкая teal подсветка во время существующего cast warning → обратный
spawn0.6s → idle3s → прямой spawn0.6s → полная очистка. Подсветка рисуется
одним Phaser Graphics цветом0x56d7c7; flame sprites используют source pixels.
Display88, pivot64,104/128. Четыре footprints48×28, шаг48, статичная строка
на позиции игрока при начале каста. Персонаж и снаряды остаются прежними.

Урон:0.35damage владельца раз в1s только в idle и при пересечении сегмента
с радиусом игрока9. Общий cooldown исключает stacking на стыках, при переходе
между сегментами и overlap двух владельцев. Вне зоны урон прекращается.
Harmless appear/vanish; никаких разовых взрывов. Существующие armor/shield,
Blink/Ultimate protection и invulnerability обрабатываются World.damagePlayer.

Все часы принадлежат World. Ultimate freeze владельца держит все фазы и DOT;
летящие снаряды не останавливаются. Pause сохраняет state. Shared cap24 с
impacts/friendly zones; owner death/despawn, terminal state и restart очищают
сегменты и damage gate. Friendly zone damage не применяется к новым сегментам.
Renderer использует bounded image pool128 и один очищаемый Graphics, без
добавления Scene timers/tweens/listeners.

Импорт:15 source PNG/GIF не редактировались, SHA-256 в manifest. Точный4×4
pixel grid512→128, PNG colors/alpha. Spawn GIF содержит13кадров; полностью
пустые13..15 PNG cells сохранены с150ms и timingSource=png-tail. Все16idle
кадров импортированы. Reverse проигрывает кадры/длительности в обратном порядке.
Atlas117frames1056×1980,8363520RGBA bytes; PNG243382bytes.85общих body/volley
frames совпали с предыдущим runtime пиксель в пиксель. Повторная сборка всех
трёх outputs побайтно идентична; proof:.tmp/necrotic-flame-wall/reproduction.json.

Проверки:

- Typecheck/lint/build PASS;822unit/100files PASS, включая14новых mechanics tests.
- 18уникальных dev browser сценариев PASS: Astral art4, Astral practice4,
  HD bosses7, HD integration3. Первый общий запуск16/18: два mobile failure
  были в подсчёте памяти terrain после перемещения. Проверка исправлена с
  GROVE_ART_BUDGET.chunkPixels; финальный Astral art повтор4/4 PASS.
- 96Canvas PNG и4JSON: screenshots/necrotic-flame-wall/; просмотрены desktop и
  mobile normal/burning, warning, reverse spawn, idle, forward vanish/empty.
- HP в реальном art harness:1000→991.544→983.088→974.632 normal;
  1000→989.038→978.076→967.114 late. Вне зоны и при vanish HP не меняется,
  переход в соседний сегмент не добавляет тик. Errors/404/Texture warnings:0.
- Логи:.tmp/necrotic-flame-wall/regression и verified-art. В первом art запуске
  assertion размера ошибочно захватывал также missile impact views; исправлен
  фильтр flame frames. Во время следующего прогона rebuild вызвал Vite reload;
  окончательные проверки выполнялись без изменения runtime файлов.

- Production9/9 PASS: обычная игра, Astral/Ash кнопки и управление,
  без DEV hook, errors/внешних ресурсов. Лог:.tmp/necrotic-flame-wall/production.

Блокеров реализации нет. Следующий шаг — пользовательская настройка баланса
пламени в существующей дуэли; commit/push/deploy не выполнялись.
