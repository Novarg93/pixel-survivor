import { expect, test } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const icons: Record<string, string> = JSON.parse(readFileSync('src/game/art/generatedLootIcons.json', 'utf8'));
const pack = process.env.PIXEL_HD_PACK ?? '07', phase = process.env.PIXEL_HD_PHASE ?? 'after';
const directory = `screenshots/hd-rework/pack-${pack}${pack === '07' ? '' : '/loot-regression'}`;
test('loot and five artifact ground/HUD matrix on both maps and viewports', async ({ page }) => {
  mkdirSync(directory, { recursive: true });
  for (const dark of [false, true]) for (const group of [0, 1]) {
    await page.goto('/?test=1'); if (dark) await page.getByRole('button', { name: 'Dark Forest', exact: true }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
    await page.evaluate(group => {
      const w = window.__PIXEL__!.world; w.elapsed = 1200; w.experience.level = 30; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; for (const a of Object.values(w.abilities)) a.level = 0;
      for (const id of ['health', 'damage', 'speed', 'cooldown', 'experience'] as const) w.artifacts.grant(w, id);
      w.loot.grant(w, 'haste'); w.loot.grant(w, 'fury');
      for (const [i, kind] of (['healing', 'haste', 'fury', 'magnet'] as const).entries()) w.loot.drop(w, kind, { x: (i - 1.5) * 34, y: 35 });
      w.loot.spawnChest(w, { x: 45, y: -45 }, 'boss'); w.dropXp({ x: -45, y: -45 }, 1);
      for (const [i, artifact] of (['health', 'damage', 'speed', 'cooldown', 'experience'] as const).slice(group * 3, group * 3 + 3).entries()) w.artifacts.drop(w, { x: (i - 1) * 40, y: 75 }, [{ artifact, weight: 1 }]);
      w.elapsed += .25; w.pause();
    }, group);
    await page.addStyleTag({ content: '.overlay{display:none!important}' });
    await expect(page.locator('[data-artifact]')).toHaveCount(5);
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.waitForTimeout(100);
      const overlap = await page.evaluate(() => { const nodes = [...document.querySelectorAll('.buff-slot,.artifact-bonus,.run-notice')].map(n => n.getBoundingClientRect()); return nodes.some((a, i) => nodes.slice(i + 1).some(b => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)); }); expect(overlap).toBe(false);
      await page.screenshot({ path: `${directory}/${phase}-items-${dark ? 'forest' : 'grove'}-${group}-${width}.png` }); await page.locator('canvas').screenshot({ path: `${directory}/${phase}-canvas-${dark ? 'forest' : 'grove'}-${group}-${width}.png` });
      if (width === 390) { await page.evaluate(() => { for (const e of window.__PIXEL__!.world.artifacts.items) e.y = -75; }); await page.waitForTimeout(50); await page.screenshot({ path: `${directory}/${phase}-clear-artifacts-${dark ? 'forest' : 'grove'}-${group}-390.png` }); }
    }
  }
});

test('thirteen simultaneous pickups retain caps and clear presentation through ten scene restarts', async ({ page }) => {
  test.setTimeout(45000); mkdirSync(directory, { recursive: true }); const records = [];
  await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => {
      const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; for (const a of Object.values(w.abilities)) a.level = 0;
      for (let j = 0; j < 6; j++) w.loot.drop(w, (['healing', 'haste', 'fury', 'magnet'] as const)[j % 4], { x: 40, y: 0 });
      for (let j = 0; j < 4; j++) w.loot.spawnChest(w, { x: 40, y: 0 }, 'boss');
      for (const artifact of ['health', 'damage', 'speed'] as const) w.artifacts.drop(w, { x: 40, y: 0 }, [{ artifact, weight: 1 }]); w.pause();
    });
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().loot.tracked)).toBe(13);
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.player.x = 40; w.resume(); });
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().loot.active), { intervals: [10] }).toBe(13); await page.evaluate(() => window.__PIXEL__!.world.pause());
    const result = await page.evaluate(() => { const { actors, ...art } = window.__PIXEL__!.art(); const w = window.__PIXEL__!.world; return { ...art, actors: actors.length, counts: [w.loot.items.length, w.loot.chests.length, w.artifacts.items.length], stacks: w.artifacts.snapshot().map(a => a.stacks) }; }); records.push(result);
    expect(result.loot.allocated).toBe(13); expect(result.counts).toEqual([0, 0, 0]); expect(result.stacks).toEqual([1, 1, 1]);
    await page.evaluate(() => window.__PIXEL__!.restartScene()); await page.waitForFunction(() => window.__PIXEL__?.world.status === 'menu'); expect(await page.evaluate(() => window.__PIXEL__!.art().loot.allocated)).toBe(0); await expect(page.locator('canvas')).toHaveCount(1); expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 }); await page.getByRole('button', { name: 'Начать забег' }).click();
  }
  for (const r of records.slice(1)) { expect(r.objects).toBe(records[0].objects); expect(r.textures).toEqual(records[0].textures); expect(r.textureBytes).toBe(records[0].textureBytes); expect(r.clock).toEqual([0, 0, 0]); expect(r.tweens).toBe(0); }
  writeFileSync(`${directory}/pickup-restarts.json`, JSON.stringify(records, null, 2));
});

