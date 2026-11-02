import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { World } from '../../src/game/systems/World';

const phase = process.env.PIXEL_BALANCE_PHASE ?? 'after', directory = `screenshots/combat-balance-2/${phase}`;
for (const width of [1280, 390]) for (const moving of [false, true]) test(`Mage39 real 10-12min survival, no test invulnerability: ${width}/${moving ? 'moving' : 'AFK'}`, async ({ page }) => {
  test.setTimeout(155000); mkdirSync(directory, { recursive: true }); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width, height: width === 390 ? 844 : 720 }); await page.goto('/?test=1'); await page.getByRole('button', { name: 'Начать забег' }).click();
  const trial = await page.evaluateHandle(async moving => {
    const worldPath = '/src/game/systems/World.ts', fixturePath = '/tests/helpers/combatBalance.ts';
    const { World: Constructor } = await import(worldPath), { strongMage } = await import(fixturePath);
    const w: World = window.__PIXEL__!.world; Object.assign(w, new Constructor(12345)); strongMage(w);
    // Enhanced variant: the user killed three Guardians. Allow three legal damage artifacts.
    const upgradePath = '/src/game/systems/UpgradeSystem.ts', { applyUpgrade } = await import(upgradePath);
    w.upgrades.pickup--; w.stats.pickup -= 20; applyUpgrade(w, 'evolve-fireball'); for (let i = 0; i < 3; i++) w.artifacts.grant(w, 'damage');
    w.elapsed = 600; w.encounterDirector.nextAt = 1e6;
    const state = { hits: 0, blocked: 0, attempts: 0, shots: 0, rushWindups: 0, peak: 0, projectiles: 0, effects: 0, seconds: 0, hp: w.player.hp, score: 0, kills: 0, status: 'playing', mobilityUses: 0 };
    const damage = w.damagePlayer.bind(w), shoot = w.shoot.bind(w), step = w.step.bind(w), windups = new Set<number>();
    w.damagePlayer = amount => { state.attempts++; const before = w.player.hp, shield = w.shield.charges, accepted = damage(amount); if (w.player.hp < before) state.hits++; if (w.shield.charges < shield) state.blocked++; return accepted; };
    w.shoot = p => { if (p.hostile) state.shots++; shoot(p); };
    w.step = dt => {
      if (w.status === 'upgrade') { w.status = 'playing'; w.experience.pending = 0; w.experience.level = 39; w.choices = []; }
      const input = moving ? { x: Math.cos((w.elapsed - 600) * .12), y: Math.sin((w.elapsed - 600) * .12) } : { x: 0, y: 0 };
      if (moving) w.mobility.activate(w, input); step(dt, input);
      for (const e of w.enemies) if (e.rush?.phase === 'windup' && !windups.has(e.id)) { windups.add(e.id); state.rushWindups++; }
      state.peak = Math.max(state.peak, w.regularCount); state.projectiles = Math.max(state.projectiles, w.projectiles.length); state.effects = Math.max(state.effects, w.effects.length);
      state.seconds = w.elapsed - 600; state.hp = w.player.hp; state.score = w.score; state.kills = w.kills; state.status = w.status; state.mobilityUses = w.mobility.sequence;
      if (state.seconds >= 120) w.pause();
    };
    return state;
  }, moving);
  const samples = []; let captured = false;
  for (let second = 0; second < 140; second++) {
    await page.waitForTimeout(1000); const state = await trial.evaluate(s => ({ ...s })); samples.push({ ...state, metrics: await page.evaluate(() => window.__PIXEL__!.metrics()) });
    if (!captured && (state.seconds >= 25 || state.status === 'over')) {
      await page.screenshot({ path: `${directory}/mage39-${width}-${moving ? 'moving' : 'AFK'}.png` }); await page.locator('canvas').screenshot({ path: `${directory}/mage39-canvas-${width}-${moving ? 'moving' : 'AFK'}.png` }); captured = true;
    }
    if (state.status === 'over' || state.seconds >= 120) break;
  }
  const result = await trial.evaluate(s => ({ ...s })); expect(result.seconds >= 119.9 || result.status === 'over').toBe(true);
  expect(result.peak).toBeLessThanOrEqual(150); expect(result.projectiles).toBeLessThanOrEqual(96); expect(result.effects).toBeLessThanOrEqual(96); expect(result.kills).toBeGreaterThan(0); expect(errors).toEqual([]);
  writeFileSync(`${directory}/mage39-${width}-${moving ? 'moving' : 'AFK'}.json`, JSON.stringify({ fixture: 'Actual Phaser RAF, fixed seed12345 Mage39, enhanced legal38 choices +3 damage artifacts; regular waves isolated, no test invulnerability, real loot and shield; circular pilot + mobility versus stationary', result, samples, errors }, null, 2));
});
