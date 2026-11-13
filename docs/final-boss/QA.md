# Финальная проверка Стража

Дата:2026-11-06. Локальный main@0388cf49015d89cb241c5142db81dd3bfc6b9930.
Использованы текущий исходный код, Node/npm.cmd и проектный Chromium/Playwright.
Без новых зависимостей, веток, commit/push/deploy. Входное ТЗ не изменялось.

## Команды и результаты

|Проверка|Результат|Доказательство|
|---|---|---|
|Baseline до правок: npm.cmd run check|PASS,614unit,типизация/lint/build|вывод baseline-команды; прежний gate в docs/TEST_REPORT.md|
|npm.cmd run check,после финальной стойки phase3|PASS,653/653,81файл,типизация/lint/build|check-final.log|
|Дополнительный dodge/cap audit|PASS,1test,6полных законных боёв|dodge-cap-audit.json|
|Первый полный E2E|365/370,5FAIL разобраны и исправлены|e2e-full.log|
|Повтор каждого исправленного случая|PASS|вывод targeted-команд;проверяется повторно в e2e-final.log|
|Все16новых final-boss E2E после gameplay-исправлений|PASS,16/16,4.8min|acceptance.log|
|Повтор1280 с новой смертью,phase3 stance/walk и покадровым захватом|PASS,1/1,26.9s|.tmp/final-boss-phase3-final|
|Повторный полный npm.cmd run test:e2e -- --workers=4|374/376,19.0min;2ошибки измерения старых UI-тестов|e2e-final.log|
|Исправленный levelup-hotfix файл|PASS,13/13,26.0s|levelup-suite.log|
|Пять повторов исправленного timing probe|PASS,5/5,15.8s|levelup-timing.log|
|Исправленный upgrade-identity-charge файл|PASS,6/6,31.1s|upgrade-identity-suite.log|
|npm.cmd run test:e2e:production|PASS,7/7,31.0s на последнем build|production-acceptance.log|
|node scripts/verify-final-built.mjs|PASS,victory120.15s/defeat77.75s|built-runtime.json|
|Финальный последовательный performance E2E|PASS,2/2,38.2s|performance-final.log,performance-serial-*.json|
|git diff --check|PASS,exit0;только предупреждение LF→CRLF|финальная Git-сверка|

Пять ошибок первого полного прогона были устаревшими fixtures/assertions:
список PCM не учитывал новый оригинальный ashSword; второй случайный
gamepad offer мог законно повторить предыдущую карту; общий role=status
находил ещё и biome-announcer; два HD assertions не учитывали новый atlas.
Сохранены проверки исходных PCM hashes, полного input pipeline и уникальности
загрузки ассетов. Нет skip,ослабления error checks или выключенных suites.

Окончательный полный прогон содержит два FAIL до исправления test probes:

1. Levelup commit измерялся на следующем RAF и дал290.9ms при границе280ms.
   Теперь измеряется actual accepted selectUpgrade,а observing RAF пишется
   отдельно. Граница180–280ms и все проверки frozen World/одного выбора
   сохранены. Новая трасса показывает commit207.4ms и observing RAF287.5ms.
2. Upgrade identity требовал frozen elapsed после screenshot,который может
   длиться дольше законного200ms commit. Второй input и frozen assertion
   перенесены перед capture;проверки selected/focus/one-upgrade сохранены.

