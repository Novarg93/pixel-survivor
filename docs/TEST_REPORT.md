# Pixel Survivor — итоговый отчёт проверки

## 2026-11-11 — точный состав публикации main без новых демо

- Проверена отдельная копия индекса Git в `.tmp/main-publish-check`, только
  файлы будущего коммита и прежние файлы HEAD, без локальных новых review.
- `npm run check`:146файлов/1104unit PASS, typecheck/lint/build PASS.
  `.tmp/main-publish-clean-check.log`. Число меньше локального набора:
  новые отдельные тесты демо исключены, игровые проверки включены.
- DEV E2E22/22 PASS,2.0мин: fire-radius, fire-ultimate-runtime,
  frost-ultimate-runtime, miniboss-assets-audio, visual-cleanup-runtime,
  music-runtime и rune-warden;1worker, отдельный порт5175.
- Production E2E13/13 PASS,54.2с, порт4175; без DEV harness.
  Логи `.tmp/main-publish-clean-e2e.log` и `main-publish-clean-production.log`.
- Canvas Fire1280, Rune cast1280 и Frost rune844 фактически просмотрены;
  снимки в `.tmp/main-publish-check/screenshots/`, в коммит не включаются.
- Дополнительный аудит проверяет136файлов индекса против проверенной копии,
  отсутствие новых HTML/viewer/screenshots/body-mask и неизменность415runtime
  файлов. `.tmp/main-publish-audit.json` сохраняет результат перед commit.
- Vite предупреждает о размере прежних chunks. При DEV scan прежний архивный
  meteor-viewer-before.html ссылается на viewer.mjs; это не вход игры,
  pre-bundling догрузил vue/phaser, все22игровых сценария прошли. Новые демо
  для обхода предупреждения не добавлялись, конфигурация Vite не менялась.
- Исторический полный DEV E2E повторно не запускался. Локальные новые демо
  сохранены на диске. Новых done-маркеров нет.

# 2026-11-11 — Fire body mask: восстановление после OOM

- `npm run check`: PASS,150unit-файлов/1112тестов, typecheck/lint/build.
  `.tmp/fire-body-mask-check.log`. Прежнее предупреждение Vite о размере chunks.
- `tsc --noEmit -p art/fire-body-mask-review-v1/tsconfig.json`: PASS.
- `node scripts/e2e.mjs fire-body-mask-review.spec.ts --workers=1`:3/3 PASS,
  28.3с. Стойка/бег с настоящим кастом, восемь направлений, четыре заклинания,
  защита головы/рук, pause/step, переключение original/mask, окончание ульты,
  настоящий restartScene без повторного commands listener, mobile390 без overflow.
- Проверка SHA256/inventory415runtime-файлов: PASS, изменений/добавлений0.
- Canvas PNG реально просмотрены: idle-mask, idle-original, moving-cast,
  idle-north, moving-meteor; также mobile390. Каталог
  `screenshots/fire-body-mask-review-v1/`, evidence.json/directions-spells.json.
  Пересечение защищённых пикселей с огнём0;2image/294912базовыхGPUбайт.
- Во время доработки расширенный тест выявил невидимую для наземных кастов
  цель при zoom4. Исправлено размещение цели в демо, повтор3/3 без ослабления
  ожидания настоящего castAbility. Typecheck выявил повторный доступ к optional
  pose в тесте; исправлено локальным сохранением pose, общий check затем зелёный.
- Старый `.tmp/fire-body-mask-e2e.log`: Node worker OOM до старта теста.
  После восстановления OOM не воспроизведён. Системные настройки не менялись.
  Full gameplay E2E и production E2E в этой задаче не запускались: runtime
  неизменен, новая маска пока только в dev-review. Done-маркеры не создавались.

## Упрощение эффектов / Rune Idle / тихие WAV — 2026-11-11

- npm run check PASS: typecheck, lint,1110unit/149файлов, build.
  Дополнительно отдельный tsc для нового review PASS; повторные20целевых unit PASS.
- Scope411→415:405byte-equal,6presentation changes,4additions.
  Все gameplay/AI/тайминги/радиусы/урон/коллизии/настройки сложности byte-equal.
  Предыдущие SHA proofs сохранены; visualCleanupIntegration — новый явный слой.
- Новый PixelLab Idle:9оригинальных128²PNG,2generations, seed93271,
  job47952de9-92b8-4f94-8e03-c671f97ef85e. SHA source/atlas, pixel equality,
  first frame=input, no clipping PASS. Atlas512×384,786432RGBAbytes.
  Idle пока review-only, порядок0…8…1,160мс/кадр,2560мс/цикл.
- Fire runtime3/3 + Mini-boss art/audio3/3 PASS; итоговый пакет cleanup,
  demo, ambience, Fire inferno/radius13/13 PASS. Ещё17audio/music/Frost
  regression PASS. Всего36разных dev browser-сценариев.
- Production13/13 PASS. Оба новых WAV доступны в сборке;27samples,
  decoded14.57–14.62MB в проверенных сценариях, лимит<15MB.
- Оба новых файла byte-equal исходникам и SHA PASS. Beast1.28с,
  Rune4.16с. Тихий playback gain.12/.14; normalization.664104/2.
  Тест подтверждает единственный старт loop при повторных кадрах,
  шаги только при фактической ходьбе, Rune near.14/far.049, остановку
  при freeze/pause/mute/SFX0/death/removal/restart. В целевом audio
  сценарии peak2loops при общем ceiling5. Voice ceiling12 сохранён.
- Первый тест дальнего мага поставил его за реальный despawn-порог;
  тест исправлен на900world внутри активной карты. Gameplay culling не менялся.
  Первый release-тест смотрел после попадания снаряда; теперь фиксирует
  реальный выпуск до столкновения. Проверки не отключались.
- Canvas просмотрен: Fire без внешнего круга на1280×720/844×390,
  ordinary windup/release без линий, Idle left/right и review390.
  На390px модели вписаны в половины canvas без обрезки посоха;
  iframe масштабирует настоящую960×540 GameScene и не ломает её viewport.
  PNG/JSON: screenshots/visual-cleanup-rune-idle-v1/;
  Fire screenshots: screenshots/fire-ultimate-runtime-v1/ и fire-radius/after/.
- Демо: ./visual-cleanup-review.html, поддерживает file:// launcher → dev5173,
  pause/step/scrub/side/zoom,4реальные сцены и переключатель звука.
  Для прослушивания нужно включить «Звуки» и кликнуть по арене.
- Открытых технических блокеров нет. Новый Idle ожидает приёмки пользователя;
  визуальные удаления и оба тихих звука уже подключены к обычной GameScene.
  Реальное устройство/длительный soak и субъективная комфортность громкости
  этим пакетом не сертифицировались. Прежний Vite chunk-size warning сохранён.

## Принятые Rune Warden v2 и звуки мини-боссов — 2026-11-11

- npm run check: typecheck, lint, 1104 unit / 147 файлов, build PASS.
  После актуализации production allowlist повторные typecheck/lint PASS.
- Новые unit7: шесть исходных WAV SHA/byte equality, один общий teleport,
  source pixels → runtime atlas (оба направления), кадры выпуска/полёта,
  once-per-cast, Astral followup, Beast melee/charge, freeze/pause/cleanup,
  Totem normal/final support release, отсутствие изменений World/RNG и scope.
  Дополнительный audio test исключает двойной synthetic final.orb.
- Целевые dev E2E: Rune4/4; sounds/ultimates19/19; итоговый demo/music/new
  mini-boss10/10 (три новых пересекаются с19). Всего30 разных dev сценариев.
  Реальное воспроизведение всех6 WAV, оба teleport, два выпуска Totem,
  отсутствие frame spam, sample fallback, pause/mute/restart, bounded voices.
- Production13/13 PASS на собственной preview-сессии. Изначально устаревший
  точный allowlist не учитывал10 PNG/JSON огня/льда/Rune v2: добавлены все10,
  проверка не ослаблена. Промежуточный повтор потерял preview-сервер;
  повтор с самостоятельным сервером завершился exit0,13/13.
- Все25 runtime samples загружаются; decoded audio12,535,568bytes,
  budget<13MB. В целевом сценарии peak5voices при лимите12, fallback0.
  Новые6 WAV совпадают с оригиналами и файлами dist по SHA256.
- Canvas PNG просмотрены: cast/projectile1280×720 и844×390, Astral followup,
  Totem release. screenshots/miniboss-assets-audio-v1/ содержит10 PNG
  и2 evidence JSON. Перекрывающий pause dialog скрыт только в тестовом снимке.
- Scope400 →411:395 неизменных,5 presentation edits,11 additions.
  Единственные runtime edits: GameArt, assetRegistry, AudioPresentation,
  catalog, samples. Gameplay/AI/баланс/урон/радиусы/скорости byte-equal.
  Атлас35frames1536×1152 (7,077,888RGBAbytes), nearest filtering.
- Локальное демо игры: ./miniboss-review.html#bosses; включить «Звуки боя»
  и кликнуть арену для audio unlock. Сравнение прежней/принятой графики
  сохранено в rune-cast-review.html, там намеренно нет аудио.
- Блокеров нет. Сохраняется прежнее предупреждение Vite о размере JS chunks;
  long soak/high DPR/реальное мобильное устройство этим пакетом не проверялись.

## Mini-boss music policy / Rune Warden PixelLab v2 — 2026-11-11

- check1096unit/146файлов PASS, typecheck/lint/build; оба review typecheck PASS.
- Music runtime4/4 browser PASS; новый viewer + hub6/6 PASS.
  Мини-боссы оставляют фазовый трек, финальная практика включаетboss.
- Cast13/flight9: каждый исходник SHA/размеры, alpha bounds/clipping0,
  source RGBA→untrimmed atlas pixel equality PASS. Atlas3.24MB decoded.
- Canvas cast/projectile/volley/native/mobile390 просмотрены;
  screenshots/rune-cast-review-v2/. Новый viewer без аудиоконтекста.
- Scope400файлов:толькоAudioPresentation.ts изменён,399byte-equal,
 0runtime additions. Новая графика и её22исходника остаются в art review.
  Старые WAV/MP3 и навыки/коллизии/скорости не изменены.

## Демо энкаунтеров/мини-боссов — 2026-11-11

- check PASS1095unit/145файлов, typecheck/lint/build; viewer typecheck PASS.
- Новые E2E3/3 PASS:20MP3 локально decode59–61с,4boss playback, одинплеер,
  draft choice, настоящие charge/rune volley/stageII flames/fast orb,
  пауза и шаг, responsive390 без горизонтального overflow.
- Все20исходников проверены SHA;4фоновых/боссовый variant2 byte-equal
  текущим runtime MP3.400runtime-файлов и их список неизменны.
- screenshots/miniboss-review-v1/: music1280/390,4босса1440;
  Canvas Rune/Guardian и музыкальная страница просмотрены.
- Прямое file:// открытие launcher проверено в Chromium: redirectHTTP200,
 20кнопок загружены, CORS-проблемы отсутствуют.
- Просмотр боёв требует Vite dev; обычный production build не включает
  эту отдельную DEV-песочницу. Новую музыку в игру ещё не переносили.

## Ледяная руна + импульс — 2026-11-11

- check1093unit/144файла, typecheck/lint/build PASS; review typecheck PASS.
- Новые Frost runtime E2E3/3 PASS: partial→full rune на1280/844,
  один sample, pause/expiry, прежний freeze/урон, missing-WAV fallback.
- Регрессии Fire/Mage/boss audio13/13 PASS, новое combo-демо2/2 PASS.
- Старые Frost art/seal/review11/12 PASS первого прохода; stress844
  прерван HMR во время исправления, отдельный повтор1/1 PASS. Проверки
  не ослаблялись; финальный stress844 median59.88FPS,p95frame16.8мс.
- Полный ряд кадров обычного Frost Nova и16кадров нового импульса
  проверен на1280×720,844×390,390×844;10рестартов сцены и156actor stress.
- Canvas появления/полной руны просмотрены; GeometryMask, не работающий
  в WebGL Phaser4, удалён. Поле раскрывается ростом изображения с импульсом.
- Новый звук1.76с из1.12–2.88с исходника. SHA оригинала сохранён;
  воспроизводимый срез и manifest в scripts/prepare-frost-ultimate-audio.py
  и art/generated/frost-ultimate-runtime-v1/. Scope393→400 PASS:
 4changed/7added/389unchanged. Fire-ассеты и gameplay побайтно прежние.

## Принятая огненная ульта — 2026-11-11

- check PASS:1090unit/143файла, typecheck/lint/production build.
-23 browser PASS: fire-inferno/fire-radius/review10 и fire-runtime/Mage/
  boss-audio13. Проверены0/2/4/6/8pulse, единичный static loop, HP20%/с,
  общий растущий радиус, pause/resume/expiry, fallback,10рестартов,
  reduced-effects/gamepad и156actor stress. Лимиты3loops/12voices сохранены.
- Canvas1280×720 и844×390 просмотрены; пути
  screenshots/fire-ultimate-runtime-v1/mantle-1280.png и expanded-844.png.
- Scope385→393:9changed/8added/376unchanged. PNG/JSON выбранных двух
  PixelLab-клипов побайтно совпадают с review; static с оригиналом.
  Pulse1.8с из3.55–5.35с, fade8/120мс; источник не изменён.
- Обе новые аудиодорожки реально загружаются/декодируются/запускаются
  в браузере; missing-WAV даёт немедленный synthesis fallback без pageerrors.
  Оценка художественной громкости остаётся за пользователем.
- Production build не включает review-сцену; демо доступно через Vite dev.
  Отдельный typecheck review и git diff --check PASS.

## Полная проверка и пользовательский Frost Nova — 2026-11-11

- check PASS:1084 unit /141 файлов, typecheck/lint/build.
- Прежний DEV-набор549 подтверждён с повторами:452 первого прохода,94
  общего повтора,2 исправленных asset-list сценария и1 переименованный
  moving-Blink сценарий отдельно PASS.61 начальное падение — остановка Vite.
- После замены Frost:23 audio E2E +13 production E2E PASS. Автокаст
  воспроизводит новый sample, цель заморожена и получает урон; HTTP SHA
  совпадает с исходником.16 buffers,5228700 decoded bytes,0 fallbacks.
