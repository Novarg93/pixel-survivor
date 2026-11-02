import { expect, test, type Page } from '@playwright/test';
import { cpus, totalmem } from 'node:os';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { Metrics } from '../../src/game/events/bridge';

function captureErrors(page: Page) { const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); }); return errors; }
async function start(page: Page, hero = 'Mage', dark = false) {
  await page.goto('/?test=1'); await page.getByRole('button', { name: new RegExp('^' + hero) }).click(); await page.getByRole('button', { name: dark ? 'Dark Forest' : 'Роща осколков', exact: true }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.player.invulnerableUntil = 1e6; for (const a of Object.values(w.abilities)) a.level = 0; w.encounterDirector.nextAt = 1e6; });
  await expect(page.getByRole('complementary', { name: 'Локальный радар' })).toBeVisible();
}

test('seeded guardian schedule, off-camera detection, stationary target and paused clocks', async ({ page }) => {
  const errors = captureErrors(page); await start(page);
  const nextAt = await page.evaluate(() => { const w=window.__PIXEL__!.world; w.encounterDirector.nextAt=240; return w.encounterDirector.nextAt; }); expect(nextAt).toBe(240);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.elapsed = w.encounterDirector.nextAt - 0.02; });
  await expect(page.locator('[data-marker="guardian"]')).toHaveCount(1); await expect(page.locator('.run-notice')).toContainText('Guardian Encounter');
  const before = await page.evaluate(() => { const w = window.__PIXEL__!.world, e = w.rareGuardian!; return { x: e.x, y: e.y, outside: Math.abs(e.x - w.player.x) > w.width / 2 + e.radius || Math.abs(e.y - w.player.y) > w.height / 2 + e.radius, next: w.encounterDirector.nextAt, time: w.elapsed }; });
  expect(before.outside).toBe(true); expect(before.next - before.time).toBeGreaterThan(59);
  const untouched = await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.enemies = w.enemies.filter(e => e.kind === 'guardian'); w.abilities.meteor.level = 1; return w.rareGuardian!.hp; });
  await page.waitForTimeout(1100); expect(await page.evaluate(() => window.__PIXEL__!.world.rareGuardian!.hp)).toBe(untouched); await page.evaluate(() => { window.__PIXEL__!.world.abilities.meteor.level = 0; });
  await page.screenshot({ path: 'docs/screenshots/21-guardian-radar-at-spawn.png' });
  await page.keyboard.down('d'); await page.waitForTimeout(250); await page.keyboard.up('d');
  await expect(page.locator('[data-player-marker]')).toHaveAttribute('transform', 'translate(90 90) rotate(90)');
  expect(await page.evaluate(() => { const e = window.__PIXEL__!.world.rareGuardian!; return { x: e.x, y: e.y }; })).toEqual({ x: before.x, y: before.y });
  await page.getByRole('button', { name: 'Пауза', exact: true }).click(); await expect(page.getByRole('dialog', { name: 'Пауза', exact: true })).toBeVisible(); await page.waitForTimeout(100);
  const paused = await page.evaluate(() => ({ elapsed: window.__PIXEL__!.world.elapsed, updates: window.__PIXEL__!.metrics().radar.updates, next: window.__PIXEL__!.world.encounterDirector.nextAt }));
  await page.waitForTimeout(600); expect(await page.evaluate(() => ({ elapsed: window.__PIXEL__!.world.elapsed, updates: window.__PIXEL__!.metrics().radar.updates, next: window.__PIXEL__!.world.encounterDirector.nextAt }))).toEqual(paused);
  await page.getByRole('button', { name: 'Продолжить' }).click(); await page.evaluate(() => window.__PIXEL__!.world.gainXp(20)); const modal = page.getByRole('dialog', { name: 'Новый уровень' }); await expect(modal).toBeVisible(); await page.waitForTimeout(100);
  const frozen = await page.evaluate(() => window.__PIXEL__!.metrics().radar.updates); await page.waitForTimeout(400); expect(await page.evaluate(() => window.__PIXEL__!.metrics().radar.updates)).toBe(frozen); await modal.getByRole('button').first().click();
  expect(await page.evaluate(() => window.__PIXEL__!.world.enemies.filter(e => e.kind === 'guardian').length)).toBe(1);
  await page.evaluate(() => { window.__PIXEL__!.world.player.x += 10000; }); await expect(page.locator('[data-marker="guardian"]')).toHaveCount(0); expect(await page.evaluate(() => window.__PIXEL__!.world.rareGuardian)).toBeUndefined(); expect(errors).toEqual([]);
});

