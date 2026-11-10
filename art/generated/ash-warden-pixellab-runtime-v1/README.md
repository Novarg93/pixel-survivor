# Ash Warden — принятые PixelLab north slam и meteor в игре

Подключены по прямой приёмке пользователя из
`../ash-warden-north-meteor-review-v1/`. Новых AI-запросов/списаний нет.
Исходные PNG скопированы пиксель в пиксель, включая скрытый RGB при alpha0.

`public/assets/hd/ash-warden-pixellab-v1/`:

- north.png/json:21кадр256²,padding2,780×1820,5 678 400RGBAbytes.
- meteor.png/json:39кадров128²,padding2,1056×660,2 787 840RGBAbytes.
- Всего60кадров/8 466 240RGBAbytes. Полные native canvas, без trim/resample.

`ashWardenPixellabPack.ts` / `ashWardenPixellabManifest.json` задают кадры,
пивоты, темп и pure presentation helpers. `ashWardenPack.wardenPose` выбирает
новое тело только для basicMelee/north. Позиция удара12 сопоставлена с точным
симуляционным контактом650/1.15мс; полный1043мсклип сопоставлен с1200/1.15мс.
Два южных/боковых набора, касты, рывок, Flame Strike и остальные позы прежние.
Для phase3 сохраняются общие угольки; старую маску другого замаха поверх
нового тела не накладываем.

FinalBossArt использует AI warning/flight/impact+dissolve для всех владельцев
метеоров (boss/arena), читая `m.age`, `m.warning`, `m.landed`. Отложенные отрицательные
age скрыты. До удара quiet loop, затем300мсполёта по оси50.673° вниз-влево;
500мсудара/затухания до alpha0. Пивот передней точки29,103, наземный61,65.
Мягкая AI-подсветка alpha0.5; прежняя точная граница опасности radius42 и дуга
времени предупреждения поверх неё сохранены. Physics/World/FinalEncounter/
баланс/цели/наказание за попадание не изменялись. Удар учитывает epsilon симуляции,
поэтому на первом landed тике не появляется пустой кадр.

GameArt загружает2атласа однократно и применяет NEAREST. Пулы FinalBossArt
и общий lifecycle прежние, нет новых таймеров/listeners/интервалов. Диагностика
различает новый источник текстур, кадры/пивоты, учитывает обе страницы в totalAtlasBytes.
Старый основной атлас оставлен для других поз и истории.

Guard: `scripts/verify-ash-warden-pixellab-integration.mjs` разрешает ровно
3изменённых и6новыхruntime файлов из исходного345baseline.342старых сохранены.
Текущая инвентаризация351. `integration-verification.json` содержит итоговыеSHA.
`audit.json` содержит все60источников/хэшей и параметры упаковки.
Builder: `scripts/build-ash-warden-pixellab-runtime.mjs`.

Browser1280×720/844×390 на двух картах прошёл: настоящий north контакт,
freeze/pause, warning/flight/impact/transparentfinish, cleanup,3restartcycles.
Текстуры140.783MiBdesktop/136.283MiBmobile, лимит144MiB. Canvas PNG и evidence
JSON в `screenshots/`; открыты и просмотрены north-overhead, meteor-flight,
meteor-impact, mobile north-contact/meteor-warning.

Полный итог проверок — в `docs/PROGRESS.md` от корня проекта.