- Источник:frost_nova/frost_nova.wav,1с/stereo48kHz PCM16,192078 bytes;
  gain1.757563. Arcane Shield gain0.55 сохранён.
- Scope384→385:3 audio metadata/README изменения,1 WAV,381 неизменный файл.
- Canvas Frost просмотрен; production desktop/mobile, музыка/SFX,
  input/pause/restarts и отсутствие внешних runtime-запросов проверены.
- Peak smoke60с:median60.05FPS,p95 update1.60ms,0 browser errors.
- Исходники тестов сохраняются; результаты, screenshots/videos и временные
  JSON outputs исключены из этого коммита по указанию пользователя.
- Чистый Git-index checkout без новых результатов прогонов:check PASS1084,
  typecheck/lint/build. Все385 runtime-файлов совпадают с рабочими по SHA.


## Приглушённый Arcane Shield upload — 2026-11-10

- `npm.cmd run check` PASS:1083 unit /141 файлов, typecheck/lint/build.
- DEV E2E PASS9: mage-uploaded-sounds3, mage-sfx4, ash-warden-sounds2.
  Новая проверка подтверждает загрузку arcaneshield.wav вместо старого
  mage-shield.wav; реальное автоматическое создание щита и поглощение
  входящего урона воспроизводят новый sample, HP под щитом сохраняется.
- Новый WAV1с/stereo48kHz скопирован побайтно, SHA совпадает;
  gain0.55, peak после gain≈0.08975, RMS≈0.01080 до cue/bus gain.
  Это уменьшение громкости исходника, без изменения аудиофайла.
- Guard PASS: baseline383 →384,3 разрешённых изменения /1 WAV,
  остальные380 runtime-файлов неизменны, включая Boss SFX и музыку.
  Старые immutable proofs сохранены с точным новым acceptance слоем.
- Визуальные изменения не выполнялись; результаты записаны в
  `art/generated/arcane-shield-sound-v1/` и проектном PROGRESS.

## Пользовательские Ash Warden SFX — 2026-11-10

- `npm.cmd run check` PASS: typecheck/lint/build,1082 unit /141 файлов.
  Новые10 unit проверяют byte/SHA и сохранность Mage keys/gains,
  swing для обоих side-вариантов, slam для north/south/диагоналей,
  Meteor freeze/cancel/dedup, coalescing, настройки и строгий scope.
- DEV E2E:20 уникальных сценариев PASS: ash-warden-sounds2,
  mage-uploaded-sounds2, mage-sfx4, audio8, music-runtime4.
  В первом запуске14 PASS,6 остановились на прежнем4MB PCM-бюджете;
  добавлено ровно1920000 bytes для пяти stereo1s48kHz Float32 buffers.
  После этого6 сценариев PASS, лимиты голосов/loop/nodes не увеличивались.
  ESLint изменённых browser-тестов PASS.
- Реальный Phaser/WebAudio boss test:5 local WAV HTTP/SHA совпадают,
 16 decoded samples,0 sample failures/fallbacks,4862276 decoded bytes,
  peak voices7≤12,0 pageerrors. Проверены source.start ranges300/200мс,
  фактические обе боковые атаки/south/north, Charge→Flame Strike,
 3 последовательных Meteor→6 фазовых воспроизведений, pause/restart.
- Missing5 boss WAV →11 Mage samples сохраняются, procedural fallback
  немедленный; сцену и Mage звук не блокирует. Старые Mage/музыка и
  их сохранённые cache keys/gain/файлы по SHA прежние.
- Runtime audit PASS: baseline376,8 изменений,7 добавлений,368 файлов
  неизменны. Все5 новых WAV побайтно равны исходникам;960390 bytes,
  каждый1с/stereo48kHz, finite/non-silent. Исходные записи не редактировались.
- Canvas screenshots/evidence: `screenshots/ash-warden-uploaded-sounds-v1/`.
  Визуальные/gameplay изменения не делались. Автопроверки не подменяют
  прослушивание пользователем и не доказывают художественную приёмку.

## Пользовательские Mage WAV и thunder ultimate — 2026-11-10

- `npm.cmd run check` PASS: 1072 unit / 140 files, typecheck/lint/build.
  Новые unit3:5 точных WAV/SHA/mapping, hash-versioned cache и gain/retained
  cues; полный inventory370→376 с4 разрешёнными изменениями и6 добавлениями.
  Музыка, её original bytes и streaming-код по SHA неизменны.
- `node scripts/integrate-mage-uploaded-sounds.mjs` декодировал5 WAV:
  4×1с + thunder2с, stereo48kHz, finite/non-silent, sample clipping .999 =0.
  Runtime копии точны по байтам; gain ограничивает исходный peak≤.751.
- DEV `mage-sfx.spec.ts` PASS4: desktop/touchlandscape, все11 актуальных
  samples, Q/Blink, fallback, scene restart и старый source viewer.
  `audio.spec.ts + music-runtime.spec.ts + mage-uploaded-sounds.spec.ts`
  PASS14: audio8/music4/uploads2. Всего18 уникальных DEV-сценариев.
  Новые uploads2 проверяют5 новых HTTP файлов по SHA, прирост samplePlays
  при применении, строго один buffer.duration2s в реальном ultimate release,
  отсутствие5 файлов→сохранность6 старых cues и процедурный Blink fallback.
- Thunder start совпал с world.ultimate.released с точностью кадра; измеренная
  задержка от старта подготовки .53332с (порог симуляции .52). Это аудиопроверка
  реального Q, без изменения тайминга или урона. Pause остановила длинный tail.
  PCM cache2947568bytes, peakVoices8, failedAssets0, sampleFallbacks0, errors0.
- Production `--grep "built approved variant2|built Mage audio|built main menu starts"`
  PASS3: загружены активные5 uploads + 6 retained WAV, их source SHA совпадают,
  вместо прежнего1.2с играет новый2с thunder; принятая музыка и практика работают
  без DEV harness, с одним AudioContext и без внешних ресурсов.
- `node scripts/verify-mage-uploaded-sounds.mjs` PASS: baseline370, changed4,
  added6, unchanged366. Canvas `screenshots/mage-uploaded-sounds-v1/ultimate-release.png`
  реально открыт и визуально проверен; аудиотрасса и список URLs в evidence.json.
- Новых генераций/списаний нет. Блокеров нет; прежний Vite chunk-size warning.

## Принятые вторые варианты музыки в игре — 2026-11-10

- `npm.cmd run check` PASS: 1069 unit / 139 files, typecheck, lint, build.
  Новые 5 unit проверяют фазовые границы 300/600/900с, boss precedence/release
  hold/new run, streaming settings и fallback без дублирования, независимость
  SFX, SHA пяти принятых take2 и точный runtime scope.
- `npm.cmd run test:e2e -- tests/e2e/audio.spec.ts tests/e2e/mage-sfx.spec.ts tests/e2e/ambient-music-review.spec.ts tests/e2e/music-runtime.spec.ts --max-failures=1`
  PASS 21/21. Новые music4: 1280×720/844×390, все 4 фазы, близкий boss и
  возврат, принудительно ускоренный seam→repeat, слышимый RMS-выход, pause,
  music0 с работающим Blink SFX, 3 scene teardown, missing MP3→fallback→recovery,
  pending media play→pause→прибытие файла без autoplay→explicit Continue.
  Прежние audio8, SFX4 и gallery5 проходят; old native stream expectations
  обновлены с двух процедурных beds до одного музыкального stream.
- `npm.cmd run test:e2e:production -- --grep "built approved variant2|built Mage audio|built main menu starts"`
  PASS 3/3: настоящая кнопка практики, boss.mp3 играет с одним AudioContext,
  два native player, пауза останавливает оба; все 5 built MP3 совпадают SHA.
  Сохранены generated Mage SFX и обычный запуск практики; DEV harness отсутствует.
- Новые snapshots обоих размеров: sources 1 после crossfade, players 2,
  repeats 1, crossfades 6, failed [], decoded PCM bytes 1280352, nodes 11.
  После 3 scene restart: contexts 1, playing 0, retained src 0.
  Existing stress 150+3+3 сохраняет ≤12 one-shots/≤3 loops/≤37 nodes и <4MB
  PCM cache. Native streaming buffers управляются браузером и в PCM cache
  не входят; полная память браузерного медиадекодера здесь не измерялась.
- `node scripts/verify-music-runtime.mjs` PASS: 363 baseline, changed6,
  added7, unchanged357. Пять MP3 общей длиной ~300с/7291610bytes точны
  относительно принятых оригиналов; новых AI-запросов/списаний нет.
- Canvas `screenshots/music-runtime-v1/playing-1280.png` и gallery file390
  реально открыты и визуально проверены; evidence JSON и второй Canvas сохранены.
  Художественная приёмка — явный выбор пользователя take2; crossfade не считается
  доказательством музыкальной бесшовности или beat match.
- Прежний Vite chunk-size warning остаётся. Блокеров нет.

## Музыкальная галерея пяти состояний — 2026-11-10

- `npm.cmd run check` PASS: 1064 unit / 138 files, typecheck, lint, build.
  Новые unit3 проверяют5×4 оригинальных MP3, все generation IDs и source SHA,
  реальные decoded duration/envelope/finite/non-silent данные, M3U и отсутствие
  изменений в любом из363 runtime-файлов или их инвентаризации.
- `node scripts/build-ambient-music-review.mjs` PASS:20 полных MP3 декодированы,
  каждый59,999977с, sampleRate44100, конечные значения PCM, RMS0,056–0,161,
  sample clipping threshold .999 =0 у всех; 29166440bytes исходников.
  Воспроизведение и декодирование не считаются художественной прослушкой;
  фактические BPM/гармония/вокал и бесшовность не проверялись автоматически.
- `npm.cmd run test:e2e -- tests/e2e/ambient-music-review.spec.ts --max-failures=1`
  PASS5/5: HTTP/file ×1280/390,20 variant buttons, native playback/duration,
  один играющий трек, repeat и sequence→следующаяфаза→stop, HTTP download,
  local source popup и20 HTTP/source SHA. Первоначальный file download тест
  выявил нативное ограничение браузера; поведение страницы заменено на явное
  открытие исходника. Исправлен формат округления59,99998с в1:00.
- Галерея проверена по реальным screenshots `http-1280.png` и `file-390.png`
  в `art/generated/music-ambient-review-v1/screenshots/`; ещё HTTP390/file1280
  сохранены. Нет overflow/page errors. После финального изменения ссылки
  повторены typecheck/lint. Runtime не менялся; Canvas-проверка здесь не нужна.
- Генерация20/20 completed без failures, один платный batch,18тыс.кредитов.
  Остаток счёта неизвестен. Прежнее Vite chunk-size warning сохраняется.
  Следующий шаг — музыкальный выбор пользователя и подготовка игровых петель.

## Boss Meteor marker и окно результатов — 2026-11-10

- `npm.cmd run check` PASS: 137 unit files / 1061 tests, TypeScript, lint, build.
  Два новых unit: sparse marker без ground image, negative age/landed cleanup,
  радиус42, progress clamp/переопределённый warning, сохранённые flight/impact;
  audit ровно4из363 изменений. Старый тест точного урона54 после1,3с PASS.
- DEV Meteor/north runtime2, Cast/Charge/последовательность2 и targeted
  Meteor2 PASS на 1280×720 и 844×390. Freeze/pause/cleanup/atlas budget прежние.
- `npm.cmd run test:e2e -- tests/e2e/boss-results-layer.spec.ts --max-failures=1`
  PASS4/4: pause/settings stacking, результаты победы и поражения на двух
  размерах, retained ready lightning в terminal UI snapshot, отсутствие
  UltimateControl и корректный restart. Новая fixture была исправлена после
  обнаружения неверного имени кнопки («Готово») и штатной очистки live ultimate
  при смерти; assertions не отключались, timeout не увеличивался.
- `npm.cmd run test:e2e:production -- --grep "built main menu starts|built Mage audio"`
  PASS2/2: реальный бой из меню, все11 локальных WAV и lightning release,
  без DEV harness и внешних ресурсов. После E2E typecheck/lint PASS.
- `node scripts/verify-boss-meteor-ui-fix.mjs` PASS: 363 baseline, 4 changed,
  359 unchanged, added0. Прежние SHA reports сохраняются через следующую
  явную приёмку, исходники и атласы не перезаписываются.
- Реальные screenshots: `screenshots/boss-meteor-ui-fix-v1/meteor/1280-meteor-warning.png`,
  `results-victory-1280.png`, `results-defeat-844.png` открыты и визуально
  проверены: открытый фон под маленьким прицелом, нет круглого ground effect,
  нет ульты поверх panel/results. Остальные этапы и размеры также сохранены.
- Блокеров нет; прежнее предупреждение Vite о размере JS chunks сохраняется.

## ElevenLabs Mage SFX и Lightning Ultimate в practice — 2026-11-10

- `npm.cmd run check` PASS: typecheck, lint, 136 unit files / 1059 tests,
  production build. Три новых unit проверяют все 44 исходных SHA/ID,
  11 сопоставлений событий, локальные WAV/PCM/пики/края/фазы и scope guard.
- `npm.cmd run test:e2e -- tests/e2e/mage-sfx.spec.ts tests/e2e/boss-practice.spec.ts tests/e2e/audio.spec.ts`
  PASS: 16/16. Проверены реальные menu→boss→Q→Blink на 1280×720/844×390,
  воспроизведение всех 11 samples, 11 запросов только при первой загрузке,
  3 restart без новых запросов, pause cleanup и отказ файлов с немедленным
  процедурным fallback. Прежние audio10-restart, mute, unsupported WebAudio,
  stress150+3+3 и практика с сохранением рекордов также PASS.
- `npm.cmd run test:e2e:production -- --grep "built Mage audio|built main menu starts|built public Mage attempt grove"`
  PASS: 3/3. Все 11 WAV в dist совпадают с manifest SHA; через настоящий
  интерфейс сыгран 1,2-секундный generated release, DEV harness отсутствует,
  внешних HTTP-запросов и page errors нет.
- `node scripts/prepare-mage-sfx.mjs` декодировал все 44 оригинала; сформированы
  11 файлов 576492 bytes, peak≤0,75, RMS>0,025, конечные PCM-сэмплы нулевые.
  `node scripts/verify-mage-sfx-integration.mjs`: 351 baseline, 7 изменено,
  12 добавлено, 344 сохранено. Старые арт-пруфы не перезаписаны.
