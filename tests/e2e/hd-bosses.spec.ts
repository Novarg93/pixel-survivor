import { selectTestCharacter } from '../helpers/character';
import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { HD_BOSS_KINDS } from '../../src/game/art/bossPack';
const pack = process.env.PIXEL_HD_PACK ?? '06';
const directory = `screenshots/hd-rework/pack-${pack}${pack === '06' ? '' : '/boss-regression'}`;

test('boss atlas contains distinct hard-alpha poses with transparent frame margins', async ({ page }) => {
  await page.goto('/?test=1'); await page.waitForFunction(() => !!window.__PIXEL__);
  const frames = await page.evaluate(async () => {
    const image = await createImageBitmap(await (await fetch('/assets/hd/bosses.png')).blob());
    const atlas: { frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }> } = await (await fetch('/assets/hd/bosses.json')).json();
    const c = document.createElement('canvas'), g = c.getContext('2d', { willReadFrequently: true })!;
    return Object.entries(atlas.frames).map(([name, { frame: f }]) => {
      c.width = f.w; c.height = f.h; g.drawImage(image, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h); const p = g.getImageData(0, 0, f.w, f.h).data;
      let pixels = 0, border = 0, soft = 0, hash = 2166136261;
      for (let i = 0; i < p.length; i++) { hash = Math.imul(hash ^ p[i], 16777619); if (i % 4 === 3 && p[i]) { pixels++; const n = (i - 3) / 4, x = n % f.w, y = Math.floor(n / f.w); if (!x || !y || x === f.w - 1 || y === f.h - 1) border++; if (p[i] !== 255) soft++; } }
      return { name, pixels, border, soft, hash: hash >>> 0 };
    });
  });
  for (const f of frames) { expect(f.border, f.name).toBe(0); expect(f.soft, f.name).toBe(0); expect(f.pixels, f.name).toBeGreaterThan(f.name.startsWith('hostile') ? 100 : 500); }
  const groups = new Map<string, number[]>(); for (const f of frames.filter(f => !f.name.startsWith('hostile'))) { const group = f.name.replace(/-\d+$/, ''); const hashes = groups.get(group) ?? []; hashes.push(f.hash); groups.set(group, hashes); }
  for (const [group, hashes] of groups) expect(new Set(hashes).size, group).toBe(hashes.length);
});

