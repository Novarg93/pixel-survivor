import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { selectTestCharacter } from '../helpers/character';

const directory = 'screenshots/atmosphere', report = 'docs/atmosphere';
function errorsOn(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}
async function start(page: Page, hero = 'Mage') {
  await page.addInitScript(() => Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { value: undefined }));
  await page.goto('/?test=1'); await selectTestCharacter(page, hero);
  await page.getByRole('button', { name: 'Роща осколков', exact: true }).click(); await page.locator('.play-button').click();
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e9;
    for (const a of Object.values(w.abilities)) a.level = 0;
    w.pause();
  });
  mkdirSync(directory, { recursive: true }); mkdirSync(report, { recursive: true });
}
async function seek(page: Page, elapsed: number) {
  await page.evaluate(t => { window.__PIXEL__!.world.elapsed = t; }, elapsed);
  await page.waitForFunction(t => {
    const s = window.__PIXEL__!.atmosphere(); return s.active && (t < 305 ? s.phase === 'normal' : t >= 905 ? s.phase === 'burning' : t >= 605 ? s.phase === 'dying' : s.phase === 'dusk');
  }, elapsed);
  await page.waitForTimeout(120);
}

for (const [width, height] of [[1280, 720], [844, 390]]) test(`forest phases retain layout, readable actors and untinted UI ${width}`, async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width, height }, hasTouch: width === 844 });
  const page = await context.newPage(), errors = errorsOn(page); await start(page);
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world;
    w.spawn('grunt', { x: 60, y: 20 }, true); w.spawn('caster', { x: -60, y: 45 });
    w.spawn('charger', { x: 110, y: -45 }); w.spawn('guardian', { x: -110, y: -45 });
    w.loot.spawnChest(w, { x: -72, y: -8 }, 'boss'); w.loot.drop(w, 'fury', { x: 72, y: -8 });
    w.artifacts.drop(w, { x: 40, y: 62 }); w.dropXp({ x: -40, y: 62 }, 5);
    w.shoot({ x: -25, y: 35, vx: 20, vy: 0, damage: 1, hostile: true });
    w.shoot({ x: 25, y: 35, vx: 20, vy: 0, damage: 1, hostile: false });
  });
  // Keep HUD and controls visible while revealing paused Canvas for comparison.
  await page.addStyleTag({ content: '.overlay{display:none!important}' });
  const rows = [], phases = ['normal', 'dusk', 'dying', 'burning']; let keys: string[] = [];
  for (const [i, time] of [240, 315, 615, 915].entries()) {
    await seek(page, time);
    const before = await page.evaluate(() => JSON.stringify(window.__PIXEL__!.world));
    await page.waitForTimeout(100); expect(await page.evaluate(() => JSON.stringify(window.__PIXEL__!.world))).toBe(before);
    const state = await page.evaluate(() => ({ atmosphere: window.__PIXEL__!.atmosphere(), art: window.__PIXEL__!.art() }));
    expect(state.atmosphere.phase).toBe(phases[i]); expect(state.atmosphere.layers).toHaveLength(8);
    expect(state.atmosphere.layers.every(l => l.depth < -20)).toBe(true);
    expect(state.atmosphere.terrain.every(t => t.tint === state.atmosphere.style.tint)).toBe(true);
    const currentKeys = state.atmosphere.terrain.map(t => t.key); if (i === 0) keys = currentKeys; else expect(currentKeys).toEqual(keys);
    expect(state.art.actors.some(a => a.texture === 'hd-guardian')).toBe(true);
    expect(state.art.actors.some(a => a.texture === 'hd-loot')).toBe(true);
    expect(await page.evaluate(() => ({ filter: getComputedStyle(document.querySelector('canvas')!).filter, overflow: document.documentElement.scrollWidth }))).toEqual({ filter: 'none', overflow: width });
    await page.screenshot({ path: `${directory}/${phases[i]}-${width}.png` }); rows.push(state.atmosphere);
  }
  // A phase seek may change the timer text, but never the appearance of HUD/menus.
  // An opaque backdrop isolates actual UI pixels from the intentionally changing Canvas.
  await page.addStyleTag({ content: '.hero-name{background:#10202c!important}' });
  const box = (await page.locator('.hero-name').boundingBox())!;
  // Exclude the fractional CSS box edges, whose antialiasing includes background pixels.
  const clip = { x: Math.ceil(box.x) + 1, y: Math.ceil(box.y) + 1, width: Math.floor(box.width) - 2, height: Math.floor(box.height) - 2 };
  const hud = await page.screenshot({ clip });
  await seek(page, 240); expect((await page.screenshot({ clip })).equals(hud)).toBe(true);
  await page.evaluate(async () => { const p = '/src/game/events/bridge.ts'; const { commands } = await import(p); commands.emit({ type: 'settings', value: { volume: 0, muted: true, pixelScale: 2, effectsIntensity: 0 } }); });
  await seek(page, 915); expect(await page.evaluate(() => window.__PIXEL__!.atmosphere().motes)).toBe(0);
  await page.evaluate(async () => { const p = '/src/game/events/bridge.ts'; const { commands } = await import(p); commands.emit({ type: 'settings', value: { volume: 0, muted: true, pixelScale: 2, effectsIntensity: 1, reducedMotion: true, reducedFlash: true } }); });
  await page.waitForTimeout(80); expect(await page.evaluate(() => window.__PIXEL__!.atmosphere().motes)).toBe(8);
  await page.screenshot({ path: `${directory}/reduced-${width}.png` });
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.status = 'playing'; w.damagePlayer(1e9); });
  await page.waitForFunction(() => !window.__PIXEL__!.atmosphere().active);
  expect(await page.evaluate(() => window.__PIXEL__!.atmosphere().layers.every(l => !l.visible || l.name === 'atmosphere-embers-ash'))).toBe(true);
  expect(errors).toEqual([]); writeFileSync(`${report}/phases-${width}.json`, JSON.stringify({ rows, errors }, null, 2)); await context.close();
});