- Реальные screenshots в `screenshots/mage-sfx-elevenlabs-v1/`: menu-1280/844,
  lightning-release-1280/844, gallery-1280, production-menu/ultimate.
  Открыты и визуально проверены оба меню, Canvas-разряд1280 и галерея.
  Эти проверки подтверждают декодирование, маршрутизацию и выходной сигнал;
  художественное качество пользователь оценивает в listening gallery.
- После добавления production E2E повторены typecheck/lint/whitespace.
  Единственное build warning — прежний размер JS chunks. Блокеров нет.

## Непрерывная ходьба при касте Mage V2 — 2026-11-09

- Полный unit: 116 файлов / 950 тестов PASS, `--maxWorkers=2` (25,69с).
  Typecheck/lint/build PASS. Компоненты check выполнены отдельно с ограничением
  workers из-за известных default unit таймаутов; таймауты не увеличивались.
- Пять новых unit: маски без добавления/изменения исходных пикселей, кисти выше
  разреза y61, отсутствие статичных ботинок, SHA четырёх входных atlas-файлов,
  117 anchors и все сочетания верх/низ/зеркало; шаг при разных скоростях,
  haste/analog/pause/stop и независимость от Cast clock.
- Два speed E2E на1280×720 и390×844 подтвердили темп×1/2/0,5/1,5 для
  135/270/67,5/202,5. Cast clock×1 и variant стабильны, пять разных кадров ног,
  pause замораживает оба слоя, stop снимает crop, pooled Image≤1, errors0.
- 19 различных релевантных DEV E2E PASS отдельными командами: speed2,
  origins2, moving3, overlap/lifecycle2, навыки/ultimate×8 направлений2,
  movement×target×direct-spell матрицы2 (по128 случаев desktop/touchlandscape),
  Lightning cinematic/performance/background6. Production9/9 PASS(42,3с):
  оба героя/биома, practice, контроллер, pause/resize и локальные asset requests,
  включая новый upper atlas. Всего28 E2E; полный suite не запускался.
- Реальные Canvas PNG открыты и просмотрены:
  screenshots/mage-moving-cast-v2/{1280,390}/walking-cast.png,
  mage-moving-cast/1280/lightning-north.png иmeteor-south.png,
  выбранные N/NE/NW/E/W изmage-cast-v2/{1280,844}/. Руки не дублируются,
  проекция мантии согласована, стык непрерывен, точки VFX следуют за верхом.
- Детерминизм: три идентичных выхода builder; 25 защищённых файлов неизменны
  (22 пользовательских PNG/GIF и три исходных manifest). Derived upper atlas:
  91 кадр,768×412,1265664RGBA bytes. Четыре исходных atlas input SHA PASS.
- Первый smoke5/9, затем четыре затронутых теста4/4 PASS: rate fixture требовал
  более длинного rank5Meteor и видимую цель внутри узкого viewport; верхний
  Image проверялся ошибочно в Sprite-only actors. Исправлены fixture и диагностика,
  gameplay duration не менялся, timeouts не увеличивались. Матрицы/ультимейты
  отдельным прогоном10/10 PASS. Логи: .tmp/mage-moving-cast-v2/.
- Новых генераций/расходов нет. Исходный арт и gameplay World не менялись.
  Отчёт: docs/art/MAGE_MOVING_CAST_V2_INTEGRATION.md.

## Пользовательские Mage Cast V2 — 2026-11-09

- Семь исходных клипов, 91 PNG-кадр: точные RGBA atlas roundtrips,14source SHA,
  первые7поз=Idle,13уникальных кадров/клип,alpha0/255,clipping0. Source GIF13×130мс
  подтверждены Aseprite; runtime использует прежние cosmetic durations, без изменения
  gameplay release/cooldown. Atlas768×1152/3538944RGBA bytes,NEAREST.
- Пять новых unit; полный115files/945tests PASS с--maxWorkers=2. Typecheck/lint/build
  PASS. ПовторсборкиIdle/Walk/Cast:9идентичных outputs,22неизменённых PNG/GIF sources.
- DEV19релевантных E2E PASS в отдельных командах: origin/fallback2,Idle2,moving3,
  overlap/lifecycle2,навыки/ultimate×8направлений2,матрицыmovement8×target8×Fireball/
  Lightning2,Lightning cinematic/reduced-effects/background/stress6. Матрицы:
  desktop1280×720 иtouch844×390,по128случаев,все7клипов и32зеркала,errors0.
- Real Canvas PNG северных N/NE/NW,Southv1/v2,Eastv1/v2 иWest mirrors открыты
  ипросмотрены. Материалы:screenshots/mage-cast-v2/{1280,844}/matrix.json иPNG;
  дополнительные muzzle/ultimate captures — в mage-cast-origins,mage-hero-v2,
  lightning-cinematic. Ни один кадр не подменялся программной перерисовкой.
- Production9/9PASS(44с):оба героя/биома,practice,контроллер,pause/resize,
  локальные exact asset requests с новымatlas. Всего28различных E2E PASS;
  полный suite не запускался.
- Исправлены ожидания тестов под новый full-body contract:phantom/split-body
  больше не активны. Первый moving1280 smoke неверно трактовал target Frost,
  уточнён по фактическому dense-group feedback и прошёл повторно. Ошибочная
  portrait-touch матрица остановлена; штатный orientation guard требуетlandscape.
  После возвращения844×390 touch128/128PASS. Portrait390×844 обычный viewport
  навыков/ultimate тоже PASS; это не утверждение о playable portrait-touch.
- Assertions/timeouts не ослаблялись. Компонентыcheck выполнены отдельно с2workers.
  git diff --check PASS. Новых генераций нет. Логи иbuild-validation:
  .tmp/mage-cast-v2/. Отчёт:docs/art/MAGE_CAST_V2_INTEGRATION.md.

## Пользовательский Mage Walking V2 — 2026-11-09

- По 13 кадров в south/north, каждый 130 мс; Aseprite batch независимо подтвердил
  GIF count/durations. Все 26 PNG RGBA кадров точно перенесены в atlas, по 13
  уникальных поз на вид. Source PNG/GIF не менялись. Mirror через runtime flipX.
- Пять новых unit: source SHA/atlas roundtrip, S/SE/E и W/SW mirror, N/NW и NE
  mirror, 130 мс/1690 мс, scale/pivots Idle, immediate start/stop, analog distance,
  pause/turn/restart и Blink cap. Полный unit: 114 файлов / 940 тестов PASS при
  --maxWorkers=2. Typecheck/lint/build PASS. Default npm run check отдельно не
  повторялся: использованы те же компоненты с ограниченной конкуренцией workers.
- Движение/Idle E2E 7/7 PASS: desktop1280×720/mobile390×844, восемь направлений,
  13 кадров и два loop wrap на каждое направление, скорость 135, freeze на шаге,
  остановка в Idle, вид/flip/origin/size, cast/hurt/death. Actual Canvas captures
  screenshots/mage-walk-v2/ открыты и просмотрены, включая south, west, north, NE.
- Moving cast/origins/phantom E2E 6/6 PASS: старые согласованные lower/upper и
  muzzle paths сохранены, после каста возвращается walking; Blink/hurt/death
  очищают crop/phantom, десять scene restarts совпадают по ресурсам и listeners.
- Production 9/9 PASS за41.2с: Mage/Warrior на обоих биомах, practice, controller,
  pause/resize и exact atlas requests. Новый atlas загружается локально.
  Итого 22 релевантных E2E PASS; полный E2E suite не запускался.
- Повтор сборки Idle/Walk: шесть выходных файлов совпали SHA256; восемь source
  файлов неизменны. Дополнительный walk atlas 1032192RGBA bytes, новых объектов
  и таймеров нет. Новых генераций нет. git diff --check PASS.
- Отчёт: docs/art/MAGE_WALK_V2_INTEGRATION.md. Логи .tmp/mage-walk-v2/:
  typecheck/lint/unit/build/e2e-movement/e2e-casting/production и build-validation.

## Пользовательский Mage Idle V2 — 2026-11-09

-Два пользовательских source PNG384×384/GIF96×96,13frames×130ms=1690ms.
  Aseprite batch подтвердил оба GIF. Все26RGBA кадров вatlas точные;
  исходные4файла совпали SHA256. Palette/source/feet не редактировались.
-Unit mage-idle-v2:4/4,включая8направлений/зеркала,полный13-frame loop,
  границы130ms,visible height/pivots. Дополнительная память atlas1032192bytes.
-Новые E2E2/2 на1280×720 и390×844:движение→Idle всех8направлений,все13фаз,
  wrap,pause,hurt,автокаст→Idle,death,error-free. Старые native movement2/2
  иhd-mage1/1PASS после точного обновления ожидаемых Idle-frame/size.
  Итого5затронутых E2E. Скриншотыscreenshots/mage-idle-v2/ реально открыты:
  front/mirror/back/back-mirror иполная сцена. Pause overlay скрыт только
  вtest screenshots,игровой UI не менялся.
-Production9/9PASS(41.6s):Mage/Warrior,Grove/Dark,practice,controller,
  pause/resize/offline requests. Exact asset request list расширен новым atlas.
-Typecheck/lint/build PASS. Полный unit113files/935tests PASS с--maxWorkers=2.
  Default npm run check сначала выявил устаревший idle8 assertion,исправлен13.
  Следующие default-прогоны упирались в5s limits неизменённых source SHA и
  survival trials. Bounded workers устранили CPU/I/O конкуренцию,без ослабления
  тестов или timeout. Поэтому это успешные компонентыcheck,а не заявленный
  полный default npm run check PASS. Логи:.tmp/mage-idle-v2/.
-git diff --check PASS. Новых генераций/затрат нет;runtime изменения ограничены
  представлениемIdle иего rest-hand fallback. Полный E2E suite не запускался.

## Mage B — Walk/Run8 front/north + mirrors — 2026-11-09

-PixelLab6completed jobs,10subscription generations,1560.90→1550.90,$0cash.
  52raw сохранены. Передние text-results отклонены за профиль и заменены fixed
  skeleton.32выбранных source+32mirror=64prepared,8loops по8уникальных кадров.
-PNG CRC/96×96/alpha0/255/clipping0/min9px margin PASS. Source palette28/10,
  ноги не фиксированы;shoe masks walk8/8,run7/8. Северный head-skin0.
-Mirrors32/32 exact,atlas32/32roundtrip,768×384/1179648RGBAbytes.
  Chromium ImageDecoder8GIF:8frames,960/640ms,infinite loop;
  64decoded RGBAframes differences0.
-Viewer file/HTTP×1280×720/390×844×walk/run:8/8PASS,errors0,missing0,
  overflow0,pause freezes clocks/background,4скорости,frame7↔0/loop wrap,
  source comparison,background иscroll. Реальные Canvas четырёх видов,
  phase sheets,game-scale с текущим Ash Warden иmobile screenshots просмотрены.
-Full npm.cmd run check PASS:112unit files/931tests,typecheck/lint/build.
  .tmp/mage-hooded-movement-v1/check.log; targeted ESLint4scripts PASS;
  git diff --check PASS. SHA2566941старого src/public/assets/art файла:
  changed0,added0. Gameplay E2E не запускались: runtime не менялся.
  Подробности:art/generated/mage-hooded-movement-v1/README.md и validation JSON.

## Mage B — Idle4 front/north + mirrors — 2026-11-09

-2animate_image jobs completed,2subscription generations,1562.90→1560.90,$0cash.
 10raw PNG сохранены;8source/8mirror prepared PNG,4frames/loop. Входной0 и
  закрывающий4 различены в metadata; пятый кадр в GIF/animation не попал.
-PNG96×96/CRC/alpha0/255/min11px margins/clipping0 PASS.4различных позы на базу,
  source palette28/10, feet-region y>=76 точная. Северный head-skin count0,
  руки не удлиняются вниз. Raw foot corrections1–6px документированы.
-Mirrors8/8 exact RGBA,atlas8/8roundtrip,384×192/294912RGBA bytes.
 4GIF Chromium ImageDecoder:4frames/2000ms/infinite loop,16RGBA frames differences0.
-Viewer file/HTTP×1280×720/390×8444/4PASS:4видимые карточки,errors0,missing0,
  overflow0,pause freezes,4скорости,prev/next/scrub/frame wrap3↔0, реальный
  loop wrap,source comparison,background change. Финальный rerun после ground-line
  уточнения также PASS. Screenshots четырёх видов,pose sheet,game-scale иmobile
  открыты и визуально просмотрены; композиции не выдаются за игровую интеграцию.
-Full npm.cmd run check PASS:112unit files/931tests,typecheck/lint/build;
  .tmp/mage-hooded-idle-v1/check.log. Targeted ESLint5standalone scripts PASS.
  SHA2566878старых src/public/assets/art файлов:changed0,added0. Принятые касты
  и S repair сохранены. Gameplay E2E не запускались: production не менялся.

## Mage B — S arm length repair — 2026-11-09

- Изменены S кадры3/4: два PixelLab edit и локальный ROI composite. Outside ROI
  differences0, head/feet точные прежние. Visual skin extent y72→49 и y64→51.
  Три stray cloth pixels восстановлены; anatomical bound не ослаблялся.
- 97 защищённых файлов совпали: 7 других клипов, остальные4кадра S, source/raw.
  Общий prior-assets audit6716файлов PASS. Пересобраны S GIF/PNG/atlas; raw не заменены.
- PNG/CRC/alpha/bounds,atlas30/30,mirrors18/18 PASS.8GIF Chromium:
  6frames/480ms/one-shot,48decodedframes RGBA differences0.
- Viewer file/HTTP×1280×720/390×8444/4PASS; pause/frame/target/speed/background,
  errors0. Первый запуск дал stationary speed sample на старте RAF; без изменения
  assertions тот же validator после bringToFront прошёл полностью. ?direction=s PASS.
- Новые S pose sheet/release и before-after PNG открыты и визуально просмотрены.
  Full npm.cmd run check PASS:112unit files/931tests,typecheck/lint/build;
  .tmp/mage-s-arm-repair-v1/check.log. Расход10subscription generations,$0cash.

## Mage B — front/back corrected cast pass — 2026-11-09

- Front source совпал с исходным selected-b.png SHA256. Две базы: original front,
  строгий north/back без лица. E/SE/S и зеркальные W/SW используют front;
  NW/N/NE используют спину, NE — подтверждённое пользователем зеркало NW.
