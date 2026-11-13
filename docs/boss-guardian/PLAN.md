# Enrage Boss Aggression / Guardian Orbs

База6903506, чистая main; feature/enrage-bosses-guardian-orbs. Без push/merge/deploy.
Исходный архив .tmp/boss-guardian/source-before.zip, baseline.json и baseline FPS.

До600s сохранить расчёты/атаки/Guardian laser+meteor: главный запрос сохраняет
первые10минут. С600s активные и новые Guardian переключаются на orbs с полным
предупреждением, старые owner hazards удаляются. Это явное решение по границе
между общей заменой Guardian и требованием не менять первые10минут.

Enrage birth index общий для успешных boss spawn после600, не интервалов. Один
снимок прежней time aggression × заданная таблица рождения, без изменения HP/dmg.
Уже живые боссы после600 не масштабируются повторно. Charger controller прежний,
его итоговые caps сохраняют принятые movement1.92/frequency2.6. Magic caps3.072/5.2,
полные normal windups; recovery>=.55/approach>=.7. Успешный index1..6 даёт
movement1.1..1.6,frequency1.15/1.3/1.45/1.6/1.75/2,volley3/4/4/5/6/7.

Детерминированный teleport: finite ring в текущем viewport вокруг игрока,
без пересечения игрока/heavy enemies. Мир бесконечный, стен/краёв карты нет.
Сигнал.45s, post-tell.55/.6s, contact grace до конца tell+.15. Если игрок занял
точку назначения — отменить цикл, не переместиться в hitbox. Отдельные цвет/форма
порталов и паттерны: Sorcerer направленный fan+runes, Eclipse broken ring+phase2.
Никаких новых timers/listeners/textures; depth20 Graphics рисует пиксельные cues.

Guardian stationary: awakening/stagger/leash/reward/HP прежние; orb warning.6s,
slow затем через10s fast, повтор10s, cap2/owner, global hostile48/total96.
Скорость относительно постоянной скорости игрока (.6/.85), ограниченный turn rate,
TTL/range/path length, попадание одно, owner cleanup на всех существующих путях.
Все попытки ограничены, нет catch-up debt. Новые optional pool fields явно очищать.

Baseline сильного Mage56:55legalchoices,все5skillsV+5evolutions,8artifacts
(damage3/CDR3/health2),240HP,speed189. Три seed12:00 и один15:00,180s,dt.05,
без test invulnerability, fixed build skips offers only. Это приближение ручного
билда; реальные неизвестные выбранные stats/artifacts не выдавать за совпадение.
