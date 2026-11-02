import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus, totalmem } from 'node:os';
const directory = 'screenshots/hd-rework/pack-08';
test('final live scale3 stress: eight class/map/viewport cases with attacks on, travel and ten restarts', async ({ page, browser }) => {
  test.setTimeout(120000); mkdirSync(directory, { recursive: true }); const results = [], restarts = [], errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  for (const hero of ['Mage', 'Warrior']) for (const dark of [false, true]) for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.goto('/?test=1');
    await page.getByRole('button', { name: 'Настройки', exact: true }).click(); await page.getByRole('button', { name: '3×', exact: true }).click(); await page.getByRole('button', { name: 'Готово' }).click();
    await page.getByRole('button', { name: new RegExp('^' + hero) }).click(); await page.getByRole('button', { name: dark ? 'Dark Forest' : 'Роща осколков', exact: true }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
    await page.evaluate(async () => {
      const url = '/src/game/utils/SeededRandom.ts', { SeededRandom } = await import(/* @vite-ignore */ url), rng = new SeededRandom(12345);
      const w = window.__PIXEL__!.world; w.rng.next = () => rng.next(); w.elapsed = 1200; w.experience.level = 30; w.options.spawnRate = 0; w.bossScheduler.nextAt = w.guardianSystem.nextAt = 1e6; w.player.invulnerableUntil = 1e6;
      for (const a of Object.values(w.abilities)) a.level = 3; for (const id of ['health', 'damage', 'speed', 'cooldown', 'experience'] as const) w.artifacts.grant(w, id);
      w.loot.grant(w, 'haste'); w.loot.grant(w, 'fury');
      for (let i = 0; i < 150; i++) w.spawn((['grunt', 'runner', 'tank', 'caster', 'rusher', 'splitter'] as const)[i % 6], { x: (i % 15 - 7) * 24, y: (Math.floor(i / 15) - 4.5) * 24 }, i % 13 === 0);
      w.spawn('guardian', { x: -65, y: -65 }); w.spawn('charger', { x: -100, y: 65 }); w.spawn('sorcerer', { x: 100, y: -65 }); w.spawn('eclipse', { x: 0, y: -140 });
      w.loot.spawnChest(w, { x: 75, y: 75 }, 'boss'); w.loot.drop(w, 'healing', { x: -75, y: 75 }); w.artifacts.drop(w, { x: 0, y: 90 });
    });
    await page.waitForTimeout(500);
    const sampling = page.evaluate(async () => {
      const frames: number[] = [], updates: number[] = [], start = performance.now(); let last = start, replenished = 0, maxProjectiles = 0, maxEffects = 0, maxOrbs = 0, minMobs = 150, maxObjects = 0, heldUpgrades = 0;
      await new Promise<void>(resolve => { const tick = (now: number) => {
        const w = window.__PIXEL__!.world;
        // Fixed-loadout performance fixture: real kills may now reach another
        // XP threshold. Validate the offer, then hold the same five rankIII skills
        // instead of measuring a paused picker or silently changing the workload.
        if (w.status === 'upgrade') {
          if (w.choices.length !== 3 || w.player.hp <= 0) throw new Error('Invalid stress upgrade transition');
          w.experience.pending = 0; w.choices = []; w.status = 'playing'; heldUpgrades++;
        }
        // Test-only refill keeps the real combat renderer at its150mob cap after kills.
        while (w.regularCount < 150) { const i = replenished++, a = i * 2.4; w.spawn((['grunt', 'runner', 'tank', 'caster', 'rusher', 'splitter'] as const)[i % 6], { x: w.player.x + Math.cos(a) * 160, y: w.player.y + Math.sin(a) * 160 }, i % 13 === 0); }
        frames.push(now - last); last = now; updates.push(window.__PIXEL__!.metrics().updateMs); minMobs = Math.min(minMobs, w.regularCount); maxProjectiles = Math.max(maxProjectiles, w.projectiles.length); maxEffects = Math.max(maxEffects, w.effects.length); maxOrbs = Math.max(maxOrbs, w.orbs.length); maxObjects = Math.max(maxObjects, window.__PIXEL__!.art().objects);
        if (now - start < 6000) requestAnimationFrame(tick); else resolve();
      }; requestAnimationFrame(tick); });
      const f = frames.slice(1).sort((a, b) => a - b), u = updates.sort((a, b) => a - b), { actors, ...art } = window.__PIXEL__!.art();
      return { fps: f.length * 1000 / f.reduce((a, b) => a + b, 0), frameMsP95: f[Math.floor(f.length * .95)], updateMsP95: u[Math.floor(u.length * .95)], minMobs, maxProjectiles, maxEffects, maxOrbs, maxObjects, replenished, heldUpgrades, kills: window.__PIXEL__!.world.kills, playing: window.__PIXEL__!.world.status, abilities: window.__PIXEL__!.world.snapshot().abilities.map(a => ({ id: a.id, level: a.level, readyIn: a.readyIn })), actors: actors.length, art };
    });
    for (const key of ['d', 's', 'a', 'w']) { await page.keyboard.down(key); await page.waitForTimeout(1250); await page.keyboard.up(key); }
    const result = await sampling; expect(result.minMobs).toBe(150); expect(result.playing).toBe('playing'); expect(result.kills).toBeGreaterThan(0); expect(result.maxProjectiles).toBeLessThanOrEqual(96); expect(result.maxEffects).toBeLessThanOrEqual(96); expect(result.maxOrbs).toBeLessThanOrEqual(240); expect(result.abilities).toHaveLength(5); expect(result.abilities.every(a => a.level === 3)).toBe(true);
    results.push({ hero, dark, width, ...result }); await page.screenshot({ path: `${directory}/live-${hero}-${dark ? 'forest' : 'grove'}-${width}.png` });
  }
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => window.__PIXEL__!.restartScene()); await page.waitForFunction(() => window.__PIXEL__?.world.status === 'menu'); await page.getByRole('button', { name: 'Начать забег' }).click();
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.elapsed = 1200; w.pause(); for (let i = 0; i < 150; i++) w.spawn('tank', { x: i % 15 * 20, y: Math.floor(i / 15) * 20 }); });
    expect(await page.evaluate(() => window.__PIXEL__!.world.regularCount)).toBe(150);
    for (const x of [50000, -50000, 0]) { await page.evaluate(x => { const w = window.__PIXEL__!.world; w.player.x = x; w.player.y = -x; }, x); await page.waitForTimeout(60); }
    const art = await page.evaluate(() => { const { actors, ...a } = window.__PIXEL__!.art(); return { ...a, actors: actors.length }; }); restarts.push(art); expect(art.actors).toBe(151); expect(art.shadows).toBe(151); expect(art.clock).toEqual([0, 0, 0]); expect(art.tweens).toBe(0); expect(art.loot.allocated).toBe(0); expect(art.bosses.allocatedDeaths).toBe(0); await expect(page.locator('canvas')).toHaveCount(1); expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 });
  }
  for (const art of restarts.slice(1)) { expect(art.objects).toBe(restarts[0].objects); expect(art.textures).toEqual(restarts[0].textures); expect(art.textureBytes).toBe(restarts[0].textureBytes); expect(art.blurListeners).toBe(restarts[0].blurListeners); }
  const renderer = await page.evaluate(() => { const gl = document.querySelector('canvas')!.getContext('webgl2') ?? document.querySelector('canvas')!.getContext('webgl'), ext = gl?.getExtension('WEBGL_debug_renderer_info'); return gl && ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'unavailable'; });
  writeFileSync(`${directory}/live-stress.json`, JSON.stringify({ measuredAt: new Date().toISOString(), cpu: cpus()[0]?.model, ramGiB: totalmem() / 1024 ** 3, browser: browser.version(), renderer, seed: 12345, setup: 'DPR1/pixelScale3; actual AI and five rank3 autoattacks ON; moving keyboard pilot; invulnerability; initial150mixed+3boss+Guardian+loot+5artifacts+buffs; test refill after kills keeps150. 0.5s warmup+6s RAF. No normal balance/phone/VRAM claim.', results, restarts, errors }, null, 2)); expect(errors).toEqual([]);
});