-6PixelLab jobs completed: north edit5 +5cast×3=20subscription generations,
  1592.90→1572.90,$0cash,retries0.30raw PNG сохранены,48prepared PNG для8клипов.
-PNG96×96/CRC/alpha0/255/clipping PASS,min3px margin у рук N.6различимых поз
  в каждом клипе;27различимых исходных prepared с учётом общих canonical frame0.
  Exact mirrors18/18,atlas30/30roundtrip,RGBA1105920B.
-Cleanup5кадров/166пикселей: exact coordinate receipt, raw сохранены. Незаказанный
  yellow orb и detached ghosts удалены; оставшихся detached components0.
-8GIF через Chromium ImageDecoder:6frames/480ms/one-shot;48RGBA frames differences0.
-Viewer file/HTTP×1280×720/390×844:4/4PASS,JS errors0,missing0,overflow0,
  pause0advance,4скорости,prev/next/scrub,background change и32target selections
  с проверкой правильной front/back базы и зеркалирования.
-Визуально просмотрены compass8,5основных pose sheets,base/release сравнения
  иmobile capture. Northern clips остаются спиной; фронтальные — из исходной B.
-Full npm.cmd run check PASS:112unit files/931tests,typecheck/lint/build.
  .tmp/mage-hooded-front-back-cast-v2/check.log. ESLint6новых scripts PASS.
  SHA2566716старых src/public/assets/art файлов:changed0,added0. Production
  gameplay E2E не запускались, runtime/принятые атласы не менялись.

## Hooded Mage B — side cast + exact mirrors — 2026-11-09

- Full npm.cmd run check PASS:112unit files/931tests,typecheck/lint/build;
  .tmp/mage-hooded-cast-v1/check.log. Targeted ESLint всех5новых js/mjs PASS.
-4PixelLab jobs completed:side edit5 +3animations×3 =14subscription generations,
  1606.90→1592.90,$0cash.18raw96×96PNG сохранены; original B byte-identical.
-3клипа×6уникальных поз,точные mirrored copies18/18;CRC/alpha0/255/dimensions,
  min12px margin,clipping0. Три локальных cleanup-записи сохраняют удалённые
  координаты и restored-pixel coordinates. PNG original/raw сохранены.
-Правый atlas576×288,663552RGBAbytes;18/18decoded atlas frames совпали с prepared.
 6GIF decoded Chromium ImageDecoder:6frames,480ms,one-shot,36RGBA frames differences0.
-Viewer file/HTTP×1280×720/390×844:4/4PASS,page errors0,missing0,overflow0,
  pause freezes age,4скорости,prev/next/scrub,background change,24target cases
  (3heights×2facings×4открытия). Сохранены full-page и Canvas screenshots.
-После cleanup открыты и визуально просмотрены forward/high/low pose sheets,
  release previews,game-scale рядом с правильным текущим Ash Warden и mobile view.
  Касты discrete aim; точные игровые palm origins и IK не заявляются.
-SHA2566614старых src/public/assets/art файлов:changed0,added0. Gameplay E2E
  не запускались, производственные файлы не менялись. Следующий этап — просмотр
  этих кастов, остальные действия и отдельная интеграция.

## Art baseline + Mage concept review — 2026-11-09

- Full check PASS:112unit files/931tests,typecheck/lint/build. Лог:
  .tmp/mage-style-exploration-v1/check.log. Финальный targeted ESLint новых
  prepare.mjs/viewer.js/viewer-data.js PASS после исправлений. Gameplay E2E не
  запускались: нет изменения production-кода/ассетов. Старое chunk warning есть.
- Два новых руководства UTF8, markdown links существуют; стиль/эталоны,
  бюджеты4/6–8/4–6/6–8/8–12 и5приоритетов road map проверены по содержимому.
- PixelLab4/4jobs completed,4×5=20subscription generations,1626.90→1606.90,
  $0cash; only text prompts, no art reference upload.96×96PNG CRC4/4,
  alpha0/255,20–28RGB colors,min9px margin,clipping0,PNG RGBA roundtrip PASS.
- Runtime Ash Warden south-idle0 извлечён из действующего атласа с trim offsets,
  без смены пикселей/масштабирования. Frame/page/pivot/scale/hash сохранены;
  свежий настоящий game Canvas1280×720 открыт и визуально просмотрен.
- Viewer file/HTTP×1280×720/390×844 —4/4PASS;8images,missing0,overflow0,
  page errors0; Grove/neutral toggle меняет Canvas. Начальная JS scope ошибка
  устранена IIFE, после исправления все4открытия PASS.
- Canvas лист A–D, game-scale comparison, актуальные references открыты и
  визуально просмотрены. Full-page desktop/mobile screenshots также сохранены.
  Композиции являются preview, новые модели в игре не установлены.
- SHA2566583существующих src/public/assets/art файлов без изменений/добавлений;
  git diff --check PASS. Evidence в art/generated/mage-style-exploration-v1/:
  metrics.json,protected-validation.json,browser-validation.json,
  document-validation.json,screenshots/,references/. Выбор концепта ещё не сделан.

## Mage Cast — сектор ±90° и hand origins — 2026-11-09

- Full check PASS:931unit/112files,typecheck/lint/build. Проверены64mode cases
  для обоих spells, точные границы N→E/W, stationary, run-turn без reset,
  idle/Blink-facing, birth positions/short flight, feedback-before-audio,
  first Lightning link/follow/неизменённые endpoints/cleanup/read-only World.
- 6core E2E PASS:128кастов desktop1280×720 +128 mobile844×390 (24native/40phantom
  на spell/экран),16real autocast birth checks,4standing/hurt, AOE overlap,
  pause/Blink/hurt/death и10restarts с пустыми muzzle caches. Тесты проверяют
  фактическую Sprite position Fireball при появлении и first bolt origin у кисти.
- 10regression E2E PASS:casting Canvas sequences desktop/portrait, full native
  stationary casts/3ultimates во всех8facings, regular Lightning rank1/5 desktop/
  landscape и mixed150+3boss+3Guardian stress. Дополнительные camera6, Fireball4,
  ultimate5, moving3 и movement2 сценария подтверждены в основном прогоне.
- Production9/9 PASS(39.9s). Comparison HTTP/file://:8режимов,64PNG каждый,
  24native/40phantom, точный NORTH-пример, все картинки/переключатели работают,
  JS/console errors0. Новый review builder прошёл отдельный ESLint.
- Изначальные3ошибки matrix/lifecycle были fixture assumptions: удаление массива
  FX без release истощало bounded pool, а stopped Mage больше не должен иметь
  phantom. Fixtures исправлены, лимиты/таймауты/проверки не ослаблены, повтор PASS.
- 273защищённых domain/original asset SHA совпали. Native PNG/atlas/source refs
  прежние. Inspector PASS:96native/112atlas keys,RGBA,alpha,margin3,unchanged South.
  Source contact sheets и actual hand/bolt screenshots открыты и визуально изучены.
  Артефакты: art/generated/mage-cast-sectors-v2/, screenshots/mage-cast-origins/,
  screenshots/mage-phantom/. Новых PixelLab запросов0.

## Arcane Phantom Cast — полный directional runtime — 2026-11-09

- Full `npm.cmd run check` PASS:922unit/111files,typecheck/lint/build.
  Первоначальный concurrency timeout survival simulation устранён последовательным
  запуском, без изменения теста/таймаута. Vite предупреждает о прежнем размере chunks.
- `mage-phantom.spec.ts`:desktop64movement×target pairs ×Fireball/Lightning,
  mobile landscape8opposites×2; настоящее умение/feedback, полный Run, fixed facing,
  one pooled image/shared atlas, pause, Blink/hurt/death,10restarts, смешанные
  Meteor+Fireball+Lightning.17сценариев mage casting/hero/moving/phantom подтверждены
  (один mobile HMR-interruption повторён отдельно PASS), плюс2run-cycle PASS.
- Canvas1280×720/844×390/390×844, screenshots/JSON в screenshots/mage-phantom/
  и текущих mage-* evidence. Полные desktop/mobile и directional crops открыты.
- `node scripts/inspect-mage-phantom.mjs` PASS:96native256,112atlas keys,
  RGBA exact resample/trim roundtrip,726533partial alpha pixels,min3px margin,
  нет legs region, South byte-identical,8approvedrefs совпадают,275защищённых файлов
  domain/original assets без изменений.8ASE по12frames/340ms/4layers;
  8GIF binary audit —12frames/340ms/one-shot, GIF alpha ограничен форматом.
- Atlas1024×316,1294336RGBA bytes. Mixed stress150+3boss+3Guardian:
  59.88medianFPS,p95frame16.7/16.8ms,150000320/137417408bytes<144MiB,
  clock0/0/0,tweens0,10restart стабильны. Build deterministic/native source hashes
  сохранены; gameplay/controls/targeting/damage не менялись.
- Production9/9 PASS(40.9s), включая меню/боссов/Mage/Warrior/контроллер/mobile,
  новый phantom atlas загружается из built public assets без внешних запросов.
 4повторных build outputs byte-identical. Comparison HTTP/file загрузил64/64PNG,
 8GIF реально декодированы Chromium в12frames/340ms каждый; browser errors0.

## Phantom Viewer — regression загрузки с диска — 2026-11-09

- До исправления: file:// блокировал module viewer.js (CORS), loader не исчезал;
  тот же HTML через HTTP успешно запускался.
- `validate-loading.mjs` PASS:4 успешных открытия (file/HTTP,1280×720/844×390),
  run-clock, scrub, pause canvas, comparison,0JS errors.4 негативных сценария
  показали конкретную устойчивую ошибку: missingPNG/stalled decode/missing dataJS/
  missing viewerJS. Bundled metadata совпадает с двумя авторитетными JSON.
- Скриншоты screenshots/loading-file-1280.png, loading-file-844.png,
  loading-http-1280.png, loading-http-844.png внутри арт-пакета; file mobile открыт
  и просмотрен. Подробный результат validation/loading-validation.json.

## Arcane Phantom Cast — изолированный PixelLab пилот — 2026-11-09

- `node art/generated/mage-phantom-cast-pixellab-v1/validate.mjs` PASS.
  Chromium1280×720/844×390, 5 режимов, 4 скорости, 12 scrub-позиций, pause,
  toggles, индивидуальный retiming и перенос release. Run не сбрасывается и
  продолжается после окончания one-shot; JS errors0/HTTP errors0, overflow нет.
- 12 native256 RGBA PNG, 11 уникальных с учётом пустого, без обрезания краями/ног.
  Fixed anchor(128,64); 11 617 пикселей головы совпали с approved references
  после общего цветового grade, max RGB difference0. Aseprite256×256/12frames/4layers.
- Оба GIF реально декодированы Chromium:12frames/340ms, durations20/20/20/30/30/
  30/40/40/30/30/30/20ms; бинарный аудит подтверждает отсутствие infinite loop.
  MainGIF512×512 — композит, alphaGIF256×256 имеет ограничения GIF-прозрачности.
- Canvas desktop/mobile, игровые1× и detail4× screenshots сохранены, изображения
  и контактные листы визуально просмотрены. Дефекты отклонённых raw кадров и
  ограничения финальной кисти/поворота/mobile описаны в ART_REVIEW.md.
- SHA-256281 игровых/сборочных файлов совпали с baseline начала пилота.
  Node syntax check и git diff --check PASS; runtime не менялся, полный build и
  gameplay E2E по условию задачи не запускались. Ручная арт-приёмка ещё не выполнена.

## Frost Nova HD — подключение принятого512pxэффекта — 2026-11-09

- Full check PASS:908unit/110files,typecheck/lint/build. Все24HD и48Ultimate
  nativeRGBAкадров реконструированы изtrimmedatlas и сверены поSHA256;
 512/146source canvases,516/150full canvases, timing/pivot/масштаб/границы и
  отсутствие перекрытия packedrects проверены. Повторная сборка4выходов
  byte-identical. Atlas1536×3630/22302720RGBAbytes/PNG767026bytes.
- Подтверждены15целевыхE2E: Frost all-frame3, настоящая boss practice2,
  Nova/Meteor6, movingcast2, mixed150+3+3/restarts1, viewer1. Первый mobile
  fixture поставил цель вне targetviewport; герой подведён ближе в fixture,
  boss practice повтор2/2 PASS(11.1s), игровая логика сохранена.
- Production9/9 PASS(43s), typecheck/lint/diff-check PASS.
- Новая Nova IV реально показана в «Бой со Стражем»1280×720/390×844:
  radius127.02, прежний диаметр254.04world units, alpha0.7, damage срабатывает,
  pause/expiry и наземное положение сохранены. CanvasPNG открыт и просмотрен,
  также просмотрена Nova I наPC/portrait.8PNG/2JSON — screenshots/frost-nova-hd-game/.
- Stress150regular+3boss+3Guardian:59.88medianFPS,p95frame16.8ms,
  p95update2.2/2ms; RGBAсумма148705984/136123072bytes<144MiB наPC/portrait.
  10restart стабильны129831616bytes, Clock0,tweens0,errors0. Общий cap повышен
 128→144MiB под принятую nativeдетализацию; не является измерением памятидрайвера.
- Отчёт docs/FROST_NOVA_HD_INTEGRATION_REPORT.md. Блокеров нет.

## Frost Nova HD — отдельный кандидат 512px — 2026-11-09

- Через настоящий запуск тренировки подтверждены Nova IV/area1.45/radius127.02:
  native146² →508.08screen/CSSpx при camera×2,3.48px на texel.
- Новый PixelLab MCP VFX Workbench native512²/24frames/20fps экспортирован
  в art/main-hero-mage/abilities/frost-nova-hd-v1/. Это процедурный рендер,
  runtime не изменён; production bundle сохранил прежний hash.
- Новый frost-nova-hd-preview.spec.ts1/1 PASS(1.9s): все24кадра512²/50ms,
  alpha, отсутствие clipping на краях, пустой финальный кадр, равные игровые
  размеры, camera×2/×3, pause/scrub/play; HTTP/page errors0.
- Canvas comparison-camera-2.png просмотрен;2PNG/1JSON в
  screenshots/frost-nova-hd-v1/. Финальный check907unit/110files,typecheck/lint/build
  PASS. Первый typecheck выявил неявныйany в новом тесте; исправлен тип JSON,
  проверки не подавлялись. git diff --check PASS. Подробности:
  docs/FROST_NOVA_HD_PREVIEW_REPORT.md.