test('automatic combat completes a Guardian wave, grants one artifact and keeps boss rewards separate', async ({ page }) => {
  const errors=captureErrors(page);await start(page);
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.options.spawnRate=0;w.experience.level=30;w.player.hp=40;w.artifacts.rng.next=()=>0;const e=w.spawn('guardian',{x:90,y:0})!;e.hp=1;w.abilities.fireball.level=1;});
  await expect(page.locator('[data-artifact="health"]')).toBeVisible();
  expect(await page.evaluate(()=>{const w=window.__PIXEL__!.world;return{max:w.effectiveMaxHp,base:w.player.maxHp,hp:w.player.hp,stacks:w.artifacts.count('health'),ground:w.artifacts.items.length,kills:w.snapshot().guardianKills,waves:w.guardianSystem.completedWaves};})).toEqual({max:110,base:100,hp:50,stacks:1,ground:0,kills:1,waves:1});
  await page.screenshot({path:'docs/screenshots/21-artifact-wave.png'});
  await page.evaluate(()=>{const w=window.__PIXEL__!.world;w.damageEnemy(w.spawn('eclipse',{x:w.player.x+200,y:0})!,999999);});
  expect(await page.evaluate(()=>window.__PIXEL__!.world.loot.chests.length)).toBe(1);expect(errors).toEqual([]);
});

