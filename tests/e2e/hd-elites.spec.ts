import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const pack = process.env.PIXEL_HD_PACK ?? '05';
const directory = `screenshots/hd-rework/pack-${pack}${pack === '05' ? '' : '/elite-regression'}`, phase = process.env.PIXEL_HD_PHASE ?? 'after';

test('elite matrix and Guardian notice: both maps, viewports and real Canvas', async ({ page }) => {
  mkdirSync(directory, { recursive: true });
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  for (const dark of [false, true]) {
    await page.goto('/?test=1'); if (dark) await page.getByRole('button', { name: 'Роща осколков', exact: true }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
    await page.evaluate(() => {
      const w = window.__PIXEL__!.world; w.pause(); w.elapsed = 1170.08;
      const kinds = ['grunt', 'runner', 'tank', 'caster', 'rusher', 'splitter'] as const;
      for (let row = 0; row < 6; row++) for (let col = 0; col < 3; col++) w.spawn(kinds[row], { x: (col - 1) * 54, y: row * 35 - 90 }, true)!.modifier = (['frenzy', 'shielded', 'volatile'] as const)[col];
      w.effect('frost', w.player, 75, 0x91e4dc, 1);
    });
    await page.addStyleTag({ content: '.overlay{display:none!important}' });
    for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.waitForTimeout(100); await page.screenshot({ path: `${directory}/${phase}-elites-${dark ? 'forest' : 'grove'}-${width}.png` }); }
    expect(await page.evaluate(() => window.__PIXEL__!.world.enemies.length)).toBe(18);
    if (phase !== 'before') expect(await page.evaluate(() => window.__PIXEL__!.art().eliteAdornments)).toBe(18);
    await page.goto('/?test=1'); if (dark) await page.getByRole('button', { name: 'Роща осколков', exact: true }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.elapsed=240; w.encounterDirector.nextAt=240; w.encounterDirector.update(w); w.pause(); });
    await page.addStyleTag({ content: '.overlay{display:none!important}' });
    await expect(page.locator('.run-notice')).toBeVisible();
    for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.waitForTimeout(100); await page.screenshot({ path: `${directory}/${phase}-guardian-${dark ? 'forest' : 'grove'}-${width}.png` }); }
    if (phase !== 'before') expect((await page.locator('.run-notice').boundingBox())!.y).toBeGreaterThan(600);
  }
  expect(errors).toEqual([]);
});

test('Guardian19 authored frames and live hurt/death keep immediate artifact and clean teardown', async ({ page }) => {
  mkdirSync(directory, { recursive: true });
  await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  const pixels = await page.evaluate(async () => {
    const image = await createImageBitmap(await (await fetch('/assets/hd/guardian.png')).blob());
    const data: { frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }> } = await (await fetch('/assets/hd/guardian.json')).json();
    const c = document.createElement('canvas'); c.width = 96; c.height = 112; const g = c.getContext('2d', { willReadFrequently: true })!;
    return Object.entries(data.frames).map(([name, { frame: f }]) => {
      g.clearRect(0, 0, 96, 112); g.drawImage(image, f.x, f.y, 96, 112, 0, 0, 96, 112); const p = g.getImageData(0, 0, 96, 112).data;
      let border = 0, soft = 0, count = 0, hash = 2166136261;
      for (let i = 0; i < p.length; i++) { hash = Math.imul(hash ^ p[i], 16777619); if (i % 4 === 3 && p[i]) { count++; const n = (i - 3) / 4, x = n % 96, y = Math.floor(n / 96); if (!x || !y || x === 95 || y === 111) border++; if (p[i] !== 255) soft++; } }
      return { name, border, soft, count, hash: hash >>> 0 };
    });
  });
  expect(pixels).toHaveLength(19); expect(new Set(pixels.map(p => p.hash)).size).toBe(19);
  for (const p of pixels) { expect(p.border, p.name).toBe(0); expect(p.soft, p.name).toBe(0); expect(p.count, p.name).toBeGreaterThan(500); }
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.experience.level = 30; w.player.invulnerableUntil = 1e6; w.artifacts.rng.next = () => 0; for (const a of Object.values(w.abilities)) a.level = 0; w.spawn('guardian', { x: 60, y: -40 }); });
  await page.waitForTimeout(80); await page.evaluate(() => { const w = window.__PIXEL__!.world; w.damageEnemy(w.rareGuardian!, 1); });
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().actors.some(a => String(a.frame).startsWith('guardian-hurt-'))), { intervals: [10] }).toBe(true);
  await page.locator('canvas').screenshot({ path: `${directory}/guardian-hurt.png` });
  const reward = await page.evaluate(() => { const w = window.__PIXEL__!.world; w.damageEnemy(w.rareGuardian!, 999999); return { artifacts: w.artifacts.snapshot().reduce((n,a)=>n+a.stacks,0), kills: w.snapshot().guardianKills, chests: w.loot.chests.length }; });
  expect(reward).toEqual({ artifacts: 1, kills: 1, chests: 0 });
  const frames = await page.evaluate(async () => { const frames: string[] = [], start = performance.now(); await new Promise<void>(resolve => { const tick = () => { const frame = window.__PIXEL__!.art().guardian.frame; if (frame) frames.push(frame); if (performance.now() - start < 670) requestAnimationFrame(tick); else resolve(); }; requestAnimationFrame(tick); }); return [...new Set(frames)]; });
  expect(frames).toHaveLength(6); expect(await page.evaluate(() => window.__PIXEL__!.art().guardian.activeDeaths)).toBe(0);
  await page.keyboard.down('d'); await page.keyboard.down('w'); await expect(page.locator('[data-artifact="health"]')).toBeVisible(); await page.keyboard.up('d'); await page.keyboard.up('w');
  expect(await page.evaluate(() => window.__PIXEL__!.world.artifacts.count('health'))).toBe(1);
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.spawn('guardian', { x: w.player.x - 45, y: w.player.y }); });
  await page.waitForTimeout(60); await page.evaluate(() => { const w = window.__PIXEL__!.world; w.damageEnemy(w.rareGuardian!, 999999); });
  await page.waitForTimeout(180); await page.evaluate(() => window.__PIXEL__!.world.pause());
  await page.addStyleTag({ content: '.overlay{display:none!important}' });
  const frozen = await page.evaluate(() => window.__PIXEL__!.art().guardian.frame); await page.waitForTimeout(100); expect(await page.evaluate(() => window.__PIXEL__!.art().guardian.frame)).toBe(frozen);
  for (const width of [1280, 390]) { await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.locator('canvas').screenshot({ path: `${directory}/guardian-death-${width}.png` }); }
  await page.evaluate(() => window.__PIXEL__!.restartScene()); await page.waitForFunction(() => window.__PIXEL__?.world.status === 'menu');
  expect(await page.evaluate(() => window.__PIXEL__!.art().guardian.allocatedDeaths)).toBe(0); await expect(page.locator('canvas')).toHaveCount(1);
  expect(await page.evaluate(() => window.__PIXEL__!.art().textures.includes('guardian'))).toBe(false);
});
