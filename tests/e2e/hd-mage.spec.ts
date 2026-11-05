import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const directory = process.env.PIXEL_HD_PACK && process.env.PIXEL_HD_PACK !== '02' ? `screenshots/hd-rework/pack-${process.env.PIXEL_HD_PACK}/mage-regression` : 'screenshots/hd-rework/pack-02';

test('Mage live directional walk and hurt poses keep the pivot and freeze on idle pause', async ({ page }) => {
  mkdirSync(directory, { recursive: true });
  await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; for (const a of Object.values(w.abilities)) a.level = 0; });
  const recorded: Record<string, string[]> = {};
  for (const [key, facing] of [['d', 'side'], ['w', 'up'], ['s', 'down']]) {
    await page.keyboard.down(key);
    recorded[facing] = await page.evaluate(async () => {
      const frames: string[] = [], begin = performance.now();
      await new Promise<void>(resolve => { const tick = () => { frames.push(window.__PIXEL__!.art().heroFrame); if (performance.now() - begin < 750) requestAnimationFrame(tick); else resolve(); }; requestAnimationFrame(tick); });
      return [...new Set(frames.filter(f => f.includes('-walk-')))];
    });
    expect(recorded[facing]).toHaveLength(6);
    for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.locator('canvas').screenshot({ path: `${directory}/mage-walk-${facing}-${width}.png` }); }
    await page.keyboard.up(key);
  }
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().heroFrame)).toContain('-idle-');
  await page.evaluate(() => window.__PIXEL__!.world.pause());
  const frame = await page.evaluate(() => window.__PIXEL__!.art().heroFrame); await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__PIXEL__!.art().heroFrame)).toBe(frame);
  await page.addStyleTag({ content: '.overlay{display:none!important}' });
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.resume(); w.damagePlayer(1); });
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().heroFrame), { intervals: [10] }).toContain('-hurt-');
  await page.evaluate(() => window.__PIXEL__!.world.pause());
  for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.locator('canvas').screenshot({ path: `${directory}/mage-hurt-${width}.png` }); }
  const hero = await page.evaluate(() => window.__PIXEL__!.art().actors.find(a => a.texture === 'hd-mage')!);
  expect(hero.width).toBe(24); expect(hero.height).toBe(30);
  writeFileSync(`${directory}/mage-walk-evidence.json`, JSON.stringify(recorded, null, 2));
});

test('Mage atlas has complete hard-alpha poses; Grove joins match one large world rectangle', async ({ page }) => {
  await page.goto('/?test=1'); await page.waitForFunction(() => !!window.__PIXEL__);
  const result = await page.evaluate(async () => {
    const image = await createImageBitmap(await (await fetch('/assets/hd/mage.png')).blob());
    const manifest: { frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }> } = await (await fetch('/assets/hd/mage.json')).json();
    const c = document.createElement('canvas'), g = c.getContext('2d', { willReadFrequently: true })!;
    const frames = Object.entries(manifest.frames).map(([name, { frame: f }]) => {
      c.width = f.w; c.height = f.h; g.drawImage(image, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
      const data = g.getImageData(0, 0, f.w, f.h).data; let border = 0, soft = 0, pixels = 0, hash = 2166136261;
      for (let i = 0; i < data.length; i++) { hash = Math.imul(hash ^ data[i], 16777619); if (i % 4 === 3 && data[i]) { pixels++; const n = (i - 3) / 4, x = n % f.w, y = Math.floor(n / f.w); if (x === 0 || x === f.w - 1 || y === 0 || y === f.h - 1) border++; if (data[i] !== 255) soft++; } }
      return { name, pixels, border, soft, hash: hash >>> 0 };
    });
    // Dynamic import goes through the same Vite module as runtime generation.
    const moduleUrl = '/src/game/art/hdGrove.ts';
    const { createHdGroveRegion } = await import(/* @vite-ignore */ moduleUrl);
    const big = createHdGroveRegion(-8, -8, 16, 16) as HTMLCanvasElement;
    c.width = c.height = 512;
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) g.drawImage(createHdGroveRegion(-8 + x * 8, -8 + y * 8), x * 256, y * 256);
    return { frames, seams: c.toDataURL() === big.toDataURL(), deterministic: big.toDataURL() === createHdGroveRegion(-8, -8, 16, 16).toDataURL() };
  });
  expect(result.frames).toHaveLength(58);
  for (const frame of result.frames) { expect(frame.border, frame.name).toBe(0); expect(frame.soft, frame.name).toBe(0); expect(frame.pixels, frame.name).toBeGreaterThan(frame.name.startsWith('mage') ? 500 : 150); }
  // Directional up and down share body motion but each clip must have distinct poses.
  for (const facing of ['down', 'up', 'side']) for (const pose of ['idle', 'walk', 'hurt', 'death']) { const clip = result.frames.filter(f => f.name.startsWith(`mage-${facing}-${pose}-`)); expect(new Set(clip.map(f => f.hash)).size, `${facing}/${pose}`).toBe(clip.length); }
  expect(result.seams).toBe(true); expect(result.deterministic).toBe(true);
});