for (const kind of HD_BOSS_KINDS) test(kind + ' real phases, hurt/death and owner cleanup on both maps and viewports', async ({ page }) => {
  test.setTimeout(45000); mkdirSync(directory, { recursive: true }); const evidence = [];
  for (const dark of [false, true]) {
    await page.goto('/?test=1'); if (dark) await page.getByRole('button', { name: 'Роща осколков', exact: true }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
    await page.evaluate(kind => { const w = window.__PIXEL__!.world; w.elapsed = 1170; w.experience.level = 30; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; w.player.invulnerableUntil = 1e6; for (const a of Object.values(w.abilities)) a.level = 0; w.spawn(kind, { x: 260, y: -30 })!.boss!.until = w.elapsed + 10; }, kind);
    await page.addStyleTag({ content: '.overlay{display:none!important}' });
    const walks = await page.evaluate(async () => { const frames: string[] = [], start = performance.now(); await new Promise<void>(resolve => { const tick = () => { for (const a of window.__PIXEL__!.art().actors) if ((a.texture === 'hd-bosses'||a.texture==='rune-warden-v1'||a.texture==='briar-beast-v1'||a.texture==='astral-revenant-v1') && String(a.frame).includes('-walk-')) frames.push(String(a.frame)); if (performance.now() - start < 700) requestAnimationFrame(tick); else resolve(); }; requestAnimationFrame(tick); }); return [...new Set(frames)]; });
    expect(walks.length).toBeGreaterThanOrEqual(4);
    await page.evaluate(() => { const w = window.__PIXEL__!.world, e = w.bosses[0]; e.x = 75; e.y = -30; e.boss!.until = w.elapsed; });
    for (const pose of ['windup', 'attack', 'recover']) {
      await expect.poll(() => page.evaluate(({ kind, pose }) => window.__PIXEL__!.art().actors.some(a => String(a.frame).startsWith(kind + '-') && (kind==='charger'?window.__PIXEL__!.world.bosses[0]!.boss!.phase===(pose==='attack'?'charge':pose)&&String(a.frame).includes('-charge-'):String(a.frame).includes(pose==='windup'?'-cast-':pose==='attack'?(kind==='sorcerer'?'-cast-11':'-cast-15'):'-walk-0'))), { kind, pose }), { intervals: [10] }).toBe(true);
      await page.evaluate(() => { const w = window.__PIXEL__!.world; w.pause(); const e = w.bosses[0]; w.player.x = e.x - 40; w.player.y = e.y; });
      for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.waitForTimeout(50); await page.locator('canvas').screenshot({ path: `${directory}/${kind}-${dark ? 'forest' : 'grove'}-${pose}-${width}.png` }); }
      await page.evaluate(() => window.__PIXEL__!.world.resume());
    }
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.damageEnemy(w.bosses[0], 1); });
    await expect.poll(() => page.evaluate(kind => window.__PIXEL__!.art().actors.some(a => a.texture===(kind==='sorcerer'?'rune-warden-v1':kind==='charger'?'briar-beast-v1':'astral-revenant-v1')&&a.tint!==0xffffff),kind), { intervals: [10] }).toBe(true);
    await page.locator('canvas').screenshot({ path: `${directory}/${kind}-${dark ? 'forest' : 'grove'}-hurt.png` });
    const reward = await page.evaluate(() => { const w = window.__PIXEL__!.world, e = w.bosses[0], id = e.id; w.shoot({ x: e.x, y: e.y, vx: 1, vy: 0, damage: 1, hostile: true, ownerId: id }); w.damageEnemy(e, 999999); return { chests: w.loot.chests.length, score: w.score, owned: w.projectiles.filter(p => p.ownerId === id).length + w.impacts.filter(i => i.ownerId === id).length }; });
    expect(reward.chests).toBe(1); expect(reward.score).toBeGreaterThanOrEqual(1000); expect(reward.owned).toBe(0);
    const frames = await page.evaluate(async () => { const frames: string[] = [], start = performance.now(); await new Promise<void>(resolve => { const tick = () => { for (const c of window.__PIXEL__!.art().bosses.corpses) frames.push(c.frame); if (performance.now() - start < 670) requestAnimationFrame(tick); else resolve(); }; requestAnimationFrame(tick); }); return [...new Set(frames)]; });
    if(kind==='sorcerer'){expect(frames).toHaveLength(1);expect(frames[0]).toMatch(/^sorcerer-1-(left|right)-walk-0$/);}else if(kind==='charger'){expect(frames).toHaveLength(1);expect(frames[0]).toMatch(/^charger-1-(left|right)-idle-0$/);}else{expect(frames).toHaveLength(1);expect(frames[0]).toMatch(/^eclipse-1-(left|right)-walk-0$/);} evidence.push({ dark, walks, reward, frames });
    await page.evaluate(kind => { const w = window.__PIXEL__!.world; w.spawn(kind, { x: w.player.x + 40, y: w.player.y + 20 }); }, kind); await page.waitForTimeout(60);
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.damageEnemy(w.bosses[0], 999999); }); await page.waitForTimeout(240); await page.evaluate(() => window.__PIXEL__!.world.pause());
    for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.locator('canvas').screenshot({ path: `${directory}/${kind}-${dark ? 'forest' : 'grove'}-death-${width}.png` }); }
    await page.evaluate(() => window.__PIXEL__!.restartScene()); await page.waitForFunction(() => window.__PIXEL__?.world.status === 'menu');
    expect(await page.evaluate(() => window.__PIXEL__!.art().bosses.allocatedDeaths)).toBe(0);
  }
  writeFileSync(`${directory}/${kind}-evidence.json`, JSON.stringify(evidence, null, 2));
});

test('Eclipse stage2 unfolds before four real warnings and a second volley', async ({ page }) => {
  mkdirSync(directory, { recursive: true });
  for (const dark of [false, true]) {
    await page.goto('/?test=1'); if (dark) await page.getByRole('button', { name: 'Роща осколков', exact: true }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.elapsed = 1170; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; w.player.invulnerableUntil = 1e6; for (const a of Object.values(w.abilities)) a.level = 0; const e = w.spawn('eclipse', { x: 60, y: -25 })!; w.damageEnemy(e, e.maxHp * .51); e.boss!.until = w.elapsed; });
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().actors.some(a => window.__PIXEL__!.world.bosses[0]!.boss!.stage===2&&a.texture==='astral-revenant-v1'&&String(a.frame).startsWith('eclipse-1-')&&String(a.frame).includes('-cast-'))), { intervals: [10] }).toBe(true);
    await page.evaluate(() => window.__PIXEL__!.world.pause());
    expect(await page.evaluate(() => window.__PIXEL__!.world.zones.filter(z => z.necrotic).length)).toBe(4);
    await page.addStyleTag({ content: '.overlay{display:none!important}' });
    for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.locator('canvas').screenshot({ path: `${directory}/eclipse-stage2-${dark ? 'forest' : 'grove'}-windup-${width}.png` }); }
    await page.evaluate(() => window.__PIXEL__!.world.resume());
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.bosses[0].shootingAt > 0), { intervals: [10] }).toBe(true);
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.bosses[0].shootingAt), { intervals: [10] }).toBe(0);
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().actors.some(a => window.__PIXEL__!.world.bosses[0]!.boss!.stage===2&&a.texture==='astral-revenant-v1'&&String(a.frame).endsWith('-cast-15'))), { intervals: [10] }).toBe(true);
    await page.evaluate(() => window.__PIXEL__!.world.pause());
    for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.locator('canvas').screenshot({ path: `${directory}/eclipse-stage2-${dark ? 'forest' : 'grove'}-volley-${width}.png` }); }
    const cleanup = await page.evaluate(() => { const w = window.__PIXEL__!.world, id = w.bosses[0].id; w.resume(); w.damageEnemy(w.bosses[0], 999999); return w.projectiles.filter(p => p.ownerId === id).length + w.impacts.filter(i => i.ownerId === id).length; }); expect(cleanup).toBe(0);
  }
});

