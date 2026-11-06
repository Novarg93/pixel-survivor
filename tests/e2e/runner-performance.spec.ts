import { selectTestCharacter } from '../helpers/character';
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus, totalmem } from 'node:os';

export const RUNNER_EVIDENCE = 'screenshots/runner-pack-01';
async function start(page: Page, dark = true) {
  await page.goto('/?test=1'); await selectTestCharacter(page, 'Warrior');
  await page.getByRole('button', { name: dark ? 'Роща осколков' : 'Роща осколков', exact: true }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
}
test('Runner pack: comparable 150 ordinary runners, texture budgets and ten scene restarts', async ({ page, browser }) => {
  test.setTimeout(90000); mkdirSync(RUNNER_EVIDENCE, { recursive: true });
  const before = process.env.PIXEL_RUNNER_BASELINE === '1', prefix = before ? 'before' : 'after', errors: string[] = [], results = [], restarts = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport); await start(page);
    await page.evaluate(() => {
      const w = window.__PIXEL__!.world; w.elapsed = 1170.08; w.player.invulnerableUntil = 100000; w.options.spawnRate = 0; w.encounterDirector.nextAt = 100000; w.encounterDirector.nextAt = 100000;
      for (const a of Object.values(w.abilities)) a.level = 0;
      for (let i = 0; i < 150; i++) w.spawn('runner', { x: (i % 15 - 7) * 27, y: (Math.floor(i / 15) - 4.5) * 27 });
    });
    await page.waitForTimeout(1000);
    const sample = await page.evaluate(async () => {
      const deltas: number[] = [], updates: number[] = [], counts: number[] = [], start = performance.now(); let last = start;
      await new Promise<void>(resolve => { const sample = (now: number) => { deltas.push(now - last); last = now; const m = window.__PIXEL__!.metrics(); updates.push(m.updateMs); counts.push(m.enemies); if (now - start < 6000) requestAnimationFrame(sample); else resolve(); }; requestAnimationFrame(sample); });
      const frames = deltas.slice(1).sort((a, b) => a - b), times = updates.sort((a, b) => a - b), { actors, ...art } = window.__PIXEL__!.art();
      return { seconds: (last - start) / 1000, fps: frames.length * 1000 / frames.reduce((a, b) => a + b, 0), frameMsP95: frames[Math.floor(frames.length * 0.95)], updateMsP95: times[Math.floor(times.length * 0.95)], minMobs: Math.min(...counts), maxMobs: Math.max(...counts), actors: actors.length, art };
    });
    expect(sample.minMobs).toBe(150); expect(sample.maxMobs).toBe(150); results.push({ viewport, ...sample });
    await page.screenshot({ path: `${RUNNER_EVIDENCE}/${prefix}-150-runners-${viewport.width}x${viewport.height}.png` });
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => window.__PIXEL__!.restartScene()); await page.waitForFunction(() => window.__PIXEL__?.world.status === 'menu');
    await page.getByRole('button', { name: 'Начать забег' }).click();
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.pause(); w.elapsed = 1170.08; for (let i = 0; i < 150; i++) w.spawn('runner', { x: i % 15 * 27 - 189, y: Math.floor(i / 15) * 27 - 120 }); });
    await page.waitForTimeout(100);
    const art = await page.evaluate(() => { const { actors, ...art } = window.__PIXEL__!.art(); return { ...art, actors: actors.length }; }); restarts.push(art);
    expect(art.actors).toBe(151); expect(art.clock).toEqual([0, 0, 0]); expect(art.tweens).toBe(0);
    expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 }); await expect(page.locator('canvas')).toHaveCount(1);
  }
  for (const art of restarts.slice(1)) { expect(art.textures).toEqual(restarts[0].textures); expect(art.textureBytes).toBe(restarts[0].textureBytes); expect(art.objects).toBe(restarts[0].objects); expect(art.blurListeners).toBe(restarts[0].blurListeners); }
  for (const dark of [true, false]) for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport); await start(page, dark);
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.pause(); w.elapsed = 1170.08; w.spawn('grunt', { x: -34, y: -18 }); w.spawn('runner', { x: 36, y: -12 }); w.spawn('runner', { x: 34, y: 45 }, true)!.modifier = 'shielded'; for (let i = 0; i < 6; i++) w.spawn(i % 2 ? 'runner' : 'grunt', { x: -72 + i * 28, y: -58 - i % 2 * 8 }); });
    await page.addStyleTag({ content: '.overlay{display:none!important}' }); await page.waitForTimeout(150);
    await page.screenshot({ path: `${RUNNER_EVIDENCE}/${prefix}-mixed-${dark ? 'forest' : 'grove'}-${viewport.width}x${viewport.height}.png` });
  }
  const renderer = await page.evaluate(() => { const gl = document.querySelector('canvas')!.getContext('webgl2'); if (!gl) return 'Canvas/WebGL1'; const ext = gl.getExtension('WEBGL_debug_renderer_info'); return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER)); });
  writeFileSync(`${RUNNER_EVIDENCE}/${prefix}-performance.json`, JSON.stringify({ measuredAt: new Date().toISOString(), before, browser: browser.version(), cpu: cpus()[0]?.model, ramGiB: totalmem() / 1024 ** 3, renderer, setup: 'DPR1, 1s warm-up + 6s RAF sample each viewport. Exactly150 ordinary runners, live pursuit/separation/collisions. Test-only disabled autoattacks/spawns and invulnerability. Ten scene restarts with paused150-runner fixture. Same harness before/after; no mobile hardware claim.', results, restarts, errors }, null, 2));
  expect(errors).toEqual([]);
});
