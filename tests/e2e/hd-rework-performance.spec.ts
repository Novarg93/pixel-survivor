import { selectTestCharacter } from '../helpers/character';
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus, totalmem } from 'node:os';

const pack = process.env.PIXEL_HD_PACK ?? '02', phase = process.env.PIXEL_HD_PHASE ?? 'after';
const directory = `screenshots/hd-rework/pack-${pack}`;
async function start(page: Page, hero: string, dark: boolean) {
  await page.goto('/?test=1');
  await selectTestCharacter(page, hero);
  await page.getByRole('button', { name: dark ? 'Dark Forest' : 'Роща осколков', exact: true }).click();
  await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(async () => {
    const moduleUrl = '/src/game/utils/SeededRandom.ts';
    const { SeededRandom } = await import(/* @vite-ignore */ moduleUrl);
    const random = new SeededRandom(12345);
    const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.elapsed = 1200.08;
    w.rng.next = () => random.next();
    w.encounterDirector.nextAt = 1e6;
    w.player.invulnerableUntil = 1e6; for (const a of Object.values(w.abilities)) a.level = 0;
  });
}

test('HD rework: identical mixed150 fixture, two viewports, maps and ten restarts', async ({ page, browser }) => {
  test.setTimeout(90000); mkdirSync(directory, { recursive: true });
  const errors: string[] = [], results = [], restarts = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport); await start(page, 'Mage', false);
    await page.evaluate(pack => {
      const w = window.__PIXEL__!.world;
      const kinds = ['grunt', 'runner', 'tank', 'caster', 'rusher', 'splitter'] as const;
      for (let i = 0; i < 150; i++) w.spawn(kinds[i % 6], { x: (i % 15 - 7) * 27, y: (Math.floor(i / 15) - 4.5) * 27 }, i % 13 === 0);
      if (Number(pack) >= 5) w.spawn('guardian', { x: -65, y: -65 });
      if (Number(pack) >= 6) { w.spawn('charger', { x: -145, y: 65 }); w.spawn('sorcerer', { x: 145, y: -65 }); w.spawn('eclipse', { x: 0, y: 145 }); }
      if (Number(pack) >= 7) {
        for (const [i, kind] of (['healing', 'haste', 'fury', 'magnet'] as const).entries()) w.loot.drop(w, kind, { x: 150 + i * 25, y: 160 });
        w.loot.spawnChest(w, { x: 175, y: 200 }, 'boss');
        for (const [i, artifact] of (['health', 'damage', 'speed'] as const).entries()) w.artifacts.drop(w, { x: 150 + i * 25, y: 220 }, [{ artifact, weight: 1 }]);
        for (let i = 0; i < 20; i++) w.dropXp({ x: i % 5 * 15 + 150, y: Math.floor(i / 5) * 15 - 200 }, 1);
      }
    }, pack);
    await page.waitForTimeout(1000);
    const sample = await page.evaluate(async () => {
      const frames: number[] = [], updates: number[] = [], counts: number[] = [], start = performance.now(); let last = start;
      await new Promise<void>(resolve => {
        const tick = (now: number) => { frames.push(now - last); last = now; updates.push(window.__PIXEL__!.metrics().updateMs); counts.push(window.__PIXEL__!.world.regularCount); if (now - start < 6000) requestAnimationFrame(tick); else resolve(); };
        requestAnimationFrame(tick);
      });
      const f = frames.slice(1).sort((a, b) => a - b), u = updates.sort((a, b) => a - b), { actors, ...art } = window.__PIXEL__!.art();
      return { fps: f.length * 1000 / f.reduce((a, b) => a + b, 0), frameMsP95: f[Math.floor(f.length * .95)], updateMsP95: u[Math.floor(u.length * .95)], minMobs: Math.min(...counts), maxMobs: Math.max(...counts), actors: actors.length, art };
    });
    expect(sample.minMobs).toBe(150); expect(sample.maxMobs).toBe(150); results.push({ viewport, ...sample });
    await page.locator('canvas').screenshot({ path: `${directory}/${phase}-stress-${viewport.width}.png` });
  }
  for (const dark of [false, true]) for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport); await start(page, 'Mage', dark);
    await page.evaluate(() => {
      const w = window.__PIXEL__!.world; w.pause();
      for (const [i, kind] of (['grunt', 'runner', 'tank', 'caster', 'rusher', 'splitter'] as const).entries()) w.spawn(kind, { x: (i % 3 - 1) * 52, y: Math.floor(i / 3) * 85 - 48 }, i === 5);
      w.effect('frost', w.player, 73, 0x91e4dc, 1);
      w.effect('lightning', { x: -40, y: 40 }, 1, 0xdab5ff, 1, { x: 45, y: 30 });
      w.shoot({ x: 25, y: 8, vx: 180, vy: 0, damage: 1, hostile: false, source: 'fireball' });
      w.shield.refreshAbsorb(15,w.elapsed+5);
      w.impacts.push({ id: w.id(), x: 48, y: -65, radius: 55, damage: 1, landAt: w.elapsed + .3, hostile: false, source: 'meteor' });
    });
    await page.addStyleTag({ content: '.overlay{display:none!important}' }); await page.waitForTimeout(120);
    await page.screenshot({ path: `${directory}/${phase}-${dark ? 'forest' : 'grove'}-${viewport.width}.png` });
    await page.locator('canvas').screenshot({ path: `${directory}/${phase}-canvas-${dark ? 'forest' : 'grove'}-${viewport.width}.png` });
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => window.__PIXEL__!.restartScene()); await page.waitForFunction(() => window.__PIXEL__?.world.status === 'menu');
    await page.getByRole('button', { name: 'Начать забег' }).click();
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.pause(); w.elapsed = 1200.08; for (let i = 0; i < 150; i++) w.spawn('tank', { x: (i % 15 - 7) * 20, y: Math.floor(i / 15) * 20 - 90 }); });
    await page.waitForTimeout(100);
    const art = await page.evaluate(() => { const { actors, ...art } = window.__PIXEL__!.art(); return { ...art, actors: actors.length }; }); restarts.push(art);
    expect(art.actors).toBe(151); expect(art.clock).toEqual([0, 0, 0]); expect(art.tweens).toBe(0);
    await expect(page.locator('canvas')).toHaveCount(1);
    expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 });
  }
  for (const art of restarts.slice(1)) { expect(art.textures).toEqual(restarts[0].textures); expect(art.textureBytes).toBe(restarts[0].textureBytes); expect(art.objects).toBe(restarts[0].objects); expect(art.blurListeners).toBe(restarts[0].blurListeners); }
  const renderer = await page.evaluate(() => { const canvas = document.querySelector('canvas')!, gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl'); const ext = gl?.getExtension('WEBGL_debug_renderer_info'); return gl && ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'Canvas/unavailable'; });
  writeFileSync(`${directory}/${phase}-performance.json`, JSON.stringify({ pack, phase, seed: 12345, measuredAt: new Date().toISOString(), cpu: cpus()[0]?.model, ramGiB: totalmem() / 1024 ** 3, browser: browser.version(), renderer, setup: 'DPR1; seed12345; 1s warmup+6s RAF;150 mixed live AI, attacks disabled, invulnerable player; same fixture before/after. Desktop mobile viewport, not phone hardware. RGBA source estimate, not GPU VRAM.', results, restarts, errors }, null, 2));
  expect(errors).toEqual([]);
});
