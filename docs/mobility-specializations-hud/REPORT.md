# Mobility Specializations / HUD Redesign

2026-11-02. Ветка feature/mobility-specializations-hud от406a688, предыдущие
результаты сохранены локальным коммитом. Main57eb439 не менялся. Push/merge/deploy нет.

## Выбор и ранги

На уровне10 обычный LevelUpModal гарантированно показывает ровно три роли своего
героя. Это один обычный выбор, без второго окна и дополнительного расхода уровня.
До10 специализаций в pool нет; после выбора только выбранная может выпадать
обычным случайным предложением доIII. Другие две и уже maxed rank не предлагаются.
При большом XP обрабатывается level-pending+1, поэтому выбор10 не пропускается.
Выбор сохраняется до конца забега, при обычном LevelUp не сбрасывается.

Новые шесть вариантов заменили прежние варианты мобильности по текущему запросу.
Базовые Dash/Blink, их дальность/скорость/protection и5 автоматических умений сохранены.
Карточки используют прежние HD рамки3px/focus/selected, категории видны текстом:
Offensive#F59E46, Defensive#9BCBC5, Utility#B58CFA. 1/2/3, Tab и touch сохранены.

| Герой / роль | Специализация | I | II | III | Длительность |
|---|---|---|---|---|---|
| Mage / Offensive | Flame Trail | 12 урона/.5s,width10 | 18/.5s,width12 | 24/.5s,width14 | 2s |
| Mage / Defensive | Slowing Flame | slow40%,width12 | slow40%,width18 | slow40%,width24 | 2s |
| Mage / Utility | Arcane Sprint | speed+30% | +35% | +40% | 2s |
| Warrior / Offensive | Cleaving Dash | damage36,width12 | 48,width14 | 60,width16 | фактический Dash |
| Warrior / Defensive | Absorb Shield | 25%maxHP | 30%maxHP | 35%maxHP | 3s |
| Warrior / Utility | Berserk | damage+25%,CDR25% | +30%,CDR30% | +35%,CDR35% | 2s |

Значения находятся в config/mobilityUpgrades.ts. Damage умножается на stats персонажа,
artifact/Fury/Berserk ровно один раз по существующему порядку модификаторов.

## Эффекты и ограничения

Стена строится от реального положения до Blink к фактическому arrival после
viewport clamp. На мобильном viewport это может быть меньше requested112px.
Продольная проекция центра цели ограничена A..B: за концами стены урона нет.
Ширина учитывает физический radius цели. Периодический урон раз в.5s на enemy ID;
Map не растёт от мёртвых/ушедших целей, очищается вместе со стеной.
Offensive использует оранжевые языки пламени, Defensive — холодное голубое пламя.

Slow обновляется на.15s, не далее expiry стены; берётся более сильный из него и
Frost slow, без перемножения. Base speed неизменен. Обычный Rusher замедляется
также во время Charge. Прежний иммунитет боссов/Guardian к контролю сохранён.
Dash проверяет каждый пройденный segment; отдельный Set допускает один hit на цель
за Dash. Внешнее прерывание не вызывает эффект прибытия после смерти/паузы.

Общий бюджет impacts+zones24 сохранён, wall cap2. При заполненном бюджете новая
стена не добавляется, Blink всё равно перемещает; предупреждения врагов не удаляются.
Отложенных стен нет. Старую собственную стену можно заменить при wall cap2.
При нормальном shared CDR floor Blink>=2.1s, lifetime2s, обычного stacking стен нет.
Sprite/particle emitters не создаются: пиксели рисуются в прежнем friendly batch.

## Absorb и CDR

Порядок входящего урона: проверки status/HP/i-frames/Dash/Blink protection,
затем Arcane Shield расходует заряд и поглощает целый hit. Если заряд не сработал,
применяются armor/Iron Skin, затем Absorb, затем остаток HP. Оба щита логически
раздельны. Полностью поглощённый Absorb удар тоже включает обычные i-frames.
Absorb не лечит и не увеличивает maxHP. Повторный Dash заменяет запас/expiry,
capacity берётся от текущего maxHP. При изменении maxHP уже выданный запас не растёт.
Смерть, menu/restart и scene teardown очищают запас, стены и временные баффы.

