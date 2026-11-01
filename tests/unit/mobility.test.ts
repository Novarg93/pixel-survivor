import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { MobilitySystem } from '../../src/game/systems/MobilitySystem';
import { MOBILITY } from '../../src/game/config/encounters';

it.each(['mage', 'warrior'] as const)('%s uses input direction, exact bounded distance and a separate cooldown', character => {
  const w = new World(1, { character }), m = new MobilitySystem();
  expect(m.activate(w, { x: 1, y: 1 })).toBe(true);
  for (let i = 0; i < 20; i++) m.update(w, .01);
  expect(Math.hypot(w.player.x, w.player.y)).toBeCloseTo(MOBILITY[character].distance);
  expect(w.player.x).toBeCloseTo(w.player.y);
  expect(m.activate(w)).toBe(false);
  w.elapsed = MOBILITY[character].cooldown - .001; expect(m.activate(w)).toBe(false);
  w.elapsed += .001; expect(m.activate(w)).toBe(true);
  expect(w.abilityDefinitions).toHaveLength(5);
});
it.each(['menu', 'paused', 'upgrade', 'over'] as const)('cannot activate in %s or bank a cast', status => {
  const w = new World(), m = new MobilitySystem(); w.status = status;
  expect(m.activate(w)).toBe(false); expect(m.sequence).toBe(0); expect(m.readyAt).toBe(0);
});
it('uses last facing at rest and scales Blink to both mobile pixel scales', () => {
  for (const width of [195, 130]) {
    const w = new World(), m = new MobilitySystem(); w.width = width; w.height = 422; w.facing = { x: -1, y: 0 };
    m.activate(w); expect(w.player.x).toBeCloseTo(-width * .38); expect(w.player.y).toBe(0);
    expect(m.protectedUntil).toBe(.18); expect(m.protectedUntil).toBeLessThan(m.readyAt * .04);
  }
});
it('clears an in-flight dash, protection, cooldown and visual state', () => {
  const w = new World(1, { character: 'warrior' }), m = new MobilitySystem(); m.activate(w); m.clear();
  expect(m.remaining).toBe(0); expect(m.protectedUntil).toBe(0); expect(m.readyAt).toBe(0); expect(m.started).toBe(-Infinity);
});
it.each(['mage', 'warrior'] as const)('%s has short real damage protection and freezes cooldown/movement on pause and upgrade', character => {
  const w = new World(2, { character, spawnRate: 0 }), m = w.mobility;
  for (const a of Object.values(w.abilities)) a.level = 0;
  m.activate(w, { x: 1, y: 0 }); const hp = w.player.hp;
  expect(w.damagePlayer(20)).toBe(false); w.pause(); const now = w.elapsed, x = w.player.x, ready = m.snapshot(w).readyIn;
  w.step(1); expect(w.elapsed).toBe(now); expect(w.player.x).toBe(x); expect(m.snapshot(w).readyIn).toBe(ready);
  w.resume(); w.gainXp(20); w.step(.05); expect(w.player.x).toBe(x); expect(m.activate(w)).toBe(false); w.selectUpgrade(w.choices[0].id);
  w.elapsed = m.protectedUntil + .001; expect(w.damagePlayer(20)).toBe(true); expect(w.player.hp).toBeLessThan(hp);
  w.player.invulnerableUntil = 0; w.damagePlayer(1e6); expect(w.status).toBe('over'); expect(m.remaining).toBe(0); expect(m.protectedUntil).toBe(0);
});