test('Mage live five abilities, paused FX phases and death do not delay game over', async ({ page }) => {
  mkdirSync(directory, { recursive: true }); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world; w.elapsed = 1170; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6;
    w.player.invulnerableUntil = 1e6;
    for (const a of w.abilityDefinitions) { w.abilities[a.id].level = 3; w.abilities[a.id].readyAt = 0; }
    for (let i = 0; i < 8; i++) { const e = w.spawn('tank', { x: 60 + i % 3 * 14, y: i * 10 - 35 })!; e.hp = e.maxHp = 1e5; e.speed = 0; }
  });
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.snapshot().damageByAbility.filter(a => a.damage > 0).length)).toBe(4);
  expect(await page.evaluate(() => {const w=window.__PIXEL__!.world;return w.shield.absorbValue(w.elapsed);})).toBeGreaterThan(0);
  await page.evaluate(() => window.__PIXEL__!.world.pause());
  await page.addStyleTag({ content: '.overlay{display:none!important}' });
  const before = await page.evaluate(() => JSON.stringify(window.__PIXEL__!.world));
  await page.waitForTimeout(120); expect(await page.evaluate(() => JSON.stringify(window.__PIXEL__!.world))).toBe(before);
  for (const phase of [0, .35, .85]) {
    await page.evaluate(t => { const w = window.__PIXEL__!.world; w.effects.length = 0; for (const kind of ['frost', 'lightning', 'meteor', 'shield'] as const) { w.effect(kind, { x: kind === 'meteor' ? 40 : 0, y: kind === 'lightning' ? 45 : 0 }, kind === 'lightning' ? 1 : 65, kind === 'meteor' ? 0xffae65 : 0x91e4dc, 1, kind === 'lightning' ? { x: -60, y: 25 } : undefined); } for (const e of w.effects) e.started -= t; }, phase);
    await page.waitForTimeout(50);
    for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.waitForTimeout(80); await page.locator('canvas').screenshot({ path: `${directory}/magic-${phase}-${width}.png` }); }
  }
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.resume(); w.player.invulnerableUntil = 0; w.shield.clearAbsorb(); w.damagePlayer(99999); });
  expect(await page.evaluate(() => window.__PIXEL__!.world.status)).toBe('over');
  const frames = await page.evaluate(async () => { const frames: string[] = [], begin = performance.now(); await new Promise<void>(resolve => { const tick = () => { frames.push(window.__PIXEL__!.art().heroFrame); if (performance.now() - begin < 650) requestAnimationFrame(tick); else resolve(); }; requestAnimationFrame(tick); }); return [...new Set(frames)]; });
  expect(frames.filter(f => f.includes('-death-')).length).toBe(6);
  await page.locator('canvas').screenshot({ path: `${directory}/mage-death-390.png` });
  writeFileSync(`${directory}/mage-evidence.json`, JSON.stringify({ frames, errors }, null, 2)); expect(errors).toEqual([]);
});
