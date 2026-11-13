# Flame Strike — ускорение второй половины

По просьбе пользователя первые6 кадров остаются150ms (900ms замаха), кадры6–11 получают75ms вместо150ms. Визуальный клип сокращён1800→1350ms. Исходные12поз, timings в art manifest и атласы не редактируются: `CLEAVE_PLAYBACK` задаёт отдельную runtime длительность кадров. Body и emission используют один индекс.

Попадание остаётся на900ms; огонь C, damage64, активное окно150ms и recovery750ms сохранены. После окончания ускоренного клипа финальная поза удерживается до прежнего конца recovery; скорость AI не повышалась.

Проверено:4новых unit cases, все682теста в86файлах с `vitest run --maxWorkers=2`, typecheck/lint/build PASS. Обычный `npm run check` дважды упёрся в существующий5s timeout survival-enrage seed12345 (5086/5268ms); timeout/assertions не менялись, ограничена только конкуренция проверочного прогона. E2E6/6: новая скорость desktop/mobile, регрессия Flame Strike и полного боя. Просмотрены игровые Canvas screenshots; trace подтверждает все12кадров, попадание~0.90–0.92s, финальная поза~1.28–1.30s. Проверены467source hashes и неизменность основного атласа/config/combat относительно main. `git diff --check` PASS.

Timings/trace/screenshots: `art/generated/ash-warden-flame-strike-timing-v1/`. Новых генераций/commit/push/deploy нет.