for (const hero of ['Mage', 'Warrior']) for (const dark of [false, true]) test(`radar markers and artifact caps render in ${hero}/${dark ? 'forest' : 'grove'}`, async ({ page }) => {
  const errors = captureErrors(page); const mobile = hero === 'Warrior' && dark; if (mobile) await page.setViewportSize({ width: 390, height: 844 }); await start(page, hero, dark);
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world; w.encounterDirector.nextAt = 1e6;
    for (const id of ['health', 'damage', 'speed', 'cooldown', 'experience'] as const) w.artifacts.grant(w, id);
    w.artifacts.grant(w, 'damage'); w.artifacts.grant(w, 'damage'); if (w.artifacts.grant(w, 'damage')) throw new Error('artifact stack cap bypassed');
    w.loot.grant(w, 'haste'); w.loot.grant(w, 'fury'); w.spawn('guardian', { x: 70, y: -45 });
    w.spawn('grunt', { x: -100, y: 0 }); w.spawn('runner', { x: 120, y: 45 }, true); w.spawn('eclipse', { x: 265, y: -100 }); w.spawn('charger', { x: -300, y: 80 }); w.spawn('sorcerer', { x: 100, y: 235 });
    for (const [i, kind] of (['healing', 'haste', 'fury', 'magnet'] as const).entries()) w.loot.drop(w, kind, { x: (i - 1.5) * 30, y: 35 });
    w.artifacts.drop(w, { x: -60, y: -50 }); w.spawn('tank', { x: 100000, y: -100000 });
  });
  for (const kind of ['guardian', 'enemy', 'elite', 'eclipse', 'charger', 'sorcerer', 'healing', 'haste', 'fury', 'magnet', 'artifact']) await expect(page.locator(`[data-marker="${kind}"]`)).toHaveCount(1);
  await expect(page.locator('[data-artifact]')).toHaveCount(5); await expect(page.locator('[data-buff]')).toHaveCount(2); await expect(page.locator('[data-artifact="damage"]')).toContainText('+24%');
  expect(await page.evaluate(() => window.__PIXEL__!.world.stats.damage)).toBe(1); expect(await page.locator('.radar').evaluate(el => el.getBoundingClientRect().width)).toBe(mobile ? 112 : 180);
  if (mobile) expect(await page.evaluate(() => { const r = document.querySelector('.radar')!.getBoundingClientRect(), b = document.querySelector('.boss-bars')!.getBoundingClientRect(); return r.left >= b.right && r.top > document.querySelector('.hud')!.getBoundingClientRect().bottom; })).toBe(true);
  await page.screenshot({ path: `docs/screenshots/21-${hero}-${dark ? 'forest' : 'grove'}.png` }); await page.locator('canvas').screenshot({ path: `docs/screenshots/21-canvas-${hero}-${dark ? 'forest' : 'grove'}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width); expect(errors).toEqual([]);
});

test('five restarts and scene recreation clear artifacts, radar data and subscriptions', async ({ page }) => {
  const errors = captureErrors(page); await start(page);
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.artifacts.grant(w, 'damage'); w.artifacts.drop(w, { x: 200, y: 0 }); w.spawn('guardian'); w.player.invulnerableUntil = 0; w.shield.charges = 0; w.damagePlayer(999999); });
    await expect(page.getByRole('dialog', { name: 'Игра окончена' })).toBeVisible(); await expect(page.locator('.radar')).toHaveCount(0); await expect(page.locator('[data-artifact]')).toHaveCount(0);
    expect(await page.evaluate(() => { const w = window.__PIXEL__!.world; return { guardian: !!w.rareGuardian, items: w.artifacts.items.length, bonus: w.effectiveDamage }; })).toEqual({ guardian: false, items: 0, bonus: 1 });
    await page.getByRole('button', { name: 'Начать заново' }).click(); await expect(page.locator('.radar')).toBeVisible(); expect(await page.evaluate(() => window.__PIXEL__!.metrics().radar.listeners)).toBe(1); await expect(page.locator('canvas')).toHaveCount(1);
  }
  await page.evaluate(() => window.__PIXEL__!.restartScene()); await expect(page.getByRole('button', { name: 'Начать забег' })).toBeVisible(); await expect(page.locator('.radar')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.metrics().radar.listeners)).toBe(0);
  await page.getByRole('button', { name: 'Начать забег' }).click(); await expect(page.locator('.radar')).toBeVisible(); await expect.poll(() => page.evaluate(() => window.__PIXEL__!.metrics().radar.listeners)).toBe(1);
  expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 }); expect(errors).toEqual([]);
});

test('radar stays bounded at maximum mobs plus guardian/bosses/loot and maintains its 5Hz budget', async ({ page, browser }) => {
  test.setTimeout(45000); const errors = captureErrors(page); await start(page);
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world; w.elapsed = 1200; w.experience.level = 30;
    for (const a of w.abilityDefinitions) { w.abilities[a.id].level = 3; w.upgrades['evolve-' + a.id] = 1; } w.stats.damage = 1.75; w.stats.projectiles = 3;
    for (let i = 0; i < 150; i++) w.spawn((['grunt', 'runner', 'tank', 'caster', 'rusher', 'splitter'] as const)[i % 6], undefined, i % 5 === 0);
    w.guardianSystem.spawnWave(w,3,20); w.spawn('eclipse', { x: 0, y: -220 }); w.spawn('charger', { x: -220, y: 0 }); w.spawn('sorcerer', { x: 200, y: 170 });
    for (let i = 0; i < 6; i++) w.loot.drop(w, 'fury', { x: 180, y: 100 }); for (let i = 0; i < 4; i++) w.loot.spawnChest(w, { x: -160, y: 100 }, 'boss'); for (let i = 0; i < 3; i++) w.artifacts.drop(w, { x: -100, y: -100 });
  });
  const samples: Metrics[] = [], started = await page.evaluate(() => ({ updates: window.__PIXEL__!.metrics().radar.updates, elapsed: window.__PIXEL__!.world.elapsed }));
  for (let i = 0; i < 30; i++) {
    const key = ['d', 's', 'a', 'w'][Math.floor(i / 7) % 4]; await page.keyboard.down(key); await page.waitForTimeout(500); await page.keyboard.up(key);
    const modal = page.getByRole('dialog', { name: 'Новый уровень' }); if (await modal.isVisible()) await modal.getByRole('button').first().click();
    await page.evaluate(() => { const w = window.__PIXEL__!.world; for(let attempt=0;w.regularCount<150&&attempt<150;attempt++)if(!w.spawn('tank'))throw new Error('Cannot refill the150-mob performance fixture'); });
    const m = await page.evaluate(() => window.__PIXEL__!.metrics()); samples.push(m);
    expect(m.enemies).toBeLessThanOrEqual(150); expect(m.guardians).toBeLessThanOrEqual(3); expect(m.bosses).toBeLessThanOrEqual(3); expect(m.radar.markers).toBeLessThanOrEqual(169); expect(m.radar.listeners).toBe(1);
    expect(m.artifacts.items).toBeLessThanOrEqual(3); expect(m.artifacts.allocated).toBeLessThanOrEqual(3); expect(m.loot.items).toBeLessThanOrEqual(6); expect(m.loot.chests).toBeLessThanOrEqual(4); expect(m.pooledSprites).toBeLessThanOrEqual(128);
  }
  const end = await page.evaluate(() => ({ updates: window.__PIXEL__!.metrics().radar.updates, elapsed: window.__PIXEL__!.world.elapsed })); expect((end.updates - started.updates) / (end.elapsed - started.elapsed)).toBeLessThan(5.5);
  expect(end.elapsed - started.elapsed).toBeGreaterThan(13); expect(Math.max(...samples.map(m => m.enemies))).toBe(150);
  await page.screenshot({ path: 'docs/screenshots/21-radar-stress.png' }); mkdirSync('docs/benchmarks', { recursive: true });
  writeFileSync('docs/benchmarks/21-radar-browser.json', JSON.stringify({ measuredAt: new Date().toISOString(), browser: browser.version(), viewport: page.viewportSize(), hardware: { cpu: cpus()[0]?.model, ramGiB: +(totalmem() / 1024 ** 3).toFixed(1) }, setup: '15 real seconds, repeated refill to150 mobs, initial3 bosses/3 guardians/6 consumables/4 boss chests/3 artifacts, Mage rankIII evolutions, test-only invulnerability and keyboard pilot.', started, end, samples, errors }, null, 2)); expect(errors).toEqual([]);
});
