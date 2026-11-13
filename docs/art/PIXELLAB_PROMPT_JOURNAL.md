# PixelLab — рекомендации и журнал принятых генераций

## 2026-11-13 — Throw и Ruin с пустой рукой приняты для игры

Явное поручение «накатывай в игру», затем «для анимации в другую сторону так же используй aceprite чтобы убрать копье» подтверждает выбранную роль обеих исправленных body-анимаций. Источник: `art/generated/warrior-spear-empty-hand-review-v1/viewer.html`, frames front/north/ultimate и три `.aseprite` проекта рядом. Приняты13front+13north+12Ruin кадров;0–4сохранены, с5кисть пустая; Ruin сохраняет исключение исходного06.png. Просмотр75мс front/north,90мсRuin; игровые тайминги/снаряды прежние. Приняты19изменённых поз; runtime mapping/SHA — оба runtime manifest и `docs/verification/warrior-empty-hand-v1/integration-verification.json`. Север для обоих бросков — source cell4 N/NE direct,NW mirror, native→atlas13/13 RGBA-identical проверено Aseprite.

Это локальная пиксельная правка существующего арта, не новая AI-генерация. Инструмент дочистки — Aseprite MCP batch1.3.18.6; новый prompt/seed/job ID неприменимы. Ранее использованный imagegen-донор сохранён в source; неизвестные параметры не выдумываются. Точные исторические PixelLab рецепты исходных Throw/Ruin остаются в предыдущих записях без изменений; стандарт SOUTH Whirlwind сохранён. Прежняя запись pending Ruin ниже относится к состоянию до этого поручения.

## 2026-11-13 — одобрен просмотр обычного Throw с пустой рукой

Пользователь ответил «отлично, ультимейт бросок копья так же исправь» на демку обычного Throw. Это одобрение показанной локальной правки обычного броска; не новая генерация и не команда интеграции в runtime. Выбранная роль: front/north body Throw после выпуска копья, с исходным замахом0–4 и пустой рукой с5 (индексы0-based). Источники, SHA и изменённые пиксели: `art/generated/warrior-spear-empty-hand-review-v1/manifest.json`, entries front/north;13кадров по75мс, NW/West зеркалятся по прежней схеме. Native `front-empty-hand.aseprite` / `north-empty-hand.aseprite`, дочистка Aseprite MCP batch1.3.18.6 в `source/aseprite-cleanup/`. Нового prompt/seed/job нет; прежний imagegen-донор сохранён в source, неизвестные параметры ему не приписываются. Рецепты принятых PixelLab исходников и Whirlwind не меняются.

Новая дочистка Ruin в том же viewer пока **pending user selection**, к одобрению обычного Throw не относится.

## 2026-11-13 — пользовательская замена Charge

По отдельному «замени charge звук на art\warrior\sounds\charge.wav» принят обновлённый supplied WAV: SHA a934f47b9edab575dec34981b92ad4b22c26de70570f6842f7ed1755769a2170,0,6865с. Роль — успешный Warrior Dash/Charge. Генератор не вызывался; prompt/seed/job неизвестны. Точные метрики/предыдущий manifest/proof и запись замены: `docs/verification/warrior-sounds-v1/charge-replacement-v2/`. История прежнего ff679d44… сохранена.

## 2026-11-13 — пользовательские звуки Warrior, без генераций

По прямому «art\warrior\sounds … интегрируй в игру» подключены девять пользовательских WAV для пяти обычных навыков, Charge и трёх ульт. Это supplied audio, не принятые PixelLab/ElevenLabs trials; prompt/tool/seed/job неизвестны и не выдумываются. Точные source paths, SHA256, длительности, gain и роли: `docs/verification/warrior-sounds-v1/manifest.json` и `docs/audio/WARRIOR_UPLOADED_SOUNDS_V1.md`. История прежних генераций/отклонений сохранена.

Этот файл ведётся по просьбе пользователя. После каждой явной приёмки
изображения или анимации добавлять точный использованный промпт, инструмент,
параметры, seed, job ID, локальный источник и выбранный проход. Рекомендация
ассистента или успешный тест не равны приёмке. Старые записи не удалять:
если роль ассета изменилась, добавить новую запись об изменении.

Первичное наполнение — известные приёмки воина B из текущей работы.
Неизвестную историю других персонажей не считать автоматически принятой.
Полные запросы остаются рядом с исходниками в `source/jobs/`.

## Практические рекомендации

1. Писать действие на английском конкретными глаголами: подготовка → удар
   или поворот → следование движению → восстановление. Одна задача на клип.
2. Использовать точный принятый PNG как первый кадр. Сохранять локальный путь
   и SHA256; `upload:<id>` временный, для повтора загрузить этот же PNG заново.
3. Для размашистого оружия добавлять прозрачные поля без ресэмплинга.
   У Cleave принятая база128² помещена в192² с полями32px и pivot96/132.
4. В caption-параметрах отдельно задавать персонажа, вид камеры, исходную
   позу и направление; в самом промпте преимущественно описывать движение.
5. Когда важна связь меча со слешем, генерировать их одним клипом. Cleave A
   принят именно так. В таком исходнике отдельного отключаемого слоя VFX нет.
6. Описывать форму следа свободно: яркий рабочий край, широкая середина,
   сужающийся хвост и исчезновение. Для Cleave больше не требуется ровно180°.
7. Для вихря просить явно вращать **тело**, показывать бок/спину/возврат
   лицом. Само слово360° не доказывает полный оборот — смотреть все кадры.
8. Предпочитать положительное описание желаемого поведения эффекта. В двух
   PixMiniMax-проходах Cleave B/C длинные запреты ground ring не убрали кольцо.
   Это наблюдение для этих проб, не универсальное правило модели.
9. При повторении дефекта менять постановку или инструмент. Не превышать
   три художественных прохода одной проблемы. Все пробы и причины выбора
   сохранять; удачный третий проход не гарантирован: у Cleave C второй лучше.
10. Проверять идентичность, лицо/цвета, меч/щит, края кадра, ритм, контакт,
    возвращение в стойку и шов цикла. Проверка файлов не заменяет просмотр.
11. Явно отмечать отражения, повороты и удалённые из playback кадры. Зеркало
    не считать новой генерацией. Не дописывать несуществующий промпт для
    программно нарисованного ассета; записать его renderer и операции cleanup.
12. Сохранять выбранный job, а не просто последний по дате. Записывать
    точную роль приёмки: Cleave A принят как навык, Cleave C — в пул автоатак.
    Принятие изображения не задаёт баланс, урон, игровые тайминги или ракурсы,
    которых нет. Котировки в generations не называть денежной стоимостью.
13. Проверять артикуляцию отдельно от количества ракурсов. Пользователь
    отклонил механику D/E: меч оборачивается, но корпус выглядит статичной
    моделью, которую прокручивают целиком. Последовательность front/side/back
    подтверждает только разворот, а не работу тела. Для следующего прохода
    задавать конкретные опоры и суставы: плечо/локоть/кисть для круга над
    головой либо опорную стопу, сгиб колена, наклон таза, отставание плеч и
    свободную ногу в противовес мечу. Подготовить асимметричную ключевую позу;
    эффект смотреть отдельным отключаемым слоем, чтобы он не скрывал дефекты.
14. Не считать подготовленную стойку гарантией траектории. В F три прохода
    (две PixMiniMax и одна animate_image) по overhead-позе всё равно опускали
    кисть и меч. Ключевую плоскость движения проверять в середине клипа;
    first/last-поза и повторение `above helmet` её не закрепили. После лимита
    попыток сохранять ограничение и переходить к отдельной работе с
    промежуточными ключевыми позами, не объявлять задачу исправленной по тестам.

## Текущие решения

- Cleave: **A** из `warrior-cleave-review-v1`, первый PixMiniMax-проход.
- Автоатаки: прежние C1/C3 остаются. Дополнительно **C** из того же Cleave-пака,
  выбранный второй PixMiniMax-проход, добавлен для фронтальной группы.
  У C есть принятое вместе с исходником короткое кольцо в конце.
- Фронтальная группа S/SE/E/SW/W; W/SW отражаются. Для N/NW/NE остаются
  принятые северо-западные C1/C3: нового заднего ракурса C не генерировали.
- Whirlwind C выбран как **референс** для пары минималистичных полных оборотов
  D/E. Это не окончательная приёмка: accepted-реестр и пул не изменены.
  Новые промпты сохраняются в source/jobs и попадут в раздел принятых после
  явного выбора пользователя.
- По обратной связи D/E не приняты по механике тела. Новый проход F/G:
  F — круг мечом над головой при устойчивом корпусе, G — вращение на одной
  опоре с противовесом. Стойки подготовлены отдельно, слеш накладывается
  существующим VFX, чтобы проверять тело без эффекта. Это ещё пробы.
- Точный актуальный art-пул: `docs/classes/warrior/APPROVED_ANIMATION_POOL.json`.
  Подключение этого пула к production отдельно от художественной приёмки.

## Рабочие референсы, отдельно от приёмки

12 ноября2026: Whirlwind C, job `49bcb0dd-3ca4-4e5a-83f7-9d82b9a5bbb7`,
выбран как ориентир движения/характера. Вход новых D/E — точная копия
[кадра24 C](../../art/generated/warrior-whirlwind-review-v1/raw/whirlwind-c/24.png).
Его SHA и источник записаны в
[reference.json](../../art/generated/warrior-whirlwind-minimal-v2/source/reference.json).
Инструмент принимает статический первый/последний PNG, поэтому движение C
описывается текстом, а не передаётся как video-conditioning. В демке рядом
воспроизводится весь исходный C. Нельзя называть такой запрос переносом
движения из видео или автоматически считать C принятым.

## Принятые изображения и анимации

Ниже сохраняются точные промпты из provenance. Служебные upload URL могут
истечь; для повторения использовать указанный локальный PNG и полный source JSON.

<!-- pixellab-accepted:warrior-model-b -->
### Воин B — Железный авангард

- Приёмка: Принятая статическая модель; 2026-11-12.
- Инструмент: PixelLab Pixen.
- Job: `1f53dd31-d70a-497f-8eb0-3b3417515b4e`.
- Принятый файл: [PNG](../../art/generated/warrior-concept-pack-v1/images/models/model-b.png), SHA256 `e3a545117166a0d1e51dce600f46d6a02c50cdecaf8b11a90234bcc35592b837`.
- Полный provenance: [JSON](../../art/generated/warrior-concept-pack-v1/source/model-requests.json).

Принятый PNG прошёл явный nearest-palette cleanup до общей24цветной палитры. Промпт относится к исходной Pixen-генерации; финальный PNG не выдаётся за неизменный raw.

Точный промпт:

```text
ONE static sprite, full-body HUMAN playable warrior facing strictly SOUTH FRONT, slight overhead top-down game camera, centered with 5 pixel margin, transparent background, 64x80 native pixels. Broad stocky heroic body with sturdy short legs, shoulders wider than hips, large clear mitten-shaped armored hands. Readable medium-detail pixel art with big clean connected pixel clusters, only THREE FLAT color planes per material, matte slate blue gray steel, oxblood cloth, muted brass, charcoal outline. Simple iconic animation-ready silhouette. No fine line textures, no scratches, no microdetails, no gradients, no painterly shading, no horns, no spikes, no tall crest or plume, no glowing eyes, no evil face, no skulls, no accessories, no text, no pedestal, no multiple views. Sword on VIEWER LEFT and shield on VIEWER RIGHT with both hands separated from torso. IRON VANGUARD design: asymmetric shoulders ONE broad angular shield-side plate and one smaller sword-side plate, LOW rounded open-face brow helmet with a flat steel brow and visible calm human face, no pointed crown. Broad beveled chestplate, short oxblood split tabard with ONE brass chevron at belt. Tall angular kite shield with one broad diagonal brass slash, wide practical sword pointing down and away from body, stocky sturdy stance. Heroic accessible frontline fighter.
```

Параметры исходного запроса:

```json
{
  "width": 64,
  "height": 80,
  "detail": "low detail",
  "outline": "selective outline",
  "direction": "south",
  "view": "low top-down",
  "no_background": true,
  "seed": 1701212
}
```

<!-- pixellab-accepted:warrior-idle-front -->
### Движение: idle-front

- Приёмка: Принято: все движения V1; 2026-11-12.
- Инструмент: animate_image.
- Job: `c0d2f10a-961d-4212-a8e2-4f0bb4d23ef9`; выбранный проход `idle-front`.
- Вход: [локальный PNG](../../art/generated/warrior-animation-review-v1/references/body-front.png), SHA256 `10e3c0f50f954c004ece993f5f1cb8f5bd3965c86403c47faa4069bd8f35b9f0`.
- Полный provenance: [JSON](../../art/generated/warrior-animation-review-v1/source/jobs/idle-front.json).
- [Лист кадров](../../art/generated/warrior-animation-review-v1/contacts/idle-front.png); [manifest](../../art/generated/warrior-animation-review-v1/manifest.json). Playback: idle-front/0, idle-front/1, idle-front/2, idle-front/3, idle-front/4.



Точный промпт:

```text
Subtle breathing idle loop of this exact armored warrior in his existing front-facing stance. Gentle chest and shoulder rise, shield and sword shift by only one or two pixels; both boots stay firmly planted at the same pixels. No turning, no walking, no added glow. Preserve exact identity, compact body size, slate steel, oxblood cloth and crisp pixel clusters. Begin and end in the reference stance.
```

Параметры исходного запроса:

```json
{
  "first_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
  "last_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
  "frame_count": 4,
  "no_background": true,
  "seed": 1712010
}
```

<!-- pixellab-accepted:warrior-idle-north -->
### Движение: idle-north

- Приёмка: Принято: все движения V1; 2026-11-12.
- Инструмент: animate_image.
- Job: `8fbd303d-6a0d-4354-8ec0-714ef40bb216`; выбранный проход `idle-north`.
- Вход: [локальный PNG](../../art/generated/warrior-animation-review-v1/raw/base-north/00.png), SHA256 `082e2b9ee49748cd87b9604d398fe76ad32340850b5a56f3f0541dd0332d6f10`.
- Полный provenance: [JSON](../../art/generated/warrior-animation-review-v1/source/jobs/idle-north.json).
- [Лист кадров](../../art/generated/warrior-animation-review-v1/contacts/idle-north.png); [manifest](../../art/generated/warrior-animation-review-v1/manifest.json). Playback: idle-north/0, idle-north/1, idle-north/2, idle-north/3, idle-north/4.



Точный промпт:

```text
Subtle breathing idle LOOP of this exact back-facing NORTH warrior. Keep back to camera, no face visible. Slight chest/shoulder breathing and tiny equipment settling only. Both boots fixed at same baseline, no turning or sliding. Same identity, helmet, sword, kite shield, native body size and crisp flat steel/oxblood pixel clusters. Return exactly to input stance.
```

Параметры исходного запроса:

```json
{
  "first_frame_url": "upload:208a9e23-2e94-45fb-8ea3-2326e8f8d6c6",
  "last_frame_url": "upload:208a9e23-2e94-45fb-8ea3-2326e8f8d6c6",
  "frame_count": 4,
  "no_background": true,
  "seed": 1712011
}
```

<!-- pixellab-accepted:warrior-run-front -->
### Движение: run-front

- Приёмка: Принято: все движения V1; 2026-11-12.
- Инструмент: animate_image.
- Job: `e8bf6d0b-f8b7-48a9-a1a6-e01e8c236513`; выбранный проход `run-front`.
- Вход: [локальный PNG](../../art/generated/warrior-animation-review-v1/references/body-front.png), SHA256 `10e3c0f50f954c004ece993f5f1cb8f5bd3965c86403c47faa4069bd8f35b9f0`.
- Полный provenance: [JSON](../../art/generated/warrior-animation-review-v1/source/jobs/run-front.json).
- [Лист кадров](../../art/generated/warrior-animation-review-v1/contacts/run-front.png); [manifest](../../art/generated/warrior-animation-review-v1/manifest.json). Playback: run-front/0, run-front/1, run-front/2, run-front/3, run-front/4, run-front/5, run-front/6, run-front/7, run-front/8.



Точный промпт:

```text
This same heavy warrior RUNS IN PLACE facing toward the camera SOUTH. Clear alternating left and right boot contacts, knees lift, compact weight transfer, small counter-motion of sword arm and shield, tabard moves in two broad folds. Full running stride cycle, no sliding across the canvas, no camera movement, no turning. Keep body size and all equipment, stable center and ground baseline. Preserve crisp medium-detail pixels, no added effects.
```

Параметры исходного запроса:

```json
{
  "first_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
  "last_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
  "frame_count": 8,
  "no_background": true,
  "seed": 1712020
}
```

<!-- pixellab-accepted:warrior-run-north -->
### Движение: run-north

- Приёмка: Принято: все движения V1; 2026-11-12.
- Инструмент: animate_image.
- Job: `6e8a3ead-3b89-4860-b97e-e4787adb517d`; выбранный проход `run-north`.
- Вход: [локальный PNG](../../art/generated/warrior-animation-review-v1/raw/base-north/00.png), SHA256 `082e2b9ee49748cd87b9604d398fe76ad32340850b5a56f3f0541dd0332d6f10`.
- Полный provenance: [JSON](../../art/generated/warrior-animation-review-v1/source/jobs/run-north.json).
- [Лист кадров](../../art/generated/warrior-animation-review-v1/contacts/run-north.png); [manifest](../../art/generated/warrior-animation-review-v1/manifest.json). Playback: run-north/0, run-north/1, run-north/2, run-north/3, run-north/4, run-north/5, run-north/6, run-north/7, run-north/8.



Точный промпт:

```text
RUN IN PLACE facing NORTH, away from camera, showing the same warrior's BACK throughout. Clear alternating boot contacts, visible leg stride and compact weight transfer, small sword/shield counter-motion and broad tabard folds. No turning, no translation or camera motion. Stable center, foot ground baseline and body size. Preserve exact native pixel style, identity and gear. Complete one full running cycle.
```

Параметры исходного запроса:

```json
{
  "first_frame_url": "upload:208a9e23-2e94-45fb-8ea3-2326e8f8d6c6",
  "last_frame_url": "upload:208a9e23-2e94-45fb-8ea3-2326e8f8d6c6",
  "frame_count": 8,
  "no_background": true,
  "seed": 1712021
}
```

<!-- pixellab-accepted:warrior-run-north-east -->
### Движение: run-north-east

