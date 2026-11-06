import { selectTestCharacter } from '../helpers/character';
import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus, totalmem } from 'node:os';

test('HD integration: comparable live 150-mob render benchmark', async ({ page, browser }) => {
  test.setTimeout(60000);
  const baseline = process.env.PIXEL_HD_BASELINE === '1', directory = 'screenshots/hd-pixel-art';
  mkdirSync(directory, { recursive: true });
  const errors: string[] = [], requests: string[] = [], results = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', r => requests.push(new URL(r.url()).pathname));
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport); await page.goto('/?test=1');
    await selectTestCharacter(page, 'Warrior'); await page.getByRole('button', { name: 'Роща осколков', exact: true }).click();
    await page.getByRole('button', { name: 'Начать забег' }).click();
    await page.evaluate(() => {
      const w = window.__PIXEL__!.world; w.elapsed = 1170.08; w.player.x = w.player.y = 0;
      w.player.invulnerableUntil = 100000; w.options.spawnRate = 0; w.encounterDirector.nextAt = 100000;
      for (const a of Object.values(w.abilities)) a.level = 0;
      for (let i = 0; i < 150; i++) { const e = w.spawn('grunt', { x: (i % 15 - 7) * 27, y: (Math.floor(i / 15) - 4.5) * 27 }, i < 2)!; if (e.elite) e.modifier = 'shielded'; }
      w.spawn('guardian', { x: 135, y: -70 });
      w.loot.drop(w, 'haste', { x: 130, y: 60 }); w.loot.spawnChest(w, { x: -130, y: 50 }, 'boss');
      w.effect('cleave', w.player, 82, 0xf4d2a0, 20, { x: 82, y: 0 });
    });
    await page.waitForTimeout(1000);
    const result = await page.evaluate(async () => {
      const deltas: number[] = [], updates: number[] = [], mobs: number[] = [], guardians: number[] = [];
      const started = performance.now(); let last = started;
      await new Promise<void>(resolve => {
        const sample = (now: number) => { deltas.push(now - last); last = now; const m = window.__PIXEL__!.metrics(); updates.push(m.updateMs); mobs.push(m.enemies); guardians.push(m.guardians); if (now - started < 6000) requestAnimationFrame(sample); else resolve(); };
        requestAnimationFrame(sample);
      });
      const frames = deltas.slice(1).sort((a, b) => a - b), times = updates.sort((a, b) => a - b);
      return { seconds: (last - started) / 1000, frames: deltas.length, fps: frames.length * 1000 / frames.reduce((a, b) => a + b, 0), frameMsP95: frames[Math.floor(frames.length * 0.95)], updateMsP95: times[Math.floor(times.length * 0.95)], minMobs: Math.min(...mobs), maxMobs: Math.max(...mobs), minGuardians: Math.min(...guardians), metrics: window.__PIXEL__!.metrics() };
    });
    expect(result.minMobs).toBe(150); expect(result.maxMobs).toBe(150); expect(result.minGuardians).toBe(1);
    results.push({ viewport, ...result });
    await page.screenshot({ path: `${directory}/${baseline ? 'baseline' : 'hd'}-load-${viewport.width}x${viewport.height}.png` });
  }
  const renderer = await page.evaluate(() => { const canvas = document.querySelector('canvas')!, gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl'); if (!gl) return 'Canvas'; const ext = gl.getExtension('WEBGL_debug_renderer_info'); return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER)); });
  writeFileSync(`${directory}/${baseline ? 'baseline' : 'hd'}-performance.json`, JSON.stringify({ baseline, measuredAt: new Date().toISOString(), browser: browser.version(), cpu: cpus()[0]?.model, logicalCores: cpus().length, ramGiB: totalmem() / 1024 ** 3, renderer, setup: 'Same test harness: DPR 1, 1s warm-up + 6s RAF sample, live 150 grunts (2 elites) + guardian + haste pickup + chest + extended visual Cleave. Test-only invulnerability, disabled autoattacks and natural spawning. No movement pilot; not a phone or long soak test.', results, assetRequests: [...new Set(requests)].filter(path => path.startsWith('/assets/')), errors }, null, 2));
  expect(errors).toEqual([]);
});
