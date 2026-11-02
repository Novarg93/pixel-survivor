import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { Metrics } from '../../src/game/events/bridge';

async function start(page: Page, hero = 'Mage', biome = 'Роща осколков') {
  await page.goto('/?test=1');
  await page.getByRole('button', { name: new RegExp('^' + hero) }).click();
  await page.getByRole('button', { name: biome, exact: true }).click();
  await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.player.invulnerableUntil = 100000; for (const a of Object.values(w.abilities)) a.level = 0; });
}
function errorsIn(page: Page) {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); return errors;
}

for (const hero of ['Mage', 'Warrior']) for (const dark of [false, true]) test(`loot contact, HUD and Canvas: ${hero} / ${dark ? 'forest' : 'grove'}`, async ({ page }) => {
  const errors = errorsIn(page); if (hero === 'Warrior' && dark) await page.setViewportSize({ width: 390, height: 844 });
  await start(page, hero, dark ? 'Dark Forest' : 'Роща осколков');
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.player.hp = 20; w.loot.drop(w, 'healing', { x: w.player.x + 40, y: w.player.y }); });
  await page.keyboard.down('d'); await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.loot.items.length)).toBe(0); await page.keyboard.up('d');
  expect(await page.evaluate(() => { const w = window.__PIXEL__!.world; return w.player.hp; })).toBe(hero === 'Mage' ? 50 : 65);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.loot.drop(w, 'haste', w.player); w.loot.drop(w, 'fury', w.player); });
  await expect(page.locator('[data-buff]')).toHaveCount(2); await expect(page.locator('[data-buff="fury"] img')).toBeVisible();
  await page.keyboard.down('d');
  const before = await page.evaluate(() => { const w = window.__PIXEL__!.world; return { x: w.player.x, elapsed: w.elapsed, speed: w.player.speed }; });
  await page.waitForTimeout(240);
  const after = await page.evaluate(() => { const w = window.__PIXEL__!.world; return { x: w.player.x, elapsed: w.elapsed }; });
  await page.keyboard.up('d');
  expect((after.x - before.x) / (after.elapsed - before.elapsed)).toBeCloseTo(before.speed * 1.5, 1);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; for (const [i, kind] of (['healing', 'haste', 'fury', 'magnet'] as const).entries()) w.loot.drop(w, kind, { x: w.player.x + (i - 1.5) * 30, y: w.player.y + 38 }); w.loot.spawnChest(w, { x: w.player.x + 55, y: w.player.y - 35 }, 'boss'); });
  await page.waitForTimeout(280); await page.screenshot({ path: `docs/screenshots/20-${hero}-${dark ? 'forest' : 'grove'}.png` });
  await page.locator('canvas').screenshot({ path: `docs/screenshots/20-canvas-${hero}-${dark ? 'forest' : 'grove'}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
  expect(await page.evaluate(() => [...document.querySelectorAll<HTMLImageElement>('[data-buff] img')].every(i => i.complete && i.naturalWidth > 0))).toBe(true);
  expect(errors).toEqual([]);
});

test('refresh, simultaneous buffs, pause, magnet upgrade pause and real-time expiry', async ({ page }) => {
  test.setTimeout(30000); const errors = errorsIn(page); await start(page);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.loot.drop(w, 'haste', w.player); w.loot.drop(w, 'fury', w.player); });
  await expect(page.locator('[data-buff]')).toHaveCount(2); await page.waitForTimeout(1100);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.loot.drop(w, 'haste', w.player); });
  await expect(page.locator('[data-buff="haste"] b')).toHaveText('10с');
  expect(await page.evaluate(() => { const w = window.__PIXEL__!.world; return w.effectiveSpeed / w.player.speed; })).toBe(1.5);
  await page.getByRole('button', { name: 'Пауза', exact: true }).click(); await expect(page.getByRole('dialog', { name: 'Пауза', exact: true })).toBeVisible();
  const paused = await page.evaluate(() => window.__PIXEL__!.world.snapshot().buffs); await page.waitForTimeout(650);
  expect(await page.evaluate(() => window.__PIXEL__!.world.snapshot().buffs)).toEqual(paused);
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.dropXp({ x: 400, y: 0 }, 20); w.loot.drop(w, 'magnet', w.player); });
  const modal = page.getByRole('dialog', { name: 'Новый уровень' }); await expect(modal).toBeVisible(); await expect(modal.getByRole('button')).toHaveCount(3);
  const upgrade = await page.evaluate(() => window.__PIXEL__!.world.snapshot().buffs); await page.waitForTimeout(650);
  expect(await page.evaluate(() => window.__PIXEL__!.world.snapshot().buffs)).toEqual(upgrade);
  expect(await page.evaluate(() => ({ xp: window.__PIXEL__!.world.experience.xp, level: window.__PIXEL__!.world.experience.level, orbs: window.__PIXEL__!.world.orbs.length, items: window.__PIXEL__!.world.loot.items.length }))).toEqual({ xp: 0, level: 2, orbs: 0, items: 0 });
  await modal.getByRole('button').first().click(); await expect(page.locator('[data-buff]')).toHaveCount(0, { timeout: 12000 });
  expect(await page.evaluate(() => { const w = window.__PIXEL__!.world; return w.effectiveSpeed / w.player.speed; })).toBe(1);
  expect(errors).toEqual([]);
});

test('death callback uses elite odds, caps six drops and the real scene removes expired sprites', async ({ page }) => {
  const errors = errorsIn(page); await start(page);
  const result = await page.evaluate(() => {
    const w = window.__PIXEL__!.world, next = w.loot.rng.next.bind(w.loot.rng); w.loot.rng.next = () => 0.119;
    w.damageEnemy(w.spawn('grunt', { x: 200, y: 0 })!, 99999); const regular = w.loot.items.length;
    const e = w.spawn('tank', { x: 200, y: 0 }, true)!; w.damageEnemy(e, 99999);
    const elite = w.loot.items.length, point = { x: e.x, y: e.y }, drop = { x: w.loot.items[0].x, y: w.loot.items[0].y };
    for (let i = 0; i < 12; i++) w.damageEnemy(w.spawn('grunt', { x: 200, y: 0 }, true)!, 99999);
    w.loot.rng.next = next; return { regular, elite, point, drop, cap: w.loot.items.length };
  });
  expect(result.regular).toBe(0); expect(result.elite).toBe(1); expect(result.drop).toEqual(result.point); expect(result.cap).toBe(6);
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.metrics().loot.items)).toBe(6);
  await page.evaluate(() => { window.__PIXEL__!.world.elapsed += 24.9; });
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.metrics().loot.items)).toBe(0);
  expect(await page.evaluate(() => window.__PIXEL__!.metrics().loot.allocatedItems)).toBe(6); expect(errors).toEqual([]);
});

test('boss chests replace timed map chests and open on approach and reset all loot on repeated death and scene teardown', async ({ page }) => {
  const errors = errorsIn(page); await start(page);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.elapsed = 180; w.encounterDirector.nextAt = 10000; w.damageEnemy(w.spawn('eclipse', { x: 60, y: 0 })!, 99999); });
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.loot.chests.length)).toBe(1);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.collectAllOrbs(); });
  while (await page.evaluate(() => window.__PIXEL__!.world.status === 'upgrade')) {
    const card = page.getByRole('dialog', { name: 'Новый уровень' }).getByRole('button').first();
    await expect(card).toHaveAttribute('aria-pressed', 'false');
    const offer = await page.evaluate(() => window.__PIXEL__!.world.offerId);
    await card.click();
    await page.waitForFunction(offer => { const w = window.__PIXEL__!.world; return w.status !== 'upgrade' || w.offerId !== offer; }, offer);
  }
  await expect(page.getByRole('dialog', { name: 'Новый уровень' })).toHaveCount(0);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; const c = w.loot.chests.find(c => c.source === 'boss')!; w.player.x = c.x - 32; w.player.y = c.y; });
  await page.keyboard.down('d'); await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.loot.chests.some(c => c.source === 'boss'))).toBe(false); await page.keyboard.up('d');
  await expect(page.locator('.loot-notice')).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.loot.grant(w, 'fury'); w.loot.grant(w, 'haste'); for (let j = 0; j < 6; j++) w.loot.drop(w, 'haste', { x: 100, y: 0 }); w.loot.spawnChest(w, { x: 150, y: 0 }, 'boss'); w.shield.charges = 0; w.player.invulnerableUntil = 0; w.damagePlayer(99999); });
    await expect(page.getByRole('dialog', { name: 'Игра окончена' })).toBeVisible();
    expect(await page.evaluate(() => { const w = window.__PIXEL__!.world; return [w.loot.items.length, w.loot.chests.length, w.snapshot().buffs.length]; })).toEqual([0, 0, 0]);
    await page.getByRole('button', { name: 'Начать заново' }).click(); await expect(page.locator('[data-buff]')).toHaveCount(0);
    expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 });
  }
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.loot.grant(w, 'haste'); w.loot.spawnChest(w, { x: 60, y: 0 }, 'boss'); window.__PIXEL__!.restartScene(); });
  await expect(page.getByRole('button', { name: 'Начать забег' })).toBeVisible(); expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 }); await expect(page.locator('canvas')).toHaveCount(1);
  expect(await page.evaluate(() => window.__PIXEL__!.metrics().loot.trail)).toBe(0); expect(errors).toEqual([]);
});

test('loot pools stay bounded at 150 mobs with both buffs and repeated allocations', async ({ page, browser }) => {
  test.setTimeout(30000); const errors = errorsIn(page); await start(page, 'Warrior', 'Dark Forest');
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.elapsed = 1200; w.encounterDirector.nextAt = 100000; w.experience.level = 30; w.encounterDirector.nextAt = 10000; for (let i = 0; i < 150; i++) w.spawn('tank'); });
  const samples: Metrics[] = [];
  await page.keyboard.down('d');
  for (let i = 0; i < 20; i++) {
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.loot.clear(); w.encounterDirector.nextAt = 100000; w.loot.grant(w, 'haste'); w.loot.grant(w, 'fury'); for (let j = 0; j < 12; j++) w.loot.drop(w, 'fury', { x: w.player.x + 80, y: w.player.y + 45 }); for (let j = 0; j < 8; j++) w.loot.spawnChest(w, { x: w.player.x - 60, y: w.player.y + 45 }, 'timed'); });
    await page.waitForTimeout(500); const m = await page.evaluate(() => window.__PIXEL__!.metrics()); samples.push(m);
    expect(m.enemies).toBeLessThanOrEqual(150); expect(m.loot.items).toBeLessThanOrEqual(6); expect(m.loot.chests).toBeLessThanOrEqual(4); expect(m.loot.buffs).toBe(2); expect(m.loot.trail).toBeLessThanOrEqual(12);
    expect(m.loot.allocatedItems).toBe(6); expect(m.loot.allocatedChests).toBe(4); expect(m.pooledSprites).toBeLessThanOrEqual(128); expect(m.sprites).toBeLessThanOrEqual(150 + 6 + 4);
  }
  await page.keyboard.up('d'); await page.screenshot({ path: 'docs/screenshots/20-loot-stress.png' });
  mkdirSync('docs/benchmarks', { recursive: true }); writeFileSync('docs/benchmarks/20-loot-browser.json', JSON.stringify({ measuredAt: new Date().toISOString(), browser: browser.version(), setup: '10 real seconds, Warrior/Dark Forest, initial 150 tanks, test invulnerability, six drops/four chests repeatedly pooled, both buffs and keyboard movement; combat abilities disabled to isolate loot costs.', samples, errors }, null, 2));
  expect(Math.max(...samples.map(m => m.enemies))).toBe(150); expect(Math.max(...samples.map(m => m.loot.trail))).toBeGreaterThan(0); expect(errors).toEqual([]);
});
