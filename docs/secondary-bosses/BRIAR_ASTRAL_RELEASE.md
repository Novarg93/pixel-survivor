# Armored Briar Beast and Astral Revenant release

2026-11-08. Пользователь принял реворки и явно запросил push в main.
Это разрешение относится к текущим законченным изменениям после Rune Warden.

Armored Briar Beast заменяет прежнее изображение Тернового тарана: walking,
attack и charge используют пользовательские кадры, только left/right с точным
зеркалом. Базовая скорость24→31.2 по принятой настройке+30%.

Astral Revenant: walking/casting left/right, модель+15%, статичный/летящий/
исчезающий снаряд, телепорт с рунами Rune Warden. Все его снаряды×2 быстрее:
ранние170ед/с, Enrage190ед/с до прежнего late multiplier. Стрелки перед залпом
убраны. Ground Blast заменён четырьмя соседними сегментами некротического огня:
предупреждающая подсветка → выбранный PixelLab spawn B → наш idle → исходный
spawn вперёд для despawn. Размер пламени уменьшен примерно на30%, зоны34×20,
шаг34.0.6s появления,3s idle,0.6s исчезновения. DOT0.35урона босса раз в1s
только внутри активного сегмента, без stacking на стыках, с обычной защитой.

Текущая кнопка меню — «Бой с Хранителем затмения»: реальная дуэль1×1 без
других мобов, Mage54, штатные способности/урон, restart той же дуэли. Ash Warden
сохранён отдельной кнопкой. Pause, Ultimate freeze, смерть владельца, конец
забега и перезапуск корректно держат/очищают owned эффекты.

В пакет входят runtime atlases, builders и все24исходных PNG/GIF двух моделей
из manifest. Helper PNG codec уже хранится в репозитории. Непринятые AI варианты,
локальные диагностические файлы, кэши и результаты временных прогонов исключены.
Selected B provenance сохранена рядом с его исходниками.

Проверки до подготовки коммита:825unit/100files,typecheck/lint/build PASS,
Astral Canvas4/4 PASS. Final B atlas126frames1056×2112,PNG260917bytes,
8921088RGBA bytes. Старые117кадров, включая idle/despawn, не изменились,
9принятых B кадров совпадают с исходными цветами/alpha. Повторная сборка всех
трёх runtime outputs побайтно идентична.

Выбранные изображения:

- [Тестовая дуэль из меню](../../screenshots/astral-revenant-practice/menu-1280.png).
- [Briar attack](../../screenshots/briar-beast-v1/grove-1280/melee-hit.png).
- [Briar charge](../../screenshots/briar-beast-v1/burning-1280/left-charge-travel.png).
- [Spawn B](../../screenshots/astral-flame-spawn-b/grove-1280/spawn-b-rise.png).
- [Наш idle](../../screenshots/astral-flame-spawn-b/grove-1280/idle-first-tick.png).
- [Наш despawn mobile](../../screenshots/astral-flame-spawn-b/burning-844/forward-vanish-middle.png).

Экспорт точного staged tree проверен отдельно: npm run check PASS,
825unit/100files,typecheck/lint/build. Его production build на отдельном
локальном preview прошёл9/9 E2E: обычная игра, обе кнопки практики,
desktop/mobile/controller и отсутствие внешних ресурсов/DEV hook.
Зависимости использованы существующие, зафиксированные package-lock;
новые пакеты не устанавливались. git diff --cached --check PASS.
Полный исторический E2E не повторялся. Deploy не выполнялся.