Sprint/Berserk используют конечные slots прежнего BuffSystem: refresh заменяет
deadline/значения. Множители не записываются повторно в базовые stats.
CDR использует существующий effectiveCooldown и floor множителя.35:
Dash4s → min1.4s; Blink6s → min2.1s. При глобальном20% CDR:3.2/4.8s.
BerserkI добавляет множитель.75 только для новых запусков cooldown; готовый
readyAt не меняется. Первый Dash получает Berserk после прибытия, его собственный
cooldown уже рассчитан. Проверенный естественный пример с global50% CDR:
первый Dash2s, выдан BerserkI, следующий Dash во время бафа1.5s; running deadlines
автоматических способностей сохраняются при refresh бафа.

## HUD

Основная полоса — один Phaser Graphics на scene: width34,height6 world pixels,
anchor(player.x,player.y-33), независимо от кадров анимации. Зелёный HP,
светло-голубой полупрозрачный Absorb только в верхней части, нижняя зелёная часть
сохраняется. Пустой Absorb не рисуется. HP/maxHP/Absorb читаются каждый кадр.
Depth11 выше героя10, ниже снарядов12, friendly14 и warnings20: полоса не закрывает
угрозы. При shutdown объект уничтожается. Дополнительных текстур/timers/tweens нет.

В Vue оставлено доступное screen-reader зеркало HP/Absorb. Верхний блок содержит
героя, уровень и компактный XP%; длинная XP-row удалена. XP и thresholds прежние.
Space слева от всех пяти auto skills, отдельная touch-кнопка сохранена.
Zoom2/3 и оба viewport проверяются реальными сценами и Canvas PNG.

## Проверки

`npm.cmd run check`: **288 unit /44файла**, TypeScript/lint/build прошли.
Целевые проверки: все12 hero specialization/viewport случаев прошли;
новый HUD **8/8**, zoom2/3 и по3scene restarts. Первые resource assertions были
исправлены: total chunk texture count зависит от камеры, постоянные атласы
сравниваются отдельно, прежний лимит чанков48 сохраняется.
Production E2E **4/4**,32.3s. Полный dev-прогон: **134 passed /1 failed**,23.7min.
Единственный сбой — fixture принудительной смерти Mage в старом gameplay-mobility:
случайная карточка открыла Arcane Shield, заряд корректно поглотил контрольный
удар1e6. Fixture теперь явно очищает заряд перед принудительной смертью, как
остальные cleanup-тесты. Реальная игровая логика Shield не изменялась.

Повтор всего gameplay-mobility и новая непрерывная нагрузка прошли: **5/5**,1.6min.
Дополнительный stress содержит12 условий для всех6 вариантов и двух viewport,
реальные cooldown deadlines не сбрасываются. Всего136 уникальных dev-сценариев
успешно проверены хотя бы в одном актуальном прогоне; одного полного зелёного
135/135 запуска не заявляем. После полного прогона gameplay-код не менялся.
Тесты не отключались, assertions сохранены.

Фактические команды (порты через PIXEL_E2E_PORT):

```powershell
npm.cmd run check
npm.cmd run test:e2e -- --max-failures=3 --reporter=list --output=.tmp/e2e-mobility-hud-full
npm.cmd run test:e2e -- tests/e2e/gameplay-mobility.spec.ts tests/e2e/mobility-specialization-stress.spec.ts --reporter=list --output=.tmp/e2e-mobility-hud-repeat
npm.cmd run test:e2e:production
git diff --check
```

Unit/integration проверяют гарантированный10 (включая queued levels), несовместимость,
ранги/max, сегмент и width, per-target ticks, expiry/refresh, slow/Frost/Rusher,
swept Dash, Absorb/overflow/i-frames, отдельный Arcane Shield, Berserk damage/CDR,
running deadlines/floor, pause/death/cleanup, HP anchor/maxHP и процент XP.
11 файлов волн/врагов/боссов/base mobility/лимитов/XP буквально сохранены:
[BASELINE.json](BASELINE.json) содержит нормализованные LF SHA256.
Автопилот старого Warrior collection test использует настоящий Dash при близкой
угрозе; неуязвимость не добавлялась. Pacing replay проверяет назначенные попытки
и свободные boss slots, поскольку новый upgrade pool меняет билд и моменты убийств.

## Измерения производительности

12 реальных секунд на условие:150 regular +3boss +3active Guardian, все auto skillsV
и mobilityIII. Тестовая неуязвимость использовалась только для постоянной нагрузки,
не для выводов о выживаемости. Windows/Chromium, Ryzen7500F,32GiB.

