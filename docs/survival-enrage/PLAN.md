# Survival Enrage / Arcane Absorb — 2026-11-03

База d7bb994, чистый main, Mage/audio/Level-Up уже закоммичены и опубликованы
пользователем. Новая feature/survival-enrage-arcane-absorb. В этой задаче без
push/merge/deploy. Архив до изменений: .tmp/survival-enrage/source-before.zip;
SHA исходников: BASELINE_FILES.json. До10:00 сохраняется старый код расчётов.

Enrage стартует на600s с tick0 (множители1); tick1 на630s. Линейные +.08spawn,
+.03movement,+.04attack; caps2/1.6/1.65. Runner ограничен1.35 и абсолютными148px/s,
Rusher1.5 и138px/s; обычные128px/s. Существующие speed/pressure curves после600
заменяются продолжением от600, а не умножаются повторно. Spawn interval/burst
заморожены на профиле600, mix/elite продолжаются по прежним таблицам; HP/damage
таблицы и прежняя HP/damage curve не меняются. Enrage не добавляет HP.
Полные attack tells сохраняются на значениях600. Cooldown/recovery сокращаются,
charge/projectile speed специально не усиливаются. Boss aggression задаётся
однократно от base600 с ограниченными добавками1.2movement/1.3frequency.

EncounterDirector до600 прежний. На600 новых боссов нет, затем один каждые30s,
тип циклически Charger/Sorcerer/Eclipse. Guardian по прежним целым минутам и caps.
Пропущенные окна расходуются, debt/queue нет, история ограничена32.

Arcane использует общий числовой AbsorbPool вместе с существующим Dash Absorb.
RankI-V15/20/25/30/35%effectiveMaxHP; refresh заменяет остаток, не складывает его.
Срок5+rank секунд и CDR/cooldown12s прежние. Arcane расходуется перед Dash Absorb;
излишек урона проходит в HP после armor/Iron Skin. Только полное поглощение Arcane
не даёт i-frames. HP-hit grace и независимая Dash/Blink protection сохраняются.
Эволюционный pulse один при разрушении щита, чтобы дробные контакты одного кадра
не создавали десятки импульсов. Описание эволюции обновляется соответственно.
Появление/поглощение сообщается через существующий feedback, Mage gesture
наблюдает реальные события. HUD складывает ограниченные два источника Absorb.

Baseline fixed build:39legalchoices/level40, FireV/FrostII/LightningV/MeteorV/
ShieldI,180HP,speed175.5,damage2.25,CDR.59049,projectiles4,area1.3, без артефактов/
эволюций. Три seed12345/67890/77,180s от12:00. Текущее encounter-окно расходуется,
арена очищается без наград, дальнейшее расписание реально. Offers обходятся
только для фиксирования билда. Real HP/loot, без test invulnerability.
Базовый AFK уже гибнет34.95/46.10/46.75s даже без боссов, move/Blink180s живы.
Не выдавать это за воспроизведение бесконечного AFK пользователя; изучить различия
билда и показать сравнение после. Изолированные cadence/FPS пробы используют
защиту только для удержания нагрузки, не для выводов о выживаемости.