- Приёмка: Принято: все движения V1; 2026-11-12.
- Инструмент: animate_image.
- Job: `50602617-18d6-4e75-b8d3-fcf4ffff3fb1`; выбранный проход `run-north-east`.
- Вход: [локальный PNG](../../art/generated/warrior-animation-review-v1/raw/base-north-east/00.png), SHA256 `1b719e5465e90758bc2eb6bfbbfea40ae4393c2f213c67a715b5a275d49e0aad`.
- Полный provenance: [JSON](../../art/generated/warrior-animation-review-v1/source/jobs/run-north-east.json).
- [Лист кадров](../../art/generated/warrior-animation-review-v1/contacts/run-north-east.png); [manifest](../../art/generated/warrior-animation-review-v1/manifest.json). Playback: run-north-east/0, run-north-east/1, run-north-east/2, run-north-east/3, run-north-east/4, run-north-east/5, run-north-east/6, run-north-east/7, run-north-east/8.



Точный промпт:

```text
RUN IN PLACE facing NORTH-EAST upper right, same back-right three-quarter view throughout. Clear alternating strides and boot contacts moving in the diagonal travel direction while staying centered. Heavy armor weight transfer, shield leads slightly, sword held safely, cloth moves in broad folds. No turning toward camera or translation, preserve same identity, size and pixel density. Complete one full running cycle.
```

Параметры исходного запроса:

```json
{
  "first_frame_url": "upload:f33230d2-171a-47f8-b7ae-15b5b1a9cb07",
  "last_frame_url": "upload:f33230d2-171a-47f8-b7ae-15b5b1a9cb07",
  "frame_count": 8,
  "no_background": true,
  "seed": 1712022
}
```

<!-- pixellab-accepted:warrior-v1-attack-south-v1 -->
### Историческая приёмка: attack-south-v1

- Приёмка: Принято ранее; текущий набор заменён C1/C3 V3; 2026-11-12.
- Инструмент: animate_image.
- Job: `2c41c89f-b10c-4f3c-bfa5-d8c73b2eb2bb`; выбранный проход `attack-south-v1`.
- Вход: [локальный PNG](../../art/generated/warrior-animation-review-v1/references/body-front.png), SHA256 `10e3c0f50f954c004ece993f5f1cb8f5bd3965c86403c47faa4069bd8f35b9f0`.
- Полный provenance: [JSON](../../art/generated/warrior-animation-review-v1/source/jobs/attack-south-v1.json).
- [Лист кадров](../../art/generated/warrior-animation-review-v1/contacts/attack-south-v1.png); [manifest](../../art/generated/warrior-animation-review-v1/manifest.json). Playback: attack-south-v1/0, attack-south-v1/1, attack-south-v1/2, attack-south-v1/3, attack-south-v1/4, attack-south-v1/5, attack-south-v1/6, attack-south-v1/7, attack-south-v1/8.

Запад V1 использовал отражение восточного источника, это отдельной генерацией не считается.

Точный промпт:

```text
Sword attack variation ONE toward SOUTH, toward the viewer. From the exact reference front stance, lift the sword arm up and to its sword-side shoulder, wind up, make a broad powerful horizontal forehand sword sweep across the entire FRONT lower half-circle, follow through, recover into the exact stance. Shield stays in the other hand, face visible, boots grounded with compact weight shift. Clear anticipation, strike and recovery. No rendered slash VFX. Keep identity, native body size and pixel style.
```

Параметры исходного запроса:

```json
{
  "first_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
  "last_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
  "frame_count": 8,
  "no_background": true,
  "seed": 1712030
}
```

<!-- pixellab-accepted:warrior-v1-attack-south-v2 -->
### Историческая приёмка: attack-south-v2

- Приёмка: Принято ранее; текущий набор заменён C1/C3 V3; 2026-11-12.
- Инструмент: animate_image.
- Job: `4bd3f837-0401-4363-ac93-812e2929e81b`; выбранный проход `attack-south-v2`.
- Вход: [локальный PNG](../../art/generated/warrior-animation-review-v1/references/body-front.png), SHA256 `10e3c0f50f954c004ece993f5f1cb8f5bd3965c86403c47faa4069bd8f35b9f0`.
- Полный provenance: [JSON](../../art/generated/warrior-animation-review-v1/source/jobs/attack-south-v2.json).
- [Лист кадров](../../art/generated/warrior-animation-review-v1/contacts/attack-south-v2.png); [manifest](../../art/generated/warrior-animation-review-v1/manifest.json). Playback: attack-south-v2/0, attack-south-v2/1, attack-south-v2/2, attack-south-v2/3, attack-south-v2/4, attack-south-v2/5, attack-south-v2/6, attack-south-v2/7, attack-south-v2/8.

Запад V1 использовал отражение восточного источника, это отдельной генерацией не считается.

Точный промпт:

```text
Sword attack variation TWO toward SOUTH: a distinct BACKHAND cleaving swing. Start in reference front stance, draw sword hand across the chest near shield-side shoulder, briefly brace behind shield, sweep sword in the OPPOSITE lateral direction across front lower half-circle, finish low and recover. Compact torso twist, clear sword hand and blade path, shield remains held in other hand. Feet remain grounded at same position. No slash VFX. Same exact warrior identity, size, native pixels and palette.
```

Параметры исходного запроса:

```json
{
  "first_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
  "last_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
  "frame_count": 8,
  "no_background": true,
  "seed": 1712031
}
```

<!-- pixellab-accepted:warrior-v1-attack-east-v1 -->
### Историческая приёмка: attack-east-v1

- Приёмка: Принято ранее; текущий набор заменён C1/C3 V3; 2026-11-12.
- Инструмент: animate_image.
- Job: `b24a90c0-733a-436b-8942-62a0fe2ab7d2`; выбранный проход `attack-east-v1`.
- Вход: [локальный PNG](../../art/generated/warrior-animation-review-v1/references/body-front.png), SHA256 `10e3c0f50f954c004ece993f5f1cb8f5bd3965c86403c47faa4069bd8f35b9f0`.
- Полный provenance: [JSON](../../art/generated/warrior-animation-review-v1/source/jobs/attack-east-v1.json).
- [Лист кадров](../../art/generated/warrior-animation-review-v1/contacts/attack-east-v1.png); [manifest](../../art/generated/warrior-animation-review-v1/manifest.json). Playback: attack-east-v1/0, attack-east-v1/1, attack-east-v1/2, attack-east-v1/3, attack-east-v1/4, attack-east-v1/5, attack-east-v1/6, attack-east-v1/7, attack-east-v1/8.

Запад V1 использовал отражение восточного источника, это отдельной генерацией не считается.

Точный промпт:

```text
Forehand sword attack variation ONE aimed EAST to the RIGHT of screen. Preserve this FRONT-facing body projection like a top-down game directional attack, do not rotate into a new profile. Lift sword arm on left side, wind up and sweep the blade broadly ACROSS the front toward the RIGHT target, clear extended rightward strike and compact follow-through, return to stance. Shield stays in opposite hand and moves aside enough for sword. Boots planted, no slash effects. Exact warrior identity, size and native pixels.
```

Параметры исходного запроса:

```json
{
  "first_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
  "last_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
  "frame_count": 8,
  "no_background": true,
  "seed": 1712034
}
```

<!-- pixellab-accepted:warrior-v1-attack-east-v2 -->
### Историческая приёмка: attack-east-v2

- Приёмка: Принято ранее; текущий набор заменён C1/C3 V3; 2026-11-12.
- Инструмент: animate_image.
- Job: `fb00557f-429e-47b3-8d4e-6f5942d379e7`; выбранный проход `attack-east-v2`.
- Вход: [локальный PNG](../../art/generated/warrior-animation-review-v1/references/body-front.png), SHA256 `10e3c0f50f954c004ece993f5f1cb8f5bd3965c86403c47faa4069bd8f35b9f0`.
- Полный provenance: [JSON](../../art/generated/warrior-animation-review-v1/source/jobs/attack-east-v2.json).
- [Лист кадров](../../art/generated/warrior-animation-review-v1/contacts/attack-east-v2.png); [manifest](../../art/generated/warrior-animation-review-v1/manifest.json). Playback: attack-east-v2/0, attack-east-v2/1, attack-east-v2/2, attack-east-v2/3, attack-east-v2/4, attack-east-v2/5, attack-east-v2/6, attack-east-v2/7, attack-east-v2/8.

Запад V1 использовал отражение восточного источника, это отдельной генерацией не считается.

Точный промпт:

```text
Distinct BACKHAND sword attack variation TWO aimed EAST to screen RIGHT. Keep the same FRONT body projection. Draw sword across upper chest with elbow bent, brace shield close, execute a short rising diagonal backhand cut with blade extended toward RIGHT, recoil and return to the original stance. Different windup and blade path than a wide forehand. Keep both hands/equipment intact, boots centered on same ground baseline, no VFX, no turning into a new profile. Same pixel style and body size.
```

Параметры исходного запроса:

```json
{
  "first_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
  "last_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
  "frame_count": 8,
  "no_background": true,
  "seed": 1712035
}
```

<!-- pixellab-accepted:warrior-approved-v3-east-forehand -->
### Автоатака: east-forehand

- Приёмка: Текущий принятый C1/C3; 2026-11-12.
- Инструмент: animate_image.
- Job: `e56cb604-8061-4d25-80c0-6d8d3970157c`; выбранный проход `east-forehand`.
- Вход: [локальный PNG](../../art/generated/warrior-autoattack-review-v2/references/front.png), SHA256 `10e3c0f50f954c004ece993f5f1cb8f5bd3965c86403c47faa4069bd8f35b9f0`.
- Полный provenance: [JSON](../../art/generated/warrior-autoattack-review-v2/source/jobs/east-forehand.json).
- [Лист кадров](../../art/generated/warrior-autoattack-review-v2/contacts/east-forehand.png); [manifest](../../art/generated/warrior-autoattack-review-v2/manifest.json). Playback: east-forehand/0, east-forehand/1, east-forehand/2, east-forehand/3, east-forehand/4, east-forehand/5, east-forehand/6, east-forehand/7, east-forehand/8.

Направления/отражения сохранены в V3; северо-западные источники — выбранные r3, не r2.

Точный промпт:

```text
Stationary ordinary auto-attack aimed EAST, directly RIGHT on the screen. Keep this same front-facing body projection; turn only the shoulders slightly toward the target. A broad FOREHAND sword cut. Pull the sword hand back to its own shoulder, then drive the blade through a wide horizontal arc into the target direction. Strong shoulder twist and low follow-through. One attack only. The sword tip must visibly reach into the specified SCREEN direction at impact. Clear wind-up, impact and recovery back to the exact input stance. Shield stays in the other hand. Keep sword a straight physical steel blade, no extra weapons, no VFX or light trails. Feet stay at the original baseline, compact weight shift, no travel, jumping, camera turn or zoom. Preserve this exact armored warrior, head, shield, body scale, colors and crisp pixel clusters. Keep the entire sword and body inside the transparent canvas with empty margins.
```

Параметры исходного запроса:

```json
{
  "frame_count": 8,
  "no_background": true,
  "seed": 17122060,
  "first_frame_url": "upload:73ee5ac5-cd20-46b0-900a-a3bc96c11dc2",
  "last_frame_url": "upload:73ee5ac5-cd20-46b0-900a-a3bc96c11dc2"
}
```

<!-- pixellab-accepted:warrior-approved-v3-east-overhead -->
### Автоатака: east-overhead

- Приёмка: Текущий принятый C1/C3; 2026-11-12.
- Инструмент: animate_image.
- Job: `45391128-d9e4-4223-8399-bb9d152b8ea9`; выбранный проход `east-overhead`.
- Вход: [локальный PNG](../../art/generated/warrior-autoattack-review-v2/references/front.png), SHA256 `10e3c0f50f954c004ece993f5f1cb8f5bd3965c86403c47faa4069bd8f35b9f0`.
- Полный provenance: [JSON](../../art/generated/warrior-autoattack-review-v2/source/jobs/east-overhead.json).
- [Лист кадров](../../art/generated/warrior-autoattack-review-v2/contacts/east-overhead.png); [manifest](../../art/generated/warrior-autoattack-review-v2/manifest.json). Playback: east-overhead/0, east-overhead/1, east-overhead/2, east-overhead/3, east-overhead/4, east-overhead/5, east-overhead/6, east-overhead/7, east-overhead/8.

Направления/отражения сохранены в V3; северо-западные источники — выбранные r3, не r2.

Точный промпт:

```text
Stationary ordinary auto-attack aimed EAST, directly RIGHT on the screen. Keep this same front-facing body projection; turn only the shoulders slightly toward the target. A compact OVERHEAD sword chop. Raise the sword clearly above the helmet, pause briefly in anticipation, then bring it sharply DOWN and FORWARD into the target direction, stopping below waist height and recovering. No horizontal sweep. One attack only. The sword tip must visibly reach into the specified SCREEN direction at impact. Clear wind-up, impact and recovery back to the exact input stance. Shield stays in the other hand. Keep sword a straight physical steel blade, no extra weapons, no VFX or light trails. Feet stay at the original baseline, compact weight shift, no travel, jumping, camera turn or zoom. Preserve this exact armored warrior, head, shield, body scale, colors and crisp pixel clusters. Keep the entire sword and body inside the transparent canvas with empty margins.
```

Параметры исходного запроса:

```json
{
  "frame_count": 8,
  "no_background": true,
  "seed": 17122062,
  "first_frame_url": "upload:73ee5ac5-cd20-46b0-900a-a3bc96c11dc2",
  "last_frame_url": "upload:73ee5ac5-cd20-46b0-900a-a3bc96c11dc2"
}
```

<!-- pixellab-accepted:warrior-approved-v3-north-west-forehand -->
### Автоатака: north-west-forehand

- Приёмка: Текущий принятый C1/C3; 2026-11-12.
- Инструмент: animate_image_pixminimax.
- Job: `2937c6ea-32c4-465e-baaa-9c8e912ff657`; выбранный проход `north-west-forehand-r3`.
- Вход: [локальный PNG](../../art/generated/warrior-autoattack-review-v2/references/north-left.png), SHA256 `dd7b8f9618fc0fcfdaf2343f76aeed6fcd9a74491e8c00f1de450358fc52e961`.
- Полный provenance: [JSON](../../art/generated/warrior-autoattack-review-v2/source/jobs/north-west-forehand-r3.json).
- [Лист кадров](../../art/generated/warrior-autoattack-review-v2/contacts/north-west-forehand.png); [manifest](../../art/generated/warrior-autoattack-review-v2/manifest.json). Playback: north-west-forehand/0, north-west-forehand/1, north-west-forehand/2, north-west-forehand/3, north-west-forehand/4, north-west-forehand/5, north-west-forehand/6, north-west-forehand/7, north-west-forehand/8.

Направления/отражения сохранены в V3; северо-западные источники — выбранные r3, не r2.

Точный промпт:

```text
One powerful physical sword slash toward the UPPER LEFT corner of the image. The knight keeps his back to the viewer. Draw the sword backward to the right shoulder, then swing the sword arm all the way across the upper-left diagonal, with a long visible blade silhouette reaching far LEFT of the helmet at the middle of the attack. Complete the leftward cut then recover to the exact starting stance. Feet stay planted. NO swoosh, NO colored trail, NO glow; animate only the knight and his physical straight sword.
```

Параметры исходного запроса:

```json
{
  "first_frame_url": "upload:fafdc99f-ba9a-4a72-a8d6-6be6828b7ea2",
  "last_frame_url": "upload:fafdc99f-ba9a-4a72-a8d6-6be6828b7ea2",
  "direction": "north-west",
  "view": "low top-down",
  "subject_description": "back view of the same steel-armored knight with red tabard, plume, shield and straight steel sword",
  "initial_pose": "standing with back facing viewer, sword lowered at the left of the image, shield held at the right",
  "frame_count": 8,
  "no_background": true,
  "enhance_prompt": false,
  "seed": 17122800
}
```

<!-- pixellab-accepted:warrior-approved-v3-north-west-overhead -->
### Автоатака: north-west-overhead

- Приёмка: Текущий принятый C1/C3; 2026-11-12.
- Инструмент: animate_image_pixminimax.
- Job: `a2a9a0bf-ac8d-4163-8f2f-9aab7dcb2b2c`; выбранный проход `north-west-overhead-r3`.
- Вход: [локальный PNG](../../art/generated/warrior-autoattack-review-v2/references/north-left.png), SHA256 `dd7b8f9618fc0fcfdaf2343f76aeed6fcd9a74491e8c00f1de450358fc52e961`.
- Полный provenance: [JSON](../../art/generated/warrior-autoattack-review-v2/source/jobs/north-west-overhead-r3.json).
- [Лист кадров](../../art/generated/warrior-autoattack-review-v2/contacts/north-west-overhead.png); [manifest](../../art/generated/warrior-autoattack-review-v2/manifest.json). Playback: north-west-overhead/0, north-west-overhead/1, north-west-overhead/2, north-west-overhead/3, north-west-overhead/4, north-west-overhead/5, north-west-overhead/6, north-west-overhead/7, north-west-overhead/8.

Направления/отражения сохранены в V3; северо-западные источники — выбранные r3, не r2.

Точный промпт:

```text
One overhead sword chop toward the UPPER LEFT corner of the image. BACK view throughout. Raise the steel sword high above the LEFT side of the helmet, show a brief overhead anticipation, then chop DOWN toward an imaginary opponent at the upper-left, with the physical blade clearly visible LEFT of the body. Return to the original stance. Keep both feet in place. NO glow, NO sweeping light, NO energy arc; only armor, shield and physical sword motion.
```

Параметры исходного запроса:

```json
{
  "first_frame_url": "upload:fafdc99f-ba9a-4a72-a8d6-6be6828b7ea2",
  "last_frame_url": "upload:fafdc99f-ba9a-4a72-a8d6-6be6828b7ea2",
  "direction": "north-west",
  "view": "low top-down",
  "subject_description": "back view of the same steel-armored knight with red tabard, plume, shield and straight steel sword",
  "initial_pose": "standing with back facing viewer, sword lowered at the left of the image, shield held at the right",
  "frame_count": 8,
  "no_background": true,
  "enhance_prompt": false,
  "seed": 17122802
}
```

<!-- pixellab-accepted:warrior-cleave-a-accepted -->
### Cleave A — широкий поперечный

- Приёмка: Принят как анимация навыка Cleave; 2026-11-12.
- Инструмент: animate_image_pixminimax.
- Job: `e79ebf3c-1617-4f9a-935a-87e21e866b03`; выбранный проход `cleave-a`.
- Вход: [локальный PNG](../../art/generated/warrior-cleave-review-v1/references/front-192.png), SHA256 `5835ef2dfa79030ea18230ce09d04161affe9673fdb55d46e10c3920e2715894`.
- Полный provenance: [JSON](../../art/generated/warrior-cleave-review-v1/source/jobs/cleave-a.json).
- [Лист кадров](../../art/generated/warrior-cleave-review-v1/contacts/cleave-a.png); [manifest](../../art/generated/warrior-cleave-review-v1/manifest.json). Playback: cleave-a/0, cleave-a/1, cleave-a/2, cleave-a/3, cleave-a/4, cleave-a/5, cleave-a/6, cleave-a/7, cleave-a/8, cleave-a/9, cleave-a/10, cleave-a/11, cleave-a/12, cleave-a/13, cleave-a/14, cleave-a/15, cleave-a/16.

