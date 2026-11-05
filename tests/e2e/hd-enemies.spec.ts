import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { HD_ENEMY_KINDS } from '../../src/game/art/enemyPack';
const directory = process.env.PIXEL_HD_PACK && process.env.PIXEL_HD_PACK !== '04' ? `screenshots/hd-rework/pack-${process.env.PIXEL_HD_PACK}/enemy-regression` : 'screenshots/hd-rework/pack-04';

test('new enemy atlas has hard alpha, transparent margins and distinct authored clips', async ({ page }) => {
  await page.goto('/?test=1'); await page.waitForFunction(() => !!window.__PIXEL__);
  const frames = await page.evaluate(async () => {
    const image = await createImageBitmap(await (await fetch('/assets/hd/enemies.png')).blob());
    const data: { frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }> } = await (await fetch('/assets/hd/enemies.json')).json();
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d', { willReadFrequently: true })!;
    return Object.entries(data.frames).map(([name, { frame: f }]) => {
      g.clearRect(0, 0, 64, 64); g.drawImage(image, f.x, f.y, 64, 64, 0, 0, 64, 64); const p = g.getImageData(0, 0, 64, 64).data;
      let pixels = 0, border = 0, soft = 0, hash = 2166136261;
      for (let i = 0; i < p.length; i++) { hash = Math.imul(hash ^ p[i], 16777619); if (i % 4 === 3 && p[i]) { pixels++; const n = (i - 3) / 4, x = n % 64, y = Math.floor(n / 64); if (!x || !y || x === 63 || y === 63) border++; if (p[i] !== 255) soft++; } }
      return { name, pixels, border, soft, hash: hash >>> 0 };
    });
  });
  for (const f of frames) { expect(f.pixels, f.name).toBeGreaterThan(100); expect(f.border, f.name).toBe(0); expect(f.soft, f.name).toBe(0); }
  for (const kind of HD_ENEMY_KINDS) for (const facing of ['left', 'right']) for (const pose of ['idle', 'walk', 'hurt', 'death', 'windup', 'attack', 'recover']) { const clip = frames.filter(f => f.name.startsWith(`${kind}-${facing}-${pose}-`)); expect(new Set(clip.map(f => f.hash)).size, `${kind}/${pose}`).toBe(clip.length); }
});

