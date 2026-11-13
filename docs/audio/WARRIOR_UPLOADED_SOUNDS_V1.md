# Warrior: пользовательские звуки, 2026-11-13

По прямому поручению интегрированы все девять WAV из `art/warrior/sounds`. Копии в `public/assets/audio/warrior-uploaded-v1` побайтно совпадают с оригиналами. Новых генераций нет; происхождение, SHA256, PCM-метрики и коэффициенты громкости: `docs/verification/warrior-sounds-v1/manifest.json`.

| Запись | Событие |
|---|---|
| cleave.wav | Cleave: начало замаха |
| whirlwind.wav | Whirlwind: применение |
| stomp.wav | Stomp: применение, включая последующий промах |
| spear_throw.wav | Piercing Throw: начало броска |
| shield_block.wav | Block: применение и поглощённый удар через общий shield cue |
| charge.wav | Успешный Dash / Charge |
| banner.wav | Успешная активация Banner |
| ultimate_stomp.wav | Успешная активация Earthbreaker |
| spear_ultimate.wav | Успешная активация Spear of Ruin |

Все записи играют однократно через существующий Phaser AudioContext, SFX/master/mute, приоритеты и лимит 12 голосов. Banner и Ultimate Stomp имеют исходную длительность 10,16 с; не обрезаются и не зацикливаются. Изменяется только playback gain, не PCM. Ульты больше не запускают звук щита мага. Stomp больше не дублирует звук по damage feedback. Обычный Cleave impact сохраняет прежний отдельный слой попадания.

Pause/upgrade/death/restart используют существующую остановку источников. Пропущенные из-за паузы звуки не переигрываются. При недоступном WAV остаётся немедленный процедурный fallback. Баланс и время нанесения урона не менялись.

Проверки:

- `npm.cmd run check`: 163 файла / 1173 unit tests, typecheck, lint и build. Финальный лог `.tmp/warrior-sounds-check-complete.log`.
- DEV E2E: 9/9 (Warrior, Mage uploads, mini-boss audio), `.tmp/warrior-sounds-regression.log`.
- Production E2E: 14/14, включая доставку всех девяти WAV с проверкой SHA, Charge через настоящий input и отсутствие DEV harness; `.tmp/warrior-sounds-production.log`.
- `screenshots/warrior-sounds-v1/`: Canvas трёх ульт и `evidence.json`; Earthbreaker просмотрен. WebAudio подтверждает проигрывание всех девяти новых samples, failedAssets=0, sampleFallbacks=0, JS errors=0, sources=0 после паузы/перезапуска. Дополнительно проверены mute и fallback при блокировке всех девяти загрузок.
- Декодированный кэш в Chromium: 24 454 244 байта (36 samples). Прежний порог 15 MB обновлён до явного 26 MB: добавлены девять исходных stereo WAV, в том числе две длинные записи. Лимиты голосов/циклов не увеличивались.
- Scope: 5 изменённых runtime-файлов, 9 новых WAV, 454 прежних файла сохранены. Новые SHA записаны отдельно; исторические proofs не переписаны. Поздняя интеграция учитывается в общих проверках и verifier helpers.

Первый browser-прогон остановился на повторной Q после паузы: фокус оставался на кнопке, и существующий keyboard handler корректно отвергал ввод. Тест переведён на настоящую экранную кнопку ульты и прошёл повторно. Один промежуточный check пересёкся с нормализацией перевода строк `samples.ts` и увидел старый SHA; после фиксации файла и proof повторён финальный check. Проверки не отключались.

Субъективная оценка тембра/микса на слух остаётся за пользователем. Известное предупреждение Vite о крупных chunks прежнее. Следующий шаг: игровой забег и настройка относительной громкости по отзывам. Блокеров, новых done-маркеров, commit/push/deploy нет.