Воин и слеш в одном исходнике. Свободная дуга, точных180° не требуется.

Точный промпт:

```text
One broad horizontal CLEAVE in FRONT of the warrior, sweeping from his sword-side shoulder across his waist to the opposite side. Clear shoulder wind-up, powerful full arm swing, follow-through, recover. During the strike a tapered ivory-white and cool steel SLASH TRAIL grows directly from the moving blade and sweeps across the LOWER foreground in front of his body. A loose flattened crescent, not a perfect semicircle. The leading edge is bright, the fading tail thin. Trail appears only through the strike then dissolves. FRONT view throughout, same warrior identity, body scale, shield and grounded feet. Recover to the exact starting stance. Slash is attached to the moving blade. Keep whole body and slash inside canvas with empty margins. No camera movement, fire, runes or circular shockwave.
```

Параметры исходного запроса:

```json
{
  "direction": "south",
  "view": "low top-down",
  "subject_description": "the exact front-facing steel-armored warrior with red tabard, helmet plume, straight steel sword and shield",
  "initial_pose": "front-facing ready stance with sword lowered and shield held at his side; no slash effect yet",
  "frame_count": 16,
  "no_background": true,
  "enhance_prompt": false,
  "seed": 17123200,
  "first_frame_url": "upload:d1cf9439-9539-4810-b30a-8faf608a9b6d",
  "last_frame_url": "upload:d1cf9439-9539-4810-b30a-8faf608a9b6d"
}
```

<!-- pixellab-accepted:warrior-cleave-c-auto-accepted -->
### Cleave C — тяжёлый сверху

- Приёмка: Принят в дополнительный пул автоатак; 2026-11-12.
- Инструмент: animate_image_pixminimax.
- Job: `3111d31d-31d3-470b-a8bb-b9cba8faf334`; выбранный проход `cleave-c-r2`.
- Вход: [локальный PNG](../../art/generated/warrior-cleave-review-v1/references/front-192.png), SHA256 `5835ef2dfa79030ea18230ce09d04161affe9673fdb55d46e10c3920e2715894`.
- Полный provenance: [JSON](../../art/generated/warrior-cleave-review-v1/source/jobs/cleave-c-r2.json).
- [Лист кадров](../../art/generated/warrior-cleave-review-v1/contacts/cleave-c.png); [manifest](../../art/generated/warrior-cleave-review-v1/manifest.json). Playback: cleave-c/0, cleave-c/1, cleave-c/2, cleave-c/3, cleave-c/4, cleave-c/5, cleave-c/6, cleave-c/7, cleave-c/8, cleave-c/9, cleave-c/10, cleave-c/11, cleave-c/12, cleave-c/13, cleave-c/14, cleave-c/15, cleave-c/16.

Выбран именно cleave-c-r2. Короткое кольцо у ног сохранено. Пока только фронтальная группа, заднего ракурса нет.

Точный промпт:

```text
The warrior makes ONE heavy downward-forward sword CLEAVE. Raise the blade high above his helmet, a brief anticipation, then chop it down through the AIR in front of his chest and waist toward the viewer. Show weight in the shoulders and knees, follow-through and recovery. A short thick ivory-white and steel tapered slash wedge follows the blade closely at chest height, then tears into two short AIRBORNE streaks and disappears. Sword stops at waist height and NEVER strikes the floor. Keep FRONT view and original warrior identity, scale, shield, grounded feet. Return to the exact input stance. ALL effects remain airborne: absolutely NO ground circle, ground oval, ring, disk, landing mark, magic seal, dust, shockwave or circular ripple anywhere. No fire. Full body and slash inside frame.
```

Параметры исходного запроса:

```json
{
  "direction": "south",
  "view": "low top-down",
  "subject_description": "the exact front-facing steel-armored warrior with red tabard, helmet plume, straight steel sword and shield",
  "initial_pose": "front-facing ready stance with sword lowered and shield held at his side; no slash effect yet",
  "frame_count": 16,
  "no_background": true,
  "enhance_prompt": false,
  "seed": 17123302,
  "first_frame_url": "upload:d1cf9439-9539-4810-b30a-8faf608a9b6d",
  "last_frame_url": "upload:d1cf9439-9539-4810-b30a-8faf608a9b6d"
}
```

<!-- pixellab-accepted:warrior-static-cleave-a -->
### Статический концепт: cleave-a

- Приёмка: Принят пользователем как визуальный концепт; 2026-11-12.
- Инструмент: Original deterministic pixel renderer.
- Принятый файл: [PNG](../../art/generated/warrior-concept-pack-v1/images/vfx/cleave-a.png), SHA256 `a0a74943753d8d936bd4d9b2adf5f103910db1f6f1ebbfd29dc5f31579027d80`.
- [Renderer](../../art/generated/warrior-concept-pack-v1/source/build-pack.mjs).

Это принятый программный PNG, а не отвергнутая Pixflux-проба. AI-промпта у принятого финального ассета нет.

AI-промпт: отсутствует — программно нарисованный ассет.

<!-- pixellab-accepted:warrior-static-whirlwind-a -->
### Статический концепт: whirlwind-a

- Приёмка: Принят пользователем как визуальный концепт; 2026-11-12.
- Инструмент: Original deterministic pixel renderer.
- Принятый файл: [PNG](../../art/generated/warrior-concept-pack-v1/images/vfx/whirlwind-a.png), SHA256 `c2149b4f271bc11dba72862cde12cdbdc9eaaa5dd42a606aa6cbfa29d8169e94`.
- [Renderer](../../art/generated/warrior-concept-pack-v1/source/build-pack.mjs).

Это принятый программный PNG, а не отвергнутая Pixflux-проба. AI-промпта у принятого финального ассета нет.

AI-промпт: отсутствует — программно нарисованный ассет.

<!-- pixellab-accepted:warrior-static-ground-stomp-a -->
### Статический концепт: ground-stomp-a

- Приёмка: Принят пользователем как визуальный концепт; 2026-11-12.
- Инструмент: Original deterministic pixel renderer.
- Принятый файл: [PNG](../../art/generated/warrior-concept-pack-v1/images/vfx/ground-stomp-a.png), SHA256 `15a02a1486b4566669d88222abcea5237e0029a11ac9a84335503e04a95a49c7`.
- [Renderer](../../art/generated/warrior-concept-pack-v1/source/build-pack.mjs).

Это принятый программный PNG, а не отвергнутая Pixflux-проба. AI-промпта у принятого финального ассета нет.

AI-промпт: отсутствует — программно нарисованный ассет.

<!-- pixellab-accepted:warrior-static-shield-block-a -->
### Статический концепт: shield-block-a

- Приёмка: Принят пользователем как визуальный концепт; 2026-11-12.
- Инструмент: Original deterministic pixel renderer.
- Принятый файл: [PNG](../../art/generated/warrior-concept-pack-v1/images/vfx/shield-block-a.png), SHA256 `f5ad18d861d018cd85e1d6b149e4835e64810f616a18f54339bb8a3c13bd8e86`.
- [Renderer](../../art/generated/warrior-concept-pack-v1/source/build-pack.mjs).

Это принятый программный PNG, а не отвергнутая Pixflux-проба. AI-промпта у принятого финального ассета нет.

AI-промпт: отсутствует — программно нарисованный ассет.

<!-- pixellab-accepted:warrior-static-piercing-throw-a -->
### Статический концепт: piercing-throw-a

- Приёмка: Принят пользователем как визуальный концепт; 2026-11-12.
- Инструмент: Original deterministic pixel renderer.
- Принятый файл: [PNG](../../art/generated/warrior-concept-pack-v1/images/vfx/piercing-throw-a.png), SHA256 `b50e91faf1bc1dad712f8478e50ff5da1b5df6206a69186865aca34852e0c0ee`.
- [Renderer](../../art/generated/warrior-concept-pack-v1/source/build-pack.mjs).

Это принятый программный PNG, а не отвергнутая Pixflux-проба. AI-промпта у принятого финального ассета нет.

AI-промпт: отсутствует — программно нарисованный ассет.

<!-- pixellab-accepted:warrior-static-charge-a-start -->
### Статический концепт: charge-a-start

- Приёмка: Принят пользователем как визуальный концепт; 2026-11-12.
- Инструмент: Original deterministic pixel renderer.
- Принятый файл: [PNG](../../art/generated/warrior-concept-pack-v1/images/vfx/charge-a-start.png), SHA256 `c0aebb2459b2af14604d706da887bafe85178548fac653a32dcf6e426c4b1d65`.
- [Renderer](../../art/generated/warrior-concept-pack-v1/source/build-pack.mjs).

Это принятый программный PNG, а не отвергнутая Pixflux-проба. AI-промпта у принятого финального ассета нет.

AI-промпт: отсутствует — программно нарисованный ассет.

<!-- pixellab-accepted:warrior-static-charge-a-travel -->
### Статический концепт: charge-a-travel

- Приёмка: Принят пользователем как визуальный концепт; 2026-11-12.
- Инструмент: Original deterministic pixel renderer.
- Принятый файл: [PNG](../../art/generated/warrior-concept-pack-v1/images/vfx/charge-a-travel.png), SHA256 `d300ceaa3d49274097a7755e108f4244b9fde9c4d7aeb7ad61ceaf97f77ddb15`.
- [Renderer](../../art/generated/warrior-concept-pack-v1/source/build-pack.mjs).

Это принятый программный PNG, а не отвергнутая Pixflux-проба. AI-промпта у принятого финального ассета нет.

AI-промпт: отсутствует — программно нарисованный ассет.

<!-- pixellab-accepted:warrior-static-charge-a-arrival -->
### Статический концепт: charge-a-arrival

- Приёмка: Принят пользователем как визуальный концепт; 2026-11-12.
- Инструмент: Original deterministic pixel renderer.
- Принятый файл: [PNG](../../art/generated/warrior-concept-pack-v1/images/vfx/charge-a-arrival.png), SHA256 `b3fc82ca23c6f96c8a0e212d6d56ffe5b6978e4b3daeaca69aefa15efc58a0a3`.
- [Renderer](../../art/generated/warrior-concept-pack-v1/source/build-pack.mjs).

Это принятый программный PNG, а не отвергнутая Pixflux-проба. AI-промпта у принятого финального ассета нет.

AI-промпт: отсутствует — программно нарисованный ассет.

<!-- pixellab-accepted:warrior-static-charge-b-start -->
### Статический концепт: charge-b-start

- Приёмка: Принят пользователем как визуальный концепт; 2026-11-12.
- Инструмент: Original deterministic pixel renderer.
- Принятый файл: [PNG](../../art/generated/warrior-concept-pack-v1/images/vfx/charge-b-start.png), SHA256 `fbabaf28b0d25014d9964d14d3ba4101cb69a6b735f1609ed44a81f9416807f4`.
- [Renderer](../../art/generated/warrior-concept-pack-v1/source/build-pack.mjs).

Это принятый программный PNG, а не отвергнутая Pixflux-проба. AI-промпта у принятого финального ассета нет.

AI-промпт: отсутствует — программно нарисованный ассет.

<!-- pixellab-accepted:warrior-static-charge-b-travel -->
### Статический концепт: charge-b-travel

- Приёмка: Принят пользователем как визуальный концепт; 2026-11-12.
- Инструмент: Original deterministic pixel renderer.
- Принятый файл: [PNG](../../art/generated/warrior-concept-pack-v1/images/vfx/charge-b-travel.png), SHA256 `001a08c229b6cba9dda8a7884eabe79689c064ab8ba89fcc9b2c4463d51aa1fb`.
- [Renderer](../../art/generated/warrior-concept-pack-v1/source/build-pack.mjs).

Это принятый программный PNG, а не отвергнутая Pixflux-проба. AI-промпта у принятого финального ассета нет.

AI-промпт: отсутствует — программно нарисованный ассет.

<!-- pixellab-accepted:warrior-static-charge-b-arrival -->
### Статический концепт: charge-b-arrival

- Приёмка: Принят пользователем как визуальный концепт; 2026-11-12.
- Инструмент: Original deterministic pixel renderer.
- Принятый файл: [PNG](../../art/generated/warrior-concept-pack-v1/images/vfx/charge-b-arrival.png), SHA256 `c25a75979c010cea0b707049b8b82b6af22ce54dd48d64a1d9fadb4858e62a9f`.
- [Renderer](../../art/generated/warrior-concept-pack-v1/source/build-pack.mjs).

Это принятый программный PNG, а не отвергнутая Pixflux-проба. AI-промпта у принятого финального ассета нет.

AI-промпт: отсутствует — программно нарисованный ассет.

<!-- pixellab-accepted:warrior-static-war-banner-a -->
### Статический концепт: war-banner-a

- Приёмка: Принят пользователем как визуальный концепт; 2026-11-12.
- Инструмент: Original deterministic pixel renderer.
- Принятый файл: [PNG](../../art/generated/warrior-concept-pack-v1/images/vfx/war-banner-a.png), SHA256 `b18235af56fad1c2a01b064933392873f1ab16813a9048a84bed3d7cd20bc613`.
- [Renderer](../../art/generated/warrior-concept-pack-v1/source/build-pack.mjs).

Это принятый программный PNG, а не отвергнутая Pixflux-проба. AI-промпта у принятого финального ассета нет.

AI-промпт: отсутствует — программно нарисованный ассет.

<!-- pixellab-accepted:warrior-static-earthbreaker-a -->
### Статический концепт: earthbreaker-a

- Приёмка: Принят пользователем как визуальный концепт; 2026-11-12.
- Инструмент: Original deterministic pixel renderer.
- Принятый файл: [PNG](../../art/generated/warrior-concept-pack-v1/images/vfx/earthbreaker-a.png), SHA256 `9de0a4d29a0993b94565a0406e9afa7b4b2d0a39142dffbb733d0416a911cf72`.
- [Renderer](../../art/generated/warrior-concept-pack-v1/source/build-pack.mjs).

Это принятый программный PNG, а не отвергнутая Pixflux-проба. AI-промпта у принятого финального ассета нет.

AI-промпт: отсутствует — программно нарисованный ассет.

<!-- pixellab-accepted:warrior-static-spear-of-ruin-b -->
### Статический концепт: spear-of-ruin-b

- Приёмка: Принят пользователем как визуальный концепт; 2026-11-12.
- Инструмент: Original deterministic pixel renderer.
- Принятый файл: [PNG](../../art/generated/warrior-concept-pack-v1/images/vfx/spear-of-ruin-b.png), SHA256 `abb439872b846b26eab4f27bb8d5f625f765d99524f5d2c3c758a7b90da76e30`.
- [Renderer](../../art/generated/warrior-concept-pack-v1/source/build-pack.mjs).

Это принятый программный PNG, а не отвергнутая Pixflux-проба. AI-промпта у принятого финального ассета нет.

AI-промпт: отсутствует — программно нарисованный ассет.


## 2026-11-12 — F выбран как близкое направление

Пользователь: «вариант F плюс минус то что нужно». F — рабочий референс движения.
Это частичное одобрение направления; перенос в игровой пул и приёмка новых проб
из него не следуют. Прежний строгий критерий горизонтальной плоскости над шлемом
больше не блокирует новую явно заказанную серию из дефолтной стойки.

- Источник F: `art/generated/warrior-whirlwind-kinematics-v3/raw/whirlwind-f/00..32.png`.
- Инструмент: `animate_image_pixminimax`; job `35cf214b-2ac1-4980-8d17-eaa2f9e3180e`; seed `17125020`; 32 запрошенных + исходный кадр, 192×192.
- Вход F: подготовленная `raw/pose-overhead/00.png`, не дефолтная стойка.
- Полные параметры: `art/generated/warrior-whirlwind-kinematics-v3/source/jobs/whirlwind-f.json`.

Точный промпт F:

```text
ONE full circle of the PHYSICAL SWORD ABOVE THE HEAD. Keep both boots planted and the warrior facing FRONT for the entire clip. Sword hand stays ABOVE the helmet. Shoulder rolls in its socket, elbow BENDS as blade passes behind head and OPENS as it passes in front, wrist leads the sword tip through front-right-back-left-front in a horizontal overhead circle. Chest tilts slightly opposite the blade, hips counter-twist gently, shield stays low. Visible arm articulation at every quarter turn. Finish in the exact raised-sword input pose. The body DOES NOT spin around. Same warrior identity and native scale; fixed camera. Animate only the warrior and physical sword, keep surrounding transparent space clean; slash effect is composited separately. Entire sword inside frame.
```

Новая серия: `art/generated/warrior-whirlwind-provider-review-v4/`. PL1/PL2 —
PixelLab, RD1/RD2 — RetroDiffusion. Компактный и более широкий круг у каждой
службы; все четыре запроса используют один PNG `references/default-front-192.png`
из принятой нейтральной стойки, без ресэмплинга. Точные тексты и параметры —
`source/plan.json`, фактические запросы/receipts — `source/jobs/`. Новые пробы не приняты.

Рекомендация: сравнивать провайдеры на одинаковом PNG и отключать VFX при оценке
тела. В RetroDiffusion `frames_duration` — число кадров (4/6/8/10/12/16),
не миллисекунды. Первые три неудачных запроса этой серии содержали ошибочные
75/100; исправленные используют 16. Документация: https://retrodiffusion.ai/app/guide/api .


<!-- pixellab-accepted:warrior-whirlwind-user-south -->
## 2026-11-12 — пользовательский эталон Whirlwind SOUTH

Пользователь явно: «сохраняем мой вариант как эталон вихря».
Исходник `art/generated/warrior/animation/whirlwind/whirlwind.png`,
SHA256 `f0fb133643cb919c29dc331c4864db6b83f31111a6efcd6ee5331174644ba381`.
Принята роль: вихрь со стартом и восстановлением в южной стойке.

Точный введённый промпт:

```text
whirlwind animation line warrior on diablo 4
```

Инструмент: Animate with text — PixMiniMax. Enhance with AI включён.
Frame count12; First и Last frame — одна исходная дефолтная стойка;
Camera Low top-down; Direction South (facing down); transparent background включён.
Результат:13занятых ячеек192×192 вPNG768×768/4×4,три пустыеячейки некадры.
Пользовательский expanded prompt/seed/job ID/FPS не предоставлены, остаютсяnull.
Импорт без измененияRGBA: `warrior-whirlwind-user-recipe-v5/source/user-import.json`.
Гайд с рецептом: `docs/art/PIXELLAB_GENERATION_GUIDE.md`.

Две дополнительные пробы точного короткого рецепта: jobs
`4ce88869-46b2-4e5a-b580-618c9275d55d` / seed17128011 и
`d02e71df-f7e6-4dba-9827-047ba3ff6511` / seed17128012. Их реальные
enhanced_prompt сохранены вreceipts, они различаются. Эти пробы НЕ приняты,
эталон не заменяют. Пользователь вернулся кWhirlwind, черновик удара пощиту
отложен без приёмки.


