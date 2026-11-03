import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
const directory = 'screenshots/gameplay/ranks';
for (const hero of ['Mage', 'Warrior']) for (const width of [1280, 390]) test(`${hero} all five real casts rank I/V remain readable at ${width}`, async ({ page }) => {
  test.setTimeout(60000); mkdirSync(directory, { recursive: true }); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.goto('/?test=1'); await page.getByRole('button', { name: new RegExp('^' + hero) }).click(); await page.getByRole('button', { name: 'Начать забег' }).click();
  await page.addStyleTag({ content: '.overlay{display:none!important}' });
  const ids = await page.evaluate(() => window.__PIXEL__!.world.abilityDefinitions.map(a => a.id)), records = [];
  for (const id of ids) {
    const hashes = [];
    for (const rank of [1, 5]) {
      const actual = await page.evaluate(({ id, rank }) => {
        const w = window.__PIXEL__!.world; w.resume(); w.elapsed = Math.ceil(Math.max(40, w.elapsed)) + 2; w.player.x = w.player.y = 0; w.player.invulnerableUntil = 1e6; w.options.spawnRate = 0; w.encounterDirector.nextAt = 1e6;
        w.enemies = []; w.effects = []; w.impacts = []; w.projectiles = []; w.zones = []; w.shield.clearAbsorb(); w.warrior.bladesUntil = w.warrior.ironUntil = w.warrior.whirlwindUntil = 0;
        for (const a of Object.values(w.abilities)) { a.level = 0; a.readyAt = 0; }
        w.abilities[id].level = rank;
        const x = id === 'fireball' ? 160 : id === 'cleave' ? 45 : id === 'meteor' || id === 'slam' ? 0 : 60;
        for (let i = 0; i < 3; i++) { const e = w.spawn('tank', { x: x + i * 15, y: i * 15 - 15 })!; e.hp = e.maxHp = 1e6; e.speed = 0; }
        w.step(.05); if (id === 'fireball') { w.step(.05); w.step(.05); }
        w.pause(); w.elapsed += .06;
        return { level: w.abilities[id].level, readyAt: w.abilities[id].readyAt, projectiles: w.projectiles.length, effects: w.effects.length, impacts: w.impacts.map(i => ({ radius: i.radius, damage: i.damage })), stats: { ...w.stats } };
      }, { id, rank });
      expect(actual.readyAt).toBeGreaterThan(40); expect(actual.level).toBe(rank);
      await page.waitForTimeout(130);
      const frozen = await page.evaluate(() => JSON.stringify(window.__PIXEL__!.world)); await page.waitForTimeout(50); expect(await page.evaluate(() => JSON.stringify(window.__PIXEL__!.world))).toBe(frozen);
      const buffer = await page.locator('canvas').screenshot({ path: `${directory}/${id}-rank${rank}-${width}.png` }); hashes.push(createHash('sha256').update(buffer).digest('hex')); records.push({ id, rank, actual });
      if (id === 'meteor' || id === 'slam') {
        await page.evaluate(() => { const w = window.__PIXEL__!.world; w.resume(); for (let i = 0; i < 18; i++) w.step(.05); w.pause(); });
        await page.waitForTimeout(80); await page.locator('canvas').screenshot({ path: `${directory}/${id}-impact-rank${rank}-${width}.png` });
      }
    }
    expect(hashes[0]).not.toBe(hashes[1]);
  }
  const layers = await page.evaluate(() => window.__PIXEL__!.art().layers); expect(layers.find(l => l.name === 'hostile-tells')!.depth).toBeGreaterThan(layers.find(l => l.name === 'friendly-feedback')!.depth);
  expect(errors).toEqual([]); writeFileSync(`${directory}/${hero}-${width}.json`, JSON.stringify({ records, errors }, null, 2));
});