test('atmosphere transitions, new chunks and ten run/scene restarts are bounded', async ({ page }) => {
  test.setTimeout(45000); const errors = errorsOn(page); await start(page, 'Warrior');
  await seek(page, 0);
  const initial = await page.evaluate(() => { const a = window.__PIXEL__!.art(); return { textures: a.textures.length - a.chunks, objects: a.objects - a.chunks, listeners: window.__PIXEL__!.listeners() }; });
  const transitions = [];
  for (const startTime of [300, 600, 900]) {
    const samples = await page.evaluate(async startTime => {
      const w = window.__PIXEL__!.world; w.elapsed = startTime; w.pause(); w.player.invulnerableUntil = 1e9;
      const values: ReturnType<NonNullable<Window['__PIXEL__']>['atmosphere']>[] = [];
      await new Promise<void>(resolve => { const frame = () => { values.push(window.__PIXEL__!.atmosphere()); if (w.elapsed < startTime + 5) { w.elapsed = Math.min(startTime + 5, w.elapsed + .025); requestAnimationFrame(frame); } else resolve(); }; requestAnimationFrame(frame); });
      w.pause(); return values;
    }, startTime);
    expect(samples.length).toBeGreaterThan(60); expect(samples.at(-1)!.blend).toBe(1);
    expect(samples.some(s => s.blend > .4 && s.blend < .6)).toBe(true);
    for (let i = 1; i < samples.length; i++) expect(samples[i].blend - samples[i - 1].blend).toBeLessThan(.04);
    transitions.push({ startTime, first: samples[0], last: samples.at(-1) });
  }
  await seek(page, 915);
  for (const x of [50000, -50000, 0]) {
    await page.evaluate(x => { const w = window.__PIXEL__!.world; w.player.x = x; w.player.y = -x; }, x); await page.waitForTimeout(120);
    const a = await page.evaluate(() => window.__PIXEL__!.atmosphere()); expect(a.terrain.every(t => t.tint === a.style.tint)).toBe(true);
  }
  const records = [];
  for (let i = 0; i < 10; i++) {
    // Ordinary run restart must clear a burning phase without a scene rebuild.
    await page.evaluate(async () => { const p = '/src/game/events/bridge.ts'; const { commands } = await import(p); commands.emit({ type: 'restart' }); window.__PIXEL__!.world.pause(); });
    await page.waitForFunction(() => window.__PIXEL__!.atmosphere().phase === 'normal');
    await seek(page, 915);
    await page.evaluate(() => window.__PIXEL__!.restartScene()); await page.waitForFunction(() => window.__PIXEL__?.world.status === 'menu'); await page.waitForTimeout(100);
    const a = await page.evaluate(() => ({ art: window.__PIXEL__!.art(), mood: window.__PIXEL__!.atmosphere(), listeners: window.__PIXEL__!.listeners() }));
    expect(a.art.textures.length - a.art.chunks).toBe(initial.textures); expect(a.art.objects - a.art.chunks).toBe(initial.objects);
    expect(a.listeners).toEqual(initial.listeners); expect(a.art.clock).toEqual([0, 0, 0]); expect(a.art.tweens).toBe(0);
    expect(a.mood).toMatchObject({ active: false, phase: 'normal', motes: 0 }); await expect(page.locator('canvas')).toHaveCount(1);
    records.push({ objects: a.art.objects, textures: a.art.textures.length, mood: a.mood, clock: a.art.clock, listeners: a.listeners });
    await page.locator('.play-button').click(); await page.evaluate(() => window.__PIXEL__!.world.pause());
  }
  await seek(page, 915); await page.addStyleTag({ content: '.overlay{display:none!important}' }); await page.screenshot({ path: `${directory}/warrior-burning-1280.png` });
  expect(errors).toEqual([]); writeFileSync(`${report}/lifecycle.json`, JSON.stringify({ transitions, records, errors }, null, 2));
});