test('three boss deaths preserve immediate chests and bounded resources through ten scene restarts', async ({ page }) => {
  test.setTimeout(45000); mkdirSync(directory, { recursive: true }); const records = [];
  await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  for (let run = 0; run < 10; run++) {
    await page.evaluate(kinds => { const w = window.__PIXEL__!.world; w.pause(); w.elapsed = 1170; w.experience.level = 30; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; w.player.invulnerableUntil = 1e6; for (const a of Object.values(w.abilities)) a.level = 0; for (let i = 0; i < 150; i++) w.spawn('tank', { x: 220 + i % 15 * 8, y: Math.floor(i / 15) * 8 }); w.spawn('guardian', { x: -70, y: -60 }); for (const [i, kind] of kinds.entries()) w.spawn(kind, { x: (i - 1) * 65, y: 50 }); }, [...HD_BOSS_KINDS]);
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().bosses.tracked)).toBe(3);
    expect(await page.evaluate(() => window.__PIXEL__!.world.regularCount)).toBe(150);
    const rewards = await page.evaluate(() => { const w = window.__PIXEL__!.world; w.resume(); for (const e of [...w.bosses]) { w.shoot({ x: e.x, y: e.y, vx: 1, vy: 0, damage: 1, hostile: true, ownerId: e.id }); w.damageEnemy(e, 999999); } w.pause(); return { bosses: w.bosses.length, chests: w.loot.chests.length, score: w.score, owned: w.projectiles.filter(p => p.ownerId !== undefined).length }; });
    expect(rewards).toMatchObject({ bosses: 0, chests: 3, owned: 0 }); expect(rewards.score).toBeGreaterThanOrEqual(3000);
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().bosses.activeDeaths)).toBe(3);
    const art = await page.evaluate(() => { const { actors, ...a } = window.__PIXEL__!.art(); return { ...a, actors: actors.length }; }); records.push(art); expect(art.bosses.allocatedDeaths).toBe(3); expect(art.bosses.tracked).toBe(0);
    await page.evaluate(() => window.__PIXEL__!.restartScene()); await page.waitForFunction(() => window.__PIXEL__?.world.status === 'menu'); expect(await page.evaluate(() => window.__PIXEL__!.art().bosses.allocatedDeaths)).toBe(0); expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 }); await expect(page.locator('canvas')).toHaveCount(1); await page.getByRole('button', { name: 'Начать забег' }).click();
  }
  for (const r of records.slice(1)) { expect(r.objects).toBe(records[0].objects); expect(r.textures).toEqual(records[0].textures); expect(r.textureBytes).toBe(records[0].textureBytes); expect(r.clock).toEqual([0, 0, 0]); expect(r.tweens).toBe(0); expect(r.blurListeners).toBe(records[0].blurListeners); }
  writeFileSync(`${directory}/boss-death-restarts.json`, JSON.stringify(records, null, 2));
});

test('both classes fight three bosses beside150 mobs on both maps', async ({ page }) => {
  test.setTimeout(45000); mkdirSync(directory, { recursive: true }); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  for (const hero of ['Mage', 'Warrior']) for (const dark of [false, true]) {
    await page.goto('/?test=1'); await selectTestCharacter(page, hero); if (dark) await page.getByRole('button', { name: 'Роща осколков', exact: true }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
    const initial = await page.evaluate(() => { const w = window.__PIXEL__!.world; w.elapsed = 1170; w.experience.level = 30; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; w.player.invulnerableUntil = 1e6; for (const a of Object.values(w.abilities)) a.level = 5; for (let i = 0; i < 150; i++) w.spawn((['grunt', 'runner', 'tank', 'caster', 'rusher', 'splitter'] as const)[i % 6], { x: (i % 15 - 7) * 30, y: (Math.floor(i / 15) - 4.5) * 30 }, i % 13 === 0); w.spawn('charger', { x: -65, y: 60 }); w.spawn('sorcerer', { x: 65, y: -35 }); w.spawn('eclipse', { x: -65, y: -65 }); return { regular: w.regularCount, bosses: w.bosses.length }; }); expect(initial).toEqual({ regular: 150, bosses: 3 });
    await page.waitForTimeout(1450); await page.evaluate(() => window.__PIXEL__!.world.pause()); await page.addStyleTag({ content: '.overlay{display:none!important}' });
    const layers = await page.evaluate(() => window.__PIXEL__!.art().layers); expect(layers.find(l => l.name === 'hostile-tells')!.depth).toBeGreaterThan(layers.find(l => l.name === 'friendly-feedback')!.depth);
    for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.waitForTimeout(60); await page.screenshot({ path: `${directory}/mixed-${hero}-${dark ? 'forest' : 'grove'}-${width}.png` }); }
  }
  expect(errors).toEqual([]);
});