## Frost Nova — две пользовательские анимации — 2026-11-09

- Финальный npm.cmd run check PASS:907unit/110files,typecheck/lint/build.
  Источники и все72нативных RGBAкадра сверены по SHA256; timings50ms,
  fixed pivot, pause/expiry/death/reselection и игровой Frost regression покрыты.
- Подтверждены18целевых E2E: новый frost-nova-art3/3, mage-ability-vfx6/6,
  frost-avalanche2/2, frost-seal7/7. Первые7ошибок были в locator/ожиданиях
  тестов; исправлены. Соответствующий повтор9/9 PASS(57.3s).
  Один concurrent check получил5000ms timeout существующего source-hash теста;
  финальный последовательный полныйcheck907/907 PASS с прежними таймаутами.
- Production9/9 PASS(40.3s): старт, тренировки, атаки, pause/resume, resize,
  управление геймпадом, точный набор локальных ресурсов, без внешних запросов.
- Canvas: все24+48кадров на1280×720,844×390,390×844. Настоящие damage/freeze,
  отрицательныйY, три рестарта накаждыйviewport, old10restart suite, Clock0,
  tweens0, повторных запросов атласа0, console/page/HTTP errors0.
- Просмотрены6реальных Canvas PNG: обычная/ультимейт наPC иportrait,
  ультимейт landscape и frozen scene с3боссами/3хранителями. Новые артефакты:
  screenshots/frost-nova-art/ —27PNG/3JSON. Stress150+3+3 на1280/844/1024:
  59.88medianFPS,p95frame16.7–16.8ms; это измерение текущего Chromium.
- Сборщик повторно воспроизводит4выхода byte-identical. git diff --check PASS.
  Детали: docs/FROST_NOVA_ANIMATION_REPORT.md. Блокеров нет.

## Secondary-chain на основном луче — 2026-11-08

- Full check PASS:856unit/105files,typecheck/lint/build.
- Native ultimate E2E5/5 PASS(23.4s), включая long ray и reduced/mobile.
- Primary и branch проверены на ultimate-branch frames; сегменты≤80px,
  постоянная толщина, joins/hand/impacts и пауза/cleanup сохранены.
- 4focused PNG: screenshots/secondary-chain-primary-v1/. Long/desktop и
  reduced portrait открыты и просмотрены. git diff --check PASS.

## Guardian scale / secondary-chain / сегменты — 2026-11-08

- Full check PASS:856unit/105files,typecheck/lint/build. Source blocker снят.
- Dev targeted23/23 PASS(1.9min), long tiled ray1/1 PASS;
  production9/9 PASS(41.5s). Final browser test typecheck/lint PASS.
- Guardian67.2×67.2/+50%, все состояния/duel/support/reward/cleanup проверены.
- Separate secondary clip, точные endpoints/joins, отрезок≤80px,
  постоянная толщина/изгиб, pause/reduced/expiry/limits проверены.
- 10sources unchanged,74frames, alpha/color differences0,
  runtime rebuild byte-identical PASS.
- Stress150+3+3:59.88medianFPS/p95frame16.8ms на1280/844,
  activation2.0/2.1ms, allocated399/389 из1181.
- 6focused Canvas PNG+JSON: screenshots/guardian-scale-lightning-tiles-v1/;
  Totem/HP/короткие и длинные лучи на desktop/mobile/portrait просмотрены.
- git diff --check PASS. Отчёт: docs/GUARDIAN_SCALE_LIGHTNING_TILES_V1_REPORT.md.

## Mage — диагонали + South Walk / Run — 2026-11-08

- 10 выбранных клипов, 11 successful jobs completed/gallery saved, один
  SW Walk повторён для более явных шагов. По 16 новых кадров 256×256.
- 69 protected files unchanged; 215 PNG CRC PASS, input equality,
  GIF↔PNG и sheet/strip differences0, alpha0/255/edge pixels0.
- Viewer: все5 направлений, playback/pause/scrub1/8/16/wrap/Canvas match,
  1280×800/390×844, no horizontal overflow и JS errors0 PASS.
- 45 outputs rebuilt byte-identical; 21 screenshot, все11 sheets,
  пять desktop сравнений и mobile SW просмотрены.
- Typecheck/lint/build PASS. Общий check: 853/854 unit; прежний
  lightning-ultimate-art source hash test не находит ultimate-hand-lightning.gif.
  Тест не ослаблялся; новые анимации валидированы независимо.
- Квитанции22.50 generations; balance delta28.55, разница6.05 не объяснена
  доступными данными API и записана явно. USD credits0→0.
- Отчёт: docs/MAGE_DIRECTIONS_PIXMINIMAX_V1_REPORT.md.

## Mage north — PixMiniMax Walk / Run — 2026-11-08

- Реальные 2 job completed, gallery saved, frame_count 16, north,
  low top-down, enhance_prompt true; расход 4.10 subscription generations.
- 8 source files unchanged; crop/raw input equality; 39 PNG CRC PASS.
  Оба экспорта по 16 кадров, sheet/strip RGBA differences 0,
  GIF alpha/color differences 0, clipping edge pixels 0, alpha 0/255.
- Offline viewer: playback/pause/scrub 1/8/16, step 16→1, Canvas pixels,
  фон, desktop/mobile overflow и page errors PASS.
- 9 review outputs воспроизведены побайтно; генерации повторно не запускались.
- Full check PASS: typecheck/lint/build, 854 unit / 105 файлов.
- 5 screenshots: screenshots/mage-north-pixminimax-v1/. Desktop frame8/light,
  mobile checker и обе 16-frame раскадровки открыты и просмотрены.
- Отчёт: docs/MAGE_NORTH_PIXMINIMAX_V1_REPORT.md.

## Электрический ультимейт — native sky/beam/impact — 2026-11-08

- Full check PASS: 854 unit / 105 файлов, typecheck/lint/build.
- Новые art E2E 4/4 PASS (21.7 s); существующие cinematic/performance 6/6
  PASS; production 9/9 PASS (37.7 s).
- HD integration 3/3 PASS (19.9 s), каталог 42 ресурсов и bounded restarts.
- Sky за непрозрачным героем, реальная рука, ветвления по frozen graph,
  импакт на каждой цели, прежний damage time 0.52 s, pause/expiry/restart,
  reduced effects, 156 targets и Clock [0,0,0] проверены.
- Семь originals unchanged; 58 native frames, alpha/color differences 0,
  три runtime outputs rebuild byte-identical.
- Stress 150+3+3: median 59.88 FPS, p95 frame 16.8 ms на 1280/844,
  activation 2.5/1.7 ms, pool max 312 при лимите 313.
- 38 Canvas PNG / 4 JSON: screenshots/lightning-ultimate-v1/.
  Выбранные desktop/mobile/portrait просмотрены, errors/404/Texture warnings 0.
- git diff --check PASS.
- Отчёт: docs/LIGHTNING_ULTIMATE_V1_REPORT.md.

## Обычная Chain Lightning — native clip — 2026-11-08

- Full check PASS:850unit/104files,typecheck/lint/build.
- Native/HD/stress E2E7/7 PASS(59s), production4176 —9/9 PASS(37.5s).
- Target geometry/length/fixed thickness/frame progression, настоящий rank3→7
  targets/damage, evolution2links, pause/expiry/restart и отдельный неизменённый
  ультимейт проверены. Исправлена только eligibility test fixture для выбора ульты.
- Два originals unchanged;32native frames, GIF/PNG alpha/color audit,
  три runtime outputs rebuild byte-identical PASS.
- Stress150+3+3:59.25/59.39medianFPS на1280/390, sampled p95 update1.90/1.40ms;
  caps и5restart/viewport без роста ресурсов PASS.
- 26Canvas PNG/4JSON: screenshots/regular-lightning-v1/. Desktop/mobile/portrait
  просмотрены, errors/404/Texture warnings0. git diff --check PASS.
- Отчёт: docs/REGULAR_LIGHTNING_V1_REPORT.md.

## Mage Fireball — первый native размер — 2026-11-08

- Full check PASS:842unit/103files,typecheck/lint/build.
- Native Fireball I/V + HD/cameraFireball regression7/7 PASS; native+stress6/6
  PASS; финальная native desktop/mobile/portrait матрица4/4 PASS(23s).
- Production4176:9/9 PASS(40.2s), без внешних ресурсов/DEV harness.
- Формирование→полёт→реальные hit/коллизии, pierce/AOE, fixed scale всех рангов,
  pause, отсутствие impacts на miss/TTL, cleanup и restart проверены.
- 9source files unchanged;48nativeRGBAframes,pivot/padding/hash audit PASS;
  три runtime outputs rebuild byte-identical. Max source alpha bounds при0.5:
  idle34×11world px, collide36×25. Рост с прокачкой не включён.
- Stress150+3+3:59.15/59.30medianFPS на1280/390; sampled p95 update1.20/1.00ms;
  caps/5restart/viewport PASS. Ранний camera hook на старом HMR server завис;
  целевой повтор на отдельном5176 прошёл без увеличения timeout/правок hook.
- 46Canvas PNG/4JSON: screenshots/mage-fireball-v1/. Выбранные desktop/mobile/
  portrait снимки просмотрены, ошибок/404/Texture warnings0. git diff --check PASS.
- Отчёт: docs/secondary-bosses/MAGE_FIREBALL_V1_REPORT.md.

## Guardian — убрать круги — 2026-11-08

- Полный check PASS:834unit/102files,typecheck/lint/build.
- Существующие art/ritual/menu E2E7/7 PASS(33.3s), ошибки0.
- Desktop/mobile/portrait Canvas screenshots получены; desktop cast,
  portrait idle и ritual release просмотрены и сохранены отдельно в
  screenshots/rootbound-guardian-no-rings/. Кольца/glow вокруг Guardian отсутствуют.
- HP, idle/cast, выстрелы, попадания, награды, freeze/pause и restart проверены
  существующими сценариями. git diff --check PASS.

## Rootbound Guardian — модель, анимации, projectile и дуэль — 2026-11-08

- npm.cmd run check PASS:834unit/102files,typecheck/lint/build. После последних
  названий browser тестов typecheck/lint отдельно PASS.
- Новые art/ritual/menu E2E10/10 PASS(52.5s); Guardian/HD/stress6/6 PASS(58.3s).
- Production4175:9/9 PASS(36.4s), обе тестовые кнопки без DEV harness, обычная
  игра, resize, controller. Keyboard/touch/gamepad, естественная победа,
  поражение, restart, возврат к обычному забегу и сохранность профиля проверены.
- Четыре source PNG/GIF неизменны;26native128frames, GIF alpha/timing audit,
  atlas padding и SHA-256, повторная сборка трёх outputs byte-identical PASS.
- 85Canvas PNG: screenshots/rootbound-guardian-v1/, выбранные desktop/mobile/
  portrait/menu открыты и просмотрены. Art matrix errors/404/Texture warnings0.
- 150regular+3boss+3Guardian:59.13/59.34 medianFPS на1280/390, sampled p95 update
  1.10/1.70ms; cap checks и5restart/viewport без роста ресурсов PASS.
- Ранний совместный check/E2E получил5s CPU timeout существующего survival seed;
  отдельный повтор и финальный полный check прошли без правки timeout/теста.
- Полный отчёт: docs/secondary-bosses/ROOTBOUND_GUARDIAN_REPORT.md.

## Astral Revenant — визуальный реворк / practice — 2026-11-08

- Финальный check99файлов/808unit PASS, typecheck/lint/build PASS.
- Production9/9 PASS(38.6s) после последней сборки, без DEV harness.
- 30browser-сценариев проверены целевыми прогонами: общий29/30, выявлен и исправлен
  best/footer overlap (−6.42→10.58px, assert≥8 сохранён); повтор8/8 UI PASS(40.4s).
  Финальные Astral art4/4 PASS(25.0s), остальные18регрессий прошли в общем прогоне.
  Логи .tmp/astral-revenant-v1/{final-e2e,final-menu,final-art,release-production}.
- 15inputs SHA unchanged,3outputs byte-identical. Atlas98frames/1056×1716,
  7248384RGBA bytes/PNG216073bytes. Mirror всех32body poses, GIF mapping/blank
  collapse/impact padding/ground alias явно проверены. Source colors/alpha из PNG.
- Реальные скорости85/95×late, counts/gaps/TTL2.5, radius27/landAt/HP, phase2
  double volley/cast, hits/freeze, Blink anchors/safety, collision/TTL dissolve,
  owner/defeat/restart cleanup, caps/no duplicate loads и нормальная победа Mage54.
- Canvas/menu92PNG/7JSON, desktop/mobile/touch/gamepad проверены. Старые5Rune
  review-файлов восстановлены после backup. Полный исторический E2E не запускался.

## Briar Beast — финальный movespeed +30% — 2026-11-08

- Check97файлов/790unit PASS, typecheck/lint/build PASS.
- Briar art+practice8/8 E2E PASS(45.1s), production9/9 PASS(34.3s).
  .tmp/briar-beast-speed/{e2e,production}/.last-run.json: passed/failedTests[].
- Live speed31.2, pursuit62.4 до modifiers; реальная дистанция за0.18s проверена
  в браузере на обычной/выжженной Роще. Charge зависит от новой базы, соблюдает
  прежний cap240 и swept collision/один hit. Уклонение без неуязвимости проходит.
- Historical replay adapter ограничен тестовым helper, spawn восстанавливается
  в finally; новый unit проверяет, что следующий реальный spawn снова31.2.
  Старые fixtures не менялись; balance test сохраняет точное сравнение всех
  остальных характеристик и учитывает разрешённый buff только у charger.
- Canvas desktop/mobile просмотрены, screenshots/briar-beast-v1/ обновлены.

## Armored Briar Beast — анимации и дуэль — 2026-11-08

- После финальной правки hit continuity: check97файлов/789unit PASS,
  typecheck/lint/build PASS. Новые12 unit проверяют inputs/alpha/timings,
  зеркальность всех37поз, phase mapping, сохранение footprint и симуляции,
  pause/freeze/resume, отсутствие перезапуска на hit, дуэль/cleanup/исходы.