## 2026-11-12 — новые Stomp / Shield Block / Piercing Throw: НЕ приняты

По просьбе пользователя запущены вместе через PixMiniMax по рецепту его вихря:
Enhance включён, 12 кадров,Low top-down, South, transparent, одна дефолтная стойка
в First/Last. Пакет `art/generated/warrior-skill-recipe-review-v1/`.
Это новые пробы для выбора, а не добавление в принятый пул.

### Ground Stomp

- Исходный промпт: `ground stomp animation like warrior on diablo 4`.
- Job `15874bd6-d9db-4505-82d8-b0d2811137dd`, seed `17129011`,13 выданных кадров.
- Расширенный текст Enhance:

```text
Raise the shield and shift weight onto the lead leg, then forcefully slam the rear foot into the ground to trigger a heavy impact. Follow through with a slight downward jolt of the entire frame as the posture stabilizes into the final stance.
```

- Полный запрос/receipt: `art/generated/warrior-skill-recipe-review-v1/source/jobs/stomp.json`.
- Лист PNG: `art/generated/warrior-skill-recipe-review-v1/spritesheets/stomp.png`.

### Shield Block

- Исходный промпт: `shield block animation like warrior on diablo 4`.
- Job `83c63a69-c5d9-4ed3-8180-e82182464292`, seed `17129012`,13 выданных кадров.
- Расширенный текст Enhance:

```text
Brace against an incoming strike by shifting weight onto the back leg and driving the shield forward with a sudden, forceful thrust. Follow through with a slight torso rotation, absorbing the impact before firming the stance into a braced guard position.
```

- Полный запрос/receipt: `art/generated/warrior-skill-recipe-review-v1/source/jobs/block.json`.
- Лист PNG: `art/generated/warrior-skill-recipe-review-v1/spritesheets/block.png`.

### Piercing Throw

- Исходный промпт: `warrior throwing a spear forward animation like warrior on diablo 4`.
- Job `a26d3b8a-e7b0-4e4b-af6f-7fc2591e009f`, seed `17129013`,13 выданных кадров.
- Расширенный текст Enhance:

```text
Shift weight to the rear leg and draw the arm back to coil the torso with tension. Snap the hips and shoulder forward to release the projectile, then recover balance by planting the lead foot and bracing with the shield.
```

- Полный запрос/receipt: `art/generated/warrior-skill-recipe-review-v1/source/jobs/throw.json`.
- Лист PNG: `art/generated/warrior-skill-recipe-review-v1/spritesheets/throw.png`.

Результаты сохранены целиком; исходные артефакты и мягкий stomp подписаны в карточках.


## 2026-11-12 — приняты Stomp, Block, старые копьё и рывок; проекции навыков

Явная инструкция пользователя: новый Ground Stomp принять (добавить отдельно
трещину под ногами), новый Shield Block принять, копьё и рывок взять старые.
Cleave A и пользовательский Whirlwind сохраняются. Текущие жесты пользователь
разрешил переиспользовать для W/E/S/SW/SE; W/SW зеркалируются по принятой схеме.
Для N/NW генерируется один новый NW-источник на способность, NE — его зеркало.
Северные результаты ещё не приняты; новая трещина также пока для просмотра.

<!-- pixellab-accepted:warrior-stomp-recipe-south -->
### Ground Stomp

- Инструмент `animate_image_pixminimax`, job `15874bd6-d9db-4505-82d8-b0d2811137dd`, seed `17129011`.
- Запрошено 12 кадров, выдано 13 с учётом входного.
- Принята роль: текущий фронтальный источник для пяти южных/боковых направлений.
- Точный запрос/receipt: `art/generated/warrior-skill-recipe-review-v1/source/jobs/stomp.json`.
- Промпт:

```text
ground stomp animation like warrior on diablo 4
```

Расширение Enhance:

```text
Raise the shield and shift weight onto the lead leg, then forcefully slam the rear foot into the ground to trigger a heavy impact. Follow through with a slight downward jolt of the entire frame as the posture stabilizes into the final stance.
```

PixMiniMax, Enhance включён, Low top-down, South, transparent, First = Last — прежняя дефолтная стойка 192×192.

<!-- pixellab-accepted:warrior-block-recipe-south -->
### Shield Block

- Инструмент `animate_image_pixminimax`, job `83c63a69-c5d9-4ed3-8180-e82182464292`, seed `17129012`.
- Запрошено 12 кадров, выдано 13 с учётом входного.
- Принята роль: текущий фронтальный источник для пяти южных/боковых направлений.
- Точный запрос/receipt: `art/generated/warrior-skill-recipe-review-v1/source/jobs/block.json`.
- Промпт:

```text
shield block animation like warrior on diablo 4
```

Расширение Enhance:

```text
Brace against an incoming strike by shifting weight onto the back leg and driving the shield forward with a sudden, forceful thrust. Follow through with a slight torso rotation, absorbing the impact before firming the stance into a braced guard position.
```

PixMiniMax, Enhance включён, Low top-down, South, transparent, First = Last — прежняя дефолтная стойка 192×192.

<!-- pixellab-accepted:warrior-throw-old-south -->
### Старый физический бросок копья

- Инструмент `animate_image`, job `b3e3f431-c32f-403e-bad8-4396bcb67e40`, seed `1712311`.
- Запрошено 8 кадров, выдано 9 с учётом входного.
- Принята роль: текущий фронтальный источник для пяти южных/боковых направлений.
- Точный запрос/receipt: `art/generated/warrior-animation-review-v1/source/jobs/gesture-throw-v2.json`.
- Промпт:

```text
THROW the actual LONG WOODEN SPEAR held above the right shoulder in this input. The warrior draws the spear hand back a little, thrusts arm and spear straight toward screen RIGHT, RELEASES the spear so it leaves his hand and exits right, follows through with an EMPTY right hand, then draws the sheathed sword and returns to the final reference stance. This is a SPEAR THROW, NOT a sword swing. Left kite shield remains held, feet fixed, exact body scale, helmet, armor, colors and crisp native pixels. No magic or trails.
```

Classic animate_image, 128×128. First — подготовленная поза с деревянным копьём; Last — исходная стойка с мечом. Это прежний принятый вариант, не новая светящаяся проба.

<!-- pixellab-accepted:warrior-charge-old-south -->
### Старый рывок

- Инструмент `animate_image`, job `b7a03eab-d0a2-4f62-9ed3-4cf24f30b6a9`, seed `1712054`.
- Запрошено 8 кадров, выдано 9 с учётом входного.
- Принята роль: текущий фронтальный источник для пяти южных/боковых направлений.
- Точный запрос/receipt: `art/generated/warrior-animation-review-v1/source/jobs/gesture-charge.json`.
- Промпт:

```text
This exact warrior prepares a forward CHARGE to screen RIGHT: lowers torso, tucks sword safely beside body, leads with kite shield, takes two powerful rapid running strides IN PLACE, braces at arrival with shield-forward shoulder impact, then returns to original stance. Clear grounded push-off and arrival recoil. Do not translate body across canvas; movement path will be shown separately. No dust or shield glow. Keep same warrior identity, size, native pixels and all gear.
```

Classic animate_image, 128×128. First = Last — дефолтная стойка. Жест из старой общей демки, источники двух семейств Charge VFX сохранены отдельно.

Северная серия: `art/generated/warrior-north-skills-review-v1/`. По 12 новых
кадров + входной у каждой из шести способностей. Для копья сначала Pixen-поза
с деревянным копьём (job `29e40368-43d0-411d-9989-d6a7c23267f3`, seed17130001),
затем PixMiniMax с финальной северной стойкой с мечом. Все другие северные
пробы имеют одинаковую NW-стойку в First/Last. Короткие и реальные expanded
prompts/seed/job сохранены в source/jobs. Вихрь выбран для демо из второго
прохода с акцентом на меч (job `1ebb62c1-89bc-4c45-b37d-fda181cf21ce`);
первый проход не скрыт и не принят. Северные анимации не вносить в registry
принятых, пока пользователь их не выбрал.


<!-- pixellab-accepted:warrior-north-stance-cell4 -->
## 2026-11-12 — выбрана новая северная стойка, кадр №4

Явный выбор пользователя: `art/warrior/8-proections.png`, 4-й кадр.
Роль: исходная северная стойка для N/NE напрямую, NW зеркально.
Полный лист SHA256 `8786f04a27fd2d54eae01c1f0f9346b00353f544ad5c85d072c4f4681a6264f3`; crop x 0, y 192, w 192, h 192
из сетки 3×3/576×576, порядок row-major. Исходные пиксели не менялись.
Результат: `art/generated/warrior-movement-attacks-review-v4/references/north-base-cell-4.png`,
SHA256 `dcdbf58073692a4f011e8fe164ba72bd38f46db82865992c7284b7044bddb45a`.
Инструмент — точное извлечение пользовательского PNG. Промпт, seed и job
создания самого листа неизвестны; это не новая AI-генерация ассистента.
Прежняя северная база со щитом к камере отклонена и не используется.

С этой стойки запрошены idle, бег и автоатаки для общей демки всех направлений.
Ниже новые пробы, **НЕ принятые**: PixMiniMax/Enhance/12 кадров, Low top-down,
north-east, transparent; одинаковый кадр 4 в First/Last.

- `north-idle`: `idle breathing animation, warrior back view facing upper right, subtle breathing with planted feet`; seed `17131011`, job `10ef8d0d-bcc5-4400-aa63-c69c2f52d7c2`. Фактический enhanced_prompt и receipt: `art/generated/warrior-movement-attacks-review-v4/source/jobs/north-idle.json`.
- `north-run`: `running loop in place animation like warrior on diablo 4, back view facing upper right`; seed `17131012`, job `fbfd63b2-7e91-4e68-9ead-f23900024f11`. Фактический enhanced_prompt и receipt: `art/generated/warrior-movement-attacks-review-v4/source/jobs/north-run.json`.
- `north-c1`: `wide horizontal sword slash animation like warrior on diablo 4, back view facing upper right`; seed `17131013`, job `44d27239-82c1-4ddf-885a-b923fa7a234c`. Фактический enhanced_prompt и receipt: `art/generated/warrior-movement-attacks-review-v4/source/jobs/north-c1.json`.
- `north-c3`: `powerful overhead sword strike animation like warrior on diablo 4, back view facing upper right`; seed `17131014`, job `08ca61d6-2bdb-430d-9fcf-90a38b464ee6`. Фактический enhanced_prompt и receipt: `art/generated/warrior-movement-attacks-review-v4/source/jobs/north-c3.json`.
- `north-heavy`: `heavy downward sword chop with a deep weight shift and broad slash trail animation like warrior on diablo 4, back view facing upper right`; seed `17131015`, job `5c0140fb-4640-49b8-b07e-b81171c98705`. Фактический enhanced_prompt и receipt: `art/generated/warrior-movement-attacks-review-v4/source/jobs/north-heavy.json`.


## 2026-11-12 — бег с общим ритмом и переделанные северные атаки: НЕ приняты

Пользователь заказал циклический южный бег с тем же числом кадров, что северный,
и новые северные автоатаки. Пакет `warrior-movement-attacks-review-v5`.
52 новых исходных кадра: четыре задания по 12 + входной. Настройки PixMiniMax,
Enhance, Low top-down, прозрачный фон, одинаковый First/Last; South у бега,
north-east у атак. Северная стойка №4 сохранена.

- `front-run`: `continuous seamless running cycle in place toward viewer, alternate legs and pump arms, no stopping between strides, warrior on diablo 4`. Seed `17132011`, job `073e0f50-e867-4b71-99c7-c26687b3df4c`. Точный expanded prompt, дополнительные caption-поля и receipt: `art/generated/warrior-movement-attacks-review-v5/source/jobs/front-run.json`.
- `north-c1`: `one compact forward sword slash toward upper right, feet planted, small torso twist and back kept toward viewer, then recover to guard; thin frontal slash trail, warrior on diablo 4`. Seed `17132012`, job `c814a798-2ac9-4748-a60a-56e75b7cee03`. Точный expanded prompt, дополнительные caption-поля и receipt: `art/generated/warrior-movement-attacks-review-v5/source/jobs/north-c1.json`.
- `north-c3`: `one compact overhead sword chop forward toward upper right, back-facing stance held, small knee bend and quick recovery, short frontal slash trail, warrior on diablo 4`. Seed `17132013`, job `a0749dd3-4ed2-4ff3-80e9-9538cf0277d1`. Точный expanded prompt, дополнительные caption-поля и receipt: `art/generated/warrior-movement-attacks-review-v5/source/jobs/north-c3.json`.
- `north-heavy`: `one heavy diagonal sword cleave toward upper right, braced back-facing stance, deep weight transfer into the cut then recoil to same guard; broad frontal blade arc, warrior on diablo 4`. Seed `17132014`, job `284a4966-8a00-4cf7-8828-5c73542925ca`. Точный expanded prompt, дополнительные caption-поля и receipt: `art/generated/warrior-movement-attacks-review-v5/source/jobs/north-heavy.json`.

Северный C3 получил яркий голубой след, исходный результат сохранён без
перекраски. Для общего счёта старые исходники retimed удержанием поз;
frameMap хранит каждую исходную позу, ничего не выброшено. Это не новые
сгенерированные кадры и не основание автоматически принимать новые движения.


## 2026-11-12 — явная приёмка всей демки v5 и интеграция

Пользователь: «все принимаю , idle, бег, автоатаки - интегрируй в игру». Приняты все 10 клипов v5, включая общий retiming: Idle 13×120 мс; Run/C1/C3 13×75 мс; тяжёлая C 17×75 мс. Все 118 исходных поз сохранены; 138 playback-ссылок. Front Idle/C1/C3/heavy — прежние принятые источники, их промпты и job не менялись. Исторические разделы выше описывают состояние до этой приёмки.

### Warrior front-run — ПРИНЯТО

- Tool: `animate_image_pixminimax`; seed `17132011`; job `073e0f50-e867-4b71-99c7-c26687b3df4c`.
- Исходник: `art/generated/warrior-movement-attacks-review-v5/references/front-run-neutral.png`. Роль: Принятые idle, бег и автоатаки для игры.
- Точный prompt: `continuous seamless running cycle in place toward viewer, alternate legs and pump arms, no stopping between strides, warrior on diablo 4`
- Фактический enhanced prompt: `Gallop in place with rhythmic intensity, driving knees high and pumping arms in sync with the gait. Maintain a consistent, forward-leaning momentum while striking the ground firmly with alternating feet to complete each stride into the grounded stance.`
- Полные параметры: `art/generated/warrior-movement-attacks-review-v5/source/jobs/front-run.json`; `args` сохранены без изменений также в registry.
- Параметры: direction `south`, Low top-down, transparent, Enhance=true, frame_count=12, First=Last. 13 исходных / 13 playback × 75 мс.

### Warrior north-idle — ПРИНЯТО

- Tool: `animate_image_pixminimax`; seed `17131011`; job `10ef8d0d-bcc5-4400-aa63-c69c2f52d7c2`.
- Исходник: `art/generated/warrior-movement-attacks-review-v4/references/north-base-cell-4.png`. Роль: Принятые idle, бег и автоатаки для игры.
- Точный prompt: `idle breathing animation, warrior back view facing upper right, subtle breathing with planted feet`
- Фактический enhanced prompt: `Slightly expand the chest and shoulders while maintaining a firm, planted stance. Gradually exhale to pull the upper torso inward, causing a soft downward shift in posture before returning to a neutral, steady position.`
- Полные параметры: `art/generated/warrior-movement-attacks-review-v4/source/jobs/north-idle.json`; `args` сохранены без изменений также в registry.
- Параметры: direction `north-east`, Low top-down, transparent, Enhance=true, frame_count=12, First=Last. 13 исходных / 13 playback × 120 мс.

### Warrior north-run — ПРИНЯТО

- Tool: `animate_image_pixminimax`; seed `17131012`; job `fbfd63b2-7e91-4e68-9ead-f23900024f11`.
- Исходник: `art/generated/warrior-movement-attacks-review-v4/references/north-base-cell-4.png`. Роль: Принятые idle, бег и автоатаки для игры.
- Точный prompt: `running loop in place animation like warrior on diablo 4, back view facing upper right`
- Фактический enhanced prompt: `Shift weight onto the lead leg while lifting the opposite knee, driving the torso in a rhythmic, grounded bounce. Maintain a steady cadence by cycling the legs and pumping the arms, settling into the rhythmic stride of the initial stance.`
- Полные параметры: `art/generated/warrior-movement-attacks-review-v4/source/jobs/north-run.json`; `args` сохранены без изменений также в registry.
- Параметры: direction `north-east`, Low top-down, transparent, Enhance=true, frame_count=12, First=Last. 13 исходных / 13 playback × 75 мс.

### Warrior north-c1 — ПРИНЯТО

- Tool: `animate_image_pixminimax`; seed `17132012`; job `c814a798-2ac9-4748-a60a-56e75b7cee03`.
- Исходник: `art/generated/warrior-movement-attacks-review-v5/references/north-base-cell-4.png`. Роль: Принятые idle, бег и автоатаки для игры.
- Точный prompt: `one compact forward sword slash toward upper right, feet planted, small torso twist and back kept toward viewer, then recover to guard; thin frontal slash trail, warrior on diablo 4`
- Фактический enhanced prompt: `Swing the blade upward in a swift, diagonal arc to create a thin, shimmering slash trail, planting the feet firmly while twisting the torso. Retract the arm with focused momentum to return the sword to a defensive guard position.`
- Полные параметры: `art/generated/warrior-movement-attacks-review-v5/source/jobs/north-c1.json`; `args` сохранены без изменений также в registry.
- Параметры: direction `north-east`, Low top-down, transparent, Enhance=true, frame_count=12, First=Last. 13 исходных / 13 playback × 75 мс.

### Warrior north-c3 — ПРИНЯТО

- Tool: `animate_image_pixminimax`; seed `17132013`; job `a0749dd3-4ed2-4ff3-80e9-9538cf0277d1`.
- Исходник: `art/generated/warrior-movement-attacks-review-v5/references/north-base-cell-4.png`. Роль: Принятые idle, бег и автоатаки для игры.
- Точный prompt: `one compact overhead sword chop forward toward upper right, back-facing stance held, small knee bend and quick recovery, short frontal slash trail, warrior on diablo 4`
- Фактический enhanced prompt: `Swing the sword in a sharp, overhead arc toward the upper right while dipping the knees to generate momentum. Extend a fleeting, glowing slash trail through the apex of the motion before snapping back to a neutral, upright stance.`
- Полные параметры: `art/generated/warrior-movement-attacks-review-v5/source/jobs/north-c3.json`; `args` сохранены без изменений также в registry.
- Параметры: direction `north-east`, Low top-down, transparent, Enhance=true, frame_count=12, First=Last. 13 исходных / 13 playback × 75 мс.

