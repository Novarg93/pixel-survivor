# HD Art Pack 01 — Runner

2026-11-01. Реализован только Runner, поверх HD-интеграции `b2cd57c`.
Художественная приёмка ещё впереди; Tank/Caster/Mage и другие наборы не начаты.

## Результат

Оригинальный Ember Strider: вытянутая голова, наклонённый узкий корпус,
длинные суставчатые ноги и когти, стреловидные медные спинные пластины.
Материалы/силуэт отличаются от округлого зелёного Grunt. Свет сверху слева,
две авторские стороны вместо runtime-зеркала. Тёплые блики отделяются от синего
Dark Forest и зелёной Grove. Это программно нарисованный оригинальный pixel art,
без коммерческих спрайтов или новой зависимости.

| Параметр | Реализовано |
|---|---|
| Исходная рамка / pivot | Все кадры64×64, `(0.5,0.5)`, без trim |
| Мировой размер | 16×16; elite22.4×22.4 по исходному множителю1.4 |
| Экран при zoom2 | 32×32; elite44.8×44.8 |
| Idle | 3 кадра,3fps, цикл |
| Walk | 6 кадров,12fps, цикл, реальные опорные/маховые фазы |
| Hurt | 3 кадра,16fps,0.1875s визуальной отдачи без остановки AI |
| Death | 6 кадров,12fps,0.5s одноразово, fade в конце |
| Стороны / всего | right/left, по18, всего36 разных кадров |
| Атлас | hd-runner,512×408, PNG83792B, JSON7032B |
| Пиксели | Бинарная альфа, NEAREST, квантование канала шаг8 |
| Legacy | runner/runner-walk не создаются; остальные исходники не меняются |

PNG SHA256: `07b0bc7aa221f5ab0bd8e62fd4247cc66453d76f34dc1d236f5f7749a6f9d7e7`.
[Исходный атлас](../public/assets/hd/runner.png),
[описание кадров](../public/assets/hd/runner.json).
Редактируемая геометрия — scripts/runner-art-source.mjs; сборка через установленный Chromium.

## Анимации без изменения механик

RunnerAnimation хранит максимум150 наблюдаемых Runner и читает их фактическое
смещение/hitUntil. Пауза сохраняет текущую позу и кадр, движение берётся из AI,
не из картинки. При ударе сохраняется направление до knockback.

Ссылки на живых Runner запоминаются до simulation step. Если отсутствующая
сущность имеет hp=0, её финальные x/y/elite передаются в визуальный слот.
Если hp>0, это despawn, тело не создаётся. Смена runId чистит наблюдение и
активные тела. World, combat, AI, balance, abilities, loot и radar не менялись.
Базовые Runner HP16/speed68/damage8/radius8/xp7 и исходные elite-множители сохранены.

Death-пул — до24 Image, вне списка живых enemies и World.effects. При переполнении
переиспользуется старейший визуальный слот; очереди отложенных смертей нет.
На паузе кадр стоит, после0.5s Image скрывается/inactive, на scene.shutdown
уничтожается. Никаких новых timer/listener/interval. Уже существующие death-искры
сохранены, игровой effect cap96 не менялся.

Настоящее удаление/score/XP/loot происходят в прежнем World.damageEnemy. E2E
проверил в одном синхронном вызове: enemy уже отсутствует, kills=1, XP14 и
предмет на земле уже есть, а corpse ещё0 до следующего кадра представления.
Затем зафиксированы все6 death-фаз и прежний размер элиты22.4.
Тела создаются для наблюдаемых Runner; уничтоженный целиком до первого наблюдения
враг оставляет исходный общий death FX. Renderer не угадывает тип/elite по цвету
частиц и не внедряет callback в World ради этого крайнего случая.

## Скриншоты Phaser Canvas

Реальная существующая GameScene с fixture: Warrior, Grunt HD, Runner,
Elite Runner с исходным shielded marker, шесть смешанных врагов.
В статичной пробе включена настоящая пауза; скрыт только диалог паузы тестовым CSS.
HUD/мини-карта и масштаб не ретушировались. В нагрузочной пробе симуляция живая.
Все PNG просмотрены в реальном игровом масштабе.