- Builder3outputs повторно побайтово идентичны,7inputs unchanged.
  .tmp/briar-beast-v1/reproduction.json; atlas74frames,1056×1320/5575680RGBA bytes.
- Финальные browser26/26 PASS(2.5min) и production9/9 PASS(40.1s) после последней
  сборки. .tmp/briar-beast-v1/{final-e2e,final-production}/.last-run.json:
  status passed/failedTests[]. Включены10рестартов,150mobs и34уникальных HD URL.
  Old load count32→34 отражает новые PNG/JSON, проверки уникальности и повторных
  перезапусков сохранены.
- Просмотрены Canvas/menu/result PNG desktop/mobile в screenshots/briar-beast-v1/
  и screenshots/briar-beast-practice/:98PNG/7JSON. Прежние Rune review-файлы после
  резервного копирования регрессии восстановлены к HEAD; gameplay assets неизменны.
  Полный исторический E2E не запускался.

## Rune Warden — финальная приёмка для main — 2026-11-08

- Check: 777/777 unit, 95 файлов, typecheck/lint/build PASS.
- Rune art + Rune practice + Ash practice: 12/12 E2E PASS.
- Production smoke: 9/9 PASS, обе кнопки тренировки работают без DEV harness.
- Новый unit проверяет отсутствие Rune direction ticks в windup/prepare,
  сохранение предупреждений Eclipse и неизменность симуляции.
- Burning desktop/mobile casting.png просмотрены: перед залпом ticks отсутствуют.
  Результаты E2E/production: .tmp/rune-warden-release/{e2e,production}/.last-run.json,
  status passed, failedTests []. Полный исторический E2E не запускался.

## Rune Judgement контур / Volley tuning — 2026-11-08

- Check776/776 unit,95 файлов, typecheck/lint/build PASS.
- Rune art+practice8/8, production9/9 PASS.
- Проверены display52 (40×1.3), early speed200, Enrage210×late и post-Blink;
  Eclipse остаётся95×late, damage/TTL прежние. Historical hashes сохранены
  через явный legacy-speed adapter helper; live скорость проверяется отдельно.
- 48PNG/4JSON: screenshots/rune-warden-volley-tuning/. Выборочно просмотрены
  чистая голубая руна без фиолетового контура и увеличенные болты desktop/mobile.

Полный исторический E2E не запускался. Исходные изображения/атлас не менялись.

## Runic Judgement V2 — 2026-11-08

- Финальный check:770/770 unit,95 файлов, typecheck/lint/build PASS.
- Rune art+practice8/8 E2E, production9/9 после финальной сборки.
- 16 текущих inputs SHA256 unchanged,84 остальных atlas frames pixel-identical;
  3outputs byte-identical при повторной сборке. Новый atlas101frames.
- Charge0..11 до landAt; hit12 и fade12..15. Тесты проверяют точный radius/pivot,
  отсутствие раннего/повторного урона, прозрачные края flash и owner/restart cleanup.
- 48Canvas PNG/4JSON: screenshots/runic-judgement-v2/, normal/burning desktop/mobile.
  Снимки warning/hit/peak/fade выборочно просмотрены, errors0, timers/tweens0.

При совместном check+browser старый180s simulation test превысил5s. После
browser последовательный полный check770/770 прошёл, пороги не менялись.
Полный исторический E2E не запускался. Отчёт: docs/secondary-bosses/RUNIC_JUDGEMENT_V2.md.

## Rune Warden practice1×1 / меню — 2026-11-08

- Check:95 файлов,768/768 unit, typecheck/lint/build PASS.
- `rune-practice.spec.ts boss-practice.spec.ts`:8/8 PASS; Rune повтор4/4.
- Production:9/9 PASS, включая обе реальные кнопки без DEV harness.
- Новые unit: реальный Mage54, штатный Sorcerer, все3 атаки до законной победы;
  единственный enemy на20min+, запрет spawns/FinalEncounter, cleanup, defeat/pause.
- Keyboard/touch/gamepad, restart текущей дуэли, выход к обычному забегу,
  localStorage unchanged.18PNG/3JSON: screenshots/rune-warden-practice/.

UI/Canvas выборочно просмотрены на1280×720,844×390,740×360. Отдельные Canvas
сняты без pause overlay. Полный исторический E2E не запускался. Подробности:
`docs/secondary-bosses/RUNE_WARDEN_PRACTICE.md`.

## Rune Warden / Ancient Rune Archmage A — 2026-11-08

Подключены пользовательские Walk/Cast, Arcane Volley flight/impact, статичные
Judgement/Blink руны и их анимации. Только left/right. Исходники16/16 SHA256
unchanged;97 atlas frames,3 outputs byte-identical при повторной сборке.

- Финальный `npm.cmd run check`: typecheck/lint/build и762/762 unit PASS.
- Rune Warden E2E4/4: две карты времени × desktop/mobile; настоящие damage tick,
  collision, Blink anchors, pause, fade, death/restart и scene resources.
- Legacy boss/Guardian E2E15/15: включая6×45s RAF и10 scene restarts.
- HD integration/Mage VFX9/9; production8/8 после финальной сборки.
- Первый combined run17/19;2 burning fixture ошибки устранены изоляцией одного
  каста от следующего, после этого целевой4/4. Gameplay assertions сохранены.
- Целевые44PNG и4JSON: screenshots/rune-warden-v1/, выборочный визуальный review.
  Errors0, Clock0/0/0, tweens0, canvas1, новая texture1 после рестарта.

Полный исторический E2E не запускался. Сохранилось предупреждение Vite о размере
chunks>500kB. Отчёт с контрактами и ограничениями:
`docs/secondary-bosses/RUNE_WARDEN_INTEGRATION_V1_REPORT.md`.

## Кнопка «Бой со Стражем» — 2026-11-06

- check:655/655unit,82файла,typecheck/lint/build exit0.
- Новый menu practice E2E:4/4,17.3s,1280/844/740,реальный keyboard/touch/
  gamepad input. Готовый законный Mage54/Frost/200HP;нет защиты или HP edits.
  Победа и поражение не меняют профиль;повтор снова запускает practice;
  обычный старт после него создаёт обычный run с1уровня.
- Прежний final-boss-results:3/3,8.8s,ordinary persistence/reload/Nova.
- Production на окончательном build8/8,38.6s,вход кнопкой в реальный boss
  intro/phase1 без DEV harness.
- Menu/button и Canvas intro PNG открыты:screenshots/final-boss/practice-*.
  Compact landscape держит обе кнопки в одном ряду,desktop record/footer
  разделены проверяемым промежутком. Full E2E повторно не запускался.
- Без commit/push/deploy. main@0388cf4. Dev server localhost:5173 запущен.

## Финальный Страж Пепельной Рощи — 2026-11-06

Единый PIXEL_SURVIVOR_FINAL_BOSS_SPEC.md реализован поверх main@0388cf4,
без Git-записей и изменений пользовательского ТЗ. Новый оригинальный атлас
252frames/223unique,2304×1792,15.75MiB RGBA,все края проверены. Death —
сочленённое падение,phase3 имеет сохраняющиеся стойку/шаг/трещины.

- npm.cmd run check:PASS,653/653unit в81файле,typecheck/lint/build exit0.
- Полный E2E:374/376 за19min. Все16новых final-boss PASS,включая5viewport,
  настоящий119.096s RAF fight/180HP без ручных HP edits/бессмертия/удаления
  опор,freeze/arena ownership,Fire/caps,сохранение до death window,lethal Nova,
  native fullscreenDPR2,portrait/blur/upgrade,zero effects,10scene restarts.
- Два FAIL в старых UI test probes разобраны:commit timestamp ошибочно
  снимался на следующем RAF;другая проверка frozen elapsed шла после долгого
  screenshot за пределами200ms окна. Измерение/порядок исправлены без правок
  игрового UI и без ослабления assertions. Их полные файлы19/19,ещё5повторов
  timing PASS. Typecheck/lint после test edits PASS. Полный376suite после
  исправления probes не повторялся;единый зелёный376/376 не заявляется.
- Production7/7,31s:нет открытого dev harness,ошибок ресурсов или внешних
  запросов,новый atlas preload. Отдельный minified actual World bundle:
  victory120.15s/defeat77.75s. Полная public production UI victory не заявляется.
- 54законных balance trials +6dodge/cap audits,3builds,3отдельные ульты,
  seeds42/713,AFK/move/full. Типичный115–120s,высокий87–90s;умеренный может
  требовать около398s и повтор щита или проиграть. Автопилот не доказывает fun.
- Отдельный финальный performance2/2,38.2s,Chromium156/DPR1/Ryzen5 7500F:
  median59.88FPS,p95frame16.7–16.8ms,p95Scene.update baseline1.4ms,
  entry/ультимейты0.4–0.7ms. New atlas preloaded и в baseline. RGBA≠VRAM.
- Git diff --check exit0. Старые records/DarkForest/legacy wins сохраняются;
  ashGuard:0 мигрируется до валидации. Pre20 replay hashes сохранены.
- Реально просмотрены pose sheet,scale comparison,desktop/mobile состояния,
  направленный меч,Fire/Lightning/freeze,новые combo/death sequences с
  timestamps и стойка phase3. Физический телефон/геймпад NOT RUN.

Пакет:docs/final-boss/{DESIGN,ART,BALANCE,QA,REPORT}.md,сырые JSON/logs рядом.
Медиа:screenshots/final-boss/. Эти каталоги игнорируются существующим Git;
force-add не выполнялся. Следующий шаг — ручная приёмка,работа остановлена.

## Frost avalanche — 2026-11-06

Новая однократная волна: старт после заморозки в1.1s, расширение0.8s,
180базового урона, cap8%HP дляboss/Guardian, исходная заморозка4+4s.

- npm.cmd run check: exit0; typecheck/lint/build;614/614unit в75файлах.
- npm.cmd run test:e2e -- tests/e2e/frost-avalanche.spec.ts tests/e2e/frost-seal.spec.ts:
  exit0,9/9,1.2min. Новые2сценария проверяют реальный Canvas на1280×720 и844×390,
  однократный последовательный hit по уже замороженным целям,3kill,дальнюю
  непоражённую цель,босс-cap,паузу иscene teardown.7существующих сценариев
  проверяют ritual/thaw,owner clocks,input,mute,late entrant,10restart инагрузку.
- Три коротких5sстресса150regular+3boss+3Guardian:156frozen,median59.88FPS,
  p95frame16.8ms на1280/844/1024. Clock0/0/0,нет роста ресурсов наrestart.
- Unit: задержка послеfreeze,stationary origin,граница,пропуск кадров,
  поздний вход позадиfront,один hit,kill/XP/статистика,damage multiplier/cap,
  pause/death/next cast,deterministic hollow texture безgameplay RNG.
- Скриншоты wave-2-1280.png иwave-3-844.png действительно открыты;
  оригинальная снежная кромка ипрозрачный центр читаются отдельно отрун.
  Все5фаз иJSON вscreenshots/frost-avalanche/. Дополнительные текущие
  ritual/stress screenshots иperformance JSON — вfrost-seal каталогах.
- Git diff --check:exit0. Полный E2E иproduction не запускались заново.
  Блокеров нет. Физические мобильные устройства не тестировались.

## Grove5s + анонсы — 2026-11-06

Окна300–305/600–605/900–905s,анонс5игровых секунд с каждого порога.
608/608 unit в74файлах,typecheck/lint/build exit0. Связанные18E2E18/18
за4,2min;после CSS mobile correction оба новых viewport-сценария2/2
за23,9s. Production7/7 за32,9s. Git diff --check exit0.
Реальные5sпереходы,blend0/.5/1,pause/upgrade/death/restart,150+3soak,
World/RNG,legacy,Fire/Frost и native fullscreen покрыты проверками.
Аннонсы не перекрывают run clock,boss bars,skill dock и Blink.
Финальные desktop/mobile PNG открыты: screenshots/biome-notice/.
Это целевые проверки новой итерации,а не новый полный356+E2Eпрогон.
Подробности: [biome-notice/REVIEW.md](biome-notice/REVIEW.md).

## Grove evolution — 2026-11-06

Текущая main,без commit/push/deploy. Финальный check601/601 unit в73файлах,
typecheck/lint/build exit0. Полный E2E350/355 за58,1min:пять устаревших сравнений
texture keys в camera fixture. После исправления оба затронутых файла13/13,
exit0 (52,4s),включая новый настоящий native fullscreen. Все356актуальных
сценариев покрыты успешными проверками; одного полного356/356не заявляется.
Production7/7 за33,2s,exit0. Git diff --check exit0.

Два минутных150+3soak:около60FPS,p95кадра16,8ms desktop/16,7ms touchviewport,
errors[]. Реальные Canvas screenshots четырёх фаз, Fire/Frost, native fullscreen,
проверки неизменности всего World/детерминизма/legacy records/рестартов выполнены.
Физический мобильный аппарат не проверялся. Арт-пожар не является hazard.

Подробный отчёт и ограничения: [grove-evolution/REVIEW.md](grove-evolution/REVIEW.md).
Все45исходных/тестовых файлов: [grove-evolution/FILES.md](grove-evolution/FILES.md).
PNG: `screenshots/grove-evolution/`; raw JSON и логи в `docs/grove-evolution/`.

## Mobile camera / Fireball cleanup — 2026-11-04, QA завершён

Main отdbd04f9, без веток/commit/push/deploy. В игровом src изменены только
zoom-выражение GameScene (touch landscape currentZoom/1.3) и удалена одна строка
двух боковых Fireball lineBetween начиная сIIIранга. Логический World viewport,
damage/speed/count/pierce/hitbox, спавн/AI/CDR/баланс и остальные graphics сохранены.

- `npm.cmd run check`:491/491 в62файлах,typecheck/lint/build exit0.
- `npm.cmd run test:e2e -- --workers=2`:281/281 за27.7min,exit0;
  failures/skipped/retries0.
- Финальный целевой camera-fireball/mobile-landscape/mobility-hud:27/27 за54.6s,exit0.
- `npm.cmd run test:e2e:production`:6/6 за28.8s,exit0.
- `git diff --check`:exit0;269src/tests SHA256 совпали после полного прогона.

