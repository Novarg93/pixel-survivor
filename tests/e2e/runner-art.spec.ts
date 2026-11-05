import { selectTestCharacter } from '../helpers/character';
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const directory = 'screenshots/runner-pack-01';
async function start(page: Page) {
  await page.goto('/?test=1'); await selectTestCharacter(page, 'Warrior'); await page.getByRole('button', { name: 'Dark Forest', exact: true }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.evaluate(() => { const w = window.__PIXEL__!.world; w.options.spawnRate = 0; for (const a of Object.values(w.abilities)) a.level = 0; });
}
function errorsIn(page: Page) { const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); return errors; }

test('Runner PNG has36 distinct complete poses, hard alpha and transparent frame borders', async ({ page }) => {
  await start(page);
  expect(await page.evaluate(() => window.__PIXEL__!.art().textures.filter(k => k === 'runner' || k === 'runner-walk'))).toEqual([]);
  const art = await page.evaluate(async () => {
    const image = await createImageBitmap(await (await fetch('/assets/hd/runner.png')).blob());
    const data: { frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }> } = await (await fetch('/assets/hd/runner.json')).json();
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64; const g = canvas.getContext('2d', { willReadFrequently: true })!;
    return Object.entries(data.frames).map(([name, { frame: f }]) => {
      g.clearRect(0, 0, 64, 64); g.drawImage(image, f.x, f.y, f.w, f.h, 0, 0, 64, 64); const pixels = g.getImageData(0, 0, 64, 64).data;
      let count = 0, border = 0, soft = 0, hash = 2166136261;
      for (let i = 0; i < pixels.length; i++) { hash = Math.imul(hash ^ pixels[i], 16777619); if (i % 4 === 3 && pixels[i]) { count++; const n = (i - 3) / 4, x = n % 64, y = Math.floor(n / 64); if (x === 0 || x === 63 || y === 0 || y === 63) border++; if (pixels[i] !== 255) soft++; } }
      return { name, count, border, soft, hash: hash >>> 0 };
    });
  });
  expect(art).toHaveLength(36); for (const frame of art) { expect(frame.count, frame.name).toBeGreaterThan(350); expect(frame.border, frame.name).toBe(0); expect(frame.soft, frame.name).toBe(0); }
  expect(new Set(art.map(f => f.hash)).size).toBe(36);
});

test('Runner live idle/walk/hurt/death preserve immediate rewards, pause, size and six death frames', async ({ page }) => {
  mkdirSync(directory, { recursive: true }); const errors = errorsIn(page);
  await start(page); await page.addStyleTag({ content: '.overlay{display:none!important}' });
  const id = await page.evaluate(() => { const w = window.__PIXEL__!.world; return w.spawn('runner', { x: 85, y: 20 }, true)!.id; });
  const walks = await page.evaluate(async id => {
    const frames: string[] = []; const start = performance.now();
    await new Promise<void>(resolve => { const tick = () => { const w = window.__PIXEL__!.world, e = w.enemies.find(e => e.id === id)!; const actor = window.__PIXEL__!.art().actors.find(a => a.x === Math.round(e.x) && a.y === Math.round(e.y) && a.texture === 'hd-runner'); if (actor) frames.push(String(actor.frame)); if (performance.now() - start < 480) requestAnimationFrame(tick); else resolve(); }; requestAnimationFrame(tick); }); return frames;
  }, id);
  expect(new Set(walks.filter(f => f.includes('-walk-'))).size).toBeGreaterThanOrEqual(4);
  await page.evaluate(id => { const w = window.__PIXEL__!.world; const e = w.enemies.find(e => e.id === id)!; e.speed = 0; }, id);
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().actors.some(a => String(a.frame).includes('runner-left-idle')))).toBe(true);
  await page.evaluate(id => { const w = window.__PIXEL__!.world; w.damageEnemy(w.enemies.find(e => e.id === id)!, 1); }, id);
  await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().actors.some(a => String(a.frame).includes('-hurt-')))).toBe(true);
  await page.evaluate(() => window.__PIXEL__!.world.pause());
  await page.screenshot({ path: `${directory}/runner-hurt-1280x720.png` });
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(150); await page.screenshot({ path: `${directory}/runner-hurt-390x844.png` });
  await page.setViewportSize({ width: 1280, height: 720 }); await page.waitForTimeout(150); await page.evaluate(() => window.__PIXEL__!.world.resume());
  const immediate = await page.evaluate(id => {
    const w = window.__PIXEL__!.world, enemy = w.enemies.find(e => e.id === id)!; w.loot.rng.next = () => 0;
    const hp = enemy.hp, stats = { radius: enemy.radius, speed: enemy.speed, damage: enemy.damage }; w.damageEnemy(enemy, 99999);
    return { removed: !w.enemies.includes(enemy), kills: w.kills, xp: w.orbs.reduce((n, o) => n + o.value, 0), loot: w.loot.items.length, corpses: window.__PIXEL__!.art().runner.activeDeaths, hp, stats };
  }, id);
  expect(immediate).toMatchObject({ removed: true, kills: 1, xp: 14, loot: 1, corpses: 0 });
  const deaths = await page.evaluate(async () => {
    const frames: string[] = [], widths: number[] = [], start = performance.now();
    await new Promise<void>(resolve => { const sample = () => { for (const corpse of window.__PIXEL__!.art().runner.corpses) { frames.push(corpse.frame); widths.push(corpse.width); } if (performance.now() - start < 580) requestAnimationFrame(sample); else resolve(); }; requestAnimationFrame(sample); }); return { frames: [...new Set(frames)], widths: [...new Set(widths)] };
  });
  expect(deaths.frames).toHaveLength(6); expect(deaths.widths[0]).toBeCloseTo(22.4); expect(await page.evaluate(() => window.__PIXEL__!.art().runner.activeDeaths)).toBe(0);
  // A second recorded death is frozen with the real world pause for a clear PNG.
  const nextId = await page.evaluate(() => { const w = window.__PIXEL__!.world; w.player.invulnerableUntil = 1e6; w.loot.rng.next = () => 0.9999; return w.spawn('runner', { x: -45, y: 30 })!.id; });
  await page.waitForTimeout(50); await page.evaluate(id => { const w = window.__PIXEL__!.world; w.damageEnemy(w.enemies.find(e => e.id === id)!, 99999); }, nextId);
  await page.waitForTimeout(180); await page.evaluate(() => window.__PIXEL__!.world.pause());
  const frozen = await page.evaluate(() => ({ state: JSON.stringify(window.__PIXEL__!.world), corpse: window.__PIXEL__!.art().runner.corpses[0]?.frame }));
  await page.waitForTimeout(180); expect(await page.evaluate(() => JSON.stringify(window.__PIXEL__!.world))).toBe(frozen.state); expect(await page.evaluate(() => window.__PIXEL__!.art().runner.corpses[0]?.frame)).toBe(frozen.corpse);
  await page.screenshot({ path: `${directory}/runner-death-1280x720.png` }); await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(150); await page.screenshot({ path: `${directory}/runner-death-390x844.png` });
  writeFileSync(`${directory}/animation-evidence.json`, JSON.stringify({ walks, immediate, deaths, frozenDeathFrame: frozen.corpse, errors }, null, 2)); expect(errors).toEqual([]);
});

