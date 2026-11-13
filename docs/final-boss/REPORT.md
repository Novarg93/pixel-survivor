# Страж Пепельной Рощи — результат реализации

Реализована отдельная финальная встреча после20:00 на существующем
main@0388cf49015d89cb241c5142db81dd3bfc6b9930. Работа не закоммичена и не
отправлена. Входной PIXEL_SURVIVOR_FINAL_BOSS_SPEC.md сохранён без изменений.
Промежуточных остановок для одобрения не было. Следующий шаг — ручная приёмка.

## Получившийся бой

- Intro2.5s:старые угрозы исчезают без наград;тот же World сохраняет билд,
  текущие HP/Absorb,лут,XP,артефакты,бафы,cooldown и активную ульту.
- Phase1:первый combo не раньше3s после intro;подход72,locked charge
  0.7/0.45/0.25s до300units,затем меч0.9/0.15s,сектор170°/280 и recovery2s.
  Начала combo разделены12незамороженными секундами. Body contact без урона.
- На70% обязательны3стационарные опоры на550 вокруг босса,арена800.
  Щит действительно блокирует все источники урона и исключает босса из
  auto-target. Одинарные boss meteors каждые8s,warning1.3s,radius42.
  Опоры выпускают по одной сфере:первые2/4/6s,затем8s,warning0.65s.
- Последняя опора отменяет boss meteor и открывает3sокно. После50s открытого
  незамороженного боя возможен единственный повтор2опоры по75%HP.
- На30% обязательна phase3,повтор щита запрещён. Аренный Армагеддон:
  5меток,через1.55sещё4;падение через1.3s,период15s,первый через3s.
  Combo и залп координируются;новая схема проверяет достижимый безопасный
  endpoint без Blink. Объявленные точки не сдвигаются.
- Freeze останавливает boss/support clocks и одиночный boss meteor;
  аренные метки продолжаются. Fire поглощает сферы,наземные удары сохраняются.
  Прежние ultimate caps/условия выбора/заряд не заменены.
- Победа только после смерти Стража. Record сохраняется сразу,смерть1.8s
  — presentation;defeat имеет приоритет. Nova из карточки тоже завершает бой.
  Удерживаемые клавиши не вызывают новый забег.

## Новый оригинальный арт

Отдельный128×128actor:закрытый шлем,корневые наплечники,слоистая броня,
рваный плащ,двуручный клинок с отдельным хватом. Не использует старого моба.
252atlas frames,223разных изображений,3набора направлений +left flip.
Есть spawn,idle,walk,chargewindup/travel/brake,swordwindup/active/recovery,
ritualenter/channel,meteorcast,shieldbreak,transition,hit и10кадров смерти.
Phase3 сохраняет отдельную поднятую стойку и шаг со светлыми трещинами.
Падение нарисовано отдельными сочленёнными позами;меч оседает отдельно.
Все252кадров проверены на края — обрезаний нет. Новая текстура preload,
на restart не загружается повторно. Подробности и ограничения в ART.md.

## Числа и измерения

HP108000,опоры1800/1350. Абсолютный charge/sword/meteor/orb урон48/64/54/24;
на200HP это24/32/27/12%. Нет адаптацииHP к билду или legacy Enrage scaling.
Типичный законный билд54level/53choices с одной ультой побеждает в симуляции
примерно за115–120s;высокий60level/59choices —87–90s. Умеренный36level/35choices
может потребовать около398s и второй щит,некоторые пилоты проигрывают.
54полных прогона +6dodge/cap audits,3билда,3отдельные ульты,seed42/713,
AFK/движение/full pilot. Доказательство на реальном RAF и сырые JSON сохранены.
Автопилот не доказывает удовольствие человека. Подробности в BALANCE.md.

## Совместимость и проверка