### Warrior north-heavy — ПРИНЯТО

- Tool: `animate_image_pixminimax`; seed `17132014`; job `284a4966-8a00-4cf7-8828-5c73542925ca`.
- Исходник: `art/generated/warrior-movement-attacks-review-v5/references/north-base-cell-4.png`. Роль: Принятые idle, бег и автоатаки для игры.
- Точный prompt: `one heavy diagonal sword cleave toward upper right, braced back-facing stance, deep weight transfer into the cut then recoil to same guard; broad frontal blade arc, warrior on diablo 4`
- Фактический enhanced prompt: `Swing the blade in a forceful, high-arcing diagonal strike, shifting weight deeply into the lead leg to drive momentum through the motion. Retract the arm quickly to absorb the recoil, bracing the core to settle back into a defensive guard.`
- Полные параметры: `art/generated/warrior-movement-attacks-review-v5/source/jobs/north-heavy.json`; `args` сохранены без изменений также в registry.
- Параметры: direction `north-east`, Low top-down, transparent, Enhance=true, frame_count=12, First=Last. 13 исходных / 17 playback × 75 мс.

N/NE напрямую от стойки №4, NW зеркально; W/SW — зеркало front. Эталон Whirlwind сохранён. Старые шесть северных навыков от неверного исходника остаются приостановленными. Новых генераций в этой интеграции нет.


## 2026-11-12 — навыки во всех проекциях v2: новые северные пробы, НЕ ПРИНЯТЫ

Пользователь запросил демку всех навыков. Принятые шесть front-источников сохранены. Для севера использована правильная стойка №4 из `art/warrior/8-proections.png`; N/NE напрямую, NW зеркально. Новая серия не интегрируется до приёмки. Registry остаётся42.

Общие параметры: PixelLab `animate_image_pixminimax`, frame_count12 (13 с входным), Enhance=true, low top-down, north-east, transparent, First=Last — `references/north-base-cell-4.png`. Субъект и исходная поза переданы явно.

- **north-block — НЕ ПРИНЯТО**. Prompt: `shield block animation like warrior on diablo 4, back view facing upper right, raise shield forward away from camera, brace and recover`.
  Enhance: `Raise the shield forward while bracing the body against the incoming impact. Absorb the force with a slight shift in stance before lowering the guard and returning to a ready position.`.
  Seed `17134014`, job `ba9b481b-8a97-471b-8e86-5d3c22d02e65`. Полный args/receipt: `art/generated/warrior-skills-directions-review-v2/source/jobs/north-block.json`.

- **north-charge — НЕ ПРИНЯТО**. Prompt: `shield first charging lunge toward upper right and recover to guard, back view, warrior on diablo 4`.
  Enhance: `Thrust the shield forward while driving the body into a powerful lunge, then recoil sharply from the momentum to plant the feet firmly. Retract the sword arm to reset the stance and settle into a braced defensive guard.`.
  Seed `17134016`, job `fb45c2ee-19a7-4ffa-be81-ca5ce99340ff`. Полный args/receipt: `art/generated/warrior-skills-directions-review-v2/source/jobs/north-charge.json`.

- **north-cleave — НЕ ПРИНЯТО**. Prompt: `one strong frontal sword cleave toward upper right then recover to guard, back view, warrior on diablo 4`.
  Enhance: `Swing the sword in a wide, powerful arc toward the upper right, generating momentum through the torso. Pull the blade back with a sharp, controlled snap to return to a defensive posture, settling firmly into the final guard.`.
  Seed `17134011`, job `b3e81996-a1b6-493f-9044-7d48b1fd88c4`. Полный args/receipt: `art/generated/warrior-skills-directions-review-v2/source/jobs/north-cleave.json`.

- **north-stomp — НЕ ПРИНЯТО**. Prompt: `ground stomp animation like warrior on diablo 4, back view facing upper right, lift one foot and stamp firmly down then return to guard`.
  Enhance: `Lift the foot to shift weight, then drive the heel downward into the ground with a powerful, heavy stomp. Stabilize the torso as the leg retracts, returning the foot to the floor and adjusting the stance back into a guarded position.`.
  Seed `17134013`, job `4eaa0384-0348-4d8b-b3ed-e08921b93b74`. Полный args/receipt: `art/generated/warrior-skills-directions-review-v2/source/jobs/north-stomp.json`.

- **north-throw — НЕ ПРИНЯТО**. Prompt: `throw one physical wooden shaft spear with a steel point forward toward upper right then return to sword guard, back view, warrior on diablo 4`.
  Enhance: `Launch the spear forward with a sharp thrust, extending the arm fully before snapping it back to the hip. Immediately recover the sword to the ready position, settling the stance with a subtle shift in weight.`.
  Seed `17134015`, job `8109c772-9690-406e-ab53-9411e3094e16`. Полный args/receipt: `art/generated/warrior-skills-directions-review-v2/source/jobs/north-throw.json`.

- **north-whirlwind — НЕ ПРИНЯТО**. Prompt: `whirlwind animation line warrior on diablo 4, sword sweeping overhead through one full turn with coordinated body twist, start and end back view facing upper right`.
  Enhance: `Swing the sword in a wide, forceful overhead arc while twisting the torso to generate momentum. Pivot the entire stance through a complete rotation, allowing the blade to carve a circular path before settling back into the initial neutral stance.`.
  Seed `17134012`, job `dc3a933a-3f26-4ad6-bd73-29cecf53b9e4`. Полный args/receipt: `art/generated/warrior-skills-directions-review-v2/source/jobs/north-whirlwind.json`.

Все шесть заданий успешны с первой попытки: 78 исходных PNG, 6.30 generations по квитанциям. Южное старое копьё не заменяется новой северной пробой; северный выпуск/форма копья оставлены для оценки. Трещина повторно использует прежнюю программную текстуру; для её пикселей AI-промпт не придумывается.

Игровая правка этого запроса: автоатаки75→60мс/кадр (1.25×), без удаления поз; слеш теперь берёт фазу самого взмаха. Старый принятый Charge играет9×20мс в течение физического рывка180мс и прерывает автоатаку. Это настройка runtime, не новая генерация и не художественная приёмка северных навыков.


## 2026-11-12 — приёмка Whirlwind / Block / Charge v2 и отзыв Throw

Пользователь принял Whirlwind, Shield Block полностью и Charge. Три северных источника добавлены в registry; front уже принят ранее и сохраняется. Северный Cleave требует исправить красный щит на серый с жёлтой полосой. Северный Stomp отклонён: нужен шаг вперёд с ударом ногой и щитом. Piercing Throw отклонён полностью во всех проекциях; прежняя запись `warrior-throw-old-south` сохраняется как историческая с currentApprovalStatus=revoked и исключается из действующего пула.

### warrior-skills-v2-north-whirlwind — ПРИНЯТО

- Точный prompt: `whirlwind animation line warrior on diablo 4, sword sweeping overhead through one full turn with coordinated body twist, start and end back view facing upper right`
- Фактический Enhance: `Swing the sword in a wide, forceful overhead arc while twisting the torso to generate momentum. Pivot the entire stance through a complete rotation, allowing the blade to carve a circular path before settling back into the initial neutral stance.`
- Tool `animate_image_pixminimax`, seed `17134012`, job `dc3a933a-3f26-4ad6-bd73-29cecf53b9e4`.
- Референс `art/generated/warrior-skills-directions-review-v2/references/north-base-cell-4.png`. Полные args/receipt: `art/generated/warrior-skills-directions-review-v2/source/jobs/north-whirlwind.json`.
- PixMiniMax, Enhance=true,12 кадров плюс входной,Low top-down,north-east,transparent,First=Last. N/NE direct,NWmirror;13×75мс.

### warrior-skills-v2-north-block — ПРИНЯТО

- Точный prompt: `shield block animation like warrior on diablo 4, back view facing upper right, raise shield forward away from camera, brace and recover`
- Фактический Enhance: `Raise the shield forward while bracing the body against the incoming impact. Absorb the force with a slight shift in stance before lowering the guard and returning to a ready position.`
- Tool `animate_image_pixminimax`, seed `17134014`, job `ba9b481b-8a97-471b-8e86-5d3c22d02e65`.
- Референс `art/generated/warrior-skills-directions-review-v2/references/north-base-cell-4.png`. Полные args/receipt: `art/generated/warrior-skills-directions-review-v2/source/jobs/north-block.json`.
- PixMiniMax, Enhance=true,12 кадров плюс входной,Low top-down,north-east,transparent,First=Last. N/NE direct,NWmirror;13×75мс.

### warrior-skills-v2-north-charge — ПРИНЯТО

- Точный prompt: `shield first charging lunge toward upper right and recover to guard, back view, warrior on diablo 4`
- Фактический Enhance: `Thrust the shield forward while driving the body into a powerful lunge, then recoil sharply from the momentum to plant the feet firmly. Retract the sword arm to reset the stance and settle into a braced defensive guard.`
- Tool `animate_image_pixminimax`, seed `17134016`, job `fb45c2ee-19a7-4ffa-be81-ca5ce99340ff`.
- Референс `art/generated/warrior-skills-directions-review-v2/references/north-base-cell-4.png`. Полные args/receipt: `art/generated/warrior-skills-directions-review-v2/source/jobs/north-charge.json`.
- PixMiniMax, Enhance=true,12 кадров плюс входной,Low top-down,north-east,transparent,First=Last. N/NE direct,NWmirror;13×75мс.


## 2026-11-12 — доработки Cleave / Stomp / Throw v3: на проверке

Cleave сохраняет все13 позы и слеш. Через бесплатный PixelLab pixelart_workbench изменены только щитовые408+283пикселя в исходных кадрах07/08: красное поле и крест заменены сталью и одной жёлтой диагональной полосой из южной палитры. Alpha и пиксели вне691 guarded patches не меняются. Это точечная авторская правка, не AI-перегенерация: prompt/seed не придумывать. Полные операции и receipts: `art/generated/warrior-skills-directions-review-v3/source/shield-patches.json`, `shield-edit-7.json`, `shield-edit-8.json`.

Новые Throw стартуют из отдельных spear-ready поз: меч в исходной стойке заменён физическим деревянным копьём через Pixen, затем PixMiniMax делает выпуск из руки. Подготовленные PNG сами не приняты отдельно. Южные первые две пробы дали нежелательные огненные артефакты при возврате к мечу и сохранены как невыбранные. Третья проба исключает доставание меча и кончается пустой рукой. Enhance выключен в этой целевой коррекции; Last frame не задан.

Первый новый Stomp ударяет щитом, но продвижение слабое. Во второй пробе Last — точная стойка№4, перемещённая через PixelLab workbench на14px вправо/14px вверх. Это задаёт новое конечное положение; сам шаг и удар генерирует PixMiniMax. Enhance выключен, чтобы сохранить точное направление и двойной удар.

### front-spear-ready — подготовка / невыбранная история, НЕ ПРИНЯТО

- Tool `edit_image_pixen`, seed `17135012`, job `806d8beb-99fc-4b22-ad55-1cd8b96a284e`.
- Точный prompt: `Keep this exact warrior, pose, shield with yellow stripe, armor, cloth, boots, size and transparent canvas. Replace only the sword in the weapon hand with ONE long physical wooden spear with a small steel triangular tip. Hold the spear ready to throw, hand near shoulder, spear shaft pointing diagonally upward behind the shoulder. No glow. Preserve all other pixels.`
- Enhance: `выключен / не применяется`
- First/input `references/front-base.png`, Last `не задан`.
- Полные args/receipt: `art/generated/warrior-skills-directions-review-v3/source/jobs/front-spear-ready.json`.

### front-throw-r2 — подготовка / невыбранная история, НЕ ПРИНЯТО

- Tool `animate_image_pixminimax`, seed `17135016`, job `d9f9640d-c2f2-42a6-bf7f-c61089d33c20`.
- Точный prompt: `Perform ONE overhand javelin THROW toward the viewer. Wind the weapon arm back with the existing real wooden spear, then swing the arm forward, OPEN the throwing hand and RELEASE the spear completely. The single brown wooden shaft and small gray steel point travel freely away from the hand toward the bottom of the image. The hand remains visibly EMPTY during follow-through; then draw the sword and return to the original shield guard. A physical throwing motion, never a spear thrust. Keep shield steel gray with one yellow diagonal stripe. No fire, glowing weapon, light beam, magical projectile, energy trail or extra spear.`
- Enhance: `выключен / не применяется`
- First/input `references/front-spear-ready.png`, Last `references/front-base.png`.
- Полные args/receipt: `art/generated/warrior-skills-directions-review-v3/source/jobs/front-throw-r2.json`.

### front-throw-r3 — текущая проба, НЕ ПРИНЯТО

- Tool `animate_image_pixminimax`, seed `17135017`, job `7e0546df-ecb4-44a7-857a-48f831daa531`.
- Точный prompt: `One ordinary overhand javelin throw. Pull the existing wooden spear back, step into the throw, swing the shoulder and RELEASE the spear fully from the hand toward the lower right. The thin brown wooden shaft and small steel point fly away and become smaller. The visibly EMPTY throwing hand follows through downward and returns to the hip while the other arm keeps the shield braced. End with the empty hand at the hip after the spear has left. Simple physical throwing action.`
- Enhance: `выключен / не применяется`
- First/input `references/front-spear-ready.png`, Last `не задан`.
- Полные args/receipt: `art/generated/warrior-skills-directions-review-v3/source/jobs/front-throw-r3.json`.

### front-throw — подготовка / невыбранная история, НЕ ПРИНЯТО

- Tool `animate_image_pixminimax`, seed `17135014`, job `2d2169ec-03a2-4b8d-9a4f-080148c67f8e`.
- Точный prompt: `Throw the single wooden spear already held in the raised hand forward toward the viewer: draw the throwing arm back, drive the shoulder forward, extend the arm and release the spear visibly out of the hand, then recover into sword and shield guard, one powerful physical spear throw, warrior on diablo 4`
- Enhance: `Draw the arm back and drive the shoulder forward to launch the spear toward the viewer, then immediately retract the arm to draw the sword from the hip and brace the shield to settle into a defensive guard.`
- First/input `references/front-spear-ready.png`, Last `references/front-base.png`.
- Полные args/receipt: `art/generated/warrior-skills-directions-review-v3/source/jobs/front-throw.json`.

### north-spear-ready — подготовка / невыбранная история, НЕ ПРИНЯТО

- Tool `edit_image_pixen`, seed `17135013`, job `a86d2eaa-298d-4985-bbb3-84c9fb152e8b`.
- Точный prompt: `Keep this exact back-facing warrior, pose, shield, armor, cloth, boots, size and transparent canvas. Replace only the sword in the weapon hand with ONE long physical wooden spear with a small steel triangular tip. Hold the spear ready to throw, hand near shoulder, spear shaft pointing diagonally upward behind the shoulder. No glow. Preserve all other pixels.`
- Enhance: `выключен / не применяется`
- First/input `references/north-base-cell-4.png`, Last `не задан`.
- Полные args/receipt: `art/generated/warrior-skills-directions-review-v3/source/jobs/north-spear-ready.json`.

### north-stomp-r2 — текущая проба, НЕ ПРИНЯТО

- Tool `animate_image_pixminimax`, seed `17135018`, job `c09d1ec3-806c-45e5-b327-7b14755d3f66`.
- Точный prompt: `Take a deliberate step FORWARD toward the UPPER RIGHT, moving the whole body one boot length forward. Lift the leading knee and the shield, then drive that leading FOOT down while slamming the SHIELD LOWER RIM into the ground directly beside the leading foot. Bend both knees into the impact, with the shield visibly touching the ground. Recover upright in the NEW FORWARD POSITION,14 pixels to the right and14 pixels up from the starting guard. Finish farther toward the upper right; do not step backward or retreat to the starting spot. Heavy coordinated foot stamp and shield ground slam.`
- Enhance: `выключен / не применяется`
- First/input `references/north-base-cell-4.png`, Last `references/north-stomp-forward-end.png`.
- Полные args/receipt: `art/generated/warrior-skills-directions-review-v3/source/jobs/north-stomp-r2.json`.

### north-stomp — подготовка / невыбранная история, НЕ ПРИНЯТО

- Tool `animate_image_pixminimax`, seed `17135011`, job `36beb43c-79ed-4f30-a264-150f1d5dc91a`.
- Точный prompt: `Step forward toward upper right, stamp the leading foot down and simultaneously slam the lower rim of the shield into the ground beside that foot, a forceful forward ground stomp with a shield ground strike, then recover to guard, warrior on diablo 4`
- Enhance: `Step forward with the leading foot, stamping it firmly into the ground while simultaneously slamming the lower rim of the shield into the earth beside it. Recover by pulling the shield back into a defensive guard position.`
- First/input `references/north-base-cell-4.png`, Last `None`.
- Полные args/receipt: `art/generated/warrior-skills-directions-review-v3/source/jobs/north-stomp.json`.

### north-throw — текущая проба, НЕ ПРИНЯТО

- Tool `animate_image_pixminimax`, seed `17135015`, job `9feaa107-7277-42a5-83ff-339051f509e7`.
- Точный prompt: `Throw the single wooden spear already held in the raised hand forward toward upper right: draw the throwing arm back, drive the shoulder forward, extend the arm and release the spear visibly out of the hand, then recover into sword and shield guard, keep back toward viewer, warrior on diablo 4`
- Enhance: `Draw the spear back, drive the shoulder forward with momentum, and release the weapon into the distance. Recover the arm quickly to the waist, drawing the sword while stabilizing the shield into a defensive guard position.`
- First/input `references/north-spear-ready.png`, Last `references/north-base-cell-4.png`.
- Полные args/receipt: `art/generated/warrior-skills-directions-review-v3/source/jobs/north-throw.json`.

Действующая демка: `art/generated/warrior-skills-directions-review-v3/viewer.html`. Только Whirlwind/Block/Charge приняты во всех8направлениях. Исправленный северный Cleave, северный Stomp и оба Throw пока для оценки. Старый Throw и прежние Throw VFX исключены из текущей демки.


## 2026-11-12 — Aseprite: лицевая часть щита северного Piercing Throw

По прямой просьбе пользователя правка выполнена в Aseprite через Lua API, без новой AI-генерации. В шести кадрах (Aseprite6–11, исходные05–10) поле щита и центральная эмблема заменены сталью с одной жёлтой диагональной полосой по южному образцу. Изменено1104пикселя; вне маски и alpha delta0. Все13поз и75мс/кадр сохранены, N/NE direct,NWmirror.

