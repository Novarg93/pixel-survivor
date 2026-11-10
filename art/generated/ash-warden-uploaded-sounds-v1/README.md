# Ash Warden — пользовательские WAV подключены

Источник: `art/final-boss/sound/`. Все5 оригиналов — stereo48kHz16-bit WAV,
по1с, суммарно960390 bytes. Runtime-копии в
`public/assets/audio/ash-warden-uploaded-v1/` совпадают побайтно и по SHA-256.
Исходные имена с # и `meteor (2).wav` сохранены; runtime-имена очищены для URL.
Ни генерации, ни trim/normalize/resample/transcode не выполнялось.

| Исходная папка | Событие | Применение |
| --- | --- | --- |
| swing | final.swing-windup / final.slash | Оба боковых варианта, включая тычок;0–300мс записи на замахе,300мс–конец на реальном контакте |
| slam | final.slam | South/north на hitFrame; направление зафиксировано атакой |
| charge | final.charge | Начало движения; исходный composite включает торможение, старый extra final.stop не дублируется |
| flamestrike | final.cleave | Однократно на cleaveImpact для всего веера |
| meteor | final.meteor-fall / final.impact | Первые200мс перед приземлением, остаток только на реальном landed |

Playback ranges используют один исходный буфер на WAV, с4мс gain fades на
границах; файлы остаются целыми. Pitch/gain вариации, категории громкости,
mute, pause, blur и teardown используют существующую аудиосистему.
События контакта не планируются заранее, поэтому заморозка не вызывает
преждевременный удар Meteor. World меняет только метку звука side/slam;
баланс, урон, тайминги атак, анимации и VFX прежние.

`manifest.json` — источники, SHA, decoded metrics и playback gains.
`runtime-baseline.json` — снимок376 runtime-файлов до изменений.
`integration-verification.json` — точный список8 изменений /7 добавлений;
368 прежних файлов неизменны, включая все старые SFX и музыку.
`scripts/verify-ash-warden-sounds.mjs` проверяет этот scope и байты WAV.

Проверки: typecheck/lint/build PASS,1082 unit в141 файле PASS;
20 уникальных DEV browser-сценариев PASS после обновления PCM-бюджета
на точный объём пяти дополнительных stereo-буферов (+1920000 bytes).
Проверены направления, обе боковые атаки, реальные start ranges WebAudio,
Charge/Flame Strike, серия3 Meteor, fallback при отсутствии файлов,
сохранность Mage, музыка, mute/pause/blur и перезапуски сцен.
Boss fixture:16 decoded samples,0 failures/fallbacks,4862276 decoded bytes,
peak voices7≤12,0 browser errors. Это не оценка художественного качества.
Canvas screenshots и evidence:
`screenshots/ash-warden-uploaded-sounds-v1/`.
