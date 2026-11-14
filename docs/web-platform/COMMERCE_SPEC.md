# Inventory, Wallet, Purchases — только архитектура

Phase01 не создаёт кошелёк, инвентарь, credits или purchase endpoints. Следующие
решения определяют контракты этапов03–05, а не доступную сейчас коммерцию.

## Каталог и единый инвентарь

Стабильные ID: `healing_potion`, `movement_boost`, `damage_boost`, `revive`,
`xp_boost_24h`. Не использовать UI names Bonus1/Bonus2 как тип предмета.
Catalog definition: id, version, localized label, effect kind, parameters,
duration, stacking policy, allowed contexts, credit_price, enabled.
Эффекты data-driven: heal/maxHP fraction, movement/damage multiplier+duration,
revive health+invulnerability, account/character XP multiplier. Числа/цены требуют
утверждённого конфига, не определяются Vue-классами. Нет client-controlled price.

`inventory_balances(user_id,item_id,quantity,version)` unique pair;
`inventory_operations(id,user,item,delta,reason,run_id,source_id,idempotency_key,receipt)`.
Grants и purchases используют общий inventory ledger, quantity никогда не отрицательна.
XP boost активируется вручную: до consume он не имеет countdown. Серверный UTC
`activated_at` запускает ровно24часа; при повторном использовании активного boost
продлеваем expires_at на24часа без умножения multiplier. Повтор запроса не продлевает
время ещё раз. Запланированный multiplier/область применения явно задаются конфигом.
Для XP finish берёт boost snapshot на Start Run, чтобы активация перед finish не
меняла завершённый run; expiry в середине run не отменяет snapshot. Practice XP=0.

## Кредитный журнал

Credits — целые единицы, сервер владеет балансом. `wallets(user unique,balance,version)`
и append-only `wallet_operations(id,user,delta,reason,source_type,source_id,
idempotency_key,correlation_id,reverses_id,created_at)`. Materialized balance всегда
сверяем с journal; транзакции с `SELECT FOR UPDATE`, одинаковый порядок locks.
Уникальные `(user,operation scope,idempotency_key)` и unique source для rewards.

Purchase Item принимает item_id, quantity, catalog_version и operation UUID, а не
balance/price. В транзакции: проверка конфигурации/доступности → lock wallet и
inventory → funds check → debit ledger + purchase receipt + inventory grant → commit.
Ответ содержит receipt и новые versions. Insufficient funds409 ничего не меняет;
stale price/config409 требует повторного подтверждения. Повтор с тем же payload
возвращает сохранённый receipt; тот же key с другим payload409. Timeout после commit
не создаёт новую покупку: повторить ID/получить receipt. DB failure откатывает всё.
Refund — компенсирующая journal operation со ссылкой на исходную, не удаление истории;
повтор refund idem. Если предмет уже использован, не вычитать quantity ниже0: pending
manual review/компенсация согласно отдельно утверждённой политике, не выдуманный refund.

## Покупка и использование в забеге

Игрок может купить заранее в кабинете. В забеге клиент сначала получает authoritative
Inventory Snapshot. Если предмет есть — Consume Item. Если нет — показать цену,
поставить World на pause и получить Purchase Item. При достаточных credits покупка
сначала добавляет предмет в inventory, отдельное явное использование расходует его.
При нехватке credits — переход к будущему top-up, сохраняя paused run; платежей сейчас нет.
Отмена/ошибка оставляет run paused, пользователь возобновляет его осознанно.

Consume транзакционно уменьшает quantity и пишет `run_item_uses` с unique operation ID,
effect version и sequence. Клиент применяет receipt единожды и ack-ает sequence;
при reconnect получает outstanding receipts и snapshot. Ack не выдаёт новый предмет.
Нельзя доверять заявлению клиента «не применилось» и автоматически выдавать новый.
Протокол delivery/ack допускает paused reconciliation: browser simulation сама по себе
не даёт exactly-once исполнения при malicious client или утрате вкладки.

## Воскрешение

Будущий runtime должен заменить немедленную финализацию смерти на `death_pending`
с pause: не сохранять terminal RunRecord, не отправлять Finish Run и не выдавать XP.
Сервер связывает одно death_id с run: active→awaiting_revive; проверяет owner/status,
предел revive, отсутствие finish. Покупка и consume revive — разные операции.
Revive Request атомарно расходует revive, сохраняет receipt/death_id и переводит
run в active. Клиент применяет согласованные HP/invulnerability один раз и resume.
Сеть потеряна после commit — запрос статуса/тот же ID, не второе списание.
Отказ/явное завершение или истечение серверного окна переводит run в finished один раз.
Гонка finish/revive блокируется row lock/version; terminal run никогда не revive.
Сейчас игра завершает смерть сразу; этот lifecycle только контракт, исходный World
в Phase01 не модифицирован. Параметры окна/лимита/HP предстоит согласовать.

Будущий платёжный провайдер отдельно: hosted checkout, проверенная подпись webhook,
unique provider event/payment IDs, валюта/сумма только серверные, journal credit после
проверенного settled event. Browser redirect не подтверждение оплаты. Refund/chargeback
через компенсации и сверку. Секреты в env/secret store; никаких карт на нашем сервере.