Нативный файл: `art/generated/warrior-skills-directions-review-v4/aseprite/north-throw.aseprite`. Защищённый слой `Original - protected` содержит13исходных cels; слой `Shield - yellow stripe` содержит6cels правки. История и exact expected/replacement RGBA: `source/aseprite-repair.json`; исполняемые операции: `source/create-aseprite.lua`, `source/apply-shield-repair.lua`; фактический результат API: `source/aseprite-receipt.json`. Это авторская material-only правка: AI-prompt/seed для неё отсутствуют и не придумываются. Исходный motion job/seed/prompt северного Throw сохраняются в прежнем source/jobs/north-throw.json.

Registry45 без новых приёмок. Poolv12 указывает новую демку; сам бросок остаётся на приёмке. Все остальные143body-кадра пакета RGBA-identical с v3. Демо: `art/generated/warrior-skills-directions-review-v4/viewer.html`, открывается сразу на Throw.


## 2026-11-12 — принят северный Piercing Throw v4; щит Whirlwind исправлен в Aseprite v5

Пользователь: «piercing throw заменил отлично, теперь та же ситуация с whirlwind».
Принят исправленный северный Throw из v4: N/NE напрямую, NW зеркально. Новая приёмка не распространяется на фронтальный Throw. Registry: 46 записей, pool v13. Старые отклонённые броски не возвращаются.

Точный первоначальный рецепт принятого движения и последующей Aseprite-правки:

```json
{
  "id": "warrior-skills-v4-north-throw",
  "title": "Warrior north Throw — yellow-stripe shield",
  "role": "Принят исправленный северный Piercing Throw: N/NE напрямую, NW зеркально. Южный новый бросок отдельно остаётся на приёмке.",
  "date": "2026-11-12",
  "kind": "animation",
  "tool": "animate_image_pixminimax",
  "jobId": "9feaa107-7277-42a5-83ff-339051f509e7",
  "prompt": "Throw the single wooden spear already held in the raised hand forward toward upper right: draw the throwing arm back, drive the shoulder forward, extend the arm and release the spear visibly out of the hand, then recover into sword and shield guard, keep back toward viewer, warrior on diablo 4",
  "enhancedPrompt": "Draw the spear back, drive the shoulder forward with momentum, and release the weapon into the distance. Recover the arm quickly to the waist, drawing the sword while stabilizing the shield into a defensive guard position.",
  "args": {
    "description": "Throw the single wooden spear already held in the raised hand forward toward upper right: draw the throwing arm back, drive the shoulder forward, extend the arm and release the spear visibly out of the hand, then recover into sword and shield guard, keep back toward viewer, warrior on diablo 4",
    "first_frame_url": "upload:91f39598-bbe7-473e-bb65-725c5fe92fac",
    "last_frame_url": "upload:f588ae3f-41b0-490b-81b2-cca1f835f9c2",
    "direction": "north-east",
    "view": "low top-down",
    "frame_count": 12,
    "enhance_prompt": true,
    "no_background": true,
    "seed": 17135015,
    "subject_description": "the same steel armored warrior with red cloth, kite shield and ONE physical wooden shaft spear with a steel point in the throwing hand; no magical weapon",
    "initial_pose": "three quarter back view facing upper right, feet braced, weapon hand raised with one physical wooden spear near the shoulder"
  },
  "seed": 17135015,
  "jobFile": "art/generated/warrior-skills-directions-review-v4/source/jobs/north-throw.json",
  "input": "art/generated/warrior-skills-directions-review-v4/references/north-spear-ready.png",
  "lastReference": "art/generated/warrior-skills-directions-review-v4/references/north-base-cell-4.png",
  "sourceManifest": "art/generated/warrior-skills-directions-review-v4/manifest.json",
  "selectedClip": "north-throw",
  "playbackFrames": [
    "north-throw/0",
    "north-throw/1",
    "north-throw/2",
    "north-throw/3",
    "north-throw/4",
    "north-throw/5",
    "north-throw/6",
    "north-throw/7",
    "north-throw/8",
    "north-throw/9",
    "north-throw/10",
    "north-throw/11",
    "north-throw/12"
  ],
  "frameMs": 75,
  "currentApprovalStatus": "accepted",
  "postprocess": {
    "tool": "Aseprite Lua API",
    "nativeFile": "art/generated/warrior-skills-directions-review-v4/aseprite/north-throw.aseprite",
    "recipe": "art/generated/warrior-skills-directions-review-v4/source/aseprite-repair.json",
    "editedPixels": 1104,
    "editedFrames": 6
  },
  "approvalEvidence": "piercing throw заменил отлично, теперь та же ситуация с whirlwind"
}
```

Whirlwind v5 — ручная материальная правка через Aseprite Lua API, без AI-генерации. Никаких новых prompt/Enhance/seed/job не выдумывается. Первоначальный рецепт движения сохранён: `warrior-skills-directions-review-v2/source/jobs/north-whirlwind.json`, job `dc3a933a-3f26-4ad6-bd73-29cecf53b9e4`, seed 17134012. Южный пользовательский эталон не изменён.

Нативный исходник: `art/generated/warrior-skills-directions-review-v5/aseprite/north-whirlwind.aseprite`. 13 кадров × 75 мс. Слой `Original - protected`: 13 cels, editable=false. Слой `Shield - yellow stripe`: 3 cels, editable=true. Изменены 574 пикселя в кадрах 6–8 (1-based); стальная поверхность и жёлтая диагональная полоса вместо красной заливки с центральной эмблемой. Точные координаты и before/after RGBA: `source/whirlwind-aseprite-repair.json`; исполняемые create/apply Lua и фактический receipt лежат рядом. Alpha и пиксели вне маски не изменены. 143 остальных body-кадра совпадают с v4, N/NE прямые и NW зеркальный. Новая текстура Whirlwind ожидает оценки; приёмка движения сохраняется.


## 2026-11-13 — приняты все финальные навыки Warrior v5 и интеграция

Явное «я их принимаю все, накатывай в игру» относится к последней демке v5. Приняты все 12 клипов / 48 сочетаний, включая исправленные северные Cleave/Whirlwind/Throw, новый Stomp r2 и front Throw r3. Старые отклонённые пробы не возвращаются. N/NE direct, NW mirror. Южный пользовательский эталон Whirlwind и его рецепт неизменны.

Ниже точные сохранённые рецепты выбранных исходников; edits относятся к финальным пикселям v5. Неизвестные данные остаются null. Новых генераций нет.

### front-cleave

```json
{
  "id": "warrior-skills-runtime-v1-front-cleave",
  "date": "2026-11-13",
  "title": "Warrior skills v5: front-cleave",
  "role": "Accepted runtime cleave, front; all eight review routes",
  "kind": "animation",
  "tool": "animate_image_pixminimax",
  "args": {
    "description": "One broad horizontal CLEAVE in FRONT of the warrior, sweeping from his sword-side shoulder across his waist to the opposite side. Clear shoulder wind-up, powerful full arm swing, follow-through, recover. During the strike a tapered ivory-white and cool steel SLASH TRAIL grows directly from the moving blade and sweeps across the LOWER foreground in front of his body. A loose flattened crescent, not a perfect semicircle. The leading edge is bright, the fading tail thin. Trail appears only through the strike then dissolves. FRONT view throughout, same warrior identity, body scale, shield and grounded feet. Recover to the exact starting stance. Slash is attached to the moving blade. Keep whole body and slash inside canvas with empty margins. No camera movement, fire, runes or circular shockwave.",
    "direction": "south",
    "view": "low top-down",
    "subject_description": "the exact front-facing steel-armored warrior with red tabard, helmet plume, straight steel sword and shield",
    "initial_pose": "front-facing ready stance with sword lowered and shield held at his side; no slash effect yet",
    "frame_count": 16,
    "no_background": true,
    "enhance_prompt": false,
    "seed": 17123200,
    "first_frame_url": "upload:d1cf9439-9539-4810-b30a-8faf608a9b6d",
    "last_frame_url": "upload:d1cf9439-9539-4810-b30a-8faf608a9b6d"
  },
  "prompt": "One broad horizontal CLEAVE in FRONT of the warrior, sweeping from his sword-side shoulder across his waist to the opposite side. Clear shoulder wind-up, powerful full arm swing, follow-through, recover. During the strike a tapered ivory-white and cool steel SLASH TRAIL grows directly from the moving blade and sweeps across the LOWER foreground in front of his body. A loose flattened crescent, not a perfect semicircle. The leading edge is bright, the fading tail thin. Trail appears only through the strike then dissolves. FRONT view throughout, same warrior identity, body scale, shield and grounded feet. Recover to the exact starting stance. Slash is attached to the moving blade. Keep whole body and slash inside canvas with empty margins. No camera movement, fire, runes or circular shockwave.",
  "enhancedPrompt": null,
  "jobId": "e79ebf3c-1617-4f9a-935a-87e21e866b03",
  "seed": 17123200,
  "sourceReference": null,
  "lastReference": null,
  "jobFile": "art/generated/warrior-cleave-review-v1/source/jobs/cleave-a.json",
  "artifact": "art/generated/warrior-skills-directions-review-v5/spritesheets/front-cleave.png",
  "manifest": "art/generated/warrior-skills-directions-review-v5/manifest.json",
  "clip": "front-cleave",
  "accepted": true,
  "sourcePixels": "Final v5 pixels, including accepted shield repairs; original motion provenance retained",
  "edit": null
}
```

### front-whirlwind

```json
{
  "id": "warrior-skills-runtime-v1-front-whirlwind",
  "date": "2026-11-13",
  "title": "Warrior skills v5: front-whirlwind",
  "role": "Accepted runtime whirlwind, front; all eight review routes",
  "kind": "animation",
  "tool": "animate_image_pixminimax via PixelLab UI; user-reported",
  "args": {
    "prompt": "whirlwind animation line warrior on diablo 4",
    "enhance_prompt": true,
    "view": "low top-down",
    "direction": "south",
    "no_background": true,
    "frame_count": 12,
    "firstAndLastFrame": "same original neutral stance",
    "seed": null,
    "job_id": null,
    "expandedPrompt": null
  },
  "prompt": "whirlwind animation line warrior on diablo 4",
  "enhancedPrompt": null,
  "jobId": null,
  "seed": null,
  "sourceReference": null,
  "lastReference": null,
  "jobFile": null,
  "artifact": "art/generated/warrior-skills-directions-review-v5/spritesheets/front-whirlwind.png",
  "manifest": "art/generated/warrior-skills-directions-review-v5/manifest.json",
  "clip": "front-whirlwind",
  "accepted": true,
  "sourcePixels": "Final v5 pixels, including accepted shield repairs; original motion provenance retained",
  "edit": null
}
```

### front-stomp

```json
{
  "id": "warrior-skills-runtime-v1-front-stomp",
  "date": "2026-11-13",
  "title": "Warrior skills v5: front-stomp",
  "role": "Accepted runtime stomp, front; all eight review routes",
  "kind": "animation",
  "tool": "animate_image_pixminimax",
  "args": {
    "description": "ground stomp animation like warrior on diablo 4",
    "direction": "south",
    "view": "low top-down",
    "frame_count": 12,
    "no_background": true,
    "enhance_prompt": true,
    "first_frame_url": "upload:b88a8efb-5b92-4b3b-be3c-fdfc67f1e140",
    "last_frame_url": "upload:b88a8efb-5b92-4b3b-be3c-fdfc67f1e140",
    "seed": 17129011
  },
  "prompt": "ground stomp animation like warrior on diablo 4",
  "enhancedPrompt": "Raise the shield and shift weight onto the lead leg, then forcefully slam the rear foot into the ground to trigger a heavy impact. Follow through with a slight downward jolt of the entire frame as the posture stabilizes into the final stance.",
  "jobId": "15874bd6-d9db-4505-82d8-b0d2811137dd",
  "seed": 17129011,
  "sourceReference": null,
  "lastReference": null,
  "jobFile": "art/generated/warrior-skill-recipe-review-v1/source/jobs/stomp.json",
  "artifact": "art/generated/warrior-skills-directions-review-v5/spritesheets/front-stomp.png",
  "manifest": "art/generated/warrior-skills-directions-review-v5/manifest.json",
  "clip": "front-stomp",
  "accepted": true,
  "sourcePixels": "Final v5 pixels, including accepted shield repairs; original motion provenance retained",
  "edit": null
}
```

### front-block

```json
{
  "id": "warrior-skills-runtime-v1-front-block",
  "date": "2026-11-13",
  "title": "Warrior skills v5: front-block",
  "role": "Accepted runtime block, front; all eight review routes",
  "kind": "animation",
  "tool": "animate_image_pixminimax",
  "args": {
    "description": "shield block animation like warrior on diablo 4",
    "direction": "south",
    "view": "low top-down",
    "frame_count": 12,
    "no_background": true,
    "enhance_prompt": true,
    "first_frame_url": "upload:b88a8efb-5b92-4b3b-be3c-fdfc67f1e140",
    "last_frame_url": "upload:b88a8efb-5b92-4b3b-be3c-fdfc67f1e140",
    "seed": 17129012
  },
  "prompt": "shield block animation like warrior on diablo 4",
  "enhancedPrompt": "Brace against an incoming strike by shifting weight onto the back leg and driving the shield forward with a sudden, forceful thrust. Follow through with a slight torso rotation, absorbing the impact before firming the stance into a braced guard position.",
  "jobId": "83c63a69-c5d9-4ed3-8180-e82182464292",
  "seed": 17129012,
  "sourceReference": null,
  "lastReference": null,
  "jobFile": "art/generated/warrior-skill-recipe-review-v1/source/jobs/block.json",
  "artifact": "art/generated/warrior-skills-directions-review-v5/spritesheets/front-block.png",
  "manifest": "art/generated/warrior-skills-directions-review-v5/manifest.json",
  "clip": "front-block",
  "accepted": true,
  "sourcePixels": "Final v5 pixels, including accepted shield repairs; original motion provenance retained",
  "edit": null
}
```

### front-charge

```json
{
  "id": "warrior-skills-runtime-v1-front-charge",
  "date": "2026-11-13",
  "title": "Warrior skills v5: front-charge",
  "role": "Accepted runtime charge, front; all eight review routes",
  "kind": "animation",
  "tool": "animate_image",
  "args": {
    "first_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
    "last_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
    "action": "This exact warrior prepares a forward CHARGE to screen RIGHT: lowers torso, tucks sword safely beside body, leads with kite shield, takes two powerful rapid running strides IN PLACE, braces at arrival with shield-forward shoulder impact, then returns to original stance. Clear grounded push-off and arrival recoil. Do not translate body across canvas; movement path will be shown separately. No dust or shield glow. Keep same warrior identity, size, native pixels and all gear.",
    "frame_count": 8,
    "no_background": true,
    "seed": 1712054
  },
  "prompt": "This exact warrior prepares a forward CHARGE to screen RIGHT: lowers torso, tucks sword safely beside body, leads with kite shield, takes two powerful rapid running strides IN PLACE, braces at arrival with shield-forward shoulder impact, then returns to original stance. Clear grounded push-off and arrival recoil. Do not translate body across canvas; movement path will be shown separately. No dust or shield glow. Keep same warrior identity, size, native pixels and all gear.",
  "enhancedPrompt": null,
  "jobId": "b7a03eab-d0a2-4f62-9ed3-4cf24f30b6a9",
  "seed": 1712054,
  "sourceReference": null,
  "lastReference": null,
  "jobFile": "art/generated/warrior-animation-review-v1/source/jobs/gesture-charge.json",
  "artifact": "art/generated/warrior-skills-directions-review-v5/spritesheets/front-charge.png",
  "manifest": "art/generated/warrior-skills-directions-review-v5/manifest.json",
  "clip": "front-charge",
  "accepted": true,
  "sourcePixels": "Final v5 pixels, including accepted shield repairs; original motion provenance retained",
  "edit": null
}
```

### north-whirlwind

```json
{
  "id": "warrior-skills-runtime-v1-north-whirlwind",
  "date": "2026-11-13",
  "title": "Warrior skills v5: north-whirlwind",
  "role": "Accepted runtime whirlwind, north; all eight review routes",
  "kind": "animation",
  "tool": "animate_image_pixminimax",
  "args": {
    "description": "whirlwind animation line warrior on diablo 4, sword sweeping overhead through one full turn with coordinated body twist, start and end back view facing upper right",
    "direction": "north-east",
    "view": "low top-down",
    "frame_count": 12,
    "enhance_prompt": true,
    "no_background": true,
    "seed": 17134012,
    "subject_description": "back view of the same steel armored warrior with sword, kite shield and red cloth",
    "initial_pose": "three quarter back view facing upper right with sword lowered and shield beside the torso",
    "last_frame_url": "upload:2d166c12-6412-445a-a803-40d083130798",
    "first_frame_url": "upload:2d166c12-6412-445a-a803-40d083130798"
  },
  "prompt": "whirlwind animation line warrior on diablo 4, sword sweeping overhead through one full turn with coordinated body twist, start and end back view facing upper right",
  "enhancedPrompt": "Swing the sword in a wide, forceful overhead arc while twisting the torso to generate momentum. Pivot the entire stance through a complete rotation, allowing the blade to carve a circular path before settling back into the initial neutral stance.",
  "jobId": "dc3a933a-3f26-4ad6-bd73-29cecf53b9e4",
  "seed": 17134012,
  "sourceReference": "references/north-base-cell-4.png",
  "lastReference": null,
  "jobFile": "art/generated/warrior-skills-directions-review-v5/source/retained-jobs/north-whirlwind.json",
  "artifact": "art/generated/warrior-skills-directions-review-v5/spritesheets/north-whirlwind.png",
  "manifest": "art/generated/warrior-skills-directions-review-v5/manifest.json",
  "clip": "north-whirlwind",
  "accepted": true,
  "sourcePixels": "Final v5 pixels, including accepted shield repairs; original motion provenance retained",
  "edit": {
    "tool": "Aseprite Lua API",
    "native": "art/generated/warrior-skills-directions-review-v5/aseprite/north-whirlwind.aseprite",
    "recipe": "art/generated/warrior-skills-directions-review-v5/source/whirlwind-aseprite-repair.json",
    "pixels": 574
  }
}
```

### north-block