Старые records дополняются ashGuard:0 до валидации,исторические победы
помечены legacy-survival,включая DarkForest. Новые имеют final-boss и
метаданные встречи. Pre20 replay hashes сохранены с нормализацией только
добавочных полей. Управление/публичный Mage/landscape-правила прежние.

Команды и точные результаты — QA.md. Check:653/653unit,типизация/lint/build.
Production:7/7. Полный E2E:374/376 за19min,все16новых final-boss PASS.
Два старых UI test probes исправлены без изменения игровых200ms и без
ослабления границ:их полные файлы19/19,плюс5повторов. Полный376suite после
этих исправлений измерения заново не запускался;единый зелёный full run
не заявляется. Публичный production smoke и minified World victory/defeat
проверяются отдельно;полная победа public production UI не заявляется.
Мобильная viewport-матрица и native fullscreen проверены Chromium.
Физические устройства не тестировались. Performance/VRAM границы описаны QA.

## Файлы

Основная логика:config/finalBoss.ts,systems/FinalEncounter.ts,World.ts,
EnemySystem,RareGuardianSystem,GuardianOrbs,MobilitySystem,UltimateSystem,
общие enemy types/score/radar. Presentation:FinalBossArt.ts,ashGuardPack.ts,
GameArt/GuardianAnimation/GameScene,AudioPresentation/catalog.
UI:FinalBossBar.vue,App.vue,GameHUD/GameRadar/RunStatistics;storage.ts.
Арт:public/assets/hd/ash-guard.{png,json},scripts/ash-guard-art-source.mjs,
build-ash-guard-art.mjs,inspect-ash-guard-art.mjs. Built audit:verify-final-built.mjs.
Unit/E2E:final-boss*,ash-guard-art,finalBossTrial,актуализированные старые
run-finish/asset-registry/earlyReplay/HD/audio/gamepad fixtures и точные
test probes в levelup-hotfix/upgrade-identity-charge.

docs/ и screenshots/ игнорируются существующим.gitignore и сохранены локально.
Force-add не выполняется. Никаких новых done-маркеров старого плана.

## Ручная проверка

Обновление по следующему запросу пользователя:в главном меню теперь есть
кнопка «Бой со Стражем». Она запускает реальную тренировку с Mage54/Frost,
200HP и штатной intro,без ожидания20минут. Результат не попадает в рекорды.
Кнопка доступна и в production;консольный способ ниже остаётся DEV-альтернативой.

1. Оценить [масштаб](../../screenshots/final-boss/scale-comparison.png),
   [позы](../../screenshots/final-boss/contact-sheet.png),
   [движение меча](../../screenshots/final-boss/animation-sequence-1280.png) и
   [падение](../../screenshots/final-boss/death-sequence-1280.png).
2. В обычном npm.cmd run dev пройти встречу своим билдом,особенно оценить
   замах/удар и ясность направления;проверить путь по трём опорам.
3. На физическом телефоне landscape оценить sword/meteor warnings рядом с
   Fire/Lightning и joystick,затем fullscreen/поворот/возврат из фона.
4. Оценить длинный бой умеренного билда и второй щит;подтвердить сложность
   и художественное качество перед любыми commit/push/deploy.

Для быстрого локального предпросмотра:запустить npm.cmd run dev,открыть
http://127.0.0.1:5173/?test=1,нажать «Начать забег»,затем выполнить в консоли:

```js
const { finalBuild } = await import('/tests/helpers/finalBossTrial.ts');
const w = window.__PIXEL__.world;
w.options.spawnRate = 0;
w.encounterDirector.nextAt = 1e9;
finalBuild(w, 'typical', 'frost');
```

Это существующий DEV harness и тот же проверенный helper:достижимые ранги
применяются через applyUpgrade,время ставится1199.9. Нет бессмертия,правокHP
босса или удаления опор. Далее бой идёт обычным управлением. Для другой
ультимативной способности начать новый забег и заменить frost на lightning
или fire;профили moderate/typical/high. В production этот способ недоступен.