Игровой код подтверждения карточек не менялся. Оба полных исправленных файла
прошли19/19,плюс5повторов timing. Полный376suite после этих двух исправлений
test probes заново НЕ выполнялся;это не единый зелёный376/376прогон.
Raw:levelup-commit-trace.json,.tmp/final-boss-full/*/error-context.md.
Все16новых final-boss сценариев прошли в этом же полном прогоне.

## Матрица поведения

|Сценарий|Статус|Покрытие|
|---|---|---|
|20:00,тот же World/build/HP/Absorb/cooldown/ultimate|PASS|unit,живой вход,queued offer и продолжающийся Dash|
|Очистка старых угроз без kill/XP/loot,нет старых волн|PASS|unit и entry Canvas|
|Intro2.5s,без body damage,первый combo≥3s|PASS|unit и реальный RAF|
|Locked charge,8направлений,swept collision при dt.01/.033/.05|PASS|contracts и Canvas|
|Sword4направления,170°/280,one contact/Absorb/protection|PASS|contracts,desktop/mobile записи|
|70/30 gates,burst/DoT/ульты не перескакивают фазу|PASS|unit и lawful full encounter|
|3опоры,stationary,без legacy scaling/expiry/артефактов|PASS|unit,3→2→1 beams,дальний target|
|1orb/owner,86speed/0.65turn/20TTL,предупреждение|PASS|unit и живой ritual|
|Shieldbreak cancels boss meteor;3sopen;1repeat2опоры|PASS|unit и умеренный balance pilot|
|Arena5+4,1.55s,warning1.3s,first3s,interval15s|PASS|unit,Canvas,group audit|
|Нет combo поверх залпа,достижимая escape point|PASS|центр/край,135speed,без Blink;deferral при speed0|
|Freeze clocks boss/support,arena продолжает|PASS|unit,real frozen beams/Armageddon|
|Fire поглощает сферы,ground impact остаётся|PASS|unit и Fire Canvas|
|100/200/260HP и Absorb20,абсолютный урон|PASS|реальные health upgrades/artifacts|
|Победа только от смерти,defeat precedence,lethal supply Nova|PASS|unit,built runtime,реальный Vue card click|
|Record до1.8s,reload during death,один результат|PASS|results E2E|
|HeldSpace/repeat не рестартует,свежийEnter работает|PASS|results E2E,input regression|
|Legacy missing ashGuard:0,DarkForest,старая победа|PASS|storage/record tests|
|Pause/blur/upgrade/portrait freeze,fullscreen/resize|PASS|actual browser API,DPR2 fullscreen без mock|
|Mute/reduced/нулевыеэффекты:опасные круги видны|PASS|пиксельный probe реального screenshot +PNG|
|10scene restarts,listeners/pools/clocks без роста|PASS|каждый основной viewport,visual-WIDTH.json|
|1280×720,1920×1080,844×390,740×360,1024×768|PASS|полная ключевая visual-матрица|
|Portrait:заглушка,без активного боя|PASS|mobile E2E|
|Физический телефон/геймпад|NOT RUN|эмуляция Chromium не заменяет устройство|

## Что именно проверено в production

Public preview проверяет Vue/Phaser,ввод,загрузку ash-guard atlas,отсутствие
dev harness/debug overrides,неизвестных внешних запросов и ошибок загрузки.
Полный живой бой до victory — dev harness,законный билд и обычный RAF,
без ручного сниженияHP,бессмертия и удаления опор.
Отдельно actual World с trial helper собран Vite в minified ES library
в.tmp/final-boss-built;в ней получены victory и defeat. Этот модуль не
поставляется в dist. Полная победа в публичном UI production НЕ заявляется.

## Производительность

Последовательные образцы на финальной версии после полного прогона сохранены как
performance-serial-{1280,844}.json. Chromium156.0.8078.4,DPR1,
Ryzen5 7500F,12logical cores,31.6GiB RAM,headless desktop.
Каждый образец3200ms:обычный baseline1170s150+3+3,вход20:00,
phase3 отдельно с Lightning/Frost/Fire. Новая текстура предзагружена во всех
образцах:это сравнение нагрузок текущего кода,не замер старого checkout.
Median около59.88FPS,p95frame16.7–16.8ms,p95Scene.update baseline1.4ms,
entry/ультимейты0.4–0.7ms. Phaser clocks[0,0,0],projectiles≤96,
нет ошибок страницы. Test-only invulnerability применяется только здесь,
не в доказательстве баланса. Итоговые performance-WIDTH.json и serial-копии
содержат именно этот отдельный прогон с1worker без конкурирующих браузеров.

|Viewport|Пик всех Phaser objects baseline/entry/ults|Texture sources baseline/ults|Source RGBA baseline/ults|
|---|---|---|---|
|1280×720|423/521/523|61/61|62266160/62266160bytes|
|844×390|399/497/496|37/34|55974704/55188272bytes|

Objects включает скрытый пул и поэтому является верхней границей активных,
а не подсчётом только видимых. Меньше mobile sources после движения —
обычный recycle чанков. Bridge listeners commands/snapshots/metrics=1/1/1
во всех образцах. На10restart отдельно проверяется равенство resource counters.

15.75MiB атласа — арифметический RGBA source size,не измеренная VRAM.
Нет утверждений о FPS на физическом телефоне или аппаратном GPU пользователя.

## Визуальная приёмка

Настоящие Canvas PNG,видео и последовательности с timestamps сохранены в
screenshots/final-boss/. Реально открыты sheet/scale,desktop/mobile intro,
ritual,направленные sword,freeze beams,Fire/Lightning,zero effects и
реальные последовательности combo/death. После просмотра исправлены padding
меча,тень/foot pivot,mobile edge indicators,фон результата и позы смерти.
Художественное качество,ощущение меча и удобство физического устройства —
следующая ручная приёмка пользователя,не автоматический PASS по unit-тестам.