```json
{
  "id": "warrior-skills-runtime-v1-north-block",
  "date": "2026-11-13",
  "title": "Warrior skills v5: north-block",
  "role": "Accepted runtime block, north; all eight review routes",
  "kind": "animation",
  "tool": "animate_image_pixminimax",
  "args": {
    "description": "shield block animation like warrior on diablo 4, back view facing upper right, raise shield forward away from camera, brace and recover",
    "direction": "north-east",
    "view": "low top-down",
    "frame_count": 12,
    "enhance_prompt": true,
    "no_background": true,
    "seed": 17134014,
    "subject_description": "back view of the same steel armored warrior with sword, kite shield and red cloth",
    "initial_pose": "three quarter back view facing upper right with sword lowered and shield beside the torso",
    "last_frame_url": "upload:2d166c12-6412-445a-a803-40d083130798",
    "first_frame_url": "upload:2d166c12-6412-445a-a803-40d083130798"
  },
  "prompt": "shield block animation like warrior on diablo 4, back view facing upper right, raise shield forward away from camera, brace and recover",
  "enhancedPrompt": "Raise the shield forward while bracing the body against the incoming impact. Absorb the force with a slight shift in stance before lowering the guard and returning to a ready position.",
  "jobId": "ba9b481b-8a97-471b-8e86-5d3c22d02e65",
  "seed": 17134014,
  "sourceReference": "references/north-base-cell-4.png",
  "lastReference": null,
  "jobFile": "art/generated/warrior-skills-directions-review-v5/source/retained-jobs/north-block.json",
  "artifact": "art/generated/warrior-skills-directions-review-v5/spritesheets/north-block.png",
  "manifest": "art/generated/warrior-skills-directions-review-v5/manifest.json",
  "clip": "north-block",
  "accepted": true,
  "sourcePixels": "Final v5 pixels, including accepted shield repairs; original motion provenance retained",
  "edit": null
}
```

### north-charge

```json
{
  "id": "warrior-skills-runtime-v1-north-charge",
  "date": "2026-11-13",
  "title": "Warrior skills v5: north-charge",
  "role": "Accepted runtime charge, north; all eight review routes",
  "kind": "animation",
  "tool": "animate_image_pixminimax",
  "args": {
    "description": "shield first charging lunge toward upper right and recover to guard, back view, warrior on diablo 4",
    "direction": "north-east",
    "view": "low top-down",
    "frame_count": 12,
    "enhance_prompt": true,
    "no_background": true,
    "seed": 17134016,
    "subject_description": "back view of the same steel armored warrior with sword, kite shield and red cloth",
    "initial_pose": "three quarter back view facing upper right with sword lowered and shield beside the torso",
    "last_frame_url": "upload:2d166c12-6412-445a-a803-40d083130798",
    "first_frame_url": "upload:2d166c12-6412-445a-a803-40d083130798"
  },
  "prompt": "shield first charging lunge toward upper right and recover to guard, back view, warrior on diablo 4",
  "enhancedPrompt": "Thrust the shield forward while driving the body into a powerful lunge, then recoil sharply from the momentum to plant the feet firmly. Retract the sword arm to reset the stance and settle into a braced defensive guard.",
  "jobId": "fb45c2ee-19a7-4ffa-be81-ca5ce99340ff",
  "seed": 17134016,
  "sourceReference": "references/north-base-cell-4.png",
  "lastReference": null,
  "jobFile": "art/generated/warrior-skills-directions-review-v5/source/retained-jobs/north-charge.json",
  "artifact": "art/generated/warrior-skills-directions-review-v5/spritesheets/north-charge.png",
  "manifest": "art/generated/warrior-skills-directions-review-v5/manifest.json",
  "clip": "north-charge",
  "accepted": true,
  "sourcePixels": "Final v5 pixels, including accepted shield repairs; original motion provenance retained",
  "edit": null
}
```

### north-cleave

```json
{
  "id": "warrior-skills-runtime-v1-north-cleave",
  "date": "2026-11-13",
  "title": "Warrior skills v5: north-cleave",
  "role": "Accepted runtime cleave, north; all eight review routes",
  "kind": "animation",
  "tool": "animate_image_pixminimax",
  "args": {
    "description": "one strong frontal sword cleave toward upper right then recover to guard, back view, warrior on diablo 4",
    "direction": "north-east",
    "view": "low top-down",
    "frame_count": 12,
    "enhance_prompt": true,
    "no_background": true,
    "seed": 17134011,
    "subject_description": "back view of the same steel armored warrior with sword, kite shield and red cloth",
    "initial_pose": "three quarter back view facing upper right with sword lowered and shield beside the torso",
    "last_frame_url": "upload:2d166c12-6412-445a-a803-40d083130798",
    "first_frame_url": "upload:2d166c12-6412-445a-a803-40d083130798"
  },
  "prompt": "one strong frontal sword cleave toward upper right then recover to guard, back view, warrior on diablo 4",
  "enhancedPrompt": "Swing the sword in a wide, powerful arc toward the upper right, generating momentum through the torso. Pull the blade back with a sharp, controlled snap to return to a defensive posture, settling firmly into the final guard.",
  "jobId": "b3e81996-a1b6-493f-9044-7d48b1fd88c4",
  "seed": 17134011,
  "sourceReference": "references/north-base-cell-4.png",
  "lastReference": "references/north-base-cell-4.png",
  "jobFile": "art/generated/warrior-skills-directions-review-v2/source/jobs/north-cleave.json",
  "artifact": "art/generated/warrior-skills-directions-review-v5/spritesheets/north-cleave.png",
  "manifest": "art/generated/warrior-skills-directions-review-v5/manifest.json",
  "clip": "north-cleave",
  "accepted": true,
  "sourcePixels": "Final v5 pixels, including accepted shield repairs; original motion provenance retained",
  "edit": {
    "tool": "PixelLab pixelart_workbench",
    "recipe": "art/generated/warrior-skills-directions-review-v5/source/shield-patches.json",
    "pixels": 691
  }
}
```

### north-stomp

```json
{
  "id": "warrior-skills-runtime-v1-north-stomp",
  "date": "2026-11-13",
  "title": "Warrior skills v5: north-stomp",
  "role": "Accepted runtime stomp, north; all eight review routes",
  "kind": "animation",
  "tool": "animate_image_pixminimax",
  "args": {
    "description": "Take a deliberate step FORWARD toward the UPPER RIGHT, moving the whole body one boot length forward. Lift the leading knee and the shield, then drive that leading FOOT down while slamming the SHIELD LOWER RIM into the ground directly beside the leading foot. Bend both knees into the impact, with the shield visibly touching the ground. Recover upright in the NEW FORWARD POSITION,14 pixels to the right and14 pixels up from the starting guard. Finish farther toward the upper right; do not step backward or retreat to the starting spot. Heavy coordinated foot stamp and shield ground slam.",
    "first_frame_url": "upload:f588ae3f-41b0-490b-81b2-cca1f835f9c2",
    "last_frame_url": "https://api.pixellab.ai/mcp/pixel-tools/c7fb043d-afc1-4146-bc1d-e838f5d724c9/image.png",
    "direction": "north-east",
    "view": "low top-down",
    "frame_count": 12,
    "enhance_prompt": false,
    "no_background": true,
    "seed": 17135018,
    "subject_description": "back view of the same steel armored warrior with a real shield and sword, facing upper right",
    "initial_pose": "both boots planted at the original northern guard; the final guard is one boot length farther toward upper right"
  },
  "prompt": "Take a deliberate step FORWARD toward the UPPER RIGHT, moving the whole body one boot length forward. Lift the leading knee and the shield, then drive that leading FOOT down while slamming the SHIELD LOWER RIM into the ground directly beside the leading foot. Bend both knees into the impact, with the shield visibly touching the ground. Recover upright in the NEW FORWARD POSITION,14 pixels to the right and14 pixels up from the starting guard. Finish farther toward the upper right; do not step backward or retreat to the starting spot. Heavy coordinated foot stamp and shield ground slam.",
  "enhancedPrompt": null,
  "jobId": "c09d1ec3-806c-45e5-b327-7b14755d3f66",
  "seed": 17135018,
  "sourceReference": "references/north-base-cell-4.png",
  "lastReference": "references/north-stomp-forward-end.png",
  "jobFile": "art/generated/warrior-skills-directions-review-v5/source/jobs/north-stomp-r2.json",
  "artifact": "art/generated/warrior-skills-directions-review-v5/spritesheets/north-stomp.png",
  "manifest": "art/generated/warrior-skills-directions-review-v5/manifest.json",
  "clip": "north-stomp",
  "accepted": true,
  "sourcePixels": "Final v5 pixels, including accepted shield repairs; original motion provenance retained",
  "edit": null
}
```

### front-throw

```json
{
  "id": "warrior-skills-runtime-v1-front-throw",
  "date": "2026-11-13",
  "title": "Warrior skills v5: front-throw",
  "role": "Accepted runtime throw, front; all eight review routes",
  "kind": "animation",
  "tool": "animate_image_pixminimax",
  "args": {
    "description": "One ordinary overhand javelin throw. Pull the existing wooden spear back, step into the throw, swing the shoulder and RELEASE the spear fully from the hand toward the lower right. The thin brown wooden shaft and small steel point fly away and become smaller. The visibly EMPTY throwing hand follows through downward and returns to the hip while the other arm keeps the shield braced. End with the empty hand at the hip after the spear has left. Simple physical throwing action.",
    "first_frame_url": "upload:0400cdd7-fb5c-43b8-8993-b7c1a8cda16c",
    "direction": "south",
    "view": "low top-down",
    "frame_count": 12,
    "enhance_prompt": false,
    "no_background": true,
    "seed": 17135017,
    "subject_description": "front view of one steel armored warrior holding a plain brown wooden javelin with a small gray steel tip and a steel shield with one yellow diagonal stripe",
    "initial_pose": "weapon arm cocked with the real wooden spear behind the shoulder, both boots planted and shield braced"
  },
  "prompt": "One ordinary overhand javelin throw. Pull the existing wooden spear back, step into the throw, swing the shoulder and RELEASE the spear fully from the hand toward the lower right. The thin brown wooden shaft and small steel point fly away and become smaller. The visibly EMPTY throwing hand follows through downward and returns to the hip while the other arm keeps the shield braced. End with the empty hand at the hip after the spear has left. Simple physical throwing action.",
  "enhancedPrompt": null,
  "jobId": "7e0546df-ecb4-44a7-857a-48f831daa531",
  "seed": 17135017,
  "sourceReference": "references/front-spear-ready.png",
  "lastReference": null,
  "jobFile": "art/generated/warrior-skills-directions-review-v5/source/jobs/front-throw-r3.json",
  "artifact": "art/generated/warrior-skills-directions-review-v5/spritesheets/front-throw.png",
  "manifest": "art/generated/warrior-skills-directions-review-v5/manifest.json",
  "clip": "front-throw",
  "accepted": true,
  "sourcePixels": "Final v5 pixels, including accepted shield repairs; original motion provenance retained",
  "edit": null
}
```

### north-throw

```json
{
  "id": "warrior-skills-runtime-v1-north-throw",
  "date": "2026-11-13",
  "title": "Warrior skills v5: north-throw",
  "role": "Accepted runtime throw, north; all eight review routes",
  "kind": "animation",
  "tool": "animate_image_pixminimax",
  "args": {
    "description": "Throw the single wooden spear already held in the raised hand forward toward upper right: draw the throwing arm back, drive the shoulder forward, extend the arm and release the spear visibly out of the hand, then recover into sword and shield guard, keep back toward viewer, warrior on diablo 4",
    "first_frame_url": "upload:91f39598-bbe7-473e-bb65-725c5fe92fac",
    "last_frame_url": "upload:f588ae3f-41b0-490b-81b2-cca1f835f9c2",
    "direction": "north-east",
    "view": "low top-down",
    "frame_count": 12,
    "enhance_prompt": true,
    "no_background": true,
    "seed": 17135015,
    "subject_description": "the same steel armored warrior with red cloth, kite shield and ONE physical wooden shaft spear with a steel point in the throwing hand; no magical weapon",
    "initial_pose": "three quarter back view facing upper right, feet braced, weapon hand raised with one physical wooden spear near the shoulder"
  },
  "prompt": "Throw the single wooden spear already held in the raised hand forward toward upper right: draw the throwing arm back, drive the shoulder forward, extend the arm and release the spear visibly out of the hand, then recover into sword and shield guard, keep back toward viewer, warrior on diablo 4",
  "enhancedPrompt": "Draw the spear back, drive the shoulder forward with momentum, and release the weapon into the distance. Recover the arm quickly to the waist, drawing the sword while stabilizing the shield into a defensive guard position.",
  "jobId": "9feaa107-7277-42a5-83ff-339051f509e7",
  "seed": 17135015,
  "sourceReference": "references/north-spear-ready.png",
  "lastReference": "references/north-base-cell-4.png",
  "jobFile": "art/generated/warrior-skills-directions-review-v5/source/jobs/north-throw.json",
  "artifact": "art/generated/warrior-skills-directions-review-v5/spritesheets/north-throw.png",
  "manifest": "art/generated/warrior-skills-directions-review-v5/manifest.json",
  "clip": "north-throw",
  "accepted": true,
  "sourcePixels": "Final v5 pixels, including accepted shield repairs; original motion provenance retained",
  "edit": {
    "tool": "Aseprite Lua API",
    "native": "art/generated/warrior-skills-directions-review-v5/aseprite/north-throw.aseprite",
    "recipe": "art/generated/warrior-skills-directions-review-v5/source/aseprite-repair.json",
    "pixels": 1104
  }
}
```

Отдельная принятая трещина: `art/generated/warrior-skills-directions-review-v5/effects/stomp-crack.png`, оригинальная программная пиксельная графика, `source/crack.mjs`, SHA 19ffd1fa3864986a8af5555be941653fd42f0877bbb6ca223c1a449043969fa9. AI prompt/seed/job отсутствуют. Игровой летящий spear — оригинальная программная текстура `scripts/build-warrior-skills-v1.mjs`, не AI и не отдельная приёмка генерации.


## 2026-11-13 — программная композиция ног и синхронизация Cleave

По запросу пользователя о раннем уроне и остановившихся ногах выполнена runtime-правка. Источники: `src/game/art/warriorHeroManifest.json` (принятые C1/C3/Heavy и Run front/north) и `src/game/art/warriorSkillsManifest.json` (принятый skill Cleave). Все PNG/атласы сохранены; источник N/NE — ячейка 4, NW mirror, W/SW front mirror.

Тип: оригинальная программная композиция. Инструмент/рецепт: `src/game/art/WarriorMovingCleaveArt.ts`; один CanvasTexture `warrior-moving-cleave-v3`, раздельные upper/lower и foreground меча/щита/baked-slash. Ноги используют фактическую дистанцию и reference speed 118; тайминг удара — `src/game/config/warriorCleave.ts`. Prompt, Enhance, seed, job ID: null — новых AI-заданий нет. Техническая реализация по запросу пользователя, не отдельная выбранная AI-генерация. Исторические приёмки и точные рецепты исходных клипов выше остаются актуальны.

Отчёт/реальные Canvas: `docs/classes/warrior/CLEAVE_SYNC_V3_REPORT.md`, `screenshots/warrior-cleave-sync-v3/`. Scope и точные SHA модулей: `art/generated/warrior-cleave-sync-v3/integration-verification.json`.


## 2026-11-13 — программные moving layers остальных навыков и War Banner в игре

По текущему запросу Run-низ переиспользован для Stomp/Block/Throw/Charge; Whirlwind сохраняет цельный принятый источник. Рецепт: `src/game/art/WarriorMovingCleaveArt.ts`, distance clock118, исходные front/north Run, foreground-маски оружия/щита/VFX, страницы до2048×3492, видимые стальные пиксели противоположной ноги для участков, перекрытых мечом Run. Северный Stomp получает компенсацию внутреннего смещения при композиции; исходные PNG не меняются. Тип: оригинальная программная композиция; prompt/Enhance/seed/job:null.

War Banner использует **ранее принятый статический объект A**: `art/generated/warrior-concept-pack-v1/layers/war-banner-a-object.png` → `public/assets/hd/war-banner-v1/object.png`, SHA256 `a206ae2b6eef17bd0d3b76a2dfe4c77675598be6f5d3a87399956cd8176d2225`, побайтное копирование. Роль в текущей реализации: якорь лечебной зоны15с/140px/10%maxHP в секунду. Граница зоны/маркеры и эмблема программные, renderer `WarBannerArt.ts`. Новых генераций нет; параметры/промпты оригинального принятого концепта сохраняются в прежних записях. Непринятые анимационные пробы не включены в runtime.

Scope/точные SHA: `art/generated/warrior-buffs-v4/integration-verification.json`. Отчёт/Canvas: `docs/classes/warrior/BUFFS_V4_REPORT.md`, `screenshots/warrior-buffs-v4/`.


## 2026-11-13 ? ??? Warrior-????? ? ????: ????? ?????????? ?? ???????

??????? ????????? ????????? ??????? ?????????? Earthbreaker/Spear of Ruin ? ?????????? ? ????????? ??????. ??? **?? ????? ?????????????? ???????**. ??????? ???????? ??????????? ???? Earthbreaker A ???? ????? ???????? ? Spear of Ruin B ????????? ?????? ???????????; runtime-manifest ????? `pending-user-gameplay-selection`.

????? ???????? PixelLab/?????? ??????????? ???, ?????? ?? ?????????0. ?????????47 ???????? RGBA-?????? ?? `art/generated/warrior-animation-review-v1/manifest.json`:

- gesture-earthbreaker: job `5e628268-2408-45cd-915c-23307de19a00`,13 playback-??? ?90??.
- gesture-ruin-v2: job `fb1d403e-ea3e-442b-bc1b-974319eeb622`,12 playback-??? ?90??; ??????? ?????????? source-frame6 ?????????,13 ???????? PNG ?? ?????????.
- vfx-earthbreaker: job `e0aff92e-8e3c-483c-93dc-18033dc763a9`,13 ??? ?90??.
- vfx-spear-of-ruin: job `972464e2-73b1-400e-9ded-4c78e0096ee7`,9 ??? ?75??, ????.

???????? ???????, ?????????, seeds ? references ???????? ? ???????? job JSON; ????? ???????? ?? ???????????. ?????? source/hash/job ???????? ? `src/game/art/warriorUltimatesManifest.json`; ????? `public/assets/hd/warrior-ultimates-v1/0.png`,47 source?atlas RGBA-identical. ??????? front-????? ? VFX ? ????? ??????? ?????????? ???? ?? ?????? ????????????.

N/NE ?????????? ??????? ???????? `north-stomp`/`north-throw` ?? `src/game/art/warriorSkillsManifest.json`, ?? ????????? ????????????? ??????4; NW ? ???????. ??? ????????????????? ? timing ?????????? ????0.54?, ? ?? ????? ????????? ??? ????? ??????? ????????? ?????. ??????????? ????? ?? ????? ? ?????? ?? ????????????. ??????????? ?????????? ?????/????? ? ????????? ??????? ? Graphics ??? AI-???????. ????? Whirlwind ? ??? ?????? ???????? ?????? ?? ????????.

?????: `art/generated/warrior-ultimates-gameplay-review-v1/viewer.html`; ?????: `docs/classes/warrior/ULTIMATES_GAMEPLAY_V1_REPORT.md`. ?????????? ???????????? ? ??????? ??????? ?????????. ????????? ?????? accepted ???????? ?????? ????? ?????? ?????? ????????????.


## 2026-11-13 ? ?????????? ???????? ???? ?24 ????????, ?? ???????