| Герой / ширина | Median FPS до → после | p95 update до → после |
|---|---:|---:|
| Mage/1280 | 59.8 → 59.6 | 0.80 → 1.00 ms |
| Mage/390 | 59.7 → 59.6 | 0.70 → 0.90 ms |
| Warrior/1280 | 59.3 → 59.5 | 0.90 → 1.10 ms |
| Warrior/390 | 60.0 → 59.8 | 0.80 → 0.90 ms |

Постоянная нагрузка150/3/3 действительно удерживалась во всех samples; caps96/96/24
соблюдены. Clock[0,0,0], browser errors отсутствуют. Во всех8 HUD-конфигурациях
после scene restarts остаётся один health Graphics и стабильное число GameObjects,
постоянных атласов/listeners/timers/tweens. Чанки отдельно bounded48.
[QA_EVIDENCE.json](QA_EVIDENCE.json) содержит полные samples и данные HUD.
Это короткий benchmark данного компьютера, не гарантия FPS физических телефонов.

### Повторные активации всех специализаций

Отдельный6s прогон на каждую пару specialization/viewport: те же150+3+3,
все уменияV, синтетический CDR floor.35 для предельной нагрузки. Space нажимается
регулярно, successful casts>=3 за условие;
readyAt не сбрасывается, стены/баффы продолжают появляться во время измерения.
После каждого условия выполнен scene teardown с проверкой очистки старого мира.

| Специализация / ширина | Median FPS | p95 update | Успешных Space |
|---|---:|---:|---:|
| flame-trail/1280 | 58.3 | 1.30 ms | 3 |
| flame-trail/390 | 58.4 | 1.70 ms | 3 |
| slowing-flame/1280 | 58.4 | 1.70 ms | 3 |
| slowing-flame/390 | 58.5 | 2.50 ms | 3 |
| arcane-sprint/1280 | 58.6 | 1.40 ms | 3 |
| arcane-sprint/390 | 58.8 | 1.40 ms | 3 |
| cleaving-dash/1280 | 58.4 | 1.60 ms | 4 |
| cleaving-dash/390 | 58.4 | 1.20 ms | 4 |
| absorb-shield/1280 | 58.4 | 1.40 ms | 4 |
| absorb-shield/390 | 58.7 | 1.20 ms | 4 |
| berserk/1280 | 58.7 | 1.20 ms | 4 |
| berserk/390 | 58.5 | 1.10 ms | 4 |

В этом performance fixture неуязвимость удерживает одинаковую нагрузку;
его результаты не используются для оценки выживаемости.

## Скриншоты

Реальные Playwright screenshots, выборочно лично просмотрены:

- [Выбор10 Mage](../../screenshots/mobility-specializations-hud/guaranteed-Mage-390-zoom3.png)
- [Выбор10 Warrior](../../screenshots/mobility-specializations-hud/guaranteed-Warrior-1280-zoom2.png)
- [HP+Absorb mobile zoom3](../../screenshots/mobility-specializations-hud/hud-Warrior-390-zoom3.png)
- [HP+XP desktop](../../screenshots/mobility-specializations-hud/hud-Mage-1280-zoom2.png)
- [Flame Trail](../../screenshots/mobility-specializations-hud/flame-trail-rank3-390.png)
- [Slowing Flame](../../screenshots/mobility-specializations-hud/slowing-flame-rank3-390.png)
- [Arcane Sprint](../../screenshots/mobility-specializations-hud/arcane-sprint-rank3-1280.png)
- [Cleaving Dash](../../screenshots/mobility-specializations-hud/cleaving-dash-rank3-390.png)
- [Absorb Shield](../../screenshots/mobility-specializations-hud/absorb-shield-rank3-1280.png)
- [Berserk](../../screenshots/mobility-specializations-hud/berserk-rank3-390.png)

PNG/raw JSON локальны/ignored. В visual fixtures эффекты фиксировались настоящей
игровой pause, её Vue overlay скрывался только для снимка. Есть отдельные Canvas PNG.

## Ручной тест

Оценить читаемость HP при всех эффектах в плотной встрече, различимость двух стен,
удобство трёх ролей на уровне10 и силу рангаIII при разных сборках. Физические
Android/iOS/highDPR и длительный heap/VRAM soak здесь не измерены.
Локальная игра: http://127.0.0.1:5194/ . Разработка остановлена для ручного теста.
Main57eb439 сохранён; push, merge и deploy не выполнялись.