test('Runner150-death burst stays at24 corpses through ten scene restarts', async ({ page }) => {
  test.setTimeout(45000); const errors = errorsIn(page), records = []; await start(page);
  for (let iteration = 0; iteration < 10; iteration++) {
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.pause(); w.elapsed = 1170; w.loot.rng.next = () => 0.9999; for (let i = 0; i < 150; i++) w.spawn('runner', { x: 100 + i % 15 * 5, y: Math.floor(i / 15) * 5 }); });
    await page.waitForTimeout(80);
    await page.evaluate(() => { const w = window.__PIXEL__!.world; for (const e of [...w.enemies]) w.damageEnemy(e, 99999); });
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().runner.activeDeaths)).toBe(24);
    const { actors, ...art } = await page.evaluate(() => window.__PIXEL__!.art()); records.push({ iteration, ...art, actors: actors.length });
    expect(art.runner.allocatedDeaths).toBe(24); expect(art.runner.replaced).toBe(126); expect(art.runner.tracked).toBe(0);
    expect(await page.evaluate(() => window.__PIXEL__!.world.kills)).toBe(150); expect(await page.evaluate(() => window.__PIXEL__!.world.orbs.length)).toBe(150);
    if (iteration === 0) {
      await page.evaluate(() => { const w = window.__PIXEL__!.world; w.resume(); w.damagePlayer(99999); }); await page.getByRole('button', { name: 'Начать заново' }).click();
      await expect.poll(() => page.evaluate(() => window.__PIXEL__!.art().runner.activeDeaths)).toBe(0); expect(await page.evaluate(() => window.__PIXEL__!.art().runner.tracked)).toBe(0);
    }
    await page.evaluate(() => window.__PIXEL__!.restartScene()); await page.waitForFunction(() => window.__PIXEL__?.world.status === 'menu');
    expect(await page.evaluate(() => window.__PIXEL__!.art().runner.allocatedDeaths)).toBe(0); await expect(page.locator('canvas')).toHaveCount(1);
    expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 });
    await page.getByRole('button', { name: 'Начать забег' }).click();
  }
  for (const record of records.slice(1)) { expect(record.objects).toBe(records[0].objects); expect(record.textureBytes).toBe(records[0].textureBytes); expect(record.clock).toEqual([0, 0, 0]); }
  writeFileSync(`${directory}/death-pool-restarts.json`, JSON.stringify({ records, errors }, null, 2)); expect(errors).toEqual([]);
});
