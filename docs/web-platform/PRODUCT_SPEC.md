# Продукт Phase 01

Pixel Survivor — существующая single-player browser survivors игра с Mage и Warrior,
автоматическими атаками, выбором из трёх улучшений, боссами, ультимейтами, локальным
аудио и личными рекордами. Финальный Страж — на 20:00. Страница `/play` доступна
без регистрации. Account registration не меняет текущую игру и не синхронизирует saves.

| Маршрут | Поведение |
| --- | --- |
| GET / | Dark fantasy landing: название, реальный игровой кадр, Play Now, Mage/Warrior, механики, roadmap progression, регистрация, footer |
| GET /faq | Управление, внутри-run progression, локальное сохранение, аккаунты и честный статус будущих покупок |
| GET /contact | Форма имени/email/темы/сообщения; доступна гостям |
| POST /contact | CSRF; required name≤100, email≤254, subject≤160, message 10–5000; максимум 3 запроса за 10 минут на IP, в том числе невалидные; DB insert и flash о сохранении, без mail |
| GET /privacy, /terms | Явные юридические черновики с обязательными полями для владельца; выдуманных реквизитов/условий нет |
| GET /play | Полноэкранная исходная игра, отдельный документ |
| /register, /login, POST /logout | Официальный starter/Fortify session auth |
| /forgot-password, /reset-password/{token} | Стандартный password broker; локально уведомление попадает в log |
| /email/verify, signed verification route | Проверка email; неподтверждённый аккаунт перенаправляется из dashboard |
| GET /dashboard | auth + verified; реальное имя/email, settings/logout, empty Account Level, Characters, Inventory, Wallet, Run History, Rewards |
| /settings/* | Стандартные profile/security/appearance starter kit; защита маршрутов сохранена |

Дизайн: сине-серый фон/панели, приглушённое золото CTA, светлый текст, моноширинные
малые акценты. Не используем новые генерации, чужие sprites, выдуманные player counts,
отзывы или достижения. Два изображения в `apps/web/public/images` — неизменённые копии
`screenshots/gamepad/1280-production.png` и
`screenshots/warrior-empty-hand-runtime-v1/throw-north-west.png`.
Это существующие Canvas proofs принятого runtime, не новый концепт-арт.

Dashboard не показывает нулевые «реальные кредиты», dummy transactions или выдуманные
уровни. Будущие ресурсы отсутствуют, а не заполнены фиктивной статистикой.
FAQ отличает временные run levels от будущих постоянных уровней. Purchases нигде не
представлены работающими. Contact подтверждает именно запись обращения в БД.

Общий будущий глобальный рейтинг един для всех: не делить платных/бесплатных игроков.
Использованные расходники сохраняются в истории каждого run; сервер проверяет запись
и запрещает повторную выдачу за run. На этом этапе рейтинг не реализован.

Перед публикацией: утвердить оператора/контакты/право/возраст/retention/удаление данных,
настроить mail и HTTPS, static assets, backup/monitoring и production config.
Публикация и коммерция не входят в текущий этап.
