import { expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { World } from '../../src/game/systems/World';
import { updateBoss } from '../../src/game/systems/BossSystem';
import { CHARGE_BOSS as C } from '../../src/game/config/chargeBoss';
import { ENEMIES } from '../../src/game/config/enemyDefinitions';
import { scalesAt } from '../../src/game/systems/DifficultyDirector';
import { drawChargePreparation } from '../../src/game/art/EncounterArt';
import { BossAnimation } from '../../src/game/art/BossAnimation';

function setup(minute = 3, character: 'mage' | 'warrior' = 'mage') {
  const w = new World(12345, { spawnRate: 0, character }); w.elapsed = minute * 60; w.encounterDirector.nextAt = 1e6;
  for (const a of Object.values(w.abilities)) a.level = 0;
  w.player.x = 160; const e = w.spawn('charger', { x: 0, y: 0 })!; e.boss!.until = w.elapsed;
  const advance = (dt: number) => { w.elapsed += dt; updateBoss(w, e, dt); };
  const launch = () => { updateBoss(w, e, .01); advance(C.windup); expect(e.boss!.phase).toBe('charge'); };
  return { w, e, advance, launch };
}
it('pursues inside the old 150px stopping range and emits one warning sound per attempt', () => {
  const { w, e, advance } = setup(); w.player.x = 100; e.boss!.until = w.elapsed + 10;
  advance(.05); expect(e.x).toBeCloseTo(2.4);
  e.boss!.until = w.elapsed; advance(.05); advance(.1); expect(w.sounds.filter(s => s === 'charge')).toHaveLength(1);
});
it('warns for exactly0.5s, locks at the end, then never homes toward a new target', () => {
  const { w, e, advance } = setup(); updateBoss(w, e, .01); const start = w.elapsed;
  w.player.y = 80; advance(.499); expect(e.boss!.phase).toBe('windup');
  w.player.y = 120; advance(.001); expect(w.elapsed - start).toBeCloseTo(.5);
  expect(e.boss!.phase).toBe('charge'); expect(e.boss!.direction).toEqual({ x: .8, y: .6 });
  const locked = { ...e.boss!.direction }; w.player.x = -500; w.player.y = -500;
  advance(.05); expect(e.boss!.direction).toEqual(locked); expect(e.x).toBeCloseTo(144 * .05 * .8); expect(e.y).toBeCloseTo(144 * .05 * .6);
});
it.each([3, 5, 7, 9, 10])('uses base multipliers and completion-based cooldown/recovery at minute%i', minute => {
  const { w, e, advance, launch } = setup(minute); launch(); const frequency = e.boss!.aggression!.frequency;
  expect(e.boss!.charge!.speed).toBeCloseTo(24 * 2 * 3 * e.boss!.aggression!.movement);
  advance(C.duration); const finish = w.elapsed;
  expect(e.boss!.phase).toBe('recover'); expect(e.boss!.until - finish).toBeCloseTo(.6 / frequency);
  expect(e.boss!.charge!.nextAt - finish).toBeCloseTo(5 / frequency);
  w.player.x = e.x + 200; advance(.6 / frequency + .00001); expect(e.boss!.phase).toBe('approach');
  w.player.x = e.x + 200; w.elapsed = finish + 5 / frequency - .00001; updateBoss(w, e, .001); expect(e.boss!.phase).toBe('approach');
  w.player.x = e.x + 200; w.elapsed = finish + 5 / frequency; updateBoss(w, e, .001); expect(e.boss!.phase).toBe('windup');
  expect(e.boss!.until - w.elapsed).toBeCloseTo(.5);
});
it('sweeps a large delta once, caps charge distance and never replays a backlog of attacks', () => {
  const { w, e, advance, launch } = setup(10); launch(); const hp = w.player.hp;
  advance(20); expect(e.x).toBeCloseTo(C.maxDistance); expect(e.y).toBe(0); expect(w.player.hp).toBeLessThan(hp);
  expect(e.boss!.phase).toBe('recover'); expect(e.boss!.charge!.nextAt).toBeCloseTo(w.elapsed + C.cooldown/e.boss!.aggression!.frequency);
  expect(w.sounds.filter(s => s === 'charge')).toHaveLength(1);
});
it('allows at most one contact per charge, including absorbed/protected contacts', () => {
  for (const protectedHit of [false, true]) {
    const { w, e, advance, launch } = setup(); launch(); let attempts = 0;
    const original = w.damagePlayer.bind(w); w.damagePlayer = n => { attempts++; return original(n); };
    if (protectedHit) w.mobility.protectedUntil = w.elapsed + .2;
    const hp = w.player.hp;
    for (let i = 0; i < 12; i++) { w.player.x = e.x + 1; advance(.1); }
    expect(attempts).toBe(1); expect(w.player.hp).toBe(protectedHit ? hp : hp - e.damage * 1.25);
  }
});
it.each(['walk', 'mage', 'warrior'] as const)('can dodge with %s using real movement and no test invulnerability', mode => {
  const { w, e, launch } = setup(10, mode === 'warrior' ? 'warrior' : 'mage'); w.player.x = 210; launch();
  const hp = w.player.hp;
  if (mode !== 'walk') expect(w.mobility.activate(w, { x: 0, y: 1 })).toBe(true);
  while (e.boss!.phase === 'charge') w.step(.05, { x: 0, y: 1 });
  expect(w.player.hp).toBe(hp); expect(w.player.y).toBeGreaterThan(30); expect(w.player.invulnerableUntil).toBe(0);
});
it('preserves HP/damage scaling, pauses exactly, and clears charge state on death and teardown', () => {
  const { w, e, advance, launch } = setup(10), scale = scalesAt(600);
  expect(e.hp).toBe(ENEMIES.charger.hp * scale.hp); expect(e.damage).toBe(ENEMIES.charger.damage * scale.damage);
  launch(); const state = JSON.stringify(e); w.pause(); updateBoss(w, e, 10); w.step(10); expect(JSON.stringify(e)).toBe(state);
  w.resume(); advance(.05); w.damageEnemy(e, 1e9); expect(e.boss!.charge).toBeUndefined(); const at = e.x; advance(100); expect(e.x).toBe(at);
  const next = w.spawn('charger')!; next.boss!.until = w.elapsed; updateBoss(w, next, .01); expect(next.boss!.charge).toBeDefined(); w.clearTemporaryState(); expect(next.boss!.charge).toBeUndefined();
});
it('uses only local pixel sparks, keeps windup readable under damage and draws no future path', () => {
  const { w, e } = setup(), art = new BossAnimation(); art.prepare(w); updateBoss(w, e, .01); w.elapsed += .05; w.damageEnemy(e, 1);
  expect(art.view(e, w).pose).toBe('windup');
  const g = { fillStyle: vi.fn().mockReturnThis(), fillRect: vi.fn().mockReturnThis() };
  drawChargePreparation(g as unknown as Phaser.GameObjects.Graphics, w, e);
  expect(g.fillRect).toHaveBeenCalledTimes(8);
  for (const [x, y, width, height] of g.fillRect.mock.calls) { expect(Math.abs(x - e.x)).toBeLessThan(25); expect(Math.abs(y - e.y)).toBeLessThan(20); expect(width).toBeLessThanOrEqual(3); expect(height).toBe(2); }
  w.damageEnemy(e, 1e9); g.fillRect.mockClear(); drawChargePreparation(g as unknown as Phaser.GameObjects.Graphics, w, e); expect(g.fillRect).not.toHaveBeenCalled();
});
it('does not skip the warning on a huge World delta; rejects invalid deltas and clears on player death', () => {
  const { w, e } = setup(); updateBoss(w, e, .01); const start = w.elapsed;
  w.step(100); expect(w.elapsed - start).toBeCloseTo(.05); expect(e.boss!.phase).toBe('windup');
  const before = JSON.stringify(e); for (const dt of [NaN, Infinity, -1, 0]) updateBoss(w, e, dt); expect(JSON.stringify(e)).toBe(before);
  w.damagePlayer(1e9); expect(w.status).toBe('over'); expect(e.boss!.charge).toBeUndefined();
  const x = e.x; updateBoss(w, e, 10); expect(e.x).toBe(x);
});
it('uses a finite fallback direction for a point-blank charge', () => {
  const { w, e, launch, advance } = setup(); w.player.x = w.player.y = 0;
  launch(); expect(Math.hypot(e.boss!.direction.x, e.boss!.direction.y)).toBe(1);
  advance(.05); expect(Math.hypot(e.x, e.y)).toBeGreaterThan(0);
});
