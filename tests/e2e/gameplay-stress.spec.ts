import { selectTestCharacter } from '../helpers/character';
import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const directory = 'screenshots/gameplay';
for (const seconds of [570,720]) for (const hero of ['Mage', 'Warrior']) for (const width of [1280, 390]) test(`new encounter and rank V sustain 150 live mobs: ${hero}/${width}/${seconds<600?'early':'Enrage'}`, async ({ page }) => {
  test.setTimeout(60000); mkdirSync(directory, { recursive: true }); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.goto('/?test=1'); await selectTestCharacter(page, hero); await page.getByRole('button', { name: 'Начать забег' }).click();
  const guardianShots=await page.evaluateHandle(seconds => {
    const w = window.__PIXEL__!.world; w.elapsed = seconds; w.experience.level = 30; w.player.invulnerableUntil = 1e6; w.encounterDirector.nextAt = 1e6;
    const shots:string[]=[],shoot=w.shoot.bind(w);w.shoot=p=>{const n=w.projectiles.length;shoot(p);if(p.homing&&w.projectiles.length>n)shots.push(p.homing.variant);};
    for (const a of w.abilityDefinitions) w.abilities[a.id].level = 5;
    for (let i = 0; i < 3; i++) w.mobility.upgrade(w, w.character === 'mage' ? 'flame-trail' : 'cleaving-dash');
    for (let i = 0; i < 150; i++) { const e = w.spawn((['grunt', 'runner', 'tank', 'caster', 'rusher', 'splitter'] as const)[i % 6], { x: (i % 15 - 7) * 25, y: (Math.floor(i / 15) - 4) * 25 }, i % 11 === 0)!; e.hp = e.maxHp = 1e6; }
    const e = w.spawn('guardian', { x: 45, y: 0 })!; e.hp = e.maxHp = 1e6; w.damageEnemy(e, 1); w.mobility.activate(w, { x: 1, y: 0 });
    return shots;
  },seconds);
  const samples = [], phases = new Set<string>();
  for (let i = 0; i < 12; i++) {
    const key = ['d', 's', 'a', 'w'][i % 4]; await page.keyboard.down(key); await page.waitForTimeout(1000); await page.keyboard.up(key);
    const sample = await page.evaluate(() => { const w = window.__PIXEL__!.world; return { ...window.__PIXEL__!.metrics(), phase: w.guardianSystem.encounter?.phase ?? '', homing:w.projectiles.filter(p=>p.homing).length,hostile:w.projectiles.filter(p=>p.hostile).length, impacts: w.impacts.length, clock: window.__PIXEL__!.art().clock }; });
    samples.push(sample); phases.add(sample.phase); expect(sample.enemies).toBeLessThanOrEqual(150); expect(sample.projectiles).toBeLessThanOrEqual(96);expect(sample.hostile).toBeLessThanOrEqual(48);expect(sample.homing).toBeLessThanOrEqual(2); expect(sample.effects).toBeLessThanOrEqual(96); expect(sample.impacts).toBeLessThanOrEqual(24); expect(sample.clock).toEqual([0, 0, 0]);
  }
  const orbShots=await guardianShots.evaluate(s=>s);expect(phases.has('orbs')).toBe(true);expect(orbShots[0]).toBe('slow');expect(phases.has('beam')).toBe(false);expect(phases.has('meteor-warning')).toBe(false);expect(samples.some(s => s.enemies === 150)).toBe(true);
  const suffix=seconds<600?'':'-enrage';await page.screenshot({ path: `${directory}/stress-${hero}-${width}${suffix}.png` });
  const fps = samples.slice(2).map(s => s.fps).sort((a, b) => a - b), ms = samples.slice(2).map(s => s.updateMs).sort((a, b) => a - b);
  writeFileSync(`${directory}/stress-${hero}-${width}${suffix}.json`, JSON.stringify({ fixture: `From${seconds}s,12 real seconds,150 high-HP regulars,rankV,invulnerability,one active stationary Guardian,one mobility cast,square keyboard pilot;not a human balance trial`,orbShots, medianFps: fps[Math.floor(fps.length / 2)], p95UpdateMs: ms[Math.floor(ms.length * .95)], samples, errors }, null, 2));
  if (hero === 'Mage' && width === 390) for (let i = 0; i < 10; i++) {
    await page.evaluate(() => window.__PIXEL__!.restartScene()); await page.getByRole('button', { name: 'Начать забег' }).click();
    await page.keyboard.press('Space'); await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.mobility.sequence)).toBe(1);
    expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual({ commands: 1, snapshots: 1, metrics: 1 }); expect(await page.evaluate(() => window.__PIXEL__!.art().clock)).toEqual([0, 0, 0]);
  }
  expect(errors).toEqual([]);
});
