import { expect, test } from '@playwright/test';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';

const directory = 'screenshots/atmosphere-fast', report = 'docs/atmosphere-fast';
for (const [width, height] of [[1280, 720], [844, 390]]) {
  test(`five-second phase changes begin at exact milestones on real Canvas ${width}`, async ({ browser, baseURL }) => {
    test.setTimeout(35000); mkdirSync(directory, { recursive: true }); mkdirSync(report, { recursive: true });
    const context = await browser.newContext({ baseURL, viewport: { width, height }, hasTouch: width === 844, recordVideo: { dir: `${directory}/videos`, size: { width, height } } });
    const page = await context.newPage(), errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { value: undefined }));
    await page.goto('/?test=1'); await page.getByRole('button', { name: 'Роща осколков', exact: true }).click(); await page.locator('.play-button').click();
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e9; for (const a of Object.values(w.abilities)) a.level = 0; w.pause(); });
    await page.waitForTimeout(150);
    const records = [];
    for (const [i, threshold] of [300, 600, 900].entries()) {
      const result = await page.evaluate(async threshold => {
        const p = window.__PIXEL__!, w = p.world, keys = p.atmosphere().terrain.map(t => t.key);
        w.elapsed = threshold - .2; w.player.invulnerableUntil = 1e9; w.resume();
        const frames: { time: number; phase: string; target: string; blend: number; tint: number }[] = [];
        const captures: { time: number; png: string }[] = [], marks = [threshold - .1, threshold + 2.5, threshold + 5.1]; let next = 0;
        await new Promise<void>(resolve => { const frame = () => {
          const a = p.atmosphere(); frames.push({ time: w.elapsed, phase: a.phase, target: a.target, blend: a.blend, tint: a.style.tint });
          if (next < marks.length && w.elapsed >= marks[next]) { captures.push({ time: w.elapsed, png: document.querySelector('canvas')!.toDataURL('image/png') }); next++; }
          if (w.elapsed < threshold + 5.3) requestAnimationFrame(frame); else resolve();
        }; requestAnimationFrame(frame); });
        w.pause(); return { frames, captures, keys, afterKeys: p.atmosphere().terrain.map(t => t.key), sameWorld: p.world === w, metrics: p.metrics() };
      }, threshold);
      const during = result.frames.filter(f => f.time >= threshold && f.time < threshold + 5);
      expect(during.length).toBeGreaterThan(60); expect(during[0].blend).toBeLessThan(.02);
      expect(during.some(f => f.blend > .4 && f.blend < .6)).toBe(true);
      for (let j = 1; j < during.length; j++) { expect(during[j].blend).toBeGreaterThanOrEqual(during[j - 1].blend); expect(during[j].blend - during[j - 1].blend).toBeLessThan(.04); }
      expect(result.frames.find(f => f.time < threshold)?.phase).toBe(['normal', 'dusk', 'dying'][i]);
      expect(result.frames.at(-1)).toMatchObject({ phase: ['dusk', 'dying', 'burning'][i], blend: 1 });
      expect(result.sameWorld).toBe(true); expect(result.afterKeys).toEqual(result.keys);
      for (const [j, c] of result.captures.entries()) writeFileSync(`${directory}/${threshold}-${['before', 'middle', 'after'][j]}-${width}.png`, Buffer.from(c.png.split(',')[1], 'base64'));
      records.push({ ...result, captures: result.captures.map(c => ({ time: c.time })) });
    }
    expect(errors).toEqual([]); writeFileSync(`${report}/transitions-${width}.json`, JSON.stringify({ records, errors }, null, 2));
    const video = page.video()!; await context.close(); copyFileSync(await video.path(), `${directory}/transitions-${width}.webm`);
  });

  test(`ultimate needs both five minutes and level30 inclusively ${width}`, async ({ browser, baseURL }) => {
    mkdirSync(directory, { recursive: true }); const context = await browser.newContext({ baseURL, viewport: { width, height }, hasTouch: width === 844 }), page = await context.newPage();
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { value: undefined }));
    await page.goto('/?test=1'); await page.locator('.play-button').click();
    for (const [elapsed, level, eligible] of [[299.99, 29, false], [300, 28, false], [300, 29, true]] as const) {
      await page.evaluate(({ elapsed, level }) => {
        const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e9; for (const a of Object.values(w.abilities)) a.level = 0;
        w.elapsed = elapsed; w.experience.level = level; w.experience.xp = 0; w.gainXp(w.snapshot().xpNext);
      }, { elapsed, level });
      await expect(page.locator('[data-upgrade]')).toHaveCount(3);
      await expect(page.locator('[data-upgrade^="ultimate-"]')).toHaveCount(eligible ? 3 : 0);
      expect(await page.evaluate(() => window.__PIXEL__!.world.experience.level)).toBe(level + 1);
      if (eligible) { expect(await page.evaluate(() => window.__PIXEL__!.world.elapsed)).toBe(300); await page.screenshot({ path: `${directory}/ultimate-level30-${width}.png` }); }
      await page.locator(eligible ? '[data-upgrade="ultimate-fire"]' : '[data-upgrade]').first().click();
      await page.waitForFunction(() => window.__PIXEL__!.world.status === 'playing');
    }
    await expect(page.locator('.ultimate-control')).toContainText('10/10'); expect(errors).toEqual([]); await context.close();
  });
}
