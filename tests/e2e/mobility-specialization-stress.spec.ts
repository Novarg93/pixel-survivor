import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { MOBILITY_UPGRADES } from '../../src/game/config/mobilityUpgrades';

test('all six specializations sustain repeated real cooldown casts at150+3+3 on desktop/mobile', async ({ page }) => {
  test.setTimeout(180000); const directory = 'screenshots/mobility-specializations-hud'; mkdirSync(directory, { recursive: true });
  const results = [], errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  for (const variant of MOBILITY_UPGRADES) for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.goto('/?test=1');
    await page.getByRole('button', { name: new RegExp('^' + (variant.character === 'mage' ? 'Mage' : 'Warrior')) }).click();
    await page.getByRole('button', { name: 'Начать забег' }).click();
    await page.evaluate(variant => {
      const w = window.__PIXEL__!.world; w.options.spawnRate = 0; w.experience.level = 39; w.elapsed = 720;
      w.encounterDirector.nextAt = 720; w.encounterDirector.update(w); w.encounterDirector.nextAt = 1e6;
      for (const a of w.abilityDefinitions) w.abilities[a.id].level = 5;
      w.stats.cooldown = .35; w.player.invulnerableUntil = 1e6; // Constant performance load only.
      for (let i = 0; i < 150; i++) w.spawn((['grunt', 'runner', 'tank', 'caster', 'rusher', 'splitter'] as const)[i % 6], { x: (i % 15 - 7) * 23, y: (Math.floor(i / 15) - 4) * 23 }, i % 11 === 0);
      for (const e of w.enemies) e.hp = e.maxHp = 1e9;
      w.guardians.forEach((g, i) => { g.x = i === 1 ? 100 : 0; g.y = (i - 1) * 130; g.discovered = true; w.damageEnemy(g, 1); });
      for (let rank = 0; rank < 3; rank++) if (!w.mobility.upgrade(w, variant.id)) throw new Error('Invalid stress specialization');
    }, variant);
    const samples = [];
    for (let i = 0; i < 8; i++) {
      const key = ['d', 's', 'a', 'w'][i % 4]; await page.keyboard.down(key); await page.keyboard.press('Space'); await page.waitForTimeout(750); await page.keyboard.up(key);
      const sample = await page.evaluate(() => { const w = window.__PIXEL__!.world, art = window.__PIXEL__!.art(); return { ...window.__PIXEL__!.metrics(), casts: w.mobility.sequence, activeGuardians: w.guardianSystem.encounters.size, hazards: w.impacts.length + w.zones.length, walls: w.zones.filter(z => z.wall).length, wallTargets: Math.max(0, ...w.zones.filter(z => z.wall).map(z => z.wall!.nextHit.size)), healthObjects: art.playerHealth.objects, clock: art.clock }; });
      expect(sample.enemies).toBe(150); expect(sample.bosses).toBe(3); expect(sample.guardians).toBe(3); expect(sample.activeGuardians).toBe(3);
      expect(sample.projectiles).toBeLessThanOrEqual(96); expect(sample.effects).toBeLessThanOrEqual(96); expect(sample.hazards).toBeLessThanOrEqual(24); expect(sample.walls).toBeLessThanOrEqual(2); expect(sample.wallTargets).toBeLessThanOrEqual(156); expect(sample.healthObjects).toBe(1); expect(sample.clock).toEqual([0, 0, 0]); samples.push(sample);
    }
    expect(samples.at(-1)!.casts).toBeGreaterThanOrEqual(3);
    if (variant.id === 'flame-trail' || variant.id === 'slowing-flame') expect(samples.slice(2).some(s => s.walls > 0)).toBe(true);
    await page.screenshot({ path: `${directory}/stress-${variant.id}-${width}.png` });
    const old = await page.evaluateHandle(() => window.__PIXEL__!.world);
    await page.evaluate(() => window.__PIXEL__!.restartScene()); await expect(page.getByRole('button', { name: 'Начать забег' })).toBeVisible();
    expect(await old.evaluate(w => [w.zones.length, w.mobility.absorbValue(w.elapsed), w.buffs.snapshot(w.elapsed).length])).toEqual([0, 0, 0]);
    expect(await page.evaluate(() => window.__PIXEL__!.art().playerHealth.objects)).toBe(1);
    expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 });
    const fps = samples.slice(2).map(s => s.fps).sort((a, b) => a - b), ms = samples.slice(2).map(s => s.updateMs).sort((a, b) => a - b);
    results.push({ variant: variant.id, width, medianFps: fps[Math.floor(fps.length / 2)], p95UpdateMs: ms.at(-1), samples });
  }
  expect(errors).toEqual([]);
  writeFileSync(`${directory}/specialization-stress.json`, JSON.stringify({ fixture: '6real seconds per condition, synthetic shared cooldown floor with real deadlines respected,150highHP regulars+3bosses+3active Guardians; invulnerability only to hold load; no survival claim', results, errors }, null, 2));
});
