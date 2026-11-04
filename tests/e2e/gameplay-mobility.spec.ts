import { selectTestCharacter } from '../helpers/character';
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const directory = 'screenshots/gameplay';
async function quiet(page: Page, hero: string) {
  await page.goto('/?test=1'); await selectTestCharacter(page, hero); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; for (const a of Object.values(w.abilities)) a.level = 0; });
}
for (const hero of ['Mage', 'Warrior']) test(`${hero} Space is a single edge, respects input/cooldown/pause/upgrade and cleans on restart`, async ({ page }) => {
  mkdirSync(directory, { recursive: true }); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); await quiet(page, hero);
  await page.keyboard.down('d'); await page.keyboard.down('Space');
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.mobility.sequence)).toBe(1);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.step(.05); w.pause(); });
  const fxStyle = await page.addStyleTag({ content: '.overlay{display:none!important}' }); await page.waitForTimeout(80);
  await page.screenshot({ path: `${directory}/${hero}-mobility-fx-desktop.png` }); await fxStyle.evaluate(style => { style.parentNode?.removeChild(style); }); await page.evaluate(() => window.__PIXEL__!.world.resume());
  await page.waitForTimeout(250); await page.keyboard.up('d');
  expect(await page.evaluate(() => window.__PIXEL__!.world.mobility.direction)).toEqual({ x: 1, y: 0 });
  expect(await page.evaluate(() => window.__PIXEL__!.world.player.x)).toBeGreaterThan(80);
  await page.screenshot({ path: `${directory}/${hero}-cooldown-desktop.png` });
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.elapsed = w.mobility.readyAt + .01; });
  await page.keyboard.down('Space'); await page.waitForTimeout(100); expect(await page.evaluate(() => window.__PIXEL__!.world.mobility.sequence)).toBe(1);
  await page.keyboard.up('Space'); await page.keyboard.press('Space'); await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.mobility.sequence)).toBe(2);
  await page.getByRole('button', { name: 'Пауза', exact: true }).click();
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  const frozen = await page.evaluate(() => ({ time: window.__PIXEL__!.world.elapsed, ready: window.__PIXEL__!.world.snapshot().mobility.readyIn }));
  await page.keyboard.press('Space'); await page.waitForTimeout(100); expect(await page.evaluate(() => ({ time: window.__PIXEL__!.world.elapsed, ready: window.__PIXEL__!.world.snapshot().mobility.readyIn }))).toEqual(frozen);
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await page.evaluate(() => window.__PIXEL__!.world.gainXp(20)); await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toBeVisible();
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  await page.keyboard.press('Space'); expect(await page.evaluate(() => window.__PIXEL__!.world.mobility.sequence)).toBe(2);
  await page.getByRole('dialog', { name: 'Новый уровень' }).getByRole('button').first().focus(); await page.keyboard.press('1');
  await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toHaveCount(0);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.elapsed = Math.max(w.elapsed, w.mobility.protectedUntil + .01); w.player.invulnerableUntil = 0; w.shield.clearAbsorb(); w.damagePlayer(1e6); });
  await page.keyboard.press('Space'); expect(await page.evaluate(() => window.__PIXEL__!.world.mobility.remaining)).toBe(0);
  await page.getByRole('button', { name: 'Начать заново' }).click(); expect(await page.evaluate(() => window.__PIXEL__!.world.snapshot().mobility)).toMatchObject({ readyIn: 0, sequence: 0 });
  expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 }); expect(errors).toEqual([]);
});
for (const hero of ['Mage', 'Warrior']) test(`${hero} real multi-touch joystick plus mobility on mobile`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, hasTouch: true, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage(); await quiet(page, hero); const name = hero === 'Mage' ? 'Blink' : 'Dash';
    const button = page.getByRole('button', { name: new RegExp('^' + name) }), pad = await page.getByLabel('Сенсорный джойстик').boundingBox(), box = await button.boundingBox();
    expect(pad).not.toBeNull(); expect(box).not.toBeNull();
    const cdp = await context.newCDPSession(page), stick = { x: pad!.x + pad!.width * .85, y: pad!.y + pad!.height * .5, id: 0 }, tap = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2, id: 1 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [stick] }); await page.waitForTimeout(120);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [stick, tap] }); await page.waitForTimeout(50);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [stick] });
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.mobility.sequence)).toBe(1);
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.step(.05); w.pause(); });
    const fxStyle = await page.addStyleTag({ content: '.overlay{display:none!important}' }); await page.waitForTimeout(80);
    await page.screenshot({ path: `${directory}/${hero}-mobility-fx-mobile.png` }); await fxStyle.evaluate(style => { style.parentNode?.removeChild(style); }); await page.evaluate(() => window.__PIXEL__!.world.resume());
    await page.waitForTimeout(250); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const data = await page.evaluate(() => { const w = window.__PIXEL__!.world; return { distance: w.mobility.distance, width: w.width, direction: w.mobility.direction, x: w.player.x, cooldown: w.snapshot().mobility.readyIn }; });
    expect(data.direction).toEqual({ x: 1, y: 0 }); expect(data.distance).toBeLessThanOrEqual(data.width * .38); expect(data.x).toBeGreaterThan(data.distance); expect(data.cooldown).toBeGreaterThan(0);
    await expect(button).toBeDisabled(); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.screenshot({ path: `${directory}/${hero}-touch-mobile.png` }); writeFileSync(`${directory}/${hero}-touch.json`, JSON.stringify(data, null, 2)); await cdp.detach();
  } finally { await context.close(); }
});
