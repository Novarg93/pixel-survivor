# Mage Cast — секторы и точки выпуска

[Игра](http://127.0.0.1:5173/) · [Сравнение](comparison.html).
Сравнение также обновлено по прежнему адресу `../mage-phantom-cast-production-v1/comparison.html`.
Переключатели показывают Fireball/молнию и desktop/mobile на настоящих игровых кадрах.

При движении обычный корпус использует три передних направления; фантом —
боковые границы ±90° и задний сектор. Для NORTH: обычные N/NE/NW,
фантомные W/SW/S/SE/E. Это24native и40phantom случаев на64 сочетания.
Ноги продолжают Run. Обычный верхний корпус поворачивается к цели, в фантомном
режиме основной Mage сохраняет полный Run. Направление движения и часы шага
не меняются. При смене движения сектор пересчитывается без перезапуска жеста.
Пока идёт визуальное завершение шага, сохраняется его ограничение на разворот;
после остановки обычный полный Mage может кастовать во все стороны.
После каста сохраняется исходное idle-направление, согласованное с прежним Blink.

Fireball/обычная молния используют существующие разные native body clips
в переднем секторе и один общий Phantom Cast в заднем. Дополнительных анимаций
или генераций PixelLab нет; approved PNG/атласы не менялись.

## Руки

`mageCastPalms.ts` содержит ручные отметки руки на0/4/8/12/16 кадрах каждого
принятого Fireball/Lightning clip. Между ними — интерполяция. Contact sheets
`fireball-0/1-marks.png`, `lightning-0/1-marks.png` показывают крестики на источниках.
Столбцы0/4/8/12/16; строки первого листа S/SE/E/NE, второго N/NW/W/SW.
`palm-marks.json` хранит все272 отметки и соответствующие исходные PNG.
Это приближённая привязка к жесту, а не новые кадры или процедурный редизайн героя.

Phantom использует свои palm metadata. На этапах проявления берётся рука
реально отображаемого исходного/промежуточного направления. Масштаб, waist offset
и pivot применяются так же, как к нарисованному корпусу. Разметка ультимейтов прежняя.

`MageSpellOrigins` читает реальные ability events до их потребления аудио:

- новый Fireball появляется у руки в первый видимый кадр. Снимок точки выпуска
  независим от дальнейшего движения Mage. Offset плавно сводится к исходной
  collision path, максимум за240мс и раньше для близкой цели;
- начало первой дуги молнии следует за рукой того же жеста. Остальные звенья
  цепи и их endpoints не смещаются. При прерывании старый луч не переносится за Blink;
- если анимация подавлена hurt/Blink, реальный автокаст получает физическую
  точку руки основного Mage вместо fallback к стопам;
- записи ограничены живыми projectiles/FX и удаляются при expiry/death/restart.

Это исключительно отображение: World physics, real spawn time, damage, cooldown,
target selection и controls сохранены. В GameScene изменены position/rotation
отрисовки снаряда, не его collision coordinates.

## Проверки

931unit/112files,typecheck/lint/build PASS. Unit охватывают все64сектора для обоих
spells, точные боковые границы, stationary/turning/pause, сохранение Blink-facing,
снимок feedback до audio, birth position, короткий полёт, chain endpoints и cleanup.

Chromium:128реальных кастов на1280×720 и128на844×390;24native/40phantom на spell.
Дополнительно16autocast birth cases и4standing/hurt cases. Screenshots/JSON:
`screenshots/mage-phantom/`, `screenshots/mage-cast-origins/` в корне проекта.
Скриншоты обычных N/NE и фантомных E/S жестов, начала Fireball и исходные
contact sheets открыты и визуально изучены. Новые расходы PixelLab:0.
Production9/9 PASS. Comparison проверен по HTTP и file:// во всех8состояниях
(2spells×2экрана×2протокола):64изображения каждый раз,24native/40phantom,
точный пример NORTH, JS/console errors0. Подробности в browser-validation.json.

Воспроизведение:

```powershell
node scripts/build-mage-cast-review.mjs
node scripts/inspect-mage-phantom.mjs
npm.cmd run check
npm.cmd run test:e2e -- mage-phantom.spec.ts mage-cast-origins.spec.ts
```

Матрица тестов очищает временные сущности через expiry/World.step, сохраняя
возврат объектов в bounded pools. Прямое удаление FX из массива в старом fixture
истощало пул; исправлен fixture, лимиты production не увеличивались.
