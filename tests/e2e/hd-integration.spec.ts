import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const directory = 'screenshots/hd-pixel-art';
async function start(page: Page, hero = 'Warrior') {
  await page.goto('/?test=1&visual=1'); await page.getByRole('button', { name: new RegExp('^' + hero) }).click();
  await page.getByRole('button', { name: 'Dark Forest', exact: true }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.waitForFunction(() => window.__PIXEL__?.world.status === 'playing');
}
function captureErrors(page: Page) { const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); }); return errors; }

test('HD is the default; desktop/mobile show actors, Guardian, loot and radar without experiment UI', async ({ page }) => {
  mkdirSync(directory, { recursive: true }); const errors = captureErrors(page), requests: string[] = [];
  page.on('request', r => { if (r.url().includes('/assets/')) requests.push(new URL(r.url()).pathname); });
  for (const hero of ['Warrior', 'Mage']) for (const size of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size); await start(page, hero); await expect(page.getByLabel('Визуальный стиль')).toHaveCount(0);
    await page.evaluate(() => {
      const w = window.__PIXEL__!.world; w.elapsed = 1200.08; w.options.spawnRate = 0; w.bossScheduler.nextAt = 100000;
      for (const a of Object.values(w.abilities)) a.level = 0;
      w.spawn('grunt', { x: 38, y: -13 }, true)!.modifier = 'shielded'; w.spawn('grunt', { x: -38, y: 7 });
      w.spawn('grunt', { x: 70, y: 55 }); w.spawn('guardian', { x: -78, y: -55 });
      w.loot.drop(w, 'haste', w.player); w.loot.drop(w, 'fury', { x: 58, y: 67 }); w.loot.spawnChest(w, { x: -65, y: 65 }, 'boss');
      w.artifacts.drop(w, { x: 62, y: -65 }); w.dropXp({ x: -35, y: -60 }, 5);
      w.effect('cleave', w.player, 82, 0xf4d2a0, 1, { x: 82, y: 0 });
    });
    await expect(page.locator('[data-marker="guardian"]')).toHaveCount(1); await expect(page.locator('[data-buff="haste"]')).toBeVisible();
    await page.evaluate(() => window.__PIXEL__!.world.pause()); await page.addStyleTag({ content: '.overlay{display:none!important}' }); await page.waitForTimeout(150);
    const before = await page.evaluate(() => JSON.stringify(window.__PIXEL__!.world)); await page.waitForTimeout(150);
    expect(await page.evaluate(() => JSON.stringify(window.__PIXEL__!.world))).toBe(before);
    const art = await page.evaluate(() => window.__PIXEL__!.art());
    expect(art.atlasFrames).toBe(37); expect(art.runner.atlasFrames).toBe(36); expect(art.textures.filter(t => t.startsWith('hd-')).sort()).toEqual(['hd-core', 'hd-runner']);
    expect(art.textures.some(t => /visual-study|pixel-plus|painted|^warrior-|^grunt(?:$|-)/.test(t))).toBe(false);
    const player = art.actors.find(a => a.texture === (hero === 'Warrior' ? 'hd-core' : 'mage-down-0') && (hero !== 'Warrior' || String(a.frame).startsWith('warrior-')))!;
    expect(player.width).toBe(24); expect(player.height).toBe(30);
    expect(art.actors.find(a => String(a.frame).startsWith('grunt-elite'))!.width).toBeCloseTo(22.4);
    expect(art.actors.find(a => a.texture === 'guardian')!.width).toBeCloseTo(33.6);
    expect(art.actors.some(a => a.texture === 'loot-chest')).toBe(true); expect(art.actors.some(a => a.texture === 'artifact')).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(size.width);
    await page.screenshot({ path: `${directory}/${hero.toLowerCase()}-${size.width}x${size.height}.png` });
  }
  expect(new Set(requests)).toEqual(new Set(['/assets/hd/core.png', '/assets/hd/core.json', '/assets/hd/runner.png', '/assets/hd/runner.json'])); expect(errors).toEqual([]);
});

test('HD movement, hurt, real contact radius and automatic Cleave retain gameplay behavior', async ({ page }) => {
  const errors = captureErrors(page); await start(page);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; for (const a of Object.values(w.abilities)) a.level = 0; });
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().heroFrame)).toContain('-idle-');
  await page.keyboard.down('d'); await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().heroFrame)).toContain('-walk-'); await page.waitForTimeout(150); await page.keyboard.up('d');
  expect(await page.evaluate(() => window.__PIXEL__!.world.player.x)).toBeGreaterThan(10);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; const e = w.spawn('grunt', { x: w.player.x + 20, y: w.player.y })!; e.speed = 0; });
  await page.waitForTimeout(150); expect(await page.evaluate(() => window.__PIXEL__!.world.player.hp)).toBe(150);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.enemies[0].x = w.player.x + 18; });
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.player.hp)).toBeCloseTo(141.8);
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().heroFrame)).toContain('-hurt-');
  expect(await page.evaluate(() => window.__PIXEL__!.world.enemies[0].radius)).toBe(10);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.abilities.cleave.level = 1; });
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.snapshot().damageByAbility.find(a => a.id === 'cleave')!.damage)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__PIXEL__!.art().cleaves)).toBeGreaterThan(0); expect(errors).toEqual([]);
});

test('HD textures, shadows, timers and listeners stay bounded across travel and scene restart', async ({ page }) => {
  const errors = captureErrors(page), loads: string[] = [], records = []; mkdirSync(directory, { recursive: true });
  page.on('request', r => { if (r.url().includes('/assets/hd/')) loads.push(r.url()); }); await start(page);
  const initial = await page.evaluate(() => window.__PIXEL__!.art());
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.pause(); w.elapsed = 1200.08; for (let i = 0; i < 150; i++) w.spawn('grunt', { x: i % 15 * 27 - 189, y: Math.floor(i / 15) * 27 - 120 }); });
    for (const x of [0, 2000, -50000, 0]) {
      await page.evaluate(x => { const w = window.__PIXEL__!.world; w.player.x = x; w.player.y = -x; }, x); await page.waitForTimeout(150);
      const art = await page.evaluate(() => window.__PIXEL__!.art()); records.push({ iteration: i, x, ...art });
      expect(art.shadows).toBe(151); expect(art.chunks).toBeLessThanOrEqual(63); expect(art.atlasFrames).toBe(37);
      expect(art.textures.length - art.chunks).toBe(initial.textures.length - initial.chunks);
      expect(art.clock).toEqual([0, 0, 0]); expect(art.tweens).toBe(0); expect(art.blurListeners).toBe(initial.blurListeners);
    }
    await page.evaluate(() => window.__PIXEL__!.restartScene()); await page.waitForFunction(() => window.__PIXEL__?.world.status === 'menu');
    await expect(page.locator('canvas')).toHaveCount(1); expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 });
    expect(await page.evaluate(() => window.__PIXEL__!.art().shadows)).toBe(1);
    await page.getByRole('button', { name: 'Начать забег' }).click();
  }
  expect(loads).toHaveLength(4); expect(errors).toEqual([]); writeFileSync(`${directory}/resources.json`, JSON.stringify({ initial, records, loads, errors }, null, 2));
});