???????????? ???????? ?????? ????? ???????? ???? ???????????. ?????? `art/generated/warrior-ultimates-animation-review-v1/viewer.html`:120 ???????????? PNG ???????? ? ???? HTML,11 ??????; ????? ????????? ? ????? ???????? ?????? ???. Exact source paths/SHA/job IDs ? ???????? playback-?????????????????? ????????? ? ???????? manifest.json. Builder ??????? SHA ????? ????????????; PNG-??????? ?? ????????.

Ruin/Earthbreaker ?????????? ??????? ???????? ??????? front-????? ? VFX ?? warriorUltimatesManifest. Banner ?????????? ????????? ???????? gesture-banner/vfx-war-banner, ??????? ??????? ?????????? VFX-source3/4. North ? ???????? north-throw/north-stomp/north-block ?? ???????? skills manifest, NW ???????; ??? ???? ??????????? ?????????????????, ?? ????? ???????? ?????????. Idle ???? ?? ???????? hero manifest. ??????????? ???????? ? ??????? ??????? ??????? ???????????; ????? ?????????? ???? ?? ?????? ????????????.

???, ???? ? ????????? ?????????? ?????? ? ??????????? Canvas-??????????? ??? AI-???????; ????? ???????? ?? ???????? ???????? ??? ??????????? ?????????, ??????? World/?????? ?? ????????. ??? ????? Whirlwind-????????? ? ?? ???????? ?????? ???????. ????? ??????????? ???????? ????? file://, ??? ???????? ???? ??? ???????.


## 2026-11-13 — принятые варианты трёх ультимейтов подключены в игру

Прямое поручение: «давай интегрировать принятые варианты ультмейтов в игру». Точный выбранный просмотр — `art/generated/warrior-ultimates-animation-review-v1/viewer.html`. Приняты Banner A, Earthbreaker A, Spear of Ruin B с показанными body/VFX. Исторические pending-записи выше сохранены. Новых AI-заданий нет.

Ниже точные рецепты выбранных архивных клипов. Неудачные исходники Banner v1/v2 и Ruin v1 не принимаются. В Banner VFX сохраняется исключение source frames 3/4; в Ruin body — frame 6. N/NE используют уже принятые north-block/stomp/throw от ячейки 4, NW — зеркало, с тем же contact-retiming, что в просмотре; новых северных генераций нет. Полные прежние рецепты северных навыков и южного Whirlwind не меняются.

### gesture-earthbreaker

```json
{
  "id": "warrior-ultimates-accepted-v1-gesture-earthbreaker",
  "date": "2026-11-13",
  "title": "Warrior ultimate: gesture-earthbreaker",
  "role": "Accepted front body gesture, S/SE/E direct, SW/W mirrored",
  "kind": "animation",
  "tool": "animate_image",
  "args": {
    "first_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
    "last_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
    "action": "Giant EARTHBREAKER SLAM body gesture. Same warrior gathers weight deeply into bent knees, lifts sword arm HIGH above helmet, raises upper torso, then drives sword and body DOWN in a very heavy ground slam in front, compresses and recoils, then recovers to original front stance. Larger anticipation and impact than Ground Stomp. Shield remains on opposite arm, no ground cracks or VFX in this body layer. No camera shake or translation. Keep exact identity, body size and pixels.",
    "frame_count": 12,
    "no_background": true,
    "seed": 1712056
  },
  "prompt": "Giant EARTHBREAKER SLAM body gesture. Same warrior gathers weight deeply into bent knees, lifts sword arm HIGH above helmet, raises upper torso, then drives sword and body DOWN in a very heavy ground slam in front, compresses and recoils, then recovers to original front stance. Larger anticipation and impact than Ground Stomp. Shield remains on opposite arm, no ground cracks or VFX in this body layer. No camera shake or translation. Keep exact identity, body size and pixels.",
  "enhancedPrompt": null,
  "seed": 1712056,
  "jobId": "5e628268-2408-45cd-915c-23307de19a00",
  "sourceReference": "art/generated/warrior-animation-review-v1/references/body-front.png",
  "lastReference": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
  "jobFile": "art/generated/warrior-animation-review-v1/source/jobs/gesture-earthbreaker.json",
  "manifest": "art/generated/warrior-animation-review-v1/manifest.json",
  "runtimeManifest": "src/game/art/warriorUltimatesManifest.json",
  "clip": "gesture-earthbreaker",
  "playbackFrames": [
    "gesture-earthbreaker/0",
    "gesture-earthbreaker/1",
    "gesture-earthbreaker/2",
    "gesture-earthbreaker/3",
    "gesture-earthbreaker/4",
    "gesture-earthbreaker/5",
    "gesture-earthbreaker/6",
    "gesture-earthbreaker/7",
    "gesture-earthbreaker/8",
    "gesture-earthbreaker/9",
    "gesture-earthbreaker/10",
    "gesture-earthbreaker/11",
    "gesture-earthbreaker/12"
  ],
  "frameMs": 90,
  "periodMs": 1170,
  "pivot": {
    "x": 64,
    "y": 100
  },
  "accepted": true
}
```

### gesture-ruin

```json
{
  "id": "warrior-ultimates-accepted-v1-gesture-ruin",
  "date": "2026-11-13",
  "title": "Warrior ultimate: gesture-ruin",
  "role": "Accepted front body gesture, S/SE/E direct, SW/W mirrored",
  "kind": "animation",
  "tool": "animate_image",
  "args": {
    "first_frame_url": "upload:f6517552-7624-4583-a04e-6d02c59b59a4",
    "last_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
    "action": "Heavy SPEAR OF RUIN THROW using the LONG WOODEN SPEAR already held above shoulder. Deep knee brace and shoulder windup with spear, then powerful right-arm thrust and RELEASE directly to screen RIGHT: spear leaves the hand and exits the image, torso follows through hard and right hand becomes EMPTY. Recover, draw original sword from belt and return to final reference stance. NOT a sword attack. Shield stays on left arm, no VFX, no translation, preserve same character identity, body size and native pixel style.",
    "frame_count": 12,
    "no_background": true,
    "seed": 1712312
  },
  "prompt": "Heavy SPEAR OF RUIN THROW using the LONG WOODEN SPEAR already held above shoulder. Deep knee brace and shoulder windup with spear, then powerful right-arm thrust and RELEASE directly to screen RIGHT: spear leaves the hand and exits the image, torso follows through hard and right hand becomes EMPTY. Recover, draw original sword from belt and return to final reference stance. NOT a sword attack. Shield stays on left arm, no VFX, no translation, preserve same character identity, body size and native pixel style.",
  "enhancedPrompt": null,
  "seed": 1712312,
  "jobId": "fb1d403e-ea3e-442b-bc1b-974319eeb622",
  "sourceReference": "art/generated/warrior-animation-review-v1/raw/pose-throw-ready/00.png",
  "lastReference": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
  "jobFile": "art/generated/warrior-animation-review-v1/source/jobs/gesture-ruin-v2.json",
  "manifest": "art/generated/warrior-animation-review-v1/manifest.json",
  "runtimeManifest": "src/game/art/warriorUltimatesManifest.json",
  "clip": "gesture-ruin",
  "playbackFrames": [
    "gesture-ruin/0",
    "gesture-ruin/1",
    "gesture-ruin/2",
    "gesture-ruin/3",
    "gesture-ruin/4",
    "gesture-ruin/5",
    "gesture-ruin/7",
    "gesture-ruin/8",
    "gesture-ruin/9",
    "gesture-ruin/10",
    "gesture-ruin/11",
    "gesture-ruin/12"
  ],
  "frameMs": 90,
  "periodMs": 1080,
  "pivot": {
    "x": 64,
    "y": 100
  },
  "accepted": true
}
```

### vfx-earthbreaker

```json
{
  "id": "warrior-ultimates-accepted-v1-vfx-earthbreaker",
  "date": "2026-11-13",
  "title": "Warrior ultimate: vfx-earthbreaker",
  "role": "Accepted ultimate effect, all eight gameplay directions",
  "kind": "animation",
  "tool": "animate_image",
  "args": {
    "first_frame_url": "upload:3daacd2c-453d-43d8-a538-f18ff17451fc",
    "last_frame_url": "upload:3926cfd4-27b1-4488-a0a7-e967d7bd707a",
    "action": "Animate this EARTHBREAKER with exactly THREE branching cracks. A heavy pulse travels from the common LEFT impact hub along the upper-right branch, then the middle-right branch, then the lower-right branch. Chunky stone eruptions rise at their tips in this sequence, then settle and crumble into sparse dust and fade completely. Keep all three separated paths and gray/brown earth, no lava, fire or glowing magic. Strong physical weight, static top-down camera, native crisp pixels.",
    "frame_count": 12,
    "no_background": true,
    "seed": 1712212
  },
  "prompt": "Animate this EARTHBREAKER with exactly THREE branching cracks. A heavy pulse travels from the common LEFT impact hub along the upper-right branch, then the middle-right branch, then the lower-right branch. Chunky stone eruptions rise at their tips in this sequence, then settle and crumble into sparse dust and fade completely. Keep all three separated paths and gray/brown earth, no lava, fire or glowing magic. Strong physical weight, static top-down camera, native crisp pixels.",
  "enhancedPrompt": null,
  "seed": 1712212,
  "jobId": "e0aff92e-8e3c-483c-93dc-18033dc763a9",
  "sourceReference": "art/generated/warrior-animation-review-v1/references/earthbreaker-a.png",
  "lastReference": "upload:3926cfd4-27b1-4488-a0a7-e967d7bd707a",
  "jobFile": "art/generated/warrior-animation-review-v1/source/jobs/vfx-earthbreaker.json",
  "manifest": "art/generated/warrior-animation-review-v1/manifest.json",
  "runtimeManifest": "src/game/art/warriorUltimatesManifest.json",
  "clip": "vfx-earthbreaker",
  "playbackFrames": [
    "vfx-earthbreaker/0",
    "vfx-earthbreaker/1",
    "vfx-earthbreaker/2",
    "vfx-earthbreaker/3",
    "vfx-earthbreaker/4",
    "vfx-earthbreaker/5",
    "vfx-earthbreaker/6",
    "vfx-earthbreaker/7",
    "vfx-earthbreaker/8",
    "vfx-earthbreaker/9",
    "vfx-earthbreaker/10",
    "vfx-earthbreaker/11",
    "vfx-earthbreaker/12"
  ],
  "frameMs": 90,
  "periodMs": 1170,
  "pivot": {
    "x": 41,
    "y": 80
  },
  "accepted": true
}
```

### vfx-spear-of-ruin

```json
{
  "id": "warrior-ultimates-accepted-v1-vfx-spear-of-ruin",
  "date": "2026-11-13",
  "title": "Warrior ultimate: vfx-spear-of-ruin",
  "role": "Accepted ultimate effect, all eight gameplay directions",
  "kind": "animation",
  "tool": "animate_image",
  "args": {
    "first_frame_url": "upload:287a3b19-f055-4a7f-9f59-ca220ba7b188",
    "last_frame_url": "upload:287a3b19-f055-4a7f-9f59-ca220ba7b188",
    "action": "Flight and force LOOP of this accepted RAMMING SPEAR ultimate pointing RIGHT. Huge bodkin steel spearhead stays rigid and readable, straight shaft vibrates slightly, three staggered pale steel trail wedges pulse and scroll backward LEFT, and the compact frontal stone-impact chevron at RIGHT punches forward and retracts. Preserve massive forward weapon axis, dark steel and warm brass, no laser beam, no orb, no magic curls. Return to the input arrangement.",
    "frame_count": 8,
    "no_background": true,
    "seed": 1712213
  },
  "prompt": "Flight and force LOOP of this accepted RAMMING SPEAR ultimate pointing RIGHT. Huge bodkin steel spearhead stays rigid and readable, straight shaft vibrates slightly, three staggered pale steel trail wedges pulse and scroll backward LEFT, and the compact frontal stone-impact chevron at RIGHT punches forward and retracts. Preserve massive forward weapon axis, dark steel and warm brass, no laser beam, no orb, no magic curls. Return to the input arrangement.",
  "enhancedPrompt": null,
  "seed": 1712213,
  "jobId": "972464e2-73b1-400e-9ded-4c78e0096ee7",
  "sourceReference": "art/generated/warrior-animation-review-v1/references/spear-of-ruin-b.png",
  "lastReference": "upload:287a3b19-f055-4a7f-9f59-ca220ba7b188",
  "jobFile": "art/generated/warrior-animation-review-v1/source/jobs/vfx-spear-of-ruin.json",
  "manifest": "art/generated/warrior-animation-review-v1/manifest.json",
  "runtimeManifest": "src/game/art/warriorUltimatesManifest.json",
  "clip": "vfx-spear-of-ruin",
  "playbackFrames": [
    "vfx-spear-of-ruin/0",
    "vfx-spear-of-ruin/1",
    "vfx-spear-of-ruin/2",
    "vfx-spear-of-ruin/3",
    "vfx-spear-of-ruin/4",
    "vfx-spear-of-ruin/5",
    "vfx-spear-of-ruin/6",
    "vfx-spear-of-ruin/7",
    "vfx-spear-of-ruin/8"
  ],
  "frameMs": 75,
  "periodMs": 675,
  "pivot": {
    "x": 112,
    "y": 48
  },
  "accepted": true
}
```

### gesture-banner

```json
{
  "id": "warrior-ultimates-accepted-v1-gesture-banner",
  "date": "2026-11-13",
  "title": "Warrior ultimate: gesture-banner",
  "role": "Accepted front body gesture, S/SE/E direct, SW/W mirrored",
  "kind": "animation",
  "tool": "animate_image_pixminimax",
  "args": {
    "first_frame_url": "upload:bc288eee-6061-4aa8-a2da-1777916618fb",
    "last_frame_url": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
    "description": "Physical downward gauntlet punch. The already raised EMPTY steel fist moves straight DOWN with elbow bending until the fist is beside the knee, hold a brief forceful braced pose, then recover into the final neutral stance. Move only body and existing equipment. Absolutely no light, no particles and no appearing objects. Keep shield slate steel and brass, with its original unchanged surface. Feet planted, no turning or canvas translation.",
    "frame_count": 8,
    "no_background": true,
    "direction": "south",
    "view": "low top-down",
    "initial_pose": "front-facing warrior standing, one empty steel-gloved fist raised above shoulder, other arm holds a slate kite shield, sword at belt",
    "subject_description": "same compact human warrior in slate steel plate armor, oxblood cloth and kite shield, one raised empty steel gauntlet",
    "enhance_prompt": false,
    "seed": 1712314
  },
  "prompt": "Physical downward gauntlet punch. The already raised EMPTY steel fist moves straight DOWN with elbow bending until the fist is beside the knee, hold a brief forceful braced pose, then recover into the final neutral stance. Move only body and existing equipment. Absolutely no light, no particles and no appearing objects. Keep shield slate steel and brass, with its original unchanged surface. Feet planted, no turning or canvas translation.",
  "enhancedPrompt": null,
  "seed": 1712314,
  "jobId": "0c7f8e93-b0c3-4a3b-bfff-f780ef9d3c97",
  "sourceReference": "art/generated/warrior-animation-review-v1/raw/pose-banner-ready/00.png",
  "lastReference": "upload:35da8c8c-a6ee-475d-bd8d-04b3a1047012",
  "jobFile": "art/generated/warrior-animation-review-v1/source/jobs/gesture-banner-v3.json",
  "manifest": "art/generated/warrior-animation-review-v1/manifest.json",
  "runtimeManifest": "src/game/art/warriorUltimatesManifest.json",
  "clip": "gesture-banner",
  "playbackFrames": [
    "gesture-banner/0",
    "gesture-banner/1",
    "gesture-banner/2",
    "gesture-banner/3",
    "gesture-banner/4",
    "gesture-banner/5",
    "gesture-banner/6",
    "gesture-banner/7",
    "gesture-banner/8"
  ],
  "frameMs": 90,
  "periodMs": 810,
  "pivot": {
    "x": 64,
    "y": 100
  },
  "accepted": true
}
```

### vfx-war-banner

```json
{
  "id": "warrior-ultimates-accepted-v1-vfx-war-banner",
  "date": "2026-11-13",
  "title": "Warrior ultimate: vfx-war-banner",
  "role": "Accepted ultimate effect, all eight gameplay directions",
  "kind": "animation",
  "tool": "animate_image",
  "args": {
    "first_frame_url": "upload:ae69e285-5fd8-4e8e-84a4-51b2787ce878",
    "last_frame_url": "upload:ae69e285-5fd8-4e8e-84a4-51b2787ce878",
    "action": "Idle LOOP of this accepted PLANTED WAR BANNER. The oxblood cloth with ONE brass chevron sways gently in two broad folds, the pole and its stone ground socket remain completely fixed. The sparse open rally-zone ring breathes subtly without expanding, with no flash or extra particles. Preserve the exact banner emblem, quiet brass/steel/cloth colors, medium-detail pixel clusters and transparent spaces. End at the starting cloth position.",
    "frame_count": 8,
    "no_background": true,
    "seed": 1712211
  },
  "prompt": "Idle LOOP of this accepted PLANTED WAR BANNER. The oxblood cloth with ONE brass chevron sways gently in two broad folds, the pole and its stone ground socket remain completely fixed. The sparse open rally-zone ring breathes subtly without expanding, with no flash or extra particles. Preserve the exact banner emblem, quiet brass/steel/cloth colors, medium-detail pixel clusters and transparent spaces. End at the starting cloth position.",
  "enhancedPrompt": null,
  "seed": 1712211,
  "jobId": "4281ec45-3bd6-4613-ab97-d55ea69fc5a2",
  "sourceReference": "art/generated/warrior-animation-review-v1/references/war-banner-a.png",
  "lastReference": "upload:ae69e285-5fd8-4e8e-84a4-51b2787ce878",
  "jobFile": "art/generated/warrior-animation-review-v1/source/jobs/vfx-war-banner.json",
  "manifest": "art/generated/warrior-animation-review-v1/manifest.json",
  "runtimeManifest": "src/game/art/warriorUltimatesManifest.json",
  "clip": "vfx-war-banner",
  "playbackFrames": [
    "vfx-war-banner/0",
    "vfx-war-banner/1",
    "vfx-war-banner/2",
    "vfx-war-banner/5",
    "vfx-war-banner/6",
    "vfx-war-banner/7",
    "vfx-war-banner/8"
  ],
  "frameMs": 75,
  "periodMs": 525,
  "pivot": {
    "x": 96,
    "y": 131
  },
  "accepted": true
}
```

Граница лечения, контактные линии/осколки разлома и финальный импульс копья — оригинальная программная Graphics-композиция; prompt/seed/job отсутствуют. Атлас упакован без изменения RGBA; runtime использует simulation clock World.elapsed. Рецепты не означают принятие неизвестных параметров: отсутствующие значения остаются null.
