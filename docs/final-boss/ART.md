# Оригинальный арт Стража

Исходник: scripts/ash-guard-art-source.mjs. Генератор:
node --experimental-strip-types --loader ./scripts/ts-art-loader.mjs scripts/build-ash-guard-art.mjs.
Ни один старый actor не используется при рисовании: собственные polygon/pixel
доспехи, сочленения, корни, плащ, закрытый шлем и двуручный клинок.

Отдельные public/assets/hd/ash-guard.png и ash-guard.json загружаются заранее
в preload, повторно используются при scene restart. Атлас2304×1792,
15.75MiB расчётного RGBA источника (не измеренная VRAM). Кадр128×128,
логический размер128×128, опора104/128 поY; hitbox28 задан отдельно.
Тело около76world pixels высотой, Mage около25: масштаб примерно3×.

252 кадров; аудит пикселей подтверждает223уникальных изображений.
Повторы присутствуют на циклических конечных позах. Это не252разных рисунков.
Направления down/up/side; left зеркалит side. Отдельные front/back-шлемы,
направленный меч и VFX сектора. Измерительный аудит не нашёл ни одного
непрозрачного пикселя на краю кадра после исправления padding оружия.

|Клип|Кадров на направление|
|---|---:|
|spawn|6|
|idle|4|
|walk|6|
|chargeWindup/travel/brake|5/3/3|
|swordWindup/active/recovery|6/5/4|
|ritualEnter/channel/meteorCast|5/4/5|
|shieldBreak/phaseTransition/hit/death|5/6/2/10|
|phase3Idle/phase3Walk|3/2|

Пятнадцать дополнительных directional-кадров phase3 заняли свободные ячейки
того же атласа: размер и RGBA budget не выросли. Между атаками сохраняются
поднятый клинок, другая стойка и светлые трещины, включая движение. Реальные
phase3-stance-WIDTH.png/phase3-walk-WIDTH.png и проверка выбранных frame names
подтверждают, что это состояние не исчезает после transition.

Плечи и корпус переносят вес, ноги имеют опорный шаг, две руки следуют
хвату меча. Клинок меняет угол замаха/активного удара; ritual ставит его
остриём вниз; meteor поднимает свободную руку; death разбивает силуэт,
гасит трещины и завершает приземлённой позой. Частый hit использует
существующий tint-overlay, не прерывая атакующее состояние.

Смерть после визуального просмотра переработана: восемь отдельно заданных
положений таза, корпуса, головы и конечностей после двух кадров потери
равновесия. Колено подламывается, рука ищет опору, корпус заваливается,
броня оседает, меч падает отдельно и гаснет. Сжатие стоящего спрайта удалено.
Повторный аудит всех252кадров:223unique,0пикселей на краях.

Лист поз: screenshots/final-boss/contact-sheet.png. Raw audit:
docs/final-boss/art-audit.json. Визуальная матрица и видео:
screenshots/final-boss/{intro,chargeWindup,chargeTravel,chargeBrake,
swordWindup,swordActive,recovery,ritual-3,ritual-2,ritual-1,distant-meteor,
shield-break,frozen-armageddon,armageddon-second,death,victory}-WIDTH.png
и videos/. Timestamps выборки combo — в visual-WIDTH.json;
death timestamps подписаны непосредственно на death-sequence-WIDTH.png.

Действительно открыты contact sheet, сравнение с Mage, intro/ritual desktop
и mobile, sword вверх/вправо, frozen beams, Fire/Lightning, zero-effects,
последовательности реальных charge/sword/recovery и death с timestamps.
animation-sequence-WIDTH.png содержит выборку примерно каждые0.083s;
death-sequence-WIDTH.png — примерно каждые0.16s, с безопасных render-часов.
Это захват настоящего Canvas на RAF, а не воспроизведение только атласа.
Полные записи лежат в videos/. Художественная ручная приёмка остаётся
следующим шагом: оценка тяжести меча и силуэта на телефоне человеком.
