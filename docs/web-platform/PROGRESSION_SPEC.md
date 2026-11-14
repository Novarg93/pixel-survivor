# Account & Character Progression — контракт следующего этапа

В записи задания «110» трактуем как диапазон **1–10**, а «3:009:59» — **3:00–9:59**:
это согласуется с явно заданным максимумом 10. Не 110 уровней. Внутриигровые уровни
забега, XP-кристаллы и баланс сейчас не изменяются.

## Аккаунт

Постоянный level 1–10 хранится на Laravel. Только подтверждённая победа над финальным
боссом обычного run выдаёт 50% стоимости перехода с текущего уровня аккаунта.
Поражение и любая boss practice — 0. На level10 XP не растёт, повторных cap rewards нет.
Награды уровня: credits, consumables, revive, xp_boost_24h и будущие типы каталога.
Конкретные количества/стоимости и XP Boost multiplier не утверждены в Phase01;
не выдавать произвольные значения до отдельной конфигурации/проверки этапа02/03.

## Герои

Уникальный серверный `(user_id, character_id)` для `mage` и `warrior`, каждый level1–10,
XP и claimed rewards независимы. Обычный run даёт XP только выбранному герою.

| Результат | Доля стоимости следующего уровня героя |
| --- | --- |
| defeat, elapsed <180 секунд | 0% |
| defeat, 180≤elapsed<600 секунд | 20% |
| defeat, elapsed≥600 секунд | 30% |
| victory, финальный босс подтверждён | 50% |
| practice любого босса/героя | 0% |

Время — активная симуляция, не время в pause/shop/tab-away; не доверять присланному
числу без проверок run. Победа заменяет defeat reward, не складывается с ним.

## Расчёт и конфигурация

Версионируем `progression_config_version`. Таблица cost(level) хранит целые XP units
для переходов1→2…9→10. Начисление = floor(cost(currentLevel) × fraction), остаток
сохраняется, порог списывается при переходе. Стоимость берётся из состояния под lock
в момент принятия finish; повтор finish возвращает тот же receipt, а не новый
расчёт по уже повышенному уровню. Race двух run сериализуется по progression row.
Кривую стоимости и rewards map необходимо утвердить до выдачи, в Phase01 их нет.

Персонаж на некоторых уровнях получает расходники через ту же наградную транзакцию.
Таблица level bonus содержит стабильные ключи:
`damage`, `maximum_health`, `movement_speed`, `pickup_radius`, `ability_area`,
`cooldown_reduction`, `damage_reduction`, `experience_gain`.
Каждая запись: level, stat, additive/multiplicative operation, value, cap,
config_version; отдельный mapper в клиентские stat names. Уменьшение cooldown/damage
должно иметь явный cap, не превращаться в отрицательные значения.
Числа бонусов сейчас не назначаются и к World не применяются.

## Будущие модели и invariants

`account_progress(user unique,level,xp,version)`;
`character_progress(user,character unique pair,level,xp,version)`;
`reward_grants(user,source_run_id,track,level,config_version,receipt)` с уникальным
источником каждой награды. Finish transaction блокирует run/progress, переводит run
в accepted один раз, сохраняет изменения и grants атомарно. Credits/items проходят
свои journals, а не неучтённый increment. Локальные saves не импортируют XP.
Потеря ответа после commit решается повтором operation ID/чтением receipt.

Acceptance следующего задания: boundary tests179.999/180/599.999/600s, practice,
victory/defeat, level cap, config version, concurrent duplicate finish, отдельные
Mage/Warrior, rollback rewards, отсутствующий/непроверенный run. Не включать
постоянные боевые бонусы до их отдельной балансировочной приёмки.