Реальный Chromium проверил844×390 и1024×768 при2×/3×, desktop1280×720,
portrait/landscape, zoom1.66→1.276923, NEAREST/pixelArt/roundPixels и полное
покрытие чанками при нескольких координатах. Настоящие FireballI/III/V/evolved
сняты на Canvas; unit-тесты подтверждают сохранение хвоста/кольца и параметров,
отсутствие двух lineBetween и read-only render. Все13PNG после полного QA
повторно открыты и просмотрены. Код между финальными проверками не менялся.

Отчёт, PNG и HTML: [CAMERA_FIREBALL_QA](CAMERA_FIREBALL_QA.md).
Логи/manifest: `docs/camera-fireball-cleanup/`. Физические устройства не проверялись.
Блокеров нет; следующий шаг — ручная приёмка пользователя.

## Landscape-only mobile + fullscreen — 2026-11-04, QA завершён

Работа в main отe28bbc5, без новых веток/commit/push/deploy.
Portrait gate/пауза, fullscreen из user gesture и orientation lock с fallback,
компактный landscape touch HUD,80px Blink,5auto icons, zoom×.83 и safe-area.
Logical World viewport/баланс/AI/CDR/коллизии/controller mapping сохранены.
Исправлен выбор карточки вторым touch при удержании joystick; overlay выше controls.

- `npm.cmd run check`:487/487 в61файле,typecheck/lint/build exit0.
- `npm.cmd run test:e2e -- --workers=2`:275/275 за26.8min,exit0;
  failures/skipped/retries0.
- После единственной CSS-строки overlay во время full QA: повтор39/39 mobile,
  levelup-hotfix,mobility-hud,hd-ui за1.4min,exit0; check/build повторно прошли.
- `npm.cmd run test:e2e:production`:6/6 за34.5s на финальной сборке,exit0.
- `git diff --check`:0; final manifest267src/tests совпал после UI/production.

В Chromium/CDP проверены все5viewport из запроса, два пальца, удержание через
реальный touch-выбор карточки, отсутствие двойных команд Blink, поворот во время
игры/ручной pause/Level Up, trusted fullscreen activation, native fullscreen
enter/exit, API success/failure/unsupported и отсутствие автоматического retry.
Реальные viewport listeners стабильны через10restarts и удаляются после unmount.
Шесть финальных PNG открыты и просмотрены, включая landscape upgrade без перекрытия.
Физические iOS/Android/Steam Deck не проверялись; следующая стадия — ручная приёмка.

Подробности, PNG и HTML: [MOBILE_LANDSCAPE_QA](MOBILE_LANDSCAPE_QA.md).
Логи и source manifests: `docs/mobile-landscape/`. Блокеров нет.

## Compact Carousel Timeline — 2026-11-04, QA завершён

Ветка feature/compact-carousel-timeline от mainfc11095, семь source/test/README
файлов. Только лента и её read-only проекция расписания изменены в игровом src;
остальной HUD/World/Director/баланс/AI/Enrage/spawn timings/input не менялись.
Окно±60s, центр сейчас, оригинальные SVG и badges2/3, 24px desktop/20px mobile,
без текста/таймера/интерполяции/дополнительных listeners или накопления истории.

- `npm.cmd run check`:487/487/61files, typecheck/lint/build exit0.
- `npm.cmd run test:e2e -- --workers=2`:262/262 за27.5min, exit0.
- `npm.cmd run test:e2e:production`:6/6 за33.3s, exit0.
- Целевые Timeline+MVP UI11/11; финальные carousel4/4 после удлинения риски.
- После полного прогона только onset-test усилен текущим `ENRAGE ·0`, поскольку
  будущая иконка может быть видна раньше начала режима. Два затронутых кейса
  прошли2/2 за14.4s; повторные typecheck/lint0. Весь src неизменён.
- Full failures/skipped/retries0; все264SHA совпали перед усилением test assertion;
  finalmanifest264 сохранён после него. `git diff --check`:exit0.

Восемь PNG реального Chromium Canvas before/center/after/Endgame1280×720/390×844
просмотрены. Геометрия, отсутствие текста/overflow/перекрытий, pause/LevelUp/
death/restart, все keyboard/gamepad/touch регрессии и lifecycle прошли.
Физические контроллеры/Safari/реальные телефоны не проверялись.
Полный HTML262кейсов сохранён перед целевым тестом, логи/SHA/PNG/файлы/ограничения —
[COMPACT_TIMELINE_QA](COMPACT_TIMELINE_QA.md). Mainfc11095 не менялась,
commit/push/merge/deploy и done-маркеры не создавались. Работа остановлена для приёмки.

## Публикация MVP UI Polish — 2026-11-04

По отдельному запросу пользователя создан commit `fc11095` (47 файлов), main
обновлена fast-forward с4289bd7 и успешно отправлена в origin/main без force.
Удалённый SHA `fc110958fc13a6828a6462f0a17e01fb51814c14` подтверждён ls-remote;
локальная main/origin/main совпадают, дерево чистое, gitdiff--check0.
Все263 нормализованных SHA256 src/tests совпали с прошедшим QA кодом;
после checkout только10файлов сменили LF наCRLF. Результаты483/258/6 сохраняются.
Две серверные ошибки обычного Git HTTPS устранены повтором через HTTP/1.1;
глобальные настройки и соседний worktree не менялись, deploy не выполнялся.

## MVP UI Polish — 2026-11-04, QA завершён

Ветка `feature/mvp-ui-polish`, база main `4289bd7`; 47 source/test/README-файлов.
Mage-only public policy, исходный Warrior через DEV-фикстуру, новые карточки,
Timeline от общего расписания Director и актуальная справка. Баланс/World/AI/
способности/spawn rate/HP/Enrage/экономика не изменены.

- `npm.cmd run check`: 483/483, 61 файл; typecheck/lint/build exit0.
- `npm.cmd run test:e2e -- --workers=2`: 258/258 за27.2min, exit0.
- `npm.cmd run test:e2e:production`: 6/6 за33.1s, exit0.
- Изолированный `gamepad-performance.spec.ts`: 2/2 за27.8s, exit0.
- Целевые card/HD/UI E2E после исправления компоновки: 31/31, exit0.
- Failures/skipped/retries финального полного набора: 0. Все263SHA256 src/tests
  совпали с manifest после QA; `git diff --check`: exit0. Main не менялась.

Реальный Chromium/Canvas, 1280×720 и390×844; PNG меню/справки/семи групп карточек/
selected/Timeline590/600/900 сохранены и просмотрены. Старый hd-ui запрет перекрытия
зоны героя сохранён: промежуточный дефект трёх boss bars исправлен отступами,
затем все соответствующие сценарии прошли. WASD/стик через Level Up, fresh-A,
200ms lock, Space guard, touch, blur/disconnect и десять рестартов прошли.

Изолированная фикстура1080s/пять Mage V/150mobs+3boss+3Guardian:
medianFPS59.08/59.07, sampled p95update1.50/1.40ms, p95gamepadpoll0.10ms.
Mock только браузерногоGamepadAPI; физический Xbox/PlayStation не проверен.
Исходное изображение Azeroth Survivor не найдено; 19 SVG эмблем оригинальные.
Логи/raw, полный список файлов, PNG и ручная приёмка — [MVP_UI_QA](MVP_UI_QA.md).
Локальный сервер5173 сохранён, тестовые порты5187/5188. Commit/push/merge/deploy
и done-маркеры не создавались. Работа остановлена для пользовательской приёмки.

## Full Gamepad Support MVP — 2026-11-04, QA завершён

Ветка `feature/full-gamepad-support`, база `2fb3134`; 22 новых/изменённых
source/test/README-файла, без изменений баланса, HP/AI/Enrage/Guardian.
`npm.cmd run check`:475/475/58files, TS/lint/build exit0.
`npm.cmd run test:e2e -- --workers=2`:251/251 за26.6min, exit0.
`npm.cmd run test:e2e:production`:6/6 за37.8s, exit0.
Skipped/flaky/unexpected0, все252SHA256 src/tests совпали, gitdiff--check0.
Один провал первого большого прогона диагностирован как выход тестового пилота
за Guardian leash; исправлена только траектория/амплитуда input mock,
150+3+3assertions сохранены. Изолированные2viewport×3повтора6/6, затем весь
набор251/251. Финальные изолированные FPS59.03/59.45, sampled p95update1.1ms,
p95poll0.10ms. Десять run + десять scene restarts: listeners/resources стабильны.
Контроллерные E2E идут через настоящий controller/Phaser/Vue/World,
браузерныйGamepadAPI замокан. Физические Xbox/PlayStation не проверены.
CanvasPNG обоихразмеров просмотрены. Файлы, раскладка, ограничения,
raw/logs и ручная инструкция — [GAMEPAD_QA](GAMEPAD_QA.md).
Работа остановлена для физического теста. Done/commit/push/merge/deploy нет.

## Held Movement Across Level-Up — QA завершён

Ветка `fix/held-movement-levelup`, checkpoint предыдущей работы `e87a06c`.
До правок оба исходных E2E воспроизвели потерю движения (W в модальном окне,
D до получения уровня). Новый набор содержит 20 E2E и 4 unit-теста.
Финальный `npm.cmd run check`: 466/466, 57 файлов, TS/lint/build, exit 0.
`npm.cmd run test:e2e:production`: 4/4, exit 0 (30.2 с).
Первый полный E2E: 231/232, единственный таймаут hd-warrior при Escape после
прямого World.resume; тест синхронизирован с Vue-снимком без ослабления
боевых assertions и без увеличения timeout. Три повтора обеих карт: 6/6.
Повторный полный `npm.cmd run test:e2e -- --workers=4`: 232/232 за 15.1 минуты,
exit 0, skipped/unexpected/flaky = 0. Все 20 новых E2E прошли. Финальные пять SHA
и все 42 SHA предыдущей Enrage-работы неизменны. Git diff --check: exit 0.
Оконный Chromium/CDP noDefaults: настоящий trusted blur/focus и отсутствие
залипания после resume, exit 0. PNG настоящего Canvas открыт и осмотрен.
Детали, логи и ограничения runner: [отчёт](held-input/REPORT.md).
Push/merge/deploy не выполнялись; далее ручная проверка.

## Endgame Enrage2.0 / Guardian Scaling — QA завершён

Checkpointd1fa0cc сохранил предыдущую работу, feature/endgame-enrage-2.
`npm.cmd run check`462/462,56files,TS/lint/build,exit0.
Полный `npm.cmd run test:e2e -- --workers=4`212/212 за15.2min, production4/4
за24.7s, final serial load2/2 за36.6s, всеexit0. JSON unexpected/skipped/
flaky0;42game/testSHAнеизменны;READMEdocобновлён;gitdiff--check0.
Final max-birth load150/3/3/5MageV:FPS59.71/59.54,p95RAFframe16.8ms,
p95Scene.update1.4/1.2ms;objects418/394plateau,textures56/32,
после5рестартоводинаковыеobjects/listeners/timers/textures.
Mage89от18min3seeds:AFKdeath43.55–45.05,move/Blink≥240s;mobile195×422
AFK58.1–62.85,active≥240. LiveCanvas2viewports:desktopAFKdeath40.06s,
mobileAFKс229.56damage/10.44HPна60s,всеactive60sбезурона. Никакойтестовой
неуязвимостивsurvival. Perp-dodgeGuardian×2 иCharger320провереныотдельно.
РеальныеPNGоткрыты/осмотрены. Старыеbeam/passiveтестыперенесеныновый
контракт;caps/rewards/cleanup/assertionsнеотключены. Подробныепараметры,
команды,rawJSON,полныйпереченьфайловиограничения:[REPORT](enrage2/REPORT.md).
Следующийшаг—ручнойтест15–25min. Push/merge/deploy не выполнялись.

## Enrage Boss Aggression / Guardian Orbs — финальный QA завершён

Веткаfeature/enrage-bosses-guardian-orbs, база6903506. `check`443/443,
55files, TS/lint/build exit0; целевые18/18, затем10/10после расширенияstress.
Полныйdev202/202 за13.7min(4workers), production4/4 за31.9s,
serial performance2/2 за37.7s, всеexit0; unexpected/skipped/flaky0.
27source/test SHA256 до/после QA совпали, gitdiff--check0. Финальные FPS:
59.64/59.86 при150+3+3/5skillsV, p95update1.3/1.1ms; textures56/32,
после5restart одинаковые objects/listeners/clock. Baseline архивного World и
новый World с одинаковым Mage56/пилотом,3seed12min+1seed15min по180s;
никакой тестовой неуязвимости в survival. Реальные Canvas screenshots
1280×720/390×844 осмотрены. До10min четыре SHA replay сохранились.
AFK3/3survived12–15min, dmg131.95–199.56, active0–4.32/Blink0; от15minAFK
смерть95.70s против93.55s baseline. AFK не считается устранённым. Причины
и изолированные проверки active Guardian, raw metrics и полный перечень
изменений: [REPORT](boss-guardian/REPORT.md). Полный allV Mage в активной зоне
3Guardian: AFK9damage, убийства5.25–10.45s до быстрой сферы. Это ограничение
не объявлено устранённым. Ручной тест пользователя остаётся следующим шагом.

## Survival Enrage / Arcane Absorb — 2026-11-03

Технический QA завершён: `check`406unit/53files/TS/lint/build exit0;
полный dev188/188 за19.4min (2workers), production4/4 за29.1s, exit0.
Отдельный serial performance2/2 за30.4s, `git diff --check`exit0.
Полные JSON unexpected/skipped/flaky0, все52source SHA неизменны за финальный QA.
До изменений сохранён исходный архив d7bb994, SHA и FPS/баланс baseline.
Повтор архивного World независимо подтвердил4replay SHA и9survival результатов;
84actual displacement probes подтвердили скорости normal/elite frenzy.
Регрессия часов600−2e−8 воспроизведена (nextAt660), исправлена (630), покрыта тестом.
Новые41unit покрывают Enrage7времён/скорости/attack starts/caps/boss30s/noqueue/
pause/restart и AbsorbI–V/overflow/refresh/Dash/CDR/визуализацию/death.
Целевые E2E9/10, затем3/3 повтор: первоначальный Blink context destroyed при
редактировании Vite helper во время прогона. Исходный полный187/188 выявил
idle frame из key-up/key-down gap в fixture; исправлены непрерывный ввод и
порядок spawn всех3Guardian перед awaken. Строгие assertions сохранены, целевой
mobile повтор1/1 и финальный полный188/188. Остаточный shield shell при0/death
воспроизведён отдельным тестом и исправлен в рендере без изменений боя.
Canvas PNG onset/Absorb/overflow/15min/AFK/move/Blink1280×720/390×844 просмотрены.
Финальные serial FPS59.33/59.33 при150обычных+3boss+3Guardian+5skills,
baseline59.12/59.23; sampled p95update1.1/1.1ms. Таймеры0, рестарты без роста.
Детерминированный Mage40: AFK32.0–34.85s до смерти, move/Blink180s живы3seed,
без test invulnerability. BaselineAFK уже34.95–46.75s, иной пользовательский
билд с артефактами этим не воспроизведён. Настоящий RAF: AFK смерть45.90/34.93s,
180урона; move/Blink45s живы на обоих viewport, урон14.01/14.95 и0/0.
AFK-окно продлено до90s, чтобы измерить TTD вместо цензурирования на45s.
Полный отчёт/таблицы/52файла/ограничения: `survival-enrage/REPORT.md`.

