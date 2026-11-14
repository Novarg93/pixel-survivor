# Web Platform Phase 01 — отчёт 2026-11-14

## Результат

Локальное Laravel-приложение создано в `apps/web` текущего репозитория/ветки main.
Работают landing, FAQ, Contact, legal drafts, Fortify auth и защищённый dashboard.
Существующая игра запускается публично через `/play`, без iframe/копии исходников.
`git diff -- src public package.json package-lock.json vite.config.ts` пуст:
боевые системы, игровой баланс, ассеты и standalone сборка не изменены.
Root ESLint исключает независимое приложение, которое имеет собственные строгие
type/lint/build проверки. Существующие пользовательские изменения тестов/скриншотов
не откатывались. Commit/push/deploy/новой ветки/Windows settings changes не было.

## Stack и установка

Фактическая проверка: default CLI PHP8.3.22; доступный Herd PHP8.5.12 выбран локальным
PATH процесса, Composer2.10.3, Node22.16.0, npm10.9.2. Глобальные зависимости не ставились.
`composer create-project laravel/vue-starter-kit apps/web --no-interaction --prefer-dist --stability=dev`
получил официальный starter source1959e1a. Framework Laravel13.42.0, server Inertia3.7.0;
Vue3, TypeScript, Tailwind4, Fortify; версии/зависимости в обоих lockfiles.

Установка PHP завершилась; автоматический npm hook первоначально остановился на
запрещённой записи в системный cache. Использован workspace `.npm-cache`; после
замены Vite Plus1.4 (не поддерживает текущий Node) на обычный Vite8.3.5 npm arborist
ошибся на старом дереве зависимостей. Пересозданы только новые `apps/web/node_modules`
и lock, затем обычный npm install прошёл. Framework не понижали; системный Node/PHP
не меняли. Ключ создан только в игнорируемом `.env`; SQLite migrations выполнены.
Официальные auth controllers/валидация/Fortify и стандартные security settings сохранены.

## Архитектура и маршруты

`resources/js/app.ts` + Inertia pages/layouts обслуживают сайт; Tailwind4 и `site.css`
задают тёмные сине-серые панели, золото, светлую типографику. Существующие игровые
скриншоты скопированы в `public/images`, новых изображений/звуков не генерировали.
`resources/views/play.blade.php` грузит отдельный `resources/js/game.ts`, который
импортирует корневой `src/main.ts`. CSS игры живёт только в этом документе; обычные
ссылки выполняют full navigation, повторный Inertia mount Phaser не создаётся.
Настоящий Vue unmount использует существующий destroy/listener cleanup.

DEV base=/, production base=/build/: allowlisted routes `/assets/{path}` и
`/build/assets/{path}` возвращают одну копию runtime из корневого `public/assets`.
Production проверка обнаружила и помогла исправить этот prefix: первоначальные
404 были реальной интеграционной ошибкой, после alias повтор smoke прошёл.
Исходники игры не менялись ради путей. JS/CSS бандлы обслуживаются Laravel public/build.

Публичные маршруты: `/`, `/faq`, GET/POST `/contact`, `/privacy`, `/terms`, `/play`.
Стандартные `/register`, `/login`, POST `/logout`, `/forgot-password`,
`/reset-password/{token}`, `/email/verify` и signed verify; `/dashboard` — auth+verified;
`/settings/profile`, `/settings/security`, `/settings/appearance` — starter protection.
Contact валидирует длины/email, ограничен3requests/10min/IP, сохраняет только4поля
и timestamps. Ответ подтверждает сохранение, не отправку письма.

Session cookies HttpOnly/SameSite=lax, password hashing/reset/signed verify — Fortify.
Laravel13 PreventRequestForgery допускает `Sec-Fetch-Site:same-origin`; cross-site
без токена реально проверен и отвергнут419. CSRF middleware не отключался.
Mail=log: тест подтверждения использовал созданную Laravel signed link из локального
журнала, без реальной доставки. Журналы/ссылки не публикуются.

## Локальный запуск (PowerShell)

Проверенные адреса: **http://127.0.0.1:8000/** и **http://127.0.0.1:8000/play**.
Полная первоначальная установка — в корневом README. Повторный запуск из корня:

```powershell
$env:PATH = "$env:USERPROFILE\.config\herd\bin\php85;$env:PATH"
Set-Location apps/web
# Сборка уже готова; при изменениях повторите npm.cmd run build
php artisan serve --host=127.0.0.1 --port=8000
```

Для HMR второй терминал с PHP8.5 в PATH, в `apps/web`: `npm.cmd run dev` (5174).
Сайт всегда открывать8000. При переходе на готовую сборку остановить Vite; если
после Ctrl+C остался `public/hot`, удалить только этот файл. Это обнаружилось при
production проверке: без удаления stale hot Laravel пытался загрузить остановленный
dev server. Корневой `npm.cmd run dev` по-прежнему работает отдельно на5173.
Игра использует прежний localStorage key/schema; новый origin имеет своё хранилище.

## Пройденные проверки