| Сцена | 1280×720 | 390×844 |
|---|---|---|
| Старый Runner / Forest | [PNG](../screenshots/runner-pack-01/before-mixed-forest-1280x720.png) | [PNG](../screenshots/runner-pack-01/before-mixed-forest-390x844.png) |
| Новый Runner / Forest | [PNG](../screenshots/runner-pack-01/after-mixed-forest-1280x720.png) | [PNG](../screenshots/runner-pack-01/after-mixed-forest-390x844.png) |
| Старый Runner / Grove | [PNG](../screenshots/runner-pack-01/before-mixed-grove-1280x720.png) | [PNG](../screenshots/runner-pack-01/before-mixed-grove-390x844.png) |
| Новый Runner / Grove | [PNG](../screenshots/runner-pack-01/after-mixed-grove-1280x720.png) | [PNG](../screenshots/runner-pack-01/after-mixed-grove-390x844.png) |
| Hurt | [PNG](../screenshots/runner-pack-01/runner-hurt-1280x720.png) | [PNG](../screenshots/runner-pack-01/runner-hurt-390x844.png) |
| Death | [PNG](../screenshots/runner-pack-01/runner-death-1280x720.png) | [PNG](../screenshots/runner-pack-01/runner-death-390x844.png) |
|150 старых обычных Runner | [PNG](../screenshots/runner-pack-01/before-150-runners-1280x720.png) | [PNG](../screenshots/runner-pack-01/before-150-runners-390x844.png) |
|150 новых обычных Runner | [PNG](../screenshots/runner-pack-01/after-150-runners-1280x720.png) | [PNG](../screenshots/runner-pack-01/after-150-runners-390x844.png) |

В смешанной группе длинные ноги/наклон и тёплая голова отделяют Runner от Grunt;
stride заметно меняется на32×32. Из живой игры сохранены все6 walk- и death-фаз
([animation-evidence.json](../screenshots/runner-pack-01/animation-evidence.json)).
Мелкие гравировки на таком масштабе вторичны. Неподвижного неуязвимого героя
150 Runner обступают и перекрывают в обоих оформлениях; исходное separation
не менялось ради красивого скриншота. На узком viewport часть толпы вне камеры.

## Производительность: текущая HD-версия → Runner Pack01

Baseline снят до изменений на b2cd57c, затем тот же runner-performance.spec.ts
с новым рисунком. Chromium156.0.8078.4, Ryzen5 7500F, RTX4060/ANGLE D3D11,
31.6GiB RAM, headless,DPR1. По1s прогрева +6s RAF измерения на viewport.
Ровно150 обычных Runner, живые pursuit/separation/collisions, без keyboard pilot.
Только тестом отключены autoattacks/новые спавны и включена неуязвимость;
min/max регулярных мобов150 в каждой выборке. Это не тест реального телефона.

| Метрика |1280×720 до → после |390×844 до → после |
|---|---:|---:|
| FPS |≈60 → ≈60 |≈60 → ≈60 |
| p95 кадра,ms |16.8 → 16.7 |16.8 →16.8 |
| p95 Scene.update,ms |0.6 →0.5 |0.6 →0.5 |
| TextureManager keys |85 →84 |61 →60 |
| Источники RGBA,B |14130960 →14964496 |7839504 →8673040 |
| GameObjects |353 →353 |329 →329 |

Один атлас заменяет две маленькие legacy-текстуры: ключей−1, RGBA +833536B
(~0.795MiB), сеть ~90.8kB PNG+JSON. FPS ограничен около60Hz; разница0.1ms
у короткого p95 не доказывает ускорение. Первоначальное декодирование и VRAM
драйвера не измерены. RGBA — width×height×4 источников, не фактическая память GPU.

