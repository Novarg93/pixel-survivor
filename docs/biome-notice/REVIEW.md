# Grove: пятисекундная смена и анонсы — 2026-11-06

Новая настройка по ручной приёмке:

| Время | Смена | Анонс |
| --- | --- | --- |
| 05:00–05:05 | normal → dusk | Сумеречная роща |
| 10:00–10:05 | dusk → dying | Умирающая роща |
| 15:00–15:05 | dying → burning | Горящая роща |

До порога сохраняется прежний вид. Art pack,координаты,плавное смешивание,
атмосферные эффекты,таймеры/состояние World и gameplay RNG сохранены.
Следующие текстуры по-прежнему готовятся скрыто по одной поверхности за кадр
в течение5секунд перед порогом,без изменения видимой карты заранее.

Текстовый анонс появляется в начале смены на5игровых секунд. Есть заголовок,
короткое описание и индикатор оставшегося времени. Последние0,5s дают плавное
затухание. Pause/Level Up замораживают всё по elapsed,без setTimeout/CSS timers.
Death/menu/restart не оставляют анонса. Текст не принимает клики/касания,
не крадёт фокус;live region polite озвучивает его средствами доступности.
DEV setVisualTime управляет только окружением и не создаёт ложных UI-анонсов.

Файлы этой итерации:

- src/game/config/atmosphere.ts — новые окна,тексты и длительность анонсов.
- src/ui/biomePhaseNotice.ts,src/ui/components/BiomePhaseNotice.vue —
  расчёт по snapshot и адаптивный UI; подключение в GameHUD.vue.
- unit atmosphere/grove-evolution/biome-phase-notice — границы,blend,жизненный цикл.
- E2E atmosphere-milestones/atmosphere/grove-evolution/biome-phase-notice —
  реальные5секундные переходы,новые midpoint302.5/602.5/902.5,текст/пауза/layout.

## Визуальная проверка

Фактический Canvas открыт на1280×720 и844×390. На mobile баннер имеет ширину280px
и top86px,на desktop —360px/top116px. Не перекрывает run clock,boss bars,
skill dock и Blink. Корректность родительского main также проверена.

| Фаза,середина перехода | Desktop | Touch landscape |
| --- | --- | --- |
| Dusk05:02.5 | [PNG](../../screenshots/biome-notice/dusk-1280.png) | [PNG](../../screenshots/biome-notice/dusk-844.png) |
| Dying10:02.5 | [PNG](../../screenshots/biome-notice/dying-1280.png) | [PNG](../../screenshots/biome-notice/dying-844.png) |
| Burning15:02.5 | [PNG](../../screenshots/biome-notice/burning-1280.png) | [PNG](../../screenshots/biome-notice/burning-844.png) |

## Проверки

Финальный check:608/608 unit в74файлах,typecheck/lint/build exit0.
Все18связанных E2E прошли за4,2min:окна/пауза/анонсы,150+3soak,рестарты,
World/RNG,legacy records,Fire/Frost,настоящий fullscreen. После визуального
просмотра исправлен scoped CSS mobile selector. Координаты/размеры и ширина
родительского main проверены повтором обоих новых viewport-сценариев:
2/2 за23,9s,exit0. Никакие assertions не ослаблены. Production7/7 за32,9s,
exit0;git diff --check exit0. Полный58minнабор предыдущей арт-итерации
не повторялся и не выдаётся за проверку этой новой версии.

Логи:CHECK.log,E2E.log,LAYOUT.log,PRODUCTION.log в этой папке.
Блокеров нет;работа остановлена для ручной приёмки.

Исходные JSON:1280.json и844.json в этой папке. Native fullscreen проверяется
на desktop Chromium; touch viewport эмулирован,физический телефон не проверялся.
Без новых зависимостей,веток,commit/push/deploy и done-маркеров.
