# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay-mobility.spec.ts >> Mage Space is a single edge, respects input/cooldown/pause/upgrade and cleans on restart
- Location: tests\e2e\gameplay-mobility.spec.ts:9:41

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Начать заново' })

```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic:
    - generic:
      - generic:
        - text: ✦ MAGE
        - generic:
          - generic: УРОВЕНЬ 1
          - progressbar "Опыт": 0%
        - progressbar "Здоровье": 100 / 100
      - generic:
        - generic: 00:27
        - generic: Тихая поляна
      - generic:
        - generic:
          - generic: "0"
          - generic: ОЧКИ · 0 УБИЙСТВ
        - button "Пауза" [ref=e6] [cursor=pointer]: Ⅱ
    - complementary "Шкала запланированных событий":
      - 'list "Запланированные события: минута до и после текущего времени"':
        - img "Сейчас"
    - generic:
      - complementary "Временные усиления"
    - complementary "Локальный радар":
      - generic:
        - text: РАДАР
        - generic: N ↑
      - img "Противники и предметы поблизости"
      - generic: ✦ хранитель ◆ артефакт
    - list "Способности":
      - listitem "Blink · Space · готово":
        - generic [aria-hidden]: ◇
        - generic: SPACE
        - generic: ГОТОВО
      - listitem "Огненный шар · Ранг 1":
        - generic: ✦
        - generic: "1"
      - listitem "Морозная нова · Открой при повышении уровня":
        - generic: ❄
        - generic: ·
        - generic: ◇
      - listitem "Цепная молния · Открой при повышении уровня":
        - generic: ϟ
        - generic: ·
        - generic: ◇
      - listitem "Армагеддон · Открой при повышении уровня":
        - generic: ☄
        - generic: ·
        - generic: ◇
      - listitem "Тайный щит · Открой при повышении уровня":
        - generic: ◇
        - generic: ·
        - generic: ◇
    - generic [ref=e7]: W A S D движение SPACE Blink ESC пауза
```

# Test source