| Команда/набор | Фактический результат |
| --- | --- |
| Корень: npm.cmd run check | PASS, exit0: typecheck + ESLint +165Vitest files /1184tests + production build |
| Корень после добавления smoke/config: npm.cmd run typecheck; npm.cmd run lint | PASS |
| apps/web: php artisan test --compact | PASS47tests /215assertions: starter auth/registration/logout/password reset/email verify/settings + web pages/contact/limiter/assets/dashboard |
| apps/web: npm.cmd run check | PASS: vue-tsc и ESLint без подавления типов |
| apps/web: npm.cmd run build | PASS Vite8 production, отдельные site/game bundles |
| php vendor/bin/pint --test | PASS |
| php vendor/bin/phpstan analyse --no-progress --memory-limit=512M | PASS,0errors;128M было недостаточно, php.ini не изменялся |
| composer validate --strict | PASS |
| composer test | PASS: Pint + PHPStan +47tests/215assertions; memory limit512M закреплён только в Composer script, без изменения php.ini |
| composer audit; npm audit --omit=dev |0security advisories runtime |
| node node_modules/@playwright/test/cli.js test --config web-platform.playwright.config.ts | PASS6/6,34.0s: desktop1280×720 + touch landscape844×390 |
| WEB_PLATFORM_PRODUCTION=1, та же Playwright команда | PASS2/2,11.4s, без Vite/harness, оба публичных героя на обоих viewport |
| npm.cmd run test:e2e -- --grep "movement, contact death\|menu, settings, pause\|audio gesture, persisted buses\|both public heroes\|Warrior.*production" | PASS4/4,49.3s: старые audio desktop/mobile10restarts, movement/death/restart/menu |
| npm.cmd run test:e2e -- --grep "viewport listeners remain bounded" | PASS1/1,24.9s:10restarts и настоящий Vue unmount снимает viewport listeners |

Новый DEV browser suite проверил гостевые переходы, Contact, cross-site419,
защиту dashboard, регистрацию/signed verification/login/logout, настоящий Phaser,
движение keyboard/joystick, ненулевой WebAudio RMS после пользовательского клика,
pause/resume, запись рекорда через смерть и восстановление после reload,
повторные переходы с0canvas на сайте/1canvas в игре и bounded bridge listeners.
Новый production suite подтвердил Mage/Warrior, отсутствие DEV API,
отсутствие JS errors/404 assets, выход в меню и переход обратно на FAQ.
Первые прогоны smoke выявили ошибки самого теста (неуникальный Play Now locator,
ожидание DEV API без `?test=1`, неверное предположение о CSRF Laravel13); исправлены
условия тестов, проверки не отключались. Финальные прогоны прошли целиком.

Canvas/screenshots: `screenshots/web-platform/landing-{desktop,landscape}.png`,
`dashboard-{desktop,landscape}.png`, `play-{desktop,landscape}.png`,
`production-{mage,warrior}-{desktop,landscape}.png`. Просмотрены actual landing,
dashboard landscape, Mage landscape и production Warrior landscape.
Изображения хранятся локально в уже игнорируемом screenshots, исходные accepted assets
и PixelLab prompt journal не менялись: новых принятых генераций нет.

## Ограничения и незапущенные проверки

- Полный многосценарный существующий E2E, долгие забеги, аппаратные iOS/Android/Safari,
  fullscreen permission UX и физический gamepad в этой фазе не прогонялись.
  Существующие input/fullscreen/lifecycle исходники не менялись; smoke не заменяет hardware QA.
- Полный npm audit сообщает9moderate dev advisories через minimatch/ESLint/typescript-eslint.
  Runtime npm audit0; composer audit0. Принудительное обновление несовместимых major
  версий не выполнялось. Это отдельное maintenance задание, включая root toolchain.
- Mail transport не настроен: reset/verification работают через log, реальных писем нет.
  Legal drafts требуют владельца/правил/retention перед публикацией. Deploy не выполнялся.
- Runtime asset delivery через PHP подходит для локальной фазы; production hosting
  потребует static mapping/packaging и проверки cache/Range/нагрузки. Крупный Phaser
  bundle даёт обычное предупреждение Vite>500kB, оно не подавлялось.
- Гостевые saves между5173и8000не переносятся автоматически. LocalStorage не защищён
  от подмены. Нет серверных начислений/кошелька/инвентаря/anticheat/рейтинга/платежей.
- SQLite проверена; MySQL/PostgreSQL и Filament5 — последующие этапы.

## Документы и следующий этап

Созданы ROADMAP, ARCHITECTURE, PRODUCT_SPEC, PROGRESSION_SPEC, COMMERCE_SPEC,
RUN_SECURITY_SPEC. Зафиксированы уровни1–10, XP boundaries, бонусы, stable item IDs,
manual24hboost, credit ledger/atomic idempotent purchases/refunds, pause shopping,
death_pending/revive и единый leaderboard с серверными проверками без обещаний anticheat.
Исторический PLAN.md не менялся; AGENTS обновлён под новую область авторизации.

Следующее отдельное рекомендуемое задание: **Account & Character Progression**
(этап02 roadmap), с проверяемой границей доверия run и утверждённым конфигом rewards.
Автоматического перехода нет. `docs/done/NN.done` для исторического runner не создавался.