Сырые данные: [before-performance.json](../screenshots/runner-pack-01/before-performance.json),
[after-performance.json](../screenshots/runner-pack-01/after-performance.json).
Один и тот же harness отдельно пересоздаёт сцену10раз с150Runner: число текстур,
их бюджет, GameObjects и слушатели стабильны; Clock0/0/0, tweens0, canvas1.
Дополнительно10раз выполнен burst150 смертей:150kills/150 XP-orbs немедленно,
пул24,126 замен,505 GameObjects после burst,14964496B источников, без роста;
после каждого scene.restart allocatedDeaths0. Смена забега также убирает тела.
[death-pool-restarts.json](../screenshots/runner-pack-01/death-pool-restarts.json).

## Проверки

- `node --experimental-strip-types scripts/build-runner-art.mjs`:36кадров.
- `node --experimental-strip-types scripts/inspect-runner-art.mjs`:36кадров, bad=[]
  (нет пустых/обрезанных фигур). В ранних позах выступал гребень; исправлена
  геометрия складывания вокруг бедра, рамка/pivot и assertions сохранены.
- `npm.cmd run check`: TypeScript, lint, **121 unit /24 файла**, build — успешно.
- `$env:PIXEL_E2E_PORT='5185'; npm.cmd run test:e2e`: **45/45**,3.3min.
- `$env:PIXEL_E2E_PORT='5186'; npm.cmd run test:e2e:production`: **4/4**,29.4s.
- `git diff --check`: успешно.
- Существующие тесты XP/loot/buffs/артефактов/Guardian/radar/боссов/рестартов,
  а также60-секундная peak-wave smoke прошли. Ничего не отключалось.
- Production запрашивает только core PNG+JSON и runner PNG+JSON;
  legacy runner/runner-walk не создаются, A/C не грузятся.
- Все36 рисунков различаются, прозрачный border, alpha0/255; реальные размеры,
  hurt, все6death-фаз, заморозка кадра и отсутствие призраков при despawn/restart
  подтверждены отдельными unit/E2E. Console/pageerror массивы пусты.

## Изменённые файлы

| Группа | Файлы |
|---|---|
| Новый ресурс | public/assets/hd/runner.png, runner.json |
| Новый код представления | src/game/art/runnerPack.ts, RunnerAnimation.ts |
| Подключение | src/game/art/assetRegistry.ts, GameArt.ts; src/game/scenes/GameScene.ts |
| Авторинг и QA | scripts/runner-art-source.mjs, build-runner-art.mjs, inspect-runner-art.mjs |
| Новые тесты | tests/unit/runner-art.test.ts; tests/e2e/runner-art.spec.ts, runner-performance.spec.ts |
| Уточнение существующих проверок | tests/unit/asset-registry.test.ts; tests/e2e/hd-integration.spec.ts, production.spec.ts — теперь проверяют ровно два нужных HD-пака |
| Документы | docs/ART_STYLE_GUIDE.md, ART_ROADMAP.md, DECISIONS.md, PROGRESS.md, RUNNER_ART_PACK_01.md; исторический banner в HD_INTEGRATION_REPORT.md; README-RU.md; .gitignore |
| Свидетельства | screenshots/runner-pack-01:16PNG и4JSON, имена/ссылки выше |

Core PNG/JSON, World, EnemySystem, CombatSystem, баланс, способности, лут,
мини-карта, другие персонажи/враги/окружение не менялись. Перезаписанные общей
матрицей старые screenshots/hd-pixel-art восстановлены из HEAD, чтобы сохранить
исторический отчёт HD-интеграции; текущие свидетельства отделены в runner-pack-01.

## Ограничения и приёмка

Нет блокирующих технических ошибок. Реальный телефон/highDPR/pixelScale3 и
длительный heap/VRAM soak не проверялись. Тело смерти может быть частично закрыто
XP/лутом согласно исходным depth; в иллюстрации death второй тестовый Runner
без случайного предмета, но его XP сохранён. Элита пока использует прежние
масштаб/рамку/модификатор, её отдельная художественная версия не рисовалась.

Пакет готов к художественной приёмке. Другие враги и Mage не начинались.
Дополнительное поручение пользователя — локально закоммитить и слить в main
указанного репозитория; Git-результат сообщается в финальном ответе.
