# Фактическая архитектура Phase 01

Монорепозиторий, текущая ветка `main`. Корневые `src`, `public/assets`, Vite 7,
Vitest и standalone workflow сохраняются. Laravel — только `apps/web`.

```
src/                              # единственный исходник Phaser/Vue игры
public/assets/                    # единственный набор игровых runtime-ассетов
apps/web/
  app/Http/Controllers/           # ContactController, GameAssetController, starter settings
  app/Models/User.php             # стандартный Fortify user
  database/migrations/            # users/session/cache/jobs и contact_messages
  resources/js/pages/             # Inertia сайт, dashboard, auth, settings
  resources/js/layouts/SiteLayout.vue
  resources/js/game.ts             # импорт ../../../../src/main
  resources/views/play.blade.php   # отдельный игровой документ, без iframe
  resources/css/                  # Tailwind 4 + сайт
  public/images/                  # копии двух существующих игровых скриншотов
  public/build/                   # игнорируемые выходы сборки, не исходники
  routes/web.php, routes/settings.php
  tests/Feature/                  # starter tests + web foundation
web-platform.playwright.config.ts
tests/web-platform/               # browser integration smoke
```

Официальный `laravel/vue-starter-kit` получен Composer create-project
(source revision `1959e1a26b1cabd02037c30210e14c5752d2b431`). Установлены Laravel
13.42.0, PHP 8.5.12 (уже имеющийся Herd CLI), Inertia Laravel 3.7.0, Vue 3,
TypeScript, Tailwind 4, Fortify. Полные версии фиксируют composer.lock/package-lock.json.
Из starter kit заменён Vite Plus на обычный Vite 8.3.5: Node 22.16.0 удовлетворяет
его engines, но не engines Vite Plus 1.4.0. PHP по умолчанию в PATH — 8.3.22;
используем PHP 8.5 локальным PATH процесса, без изменения Windows.

## Почему `/play` — отдельный документ

Прямой Inertia-компонент, импортирующий `src/App.vue`, возможен, но три игровых CSS
содержат глобальные `html/body/#app/main`, кнопки и fullscreen overflow. Их перенос
в scoped layers затронул бы проверенные touch/landscape/fullscreen UI. Кроме того,
Inertia navigation требует аккуратного ожидания асинхронного Phaser destroy.
Поэтому выбран самостоятельный Vite entry в том же приложении и origin.
`<a href="/play">` выполняет обычную навигацию; Blade грузит только `game.ts`.
Игра импортируется без копирования, iframe и переписывания. Site Tailwind/CSS туда
не загружаются, игровые стили не попадают на сайт. На настоящем Vue unmount
сохраняется исходный `game.destroy(true)` и снятие bridge/DOM/input listeners.
Document navigation уничтожает контекст; browser back/forward cache может вернуть
один существующий документ, но не монтирует второй Phaser в нём.

`/assets/{path}` (DEV) и `/build/assets/{path}` (production BASE_URL=/build/)
возвращают оригинальные файлы `../../public/assets`: realpath containment,
allowlist PNG/JSON/WAV/MP3/OGG, nosniff и часовой cache. Нет обхода директорий или
публичного доступа к art/source/секретам. Это локальная реализация: перед hosting
нужно настроить static mapping/web server alias либо упаковать копию runtime-ассетов
в public build. PHP file responses не являются планом высоконагруженной доставки.
Страница игры публична, её origin позволяет будущий session/CSRF API без CORS и
обмена сообщениями iframe. Phaser остаётся владельцем gameplay/timing/collisions;
Vue — UI; существующий bounded bridge сохраняется.

## Persistence и доверие

SQLite локально: users, sessions, cache, jobs, contact_messages. Миграции используют
переносимые Laravel schema types; MySQL/PostgreSQL не тестировались. Server session,
Fortify password hashing/reset/signed email verification/CSRF не заменяются своей
криптографией. Dashboard требует auth + verified; profile доступен auth пользователю.
Guest localStorage key `pixel-survivor-v1`/schema2 не меняются; localhost:5173 и
127.0.0.1:8000 имеют разные хранилища. Автоматической миграции/синхронизации нет.

В Phase 01 нет progression, economy, run API, leaderboard, anticheat. `RunRecord`
генерируется клиентом и остаётся недоверенной локальной историей. Не импортировать
её как основание выдачи денег/XP. Будущие контракты описаны отдельно.

Почта по умолчанию `MAIL_MAILER=log`, очереди и внешние сервисы для текущего UI
не нужны. Реального письма пользователю нет. Contact сохраняет текст параметризованным
запросом, ничего не отправляет по email, не принимает HTML как исполняемый контент,
не собирает IP в БД. При будущем admin UI обязателен escaped text rendering.
Filament 5 пока не установлен. Legal/operator/retention требуют утверждения до публикации.
