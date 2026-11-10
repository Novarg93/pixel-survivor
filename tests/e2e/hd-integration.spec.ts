import { selectTestCharacter } from '../helpers/character';
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync,readFileSync } from 'node:fs';
const MAGE_IDLE=JSON.parse(readFileSync('src/game/art/mageIdleManifest.json','utf8')) as {displaySize:number};
const MAGE_HERO=JSON.parse(readFileSync('src/game/art/mageHeroManifest.json','utf8')) as {pages:{index:number}[]};
const EXPECTED_ART_REQUESTS=['/assets/hd/mage-shield-nova-pixellab-v1/atlas.png','/assets/hd/mage-shield-nova-pixellab-v1/atlas.json','/assets/hd/mage-blink-v1/atlas.png','/assets/hd/mage-blink-v1/atlas.json','/assets/hd/mage-moving-cast-v2/upper.png','/assets/hd/mage-moving-cast-v2/upper.json','/assets/hd/mage-cast-v2/atlas.png','/assets/hd/mage-cast-v2/atlas.json','/assets/hd/mage-run-v2/atlas.png','/assets/hd/mage-run-v2/atlas.json','/assets/hd/mage-idle-v2/atlas.png','/assets/hd/mage-idle-v2/atlas.json','/assets/hd/mage-phantom-v1/atlas.png','/assets/hd/mage-phantom-v1/atlas.json','/assets/hd/lightning-ultimate-v1/atlas.png','/assets/hd/lightning-ultimate-v1/atlas.json','/assets/hd/regular-lightning-v1/atlas.png','/assets/hd/regular-lightning-v1/atlas.json','/assets/hd/mage-meteor-pixellab-v1/atlas.png','/assets/hd/mage-meteor-pixellab-v1/atlas.json','/assets/hd/mage-fireball-pixellab-v1/atlas.png','/assets/hd/mage-fireball-pixellab-v1/atlas.json','/assets/hd/astral-flame-pixellab-v1/atlas.json','/assets/hd/astral-flame-pixellab-v1/atlas.png','/assets/hd/astral-projectile-pixellab-v1/atlas.json','/assets/hd/astral-projectile-pixellab-v1/atlas.png','/assets/hd/astral-revenant-v1/atlas.json','/assets/hd/astral-revenant-v1/atlas.png','/assets/hd/briar-beast-v1/atlas.json','/assets/hd/briar-beast-v1/atlas.png','/assets/hd/rune-warden-pixellab-v1/atlas.png','/assets/hd/rune-warden-pixellab-v1/atlas.json','/assets/hd/rune-warden-v1/atlas.json','/assets/hd/rune-warden-v1/atlas.png','/assets/hd/mage-frost-ultimate-runtime-v1/atlas.json','/assets/hd/mage-frost-ultimate-runtime-v1/atlas.png','/assets/hd/ash-warden-flame-strike-v1/atlas.json','/assets/hd/ash-warden-flame-strike-v1/atlas.png','/assets/hd/ash-warden-melee-combo-v1/atlas.json','/assets/hd/ash-warden-melee-combo-v1/atlas.png',...Array.from({length:4},(_,i)=>[`/assets/hd/ash-warden-v1/${i}.json`,`/assets/hd/ash-warden-v1/${i}.png`]).flat(), '/assets/hd/bosses.json', '/assets/hd/bosses.png', '/assets/hd/core.json', '/assets/hd/core.png', '/assets/hd/enemies.json', '/assets/hd/enemies.png', '/assets/hd/guardian.json', '/assets/hd/guardian.png', '/assets/hd/loot.json', '/assets/hd/loot.png', ...MAGE_HERO.pages.flatMap(p=>[`/assets/hd/mage-hero-v2/${p.index}.json`,`/assets/hd/mage-hero-v2/${p.index}.png`]), '/assets/hd/runner.json', '/assets/hd/runner.png'];
EXPECTED_ART_REQUESTS.push(
  '/assets/hd/ash-warden-pixellab-v1/north.png',
  '/assets/hd/ash-warden-pixellab-v1/north.json',
  '/assets/hd/ash-warden-pixellab-v1/meteor.png',
  '/assets/hd/ash-warden-pixellab-v1/meteor.json',
);
const directory = 'screenshots/hd-pixel-art';
async function start(page: Page, hero = 'Warrior') {
  await page.goto('/?test=1&visual=1'); await selectTestCharacter(page, hero);
  await page.getByRole('button', { name: 'Роща осколков', exact: true }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.waitForFunction(() => window.__PIXEL__?.world.status === 'playing');
}
function captureErrors(page: Page) { const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); }); return errors; }

test('HD is the default; desktop/mobile show actors, Guardian, loot and radar without experiment UI', async ({ page }) => {
  mkdirSync(directory, { recursive: true }); const errors = captureErrors(page), requests: string[] = [];
  page.on('request', r => { if (r.url().includes('/assets/hd/')) requests.push(new URL(r.url()).pathname); });
  for (const hero of ['Warrior', 'Mage']) for (const size of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size); await start(page, hero); await expect(page.getByLabel('Визуальный стиль')).toHaveCount(0);
    await page.evaluate(() => {
      const w = window.__PIXEL__!.world; w.elapsed = 1170.08; w.options.spawnRate = 0; w.encounterDirector.nextAt = 100000;
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
    expect(art.atlasFrames).toBe(37); expect(art.runner.atlasFrames).toBe(36); expect(art.textures.filter(t => t.startsWith('hd-')).sort()).toEqual(['hd-bosses', 'hd-core', 'hd-enemies', 'hd-guardian', 'hd-loot', 'hd-mage-abilities', 'hd-runner']);
    expect(art.textures.some(t => /visual-study|pixel-plus|painted|^warrior-|^grunt(?:$|-)/.test(t))).toBe(false);
    const player = art.actors.find(a => hero==='Warrior'?a.texture==='hd-core'&&String(a.frame).startsWith('warrior-'):a.texture==='mage-idle-v2'||a.texture==='mage-run-v2'||a.texture==='mage-cast-v2')!;
    expect(player.width).toBe(hero==='Warrior'?24:MAGE_IDLE.displaySize); expect(player.height).toBe(hero==='Warrior'?30:MAGE_IDLE.displaySize);
    expect(art.actors.find(a => String(a.frame).startsWith('grunt-elite'))!.width).toBeCloseTo(22.4);
    expect(art.actors.find(a => a.texture === 'hd-guardian')!.width).toBeCloseTo(67.2);
    expect(art.actors.some(a => a.texture === 'hd-loot' && String(a.frame).startsWith('chest-'))).toBe(true); expect(art.actors.some(a => a.texture === 'hd-loot' && String(a.frame).startsWith('artifact-'))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(size.width);
    await page.screenshot({ path: `${directory}/${hero.toLowerCase()}-${size.width}x${size.height}.png` });
  }
  expect(new Set(requests)).toEqual(new Set(EXPECTED_ART_REQUESTS)); expect(errors).toEqual([]);
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
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.pause(); w.elapsed = 1170.08; for (let i = 0; i < 150; i++) w.spawn('grunt', { x: i % 15 * 27 - 189, y: Math.floor(i / 15) * 27 - 120 }); });
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
  expect(loads).toHaveLength(EXPECTED_ART_REQUESTS.length); expect(new Set(loads.map(url=>new URL(url).pathname))).toEqual(new Set(EXPECTED_ART_REQUESTS)); expect(errors).toEqual([]); writeFileSync(`${directory}/resources.json`, JSON.stringify({ initial, records, loads, errors }, null, 2));
});