test('loot atlas uses hard alpha, distinct sheen/open poses and exact shared HUD crops', async ({ page }) => {
  await page.goto('/?test=1');
  const frames = await page.evaluate(async icons => {
    const image = await createImageBitmap(await (await fetch('/assets/hd/loot.png')).blob());
    const atlas: { frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }> } = await (await fetch('/assets/hd/loot.json')).json();
    const c = document.createElement('canvas'), g = c.getContext('2d', { willReadFrequently: true })!;
    const results = [];
    for (const [name, { frame: f }] of Object.entries(atlas.frames)) {
      c.width = f.w; c.height = f.h; g.drawImage(image, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h); const p = g.getImageData(0, 0, f.w, f.h).data;
      let border = 0, soft = 0, pixels = 0, hash = 2166136261;
      for (let i = 0; i < p.length; i++) { hash = Math.imul(hash ^ p[i], 16777619); if (i % 4 === 3 && p[i]) { pixels++; const n = (i - 3) / 4, x = n % f.w, y = Math.floor(n / f.w); if (!x || !y || x === f.w - 1 || y === f.h - 1) border++; if (p[i] !== 255) soft++; } }
      const key = name.replace(/-idle-0$/, ''); let shared = true;
      if (key in icons) { const crop = await createImageBitmap(await (await fetch(icons[key as keyof typeof icons])).blob()); g.clearRect(0, 0, c.width, c.height); g.drawImage(crop, 0, 0); shared = g.getImageData(0, 0, c.width, c.height).data.every((v, i) => v === p[i]); }
      results.push({ name, border, soft, pixels, hash: hash >>> 0, shared });
    }
    return results;
  }, icons);
  expect(frames).toHaveLength(39);
  for (const f of frames) { expect(f.border, f.name).toBe(0); expect(f.soft, f.name).toBe(0); expect(f.pixels, f.name).toBeGreaterThan(f.name.startsWith('xp-') ? 40 : 100); expect(f.shared, f.name).toBe(true); }
  const groups = new Map<string, number[]>(); for (const f of frames) { const key = f.name.replace(/-\d+$/, ''); const hashes = groups.get(key) ?? []; hashes.push(f.hash); groups.set(key, hashes); } for (const [key, hashes] of groups) expect(new Set(hashes).size, key).toBe(hashes.length);
});

test('real chest contact plays six opening frames, freezes and grants once; five artifacts stay distinct', async ({ page }) => {
  mkdirSync(directory, { recursive: true }); await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6; w.player.invulnerableUntil = 1e6; w.player.hp = 20; w.loot.rng.next = () => 0; for (const a of Object.values(w.abilities)) a.level = 0; w.loot.spawnChest(w, { x: 40, y: 0 }, 'boss'); });
  await page.keyboard.down('d');
  const frames = await page.evaluate(async () => { const frames: string[] = [], start = performance.now(); await new Promise<void>(resolve => { const tick = () => { frames.push(...window.__PIXEL__!.art().loot.frames.filter(f => f.startsWith('chest-open-'))); if (performance.now() - start < 760) requestAnimationFrame(tick); else resolve(); }; requestAnimationFrame(tick); }); return [...new Set(frames)]; });
  await page.keyboard.up('d'); expect(frames).toHaveLength(6); expect(await page.evaluate(() => window.__PIXEL__!.world.player.hp)).toBe(50); expect(await page.evaluate(() => window.__PIXEL__!.world.loot.chests.length)).toBe(0);
  for (const artifact of ['health', 'damage', 'speed', 'cooldown', 'experience'] as const) {
    await page.evaluate(artifact => { const w = window.__PIXEL__!.world; w.artifacts.drop(w, { x: w.player.x + 40, y: w.player.y }, [{ artifact, weight: 1 }]); }, artifact);
    await page.keyboard.down('d'); await expect.poll(() => page.evaluate(id => window.__PIXEL__!.world.artifacts.count(id), artifact), { intervals: [10] }).toBe(1); await page.keyboard.up('d');
  }
  await expect(page.locator('[data-artifact] img')).toHaveCount(5); const sources = await page.locator('[data-artifact] img').evaluateAll(imgs => imgs.map(i => (i as HTMLImageElement).src)); expect(new Set(sources).size).toBe(5);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.loot.spawnChest(w, { x: w.player.x + 40, y: w.player.y }, 'boss'); });
  await page.keyboard.down('d'); await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().loot.frames.some(f => f.startsWith('chest-open-'))), { intervals: [10] }).toBe(true); await page.keyboard.up('d'); await page.waitForTimeout(130); await page.evaluate(() => window.__PIXEL__!.world.pause());
  const frozen = await page.evaluate(() => window.__PIXEL__!.art().loot.frames); await page.waitForTimeout(150); expect(await page.evaluate(() => window.__PIXEL__!.art().loot.frames)).toEqual(frozen);
  await page.addStyleTag({ content: '.overlay{display:none!important}' }); for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.locator('canvas').screenshot({ path: `${directory}/chest-open-${width}.png` }); }
  await page.evaluate(() => window.__PIXEL__!.restartScene()); await page.waitForFunction(() => window.__PIXEL__?.world.status === 'menu'); expect(await page.evaluate(() => window.__PIXEL__!.art().loot.allocated)).toBe(0);
});
