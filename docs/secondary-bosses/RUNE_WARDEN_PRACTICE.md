# Rune Warden — тренировка1×1

2026-11-08. В главном меню добавлена отдельная кнопка **«Бой с Хранителем рун»**
рядом с **«Бой со Стражем»**. Она работает в production, без `?test=1`.

Создаётся ровно один Rune Warden с обычными HP/уроном/AI. Готовый Mage54/HP200
получает тот же законный билд и ледяную ульту, что в тренировке Ash Warden.
Защиты от урона нет. Босс взят из первого Enrage cohort на630s: доступны
Arcane Volley, Runic Judgement и Blink; время дуэли на HUD начинается с00:00.

Фоновые обычные/элитные враги, другие боссы, Guardian и автоматический переход
к Ash Warden отключены на всю дуэль, включая20min+. Босс не исчезает при
удалении игрока. Победа после убийства Rune Warden, поражение после смерти героя;
owned projectiles/руны/эффекты очищаются. Дополнительных XP/chest/level-up нет.
Тренировки не сохраняются в рекорды или статистику. «Начать заново» повторяет
именно Rune Warden; главное меню → обычный забег возвращает стандартные правила.

Файлы: `config/bossPractice.ts`, `bootstrap/preparePracticeMage.ts`,
`bootstrap/startRunePractice.ts`, `startBossPractice.ts`, World/FinalEncounter,
GameScene/bridge, MainMenu/App/GameHUD. Добавлены `rune-practice.test.ts` и
`rune-practice.spec.ts`, production smoke для новой кнопки.

Проверки:95 файлов/768 unit, typecheck/lint/build PASS;8/8 браузерных сценариев
обеих тренировок и9/9 production. Дополнительный целевой повтор4/4 Rune practice
содержит18PNG и3JSON в `screenshots/rune-warden-practice/`:1280×720,
844×390,740×360, menu/entry/cast/result, keyboard/touch/gamepad, настоящий бой
до победы на desktop и740, defeat fixture на844, restart и сохранность storage.
Отдельные arena screenshots снимаются со скрытым pause overlay.

Unit отдельно проверяет единственного босса после20min, запрет внешних spawns,
отсутствие despawn на5000units, однократную победу, cleanup, pause/defeat и
прохождение всех трёх атак реальным Mage без тестовой неуязвимости. Старые
deterministic replay fixtures проходят. Первый UI-прогон нашёл неверную подпись
дуэли и недостаточный отступ рекорда от footer; оба исправлены, assertions сохранены.

Полный исторический E2E набор не запускался. Блокеров нет. Commit/push/deploy
и новые номерные done-маркеры не создавались. Следующий шаг — ручная приёмка.
