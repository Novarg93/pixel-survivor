import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { SlamPresentation } from '../../src/game/art/WarriorMagic';
import { groundSlam } from '../../src/game/abilities/warrior';
it('typed slam presentation observes real impact, immediate damage and bounded expiry without world mutation', () => {
  const w = new World(42, { character: 'warrior', spawnRate: 0 }), art = new SlamPresentation();
  const enemy = w.spawn('tank', { x: 40, y: 0 })!; enemy.hp = enemy.maxHp = 1000; enemy.speed = 0;
  for (const a of Object.values(w.abilities)) a.level = 0;
  w.abilities.slam.level = 1; expect(groundSlam(w)).toBe(true); art.prepare(w);
  const before = JSON.stringify(w); art.prepare(w); art.update(w); expect(JSON.stringify(w)).toBe(before);
  for (let i = 0; i < 14; i++) w.step(.05);
  art.update(w); expect(enemy.hp).toBeLessThan(1000); expect(art.bursts).toHaveLength(1);
  expect(w.snapshot().damageByAbility.find(a => a.id === 'slam')!.damage).toBeGreaterThan(0);
  w.pause(); const frozen = JSON.stringify(art.bursts); art.update(w); expect(JSON.stringify(art.bursts)).toBe(frozen);
  w.elapsed += 1; art.update(w); expect(art.bursts).toHaveLength(0);
  art.prepare(new World(1)); expect(art.bursts).toHaveLength(0);
});