for (const kind of HD_ENEMY_KINDS) test(kind + ' live motion, hurt and six death phases preserve rewards and both-map readability', async ({ page }) => {
  mkdirSync(directory, { recursive: true }); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.elapsed = 1170; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; w.player.invulnerableUntil = 1e6; for (const a of Object.values(w.abilities)) a.level = 0; });
  const id = await page.evaluate(kind => window.__PIXEL__!.world.spawn(kind, { x: 85, y: 25 })!.id, kind);
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().actors.some(a => a.texture === 'hd-enemies' && String(a.frame).includes('-walk-')))).toBe(true);
  if (kind === 'caster') {
    await page.evaluate(id => { const w = window.__PIXEL__!.world; w.enemies.find(e => e.id === id)!.shootAt = w.elapsed; }, id);
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().actors.some(a => String(a.frame).includes('caster-') && String(a.frame).includes('-windup-'))), { intervals: [10] }).toBe(true);
    await page.locator('canvas').screenshot({ path: `${directory}/caster-windup.png` });
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.projectiles.some(p => p.hostile)), { intervals: [10] }).toBe(true);
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().actors.some(a => String(a.frame).includes('caster-') && String(a.frame).includes('-attack-'))), { intervals: [10] }).toBe(true);
    await page.locator('canvas').screenshot({ path: `${directory}/caster-attack.png` });
  }
  if (kind === 'rusher') {
    await page.evaluate(id => { const w = window.__PIXEL__!.world; w.enemies.find(e => e.id === id)!.rush!.until = w.elapsed; }, id);
    for (const phase of ['windup', 'attack', 'recover']) {
      await expect.poll(() => page.evaluate(phase => window.__PIXEL__!.art().actors.some(a => String(a.frame).startsWith('rusher-') && String(a.frame).includes(`-${phase}-`)), phase), { intervals: [10] }).toBe(true);
      await page.locator('canvas').screenshot({ path: `${directory}/rusher-${phase}.png` });
    }
  }
  await page.evaluate(id => { const w = window.__PIXEL__!.world; w.damageEnemy(w.enemies.find(e => e.id === id)!, 1); }, id);
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().actors.some(a => a.texture === 'hd-enemies' && String(a.frame).includes('-hurt-'))), { intervals: [10] }).toBe(true);
  await page.evaluate(() => window.__PIXEL__!.world.pause());
  await page.addStyleTag({ content: '.overlay{display:none!important}' });
  for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.locator('canvas').screenshot({ path: `${directory}/${kind}-hurt-${width}.png` }); }
  await page.evaluate(() => window.__PIXEL__!.world.resume());
  const rewards = await page.evaluate(id => { const w = window.__PIXEL__!.world, e = w.enemies.find(e => e.id === id)!; w.loot.rng.next = () => .999; const before = w.kills; w.damageEnemy(e, 999999); return { kills: w.kills - before, removed: !w.enemies.includes(e), xp: w.orbs.length }; }, id);
  expect(rewards).toEqual({ kills: 1, removed: true, xp: 1 });
  if (kind === 'splitter') expect(await page.evaluate(() => window.__PIXEL__!.world.enemies.filter(e => e.offspring).length)).toBe(2);
  const deaths = await page.evaluate(async () => { const frames: string[] = [], begin = performance.now(); await new Promise<void>(resolve => { const tick = () => { for (const c of window.__PIXEL__!.art().packed.corpses) frames.push(c.frame); if (performance.now() - begin < 560) requestAnimationFrame(tick); else resolve(); }; requestAnimationFrame(tick); }); return [...new Set(frames)]; });
  expect(deaths).toHaveLength(6);
  const second = await page.evaluate(kind => window.__PIXEL__!.world.spawn(kind, { x: -42, y: 25 })!.id, kind);
  await page.waitForTimeout(60); await page.evaluate(id => { const w = window.__PIXEL__!.world; w.damageEnemy(w.enemies.find(e => e.id === id)!, 999999); }, second);
  await page.waitForTimeout(180); await page.evaluate(() => window.__PIXEL__!.world.pause());
  for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.locator('canvas').screenshot({ path: `${directory}/${kind}-death-${width}.png` }); }
  for (const dark of [false, true]) {
    await page.goto('/?test=1'); if (dark) await page.getByRole('button', { name: 'Dark Forest', exact: true }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
    await page.evaluate(kind => { const w = window.__PIXEL__!.world; w.pause(); w.elapsed = 1170; w.spawn(kind, { x: -42, y: -20 }); w.spawn(kind, { x: 45, y: 30 }, true)!.modifier = 'shielded'; w.spawn('grunt', { x: -45, y: 48 }); w.spawn('runner', { x: 45, y: -45 }); }, kind);
    await page.addStyleTag({ content: '.overlay{display:none!important}' });
    for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.waitForTimeout(80); await page.locator('canvas').screenshot({ path: `${directory}/${kind}-${dark ? 'forest' : 'grove'}-${width}.png` }); }
  }
  writeFileSync(`${directory}/${kind}-evidence.json`, JSON.stringify({ rewards, deaths, errors }, null, 2)); expect(errors).toEqual([]);
});

test('mixed150 deaths reuse24 visual corpses and clear through ten scene restarts', async ({ page }) => {
  test.setTimeout(45000); mkdirSync(directory, { recursive: true }); const records = [];
  await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  for (let run = 0; run < 10; run++) {
    await page.evaluate(kinds => { const w = window.__PIXEL__!.world; w.pause(); w.elapsed = 1170; w.loot.rng.next = () => .9999; for (let i = 0; i < 150; i++) w.spawn(kinds[i % kinds.length], { x: i % 15 * 7 + 50, y: Math.floor(i / 15) * 7 - 30 }); }, [...HD_ENEMY_KINDS]);
    await page.waitForTimeout(80); await page.evaluate(() => { const w = window.__PIXEL__!.world; for (const e of [...w.enemies]) w.damageEnemy(e, 999999); });
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().packed.activeDeaths)).toBe(24);
    const art = await page.evaluate(() => { const { actors, ...a } = window.__PIXEL__!.art(); return { ...a, actors: actors.length }; }); records.push(art);
    expect(art.packed.allocatedDeaths).toBe(24); expect(art.packed.replaced).toBe(126); expect(art.packed.tracked).toBe(0);
    expect(await page.evaluate(() => ({ kills: window.__PIXEL__!.world.kills, xp: window.__PIXEL__!.world.orbs.length }))).toEqual({ kills: 150, xp: 150 });
    await page.evaluate(() => window.__PIXEL__!.restartScene()); await page.waitForFunction(() => window.__PIXEL__?.world.status === 'menu');
    expect(await page.evaluate(() => window.__PIXEL__!.art().packed.allocatedDeaths)).toBe(0);
    expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 }); await expect(page.locator('canvas')).toHaveCount(1);
    await page.getByRole('button', { name: 'Начать забег' }).click();
  }
  for (const r of records.slice(1)) { expect(r.objects).toBe(records[0].objects); expect(r.textureBytes).toBe(records[0].textureBytes); expect(r.clock).toEqual([0, 0, 0]); expect(r.tweens).toBe(0); }
  writeFileSync(`${directory}/mixed-death-restarts.json`, JSON.stringify(records, null, 2));
});