for (const [width, height] of [[1280, 720], [844, 390]]) test(`atmosphere sequential late-run soak and performance ${width}`, async ({ browser, baseURL }) => {
  test.setTimeout(85000); const context = await browser.newContext({ baseURL, viewport: { width, height }, hasTouch: width === 844 }), page = await context.newPage();
  const errors = errorsOn(page); await start(page);
  await page.evaluate(() => {
    const w = window.__PIXEL__!.world; w.elapsed = 870; w.status = 'playing'; w.player.invulnerableUntil = 1e9;
    for (let i = 0; i < 150; i++) { const e = w.spawn((['grunt', 'runner', 'tank', 'caster'] as const)[i % 4], { x: (i % 15 - 7) * 20, y: (Math.floor(i / 15) - 5) * 20 })!; e.hp = e.maxHp = 1e9; }
    for (const [i, kind] of (['charger', 'sorcerer', 'eclipse'] as const).entries()) { const e = w.spawn(kind, { x: 110, y: (i - 1) * 60 })!; e.hp = e.maxHp = 1e9; }
  });
  const result = await page.evaluate(async () => {
    const started = performance.now(), rows: { ms: number; time: number; motes: number; objects: number; update: number; textures: number }[] = []; let previous = started;
    await new Promise<void>(resolve => { const frame = (now: number) => {
      const p = window.__PIXEL__!, a = p.art(); rows.push({ ms: now - previous, time: p.world.elapsed, motes: p.atmosphere().motes, objects: a.objects, update: p.metrics().updateMs, textures: a.textures.length - a.chunks }); previous = now;
      if (now - started < 60000) requestAnimationFrame(frame); else resolve();
    }; requestAnimationFrame(frame); });
    return { rows, metrics: window.__PIXEL__!.metrics(), atmosphere: window.__PIXEL__!.atmosphere(), art: { clock: window.__PIXEL__!.art().clock, tweens: window.__PIXEL__!.art().tweens } };
  });
  const summarize = (min: number, max: number) => {
    const rows = result.rows.filter(r => r.time >= min && r.time < max), times = rows.map(r => r.ms).sort((a, b) => a - b);
    return { frames: times.length, fps: 1000 / (times.reduce((a, b) => a + b, 0) / times.length), median: times[Math.floor(times.length * .5)], p95: times[Math.floor(times.length * .95)], updateP95: rows.map(r => r.update).sort((a, b) => a - b)[Math.floor(rows.length * .95)] };
  };
  const early = summarize(872, 879), burning = summarize(902, 929);
  expect(result.rows.at(-1)!.time - result.rows[0].time).toBeGreaterThan(50); expect(result.metrics).toMatchObject({ enemies: 150, bosses: 3 });
  expect(result.atmosphere.phase).toBe('burning'); expect(result.rows.every(r => r.motes <= (width === 844 ? 18 : 28))).toBe(true);
  expect(Math.max(...result.rows.map(r => r.textures)) - Math.min(...result.rows.map(r => r.textures))).toBeLessThanOrEqual(result.atmosphere.environment.chunks); expect(result.art).toEqual({ clock: [0, 0, 0], tweens: 0 });
  expect(burning.median).toBeLessThan(Math.max(40, early.median * 1.6 + 6)); expect(burning.p95).toBeLessThan(Math.max(100, early.p95 * 2 + 12));
  await page.screenshot({ path: `${directory}/stress-burning-${width}.png` }); expect(errors).toEqual([]);
  writeFileSync(`${report}/soak-${width}.json`, JSON.stringify({ ...result, early, burning, errors }, null, 2)); await context.close();
});
