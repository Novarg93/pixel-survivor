# Run lifecycle и будущие контракты

**Спецификация, не реализованные API.** В Phase01 отсутствуют `/api/v1/*` и серверная
выдача наград. `src/game/services/storage.ts::RunRecord` создаётся браузером,
редактируем и не доказывает исход боя/потраченное время. Не строить на нём фиктивную
«защищённую систему». Клиентская телеметрия и подпись выданного сервером seed не
гарантируют отсутствие читов; authoritative simulation/replay verification — отдельная работа.

## Общие правила будущего API

Same-origin `/api/v1`, Laravel session auth + CSRF, confirmed email для постоянных
операций; guests продолжают локальную игру без server rewards. JSON DTO с
`schema_version`, UUID operation_id, entity `version`; UTC ISO8601 timestamps,
целые credits/XP, ограниченные payload sizes. Ownership всегда из session, не user_id
клиента. POST mutations требуют Idempotency-Key; stored request hash + receipt.
401 session expired,403 forbidden,409 state/version/key conflict,422 invalid,
429 throttled,503 temporary unavailable. Retry с тем же operation ID; клиент
не считает timeout провалом commit и не делает optimistic credits/items.

| Контракт / предлагаемый маршрут | Запрос | Ответ и серверный invariant |
| --- | --- | --- |
| Start Run POST /runs | character_id mage/warrior, biome_id, mode normal/practice, client_build | server run_id, seed, config/build version, mode, started_at, progress/loadout/boost snapshot; idempotent; run принадлежит session user |
| Finish Run POST /runs/{id}/finish | outcome claim, active_elapsed_ms, bounded aggregates/events, final encounter claim, receipt sequence | pending_review/accepted/rejected + finish receipt; никогда не доверять XP/credits/score amount клиента; unique finish/run, grants ровно один раз |
| Account Progress GET /progress/account | — | level1–10, xp, next_cost/null at cap, version, rewards summary; только server state |
| Character Progress GET /progress/characters/{id} | mage/warrior | независимые level/xp/bonus config version, next_cost, version |
| Inventory Snapshot GET /inventory | optional since_version | quantities по stable item_id, catalog/effects versions, active boost expires_at, outstanding consumes; без UI-классов |
| Purchase Item POST /purchases | item_id, quantity, catalog_version, operation_id | purchase receipt + inventory/wallet versions; atomic debit/grant; client price не принимается |
| Consume Item POST /runs/{id}/items/consume | item_id, operation_id, expected_run_version | consume receipt, effect snapshot, sequence, remaining quantity; owner/active/allowed context; idem |
| Revive Request POST /runs/{id}/revive | death_id, operation_id, expected_run_version | revive receipt/effect/sequence + active state; только awaiting_revive, одно списание на death |
| Wallet Balance GET /wallet | — | integer balance, version, as_of; только сервер, никакого client set balance |
| Leaderboard Submission POST /runs/{id}/leaderboard | operation_id, visibility/consent where required | pending/accepted/rejected entry receipt; сервер сам читает accepted run score; unique run_id; нельзя прислать произвольный score |

Единый глобальный рейтинг для всех игроков, без деления по paid bonuses. Запись
хранит consumables_used и версии эффектов/loadout, источник результата и review status.
История использованных предметов серверная, связана с inventory consume receipts;
клиентские заявления учитываются как telemetry, не как финансовые операции.
Rejected/подозрительный run не выдаёт наград и не попадает в рейтинг автоматически.
Начисления progress и credits — unique source_run_id + track/reward, не факт наличия
leaderboard submission. Повтор submissions/finish не меняет баланс/XP.

## Lifecycle и проверки

`started → active → awaiting_revive → active` либо
`active/awaiting_revive → submitted → pending_review → accepted/rejected`.
Terminal state необратим для revive. Pause/shop — интервалы активного run, не XP time.
Серверный clock ограничивает время сверху, активное simulation time требует сверки;
нет утверждения, что старт/финиш clock доказывает честную симуляцию.
Одна операция finish блокирует row и принимает только допустимую version/state;
concurrent requests возвращают receipt либо conflict. Idempotency records хранятся
не меньше срока жизни run/финансовых receipts; ключ не удаляется до возможности replay.

Минимальные проверки: owner, build/config version, известные hero/biome/mode,
допустимые state transitions, start-to-finish bounds, pause accounting, монотонные
events/sequences, entity/kill/score bounds по конфигу, достижимость финального босса,
practice=0 постоянного XP, расходники по ledger, повтор grant/finish и payload bounds.
Seed/config сервер выдаёт для воспроизводимости, не как доказательство игры.
Подозрительные расхождения требуют review; не рекламировать checks как полный anticheat.

Будущая клиентская граница: injectable PlatformPort с guest implementation (локальный
save, без network rewards) и session implementation (DTO API). Локальный RunRecord
не заменяет server run_id. Смерть до выбора revive не вызывает finish; receipt delivery,
reconnect и pause/termination описаны в COMMERCE_SPEC. В Phase01 port не добавлен:
не создаём абстракцию без runtime consumer и не меняем боевые системы.

Acceptance будущего протокола: forged claims, чужой run, csrf/session expiration,
duplicate/reordered/concurrent finish, revive-vs-finish race, repeated consume,
timeout after commit, replayed payment event, rollback grants и practice boundaries.