## Mage Casting — 2026-11-03

`npm.cmd run check`:365unit/51files, TS/lint/build, exit0.
`npm.cmd run test:e2e`:178/178 за29.8min, status passed/failedTests[].
`npm.cmd run test:e2e:production`:4/4 за28.5s, exit0.
`git diff --check`:exit0. Новые проверки не отключались, старые не исключались.
Шесть новыхE2E: два Mage45 stress, две Canvas последовательности1280/390,
pause/hurt/death/10restarts и222hardalpha/54head-feet checks. Unit13 добавлены
для read-only наблюдения фактических casts, bounded queue и жизненного цикла.
18временных filmstrip финального запуска просмотрены; дополнительно просмотрены
два полных activeBlink CanvasPNG. WebM записаны, целиком не просмотрены.
Нагрузка150/3/3:59.42/59.32FPS, sampled p95update1.6/1.5ms; до59.10/59.25,
1.4/1.5ms. Фиксированная добавка2objects/1texture5 169 152RGBA bytes, роста
после5/10рестартов нет. Исходный Mage и завершённый хотфикс UI/audio SHA сохранены.
Первый неполный финальный запуск остановлен из-за случайного недобора Guardian
в load fixture; исправлена подготовка четырёх fixture без ослабления assertions,
затем весь набор пройден заново. Директор и баланс не менялись.
Отчёт,32файла, ограничения, точный метод измерений и доказательства:
`mage-casting/REPORT.md`, `mage-casting/VALIDATION.json`, `mage-casting/REVIEW.html`.

---

## Frost Audio / Level-Up UX — 2026-11-03

Check352unit/50files/TS/lint/build exit0. Полный Playwright172/172 за27.4min,
last-run status passed/failedTests[]. PowerShell wrapper дал1 наstderr warning;
это воспроизведено exitCode0 probe, production с явным exit LASTEXITCODE дал0:
4/4 за24.4s. Diff-check прошёл. Все12запрошенных input/confirmation/audio сценариев
покрыты unit/E2E. PNG before/selected/after desktop/mobile просмотрены, реальный
RAF подтвердил паузу доcommit и возобновление. Timer200ms проверен unit;
наблюдение послеcommit в RAF может запаздывать под нагрузкой (263.3ms в полном
прогоне). Детали/инварианты/ограничения: `frost-audio-levelup/REPORT.md`.

---

## Audio MVP — 2026-11-03

`feature/audio-mvp` от `3e5febf`. `npm.cmd run check`: TypeScript/lint/build,
341 unit /48 файлов — успешно. Полный dev E2E: **158/158 за28.3min**;
production: **4/4 за28.3s**, включая реальный Web Audio RMS после клика и тишину
на паузе для обоих героев/обеих карт. `git diff --check` прошёл.
Canvas PNG просмотрены; 10рестартов наdesktop/mobile без роста аудиоресурсов,
150+3+3 нагрузка соблюдает бюджет12голосов/3петель. Источник: `AUDIO_MVP_REPORT.md`,
манифест/измерения/коды возврата: `audio-mvp/`. Первый полный прогон потерял
временный сервер и заменён успешным изолированным повтором.
Сигнал в аудиографе подтверждён; субъективное звучание, физические устройства
и другие браузеры не проверялись. Следующий шаг — ручное прослушивание.

---

**Текущее расширение Phase2 (12–19):** [PHASE2_TEST_REPORT.md](PHASE2_TEST_REPORT.md). Ниже сохранён отчёт исходной Phase1 (00–11); его числа тестов/FPS относятся к тому этапу.

Дата: 31 октября 2026. Все команды выполнены локально внутри проекта. Проверено исходное приложение и собранный production runtime; публикация не выполнялась.

## Среда

- Windows x64; Node **22.16.0**, npm **10.9.2**.
- Phaser **4.2.1**, Vue **3.5.44**, TypeScript **5.9.3**, Vite **7.3.7**, Vitest **5.0.5**.
- Playwright **1.64.1**, Chromium **156.0.8078.4**, headless. Playwright MCP не был доступен; использован настоящий Chromium через локальный `@playwright/test`.
- CPU **AMD Ryzen 5 7500F**, 12 логических потоков, **31.6 GiB RAM**.
- Renderer: **ANGLE / NVIDIA GeForce RTX 4060 / Direct3D11**.
- Viewport: **1280×720** и **390×844**.

## Команды и результаты

| Команда | Фактический результат |
|---|---|
| `npm install --ignore-scripts` | Зависимости установлены, версии закреплены в lockfile |
| `npm ci --ignore-scripts` | Чистая переустановка из lockfile прошла |
| `npm run check` | Typecheck + ESLint + **58 unit tests / 11 файлов** + production build прошли |
| `npm run test:e2e` | **11 passed**, около 1.2 минуты с минутным stress smoke |
| `npm run test:e2e:production` | **1 passed**, 7.4с; поднят и закрыт настоящий Vite preview на 4173 |
| `npm audit --omit=dev --json` | **0** runtime vulnerabilities |
| `npm audit --json` | **13 moderate**, 0 high/critical, в dev-цепочке ESLint/TypeScript ESLint/minimatch; см. сохранённый JSON |

Build выдаёт предупреждение о размере Phaser chunk: **1,387.44 kB**, gzip **371.54 kB**. Это предупреждение, build завершается успешно. Внешнего CDN нет. Кэш npm, Chromium и временные профили находятся в `.npm-cache`, `.browsers`, `.tmp` проекта.

## Unit/integration проверки

| Файл | Тестов | Что проверено |
|---|---:|---|
| `bridge.test.ts` | 1 | Доставка typed events, unsubscribe |
| `world.test.ts` | 6 | Нормализованные диагонали, ближайшая цель, периметр спавна, 60с симуляции/убийства/caps |
| `combat.test.ts` | 5 | I-frames, однократная смерть, свежие рестарты, swept collision, knockback с сохранением boss telegraph |
| `upgrades.test.ts` | 6 | XP thresholds/carry, три уникальных eligible выбора, caps/fallback, очереди уровней, XP pools |
| `abilities.test.ts` | 7 | Unlock/rank eligibility, cooldown, уникальная цепь, slow expiry, delayed meteor, shield, огненная эволюция |
| `director.test.ts` | 8 | Границы/веса волн, regular/hostile caps, bounded scaling, caster telegraph/cadence, despawn без очков, grid, elite score |
| `bosses.test.ts` | 8 | Scheduler/cap, charge/recovery, rune volley, owner cleanup в том же кадре, boss score once, победа над обоими боссами реальной магией |
| `world-chunks.test.ts` | 2 | Детерминированные координаты/декорации, bounded chunks при дальнем перемещении |
| `ux.test.ts` | 4 | Pause/input gates, upgrade нельзя случайно закрыть, clamp delta, versioned settings/corruption/quota |
| `records.test.ts` | 6 | Два sorted рекорда, настройки сохраняют историю, duplicate save/top10, corruption/future schema, score/death/invalid damage, 120с collection pilot |
| `reliability.test.ts` | 5 | Pool reuse/double-release, stale offerId, 10 dispose cycles, повторное использование projectile/effect, два детерминированных 20мин accelerated run |

В ускоренном stress test каждый шаг 0.05с проверяет <=150 обычных мобов, <=3 боссов, <=96 снарядов, <=96 эффектов и <=240 кристаллов. Два run с одинаковым seed дают одинаковые kills/score. Для проверки ресурсов используется развитая сборка и тестовая неуязвимость; обычная сложность выживания этим не доказывается.

## Настоящий браузер

11 dev-сценариев:

1. Открытие всех пяти способностей через настоящую UI-выдачу трёх карточек; проверка их активации/снарядов/slow/meteor/shield в сцене. Только XP ускорен тестовым harness.
2. Blur ставит паузу; focus не возобновляет без нажатия Continue.
3. Настоящий Phaser Canvas отрисован, нет pageerror.
4. Реальный XP drop/pickup открывает три карточки, время стоит; Tab сохраняет второй фокус через несколько snapshots, клавиша 1 применяет улучшение/возобновляет.
5. WASD меняет координату; три смерти/рестарта возвращают HP/score и один listener.
6. Оба босса рисуют предупреждения/HP, получают урон и умирают; desktop/mobile снимки. Время встречи и финальный урон ускорены harness.
7. Menu/help/settings/mute/pause/resume и keyboard focus работают.
8. Pointer Events джойстика действительно двигают World; ширина документа 390px без overflow.
9. Два забега сохраняют [30,10], переживают reload и отображаются как **LOCAL / THIS BROWSER**.
10. Десять последовательных run restart + настоящий Phaser Scene restart: один Canvas, по одному commands/snapshots/metrics listener, fresh HP/score/orbs.
11. 60 интервалов по одной секунде в peak wave: движение клавиатурой, все лимиты, отсутствие console/page/resource errors, screenshot и метрики.

Production-сценарий выполняется **без harness**: меню → старт → естественный автоматический kill/очки → движение → pause/resume → resize 390×844. Проверены отсутствие `window.__PIXEL__`, внешних запросов, 404 и console/page errors.

После завершения тестов порты 5173 и 4173 проверены закрытыми: собственные временные серверы завершены.

## Замер производительности

Финальный замер: `2026-10-31T17:16:03.195Z`. Полные 60 samples и железо — [browser-smoke.json](benchmarks/browser-smoke.json).

Начало на игровом времени 20мин, level 30, 150 мобов + 2 босса, способности III, 3 огненных шара, тестовая неуязвимость и движущийся keyboard pilot. Номинально 60с + накладные расходы автоматизации; игровое время выросло на **60.775с**. После трёх warm-up samples:

| Метрика | Результат |
|---|---:|
| FPS min | 59.79 |
| FPS median | 60.14 |
| FPS average | 60.17 |
| World + scene synchronization update median | 0.50мс |
| Update p95 | 2.70мс |
| Max regular mobs sampled | 150 |
| Max projectiles sampled | 34 |
| Max XP orbs sampled | 216 |
| Max active bosses sampled | 2 |
| Max nearby chunks sampled | 48 |
| Browser errors | 0 |

FPS измерен `Phaser.loop.actualFps`; updateMs не включает полное время GPU rendering. Draw calls не заявляются. Это замер на указанном ПК; он не обещает 60 FPS на телефоне. Heap profiling/10-минутный реальный soak не выполнялись; проверены budgets, пулы, очистка чанков и постоянство listeners/Canvas при рестартах.

## Скриншоты, действительно открытые и просмотренные

- [Финальное меню](screenshots/11-menu.png)
- [Production desktop](screenshots/11-production-desktop.png), [production mobile](screenshots/11-production-mobile.png)
- [Карточки desktop](screenshots/11-upgrade-desktop.png), [карточки mobile](screenshots/11-upgrade-mobile.png)
- [Пять активных способностей](screenshots/11-five-skills.png)
- [Два босса / desktop](screenshots/07-desktop.png), [mobile](screenshots/07-mobile.png)
- [Touch HUD](screenshots/08-mobile.png), [локальные рекорды](screenshots/09-records.png)
- [Минутный stress](screenshots/10-stress.png)

Проверялись именно изображения Canvas через view_image, а не только DOM. Найденное растяжение мобильного HUD было исправлено. Тексты карточек, фокус, герой, enemy silhouettes, телеграфы и поля HUD различимы.

## Исправленные причины отказов

- Несогласованный устаревший dev-набор: обновлены версии, выполнена чистая установка; critical/high устранены, runtime audit чистый. Dev-only moderate остались в актуальной цепочке lint/glob; принудительная несовместимая замена major зависимостей не делалась. [Audit JSON](benchmarks/dependency-audit.json), [runtime audit](benchmarks/runtime-audit.json).
- Windows Playwright webServer teardown оставлял Vite: локальный runner теперь владеет непосредственным дочерним Node-процессом и завершает его.
- Fixture скачка времени закономерно вызвал третьего планового босса: исправлено расписание fixture.
- PowerShell pipe испортил кириллицу кнопки; исправлен UTF-8 текст.
- Modal терял Tab focus из-за наблюдения за новым snapshot-массивом: watch переведён на offerId.
- Начальный peak fixture на первом уровне слишком часто открывал upgrade pause; он приведён к позднему уровню. Обнаруженный favicon 404 исправлен настоящим локальным SVG.
- Снаряд погибшего босса мог сработать позже в том же update: добавлена проверка владельца и regression test.
- Npm/PowerShell перехватывал передаваемый `--production`: production тест вынесен в `npm run test:e2e:production`; именованная команда прошла.

Ни один тест не отключён, ошибки типов не подавлены, проверка console errors не ослаблена. Открытых блокеров нет.

## Непроверенные ограничения

- Реальные iOS/Android, Safari/Firefox и физическая touch-клавиатура не проверялись; mobile покрыт Chromium viewport + Pointer Events.
- Полный ручной 15–20-минутный забег/субъективный баланс и десятиминутный реальный stress требуют отдельной игры/замера. Автоматизация проверила 120с collection pilot, accelerated 20мин и 60с реального peak stress.
- AudioContext/SFX код выполнялся в браузере без исключений, но субъективное прослушивание не проводилось.
- PWA/service worker отсутствует. Runtime не требует внешней сети, но для загрузки/перезагрузки нужен локальный static/dev/preview server.
- LocalStorage не защищён от ручного редактирования. При запрете хранилища игра продолжается, сохранение между вкладками/сеансами не гарантируется.