```ts
  1  | import { selectTestCharacter } from '../helpers/character';
  2  | import { expect, test, type Page } from '@playwright/test';
  3  | import { mkdirSync, writeFileSync } from 'node:fs';
  4  | const directory = 'screenshots/gameplay';
  5  | async function quiet(page: Page, hero: string) {
  6  |   await page.goto('/?test=1'); await selectTestCharacter(page, hero); await page.getByRole('button', { name: 'Начать забег' }).click();
  7  |   await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; for (const a of Object.values(w.abilities)) a.level = 0; });
  8  | }
  9  | for (const hero of ['Mage', 'Warrior']) test(`${hero} Space is a single edge, respects input/cooldown/pause/upgrade and cleans on restart`, async ({ page }) => {
  10 |   mkdirSync(directory, { recursive: true }); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); await quiet(page, hero);
  11 |   await page.keyboard.down('d'); await page.keyboard.down('Space');
  12 |   await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.mobility.sequence)).toBe(1);
  13 |   await page.evaluate(() => { const w = window.__PIXEL__!.world; w.step(.05); w.pause(); });
  14 |   const fxStyle = await page.addStyleTag({ content: '.overlay{display:none!important}' }); await page.waitForTimeout(80);
  15 |   await page.screenshot({ path: `${directory}/${hero}-mobility-fx-desktop.png` }); await fxStyle.evaluate(style => { style.parentNode?.removeChild(style); }); await page.evaluate(() => window.__PIXEL__!.world.resume());
  16 |   await page.waitForTimeout(250); await page.keyboard.up('d');
  17 |   expect(await page.evaluate(() => window.__PIXEL__!.world.mobility.direction)).toEqual({ x: 1, y: 0 });
  18 |   expect(await page.evaluate(() => window.__PIXEL__!.world.player.x)).toBeGreaterThan(80);
  19 |   await page.screenshot({ path: `${directory}/${hero}-cooldown-desktop.png` });
  20 |   await page.evaluate(() => { const w = window.__PIXEL__!.world; w.elapsed = w.mobility.readyAt + .01; });
  21 |   await page.keyboard.down('Space'); await page.waitForTimeout(100); expect(await page.evaluate(() => window.__PIXEL__!.world.mobility.sequence)).toBe(1);
  22 |   await page.keyboard.up('Space'); await page.keyboard.press('Space'); await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.mobility.sequence)).toBe(2);
  23 |   await page.getByRole('button', { name: 'Пауза', exact: true }).click();
  24 |   await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  25 |   const frozen = await page.evaluate(() => ({ time: window.__PIXEL__!.world.elapsed, ready: window.__PIXEL__!.world.snapshot().mobility.readyIn }));
  26 |   await page.keyboard.press('Space'); await page.waitForTimeout(100); expect(await page.evaluate(() => ({ time: window.__PIXEL__!.world.elapsed, ready: window.__PIXEL__!.world.snapshot().mobility.readyIn }))).toEqual(frozen);
  27 |   await page.getByRole('button', { name: 'Продолжить' }).click();
  28 |   await page.evaluate(() => window.__PIXEL__!.world.gainXp(20)); await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toBeVisible();
  29 |   await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  30 |   await page.keyboard.press('Space'); expect(await page.evaluate(() => window.__PIXEL__!.world.mobility.sequence)).toBe(2);
  31 |   await page.getByRole('dialog', { name: 'Новый уровень' }).getByRole('button').first().focus(); await page.keyboard.press('1');
  32 |   await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toHaveCount(0);
  33 |   await page.evaluate(() => { const w = window.__PIXEL__!.world; w.elapsed = Math.max(w.elapsed, w.mobility.protectedUntil + .01); w.player.invulnerableUntil = 0; w.shield.clearAbsorb(); w.damagePlayer(1e6); });
  34 |   await page.keyboard.press('Space'); expect(await page.evaluate(() => window.__PIXEL__!.world.mobility.remaining)).toBe(0);
> 35 |   await page.getByRole('button', { name: 'Начать заново' }).click(); expect(await page.evaluate(() => window.__PIXEL__!.world.snapshot().mobility)).toMatchObject({ readyIn: 0, sequence: 0 });
     |                                                             ^ Error: locator.click: Test timeout of 30000ms exceeded.
  36 |   expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 }); expect(errors).toEqual([]);
  37 | });
  38 | for (const hero of ['Mage', 'Warrior']) test(`${hero} real multi-touch joystick plus mobility on mobile`, async ({ browser, baseURL }) => {
  39 |   const context = await browser.newContext({ baseURL, hasTouch: true, viewport: { width: 844, height: 390 } });
  40 |   try {
  41 |     const page = await context.newPage(); await quiet(page, hero); const name = hero === 'Mage' ? 'Blink' : 'Dash';
  42 |     const button = page.getByRole('button', { name: new RegExp('^' + name) }), pad = await page.getByLabel('Сенсорный джойстик').boundingBox(), box = await button.boundingBox();
  43 |     expect(pad).not.toBeNull(); expect(box).not.toBeNull();
  44 |     const cdp = await context.newCDPSession(page), stick = { x: pad!.x + pad!.width * .85, y: pad!.y + pad!.height * .5, id: 0 }, tap = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2, id: 1 };
  45 |     await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [stick] }); await page.waitForTimeout(120);
  46 |     await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [stick, tap] }); await page.waitForTimeout(50);
  47 |     await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [stick] });
  48 |     await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.mobility.sequence)).toBe(1);
  49 |     await page.evaluate(() => { const w = window.__PIXEL__!.world; w.step(.05); w.pause(); });
  50 |     const fxStyle = await page.addStyleTag({ content: '.overlay{display:none!important}' }); await page.waitForTimeout(80);
  51 |     await page.screenshot({ path: `${directory}/${hero}-mobility-fx-mobile.png` }); await fxStyle.evaluate(style => { style.parentNode?.removeChild(style); }); await page.evaluate(() => window.__PIXEL__!.world.resume());
  52 |     await page.waitForTimeout(250); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  53 |     const data = await page.evaluate(() => { const w = window.__PIXEL__!.world; return { distance: w.mobility.distance, width: w.width, direction: w.mobility.direction, x: w.player.x, cooldown: w.snapshot().mobility.readyIn }; });
  54 |     expect(data.direction).toEqual({ x: 1, y: 0 }); expect(data.distance).toBeLessThanOrEqual(data.width * .38); expect(data.x).toBeGreaterThan(data.distance); expect(data.cooldown).toBeGreaterThan(0);
  55 |     await expect(button).toBeDisabled(); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(844);
  56 |     await page.screenshot({ path: `${directory}/${hero}-touch-mobile.png` }); writeFileSync(`${directory}/${hero}-touch.json`, JSON.stringify(data, null, 2)); await cdp.detach();
  57 |   } finally { await context.close(); }
  58 | });
  59 |
```
