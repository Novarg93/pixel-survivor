# Пакет 08 — интерфейс и итоговая сборка

Статус: **verified**. База `37bdc2b`, локальный коммит пакета `cf3eb29`. Художественная приёмка пользователем ещё предстоит.

## Реализация

AssetId: `hud`, `menu`, `upgradeUI`, `deathUI`; дополнительно завершён XP pickup FX. `src/ui/hd-theme.css` подключён после базовых стилей. Тёмные панели, двойные прямоугольные рамки, золотые акценты, отдельные цвета HP/XP, крупные заголовки и табличные цифры объединяют меню, HUD, настройки, паузу, три карточки, Game Over, статистику и рекорды. Внешних шрифтов, изображений и зависимостей нет. Backdrop blur модальных экранов снят.

Сохранены тексты, бесплатные предложения, focus trap, Tab/Enter/ESC/1/2/3 и touch. Цвет ранга опирается на настоящий tier, новые редкости не придуманы. Список способностей получил aria-label, XP округляется только при отображении, без изменения состояния. Декоративный ромб первоначально попал в accessible-имя выбранной локации; exact E2E выявил ошибку. Исправлено пустым CSS-элементом, проверки имён сохранены.

XP contact echo использует исходные contact/expiry и общий визуальный pool 24 на 0,5 с с размером 6 мировых единиц. 240 XP начисляются сразу; повторных XP-событий, эффектов при expiry и задержек нет. World, баланс, AI, способности, лут и радар не изменены.

## Проверки

- Baseline до изменений: 5/5, 45,9 с — четыре полных UI flow с двумя viewport и synthetic benchmark.
- `npm.cmd run check`: TypeScript, lint, 141 unit в 30 файлах, build — успешно.
- Полный dev: 76/76, 7,6 минуты. Production: 4/4, 32,8 с. `git diff --check` чистый.
- Финальный targeted: 6/6, около 1,5 минуты; затем TypeScript и lint повторно успешны.
- Mage/Warrior × Grove/Forest × 1280×720/390×844, pixelScale 3 выбран через реальные настройки. Начальные 150 врагов с элитами, Guardian, три босса, лут, пять артефактов, бафы и все пять способностей каждого класса.
- Сняты и лично просмотрены Canvas всех восьми сочетаний и UI: меню, настройки, пауза, карточки, Game Over сверху и снизу, статистика, рекорды. Горизонтального overflow нет; UI не пересекает центральную AABB героя.
- Проверены Tab/Shift+Tab/3, ровно три предложения, пауза World. Контекст hasTouch и native CDP touch drag двигают героя; taps настроек, паузы и карточек работают. Это эмуляция, а не Android.
- В новом travel fixture обнаружен стартовый cap 35. Указано elapsed 1200 и добавлены явные asserts 150 врагов / 151 спрайт / 151 тень. Повторные 6/6 подтверждают усиленную проверку. Общий benchmark с десятью рестартами на 150 врагах также прошёл в полном наборе.

## Производительность

Seed 12345, одинаковые условия до/после: 150 mixed + Guardian + три босса + четыре расходника + сундук + три артефакта + 20 XP. Автоатаки выключены, герой неуязвим; 1 с прогрева + 6 с RAF, DPR 1. Ryzen 7500F, RTX 4060 / ANGLE D3D11, Chromium 156.

| Метрика | 1280×720 до→после | 390×844 до→после |
|---|---:|---:|
| FPS | ≈60→≈60 | ≈60→≈60 |
| p95 frame, мс | 16,8→16,8 | 16,8→16,8 |
| p95 Scene.update, мс | 1,1→1,1 | 1,0→1,1 |
| RGBA источников, B | 36695376→36695376 | 30403920→30403920 |
| Texture keys | 55→55 | 31→31 |
| GameObjects | 430→430 | 406→406 |

Отдельный живой тест: pixelScale 3, восемь сочетаний классов/карт/viewport, пять rank-3 автоатак включены, настоящий AI, движение клавиатурой. Test-only refill через World.spawn поддерживает 150 после убийств. Неуязвимость и refill — условия нагрузки, не изменения баланса. Прогрев 0,5 с + 6 с RAF.

Финальная серия: 59,5–60 FPS, p95 Scene.update 1,4–1,9 мс, пиковые GameObjects 517–557. Десять рестартов с 150 tank и travel ±50000→0: стабильны 151 спрайт, 151 тень, 330 объектов, 24 чанка, 30403920 B источников. Clock 0/0/0, tweens 0, Canvas 1, подписки не растут, пулы очищены. Raw: [live-stress.json](../../screenshots/hd-rework/pack-08/live-stress.json).

Семь атласов декодируются примерно в 23 MiB; bounded chunks и HUD crops учитываются отдельно. RGBA источников не равна фактической VRAM. FPS 60 при 60 Hz не доказывает одинаковую GPU-стоимость. Android, high DPR и длительный VRAM/heap soak не проверены.

## Registry и ограничения

Важных legacy PNG, акторов, предметов или UI-заглушек в охвате 02–08 нет. Runtime загружает семь атласов / 14 PNG+JSON. Старые генераторы не вызываются. Ровно две записи сохраняют status legacy с явным retainedReason:

| AssetId | Причина |
|---|---|
| guardianTell | Прежняя точная полоса HP и золотая печать; сам Guardian HD |
| bossTell | Прежние пути, кольца, радиусы, modifier/freeze/rush marks и указатели вне экрана; три босса HD |

У утверждённых core Warrior/Grunt отдельный death clip отсутствует; используется общий bounded FX. Им не приписываются новые кадры.

При крайней плотности исходные телеграфы и толпа перекрываются. Их не скрывали и не меняли timings/AI ради снимка. Свободная центральная AABB относится к UI и не гарантирует отсутствие перекрытий каждого объекта карты угловыми панелями.

## Основные PNG

| Экран | Desktop | Mobile |
|---|---|---|
| Меню | [PNG](../../screenshots/hd-rework/pack-08/after-Warrior-forest-1280-menu.png) | [PNG](../../screenshots/hd-rework/pack-08/after-Mage-grove-390-menu.png) |
| Настройки | [PNG](../../screenshots/hd-rework/pack-08/after-Warrior-forest-1280-settings.png) | [PNG](../../screenshots/hd-rework/pack-08/after-Mage-grove-390-settings.png) |
| Карточки | [PNG](../../screenshots/hd-rework/pack-08/after-Mage-forest-1280-upgrade.png) | [PNG](../../screenshots/hd-rework/pack-08/after-Warrior-grove-390-upgrade.png) |
| Живой стресс | [PNG](../../screenshots/hd-rework/pack-08/live-Mage-grove-1280.png) | [PNG](../../screenshots/hd-rework/pack-08/live-Warrior-forest-390.png) |
| Полная статистика | [PNG](../../screenshots/hd-rework/pack-08/after-Warrior-forest-1280-death-bottom.png) | [PNG](../../screenshots/hd-rework/pack-08/after-Mage-forest-390-death-bottom.png) |
| Рекорды | [PNG](../../screenshots/hd-rework/pack-08/after-Warrior-forest-1280-records.png) | [PNG](../../screenshots/hd-rework/pack-08/after-Mage-grove-390-records.png) |

Полный итог: [FINAL_REPORT.md](FINAL_REPORT.md). Дальнейшая автономная реализация не требуется; следующий шаг — художественная приёмка.
