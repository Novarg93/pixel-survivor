import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { ULTIMATE as C, WARRIOR_ULTIMATE_DEFINITIONS, type WarriorAttackUltimate } from '../../src/game/config/ultimates';
import { chooseUpgrades } from '../../src/game/systems/UpgradeSystem';
import { WarriorHeroAnimation } from '../../src/game/art/WarriorHeroAnimation';
import { warriorUltimateBody } from '../../src/game/art/warriorUltimatesPack';
import { direction } from '../../src/game/utils/math';

function setup(kind: WarriorAttackUltimate) {
  const w = new World(47, { character: 'warrior', spawnRate: 0 }); w.elapsed = 300; w.experience.level = 30; w.encounterDirector.nextAt = Infinity;
  for (const a of Object.values(w.abilities)) a.level = 0;
  w.facing = { x: 1, y: 0 }; expect(w.ultimate.choose(w, kind)).toBe(true); return w;
}
function target(w: World, x: number, y = 0, kind: 'tank' | 'charger' | 'guardian' = 'tank') {
  const e = w.spawn(kind, { x, y })!; e.hp = e.maxHp = 10000; e.speed = e.damage = 0; return e;
}
it('offers exactly three Warrior ultimates, keeps Mage choices isolated, and locks the selected ultimate', () => {
  const w = setup('ruin'); w.ultimate.clear();
  expect(chooseUpgrades(w).map(c => c.id)).toEqual(['ultimate-banner', 'ultimate-earthbreaker', 'ultimate-ruin']);
  expect(WARRIOR_ULTIMATE_DEFINITIONS).toHaveLength(3);
  expect(w.ultimate.choose(w, 'fire')).toBe(false); expect(w.ultimate.choose(w, 'ruin')).toBe(true); expect(w.ultimate.choose(w, 'earthbreaker')).toBe(false);
  const mage = new World(7); mage.elapsed = 300; mage.experience.level = 30;
  expect(mage.ultimate.choose(mage, 'ruin')).toBe(false); expect(chooseUpgrades(mage).every(c => !['ultimate-earthbreaker', 'ultimate-ruin', 'ultimate-banner'].includes(c.id))).toBe(true);
});
it.each(['earthbreaker', 'ruin'] as const)('%s delays damage until contact, cancels ordinary attacks and preserves pause/charge rules', kind => {
  const w = setup(kind), e = target(w, 0); w.warrior.pendingSpear = { releaseAt: 301, vx: 340, vy: 0, damage: 1, pierce: 3, hitRadius: 14 };
  expect(w.ultimate.activate(w)).toBe(true); expect(w.warrior.pendingSpear).toBeUndefined();
  expect(w.mobility.activate(w)).toBe(false); expect(w.ultimate.activate(w)).toBe(false);
  w.elapsed = w.ultimate.warrior.releaseAt - .001; w.ultimate.update(w); expect(e.hp).toBe(10000);
  const at = w.elapsed; w.pause(); w.step(1); expect(w.elapsed).toBe(at); w.ultimate.update(w); expect(e.hp).toBe(10000); w.resume();
  w.elapsed = w.ultimate.warrior.releaseAt; w.ultimate.update(w); expect(e.hp).toBeLessThan(10000);
  w.elapsed = w.ultimate.activeUntil + .1; w.ultimate.update(w); const hp = e.hp;
  for (let i = 0; i < 5; i++) { w.elapsed++; w.ultimate.update(w); }
  expect(e.hp).toBe(hp); expect(w.ultimate.warrior.spear).toBeNull(); expect(w.ultimate.warrior.pulses).toHaveLength(0);
  expect(w.ultimate.activate(w)).toBe(false);
  for (let i = 0; i < 10; i++) { w.mobility.readyAt = w.elapsed; expect(w.mobility.activate(w)).toBe(true); for (let j = 0; j < 4; j++) w.step(.05); w.ultimate.onBlink(w); expect(w.ultimate.charge).toBe(i + 1); }
  expect(w.ultimate.activate(w)).toBe(true);
  w.player.invulnerableUntil = w.mobility.protectedUntil = 0; w.damagePlayer(1e9);
  expect(w.ultimate.selected).toBeNull(); expect(w.ultimate.warrior.kind).toBeNull(); expect(w.ultimate.warrior.pulses).toHaveLength(0);
});
it('Earthbreaker advances three branches in four waves; overlapping branches hit once per wave and never early', () => {
  const w = setup('earthbreaker'), center = target(w, 0), far = target(w, 250), outside = target(w, 150, 130);
  w.ultimate.activate(w); const u = w.ultimate.warrior;
  w.elapsed = u.releaseAt; w.ultimate.update(w); expect(u.wave).toBe(1); expect(u.pulses).toHaveLength(3);
  expect(center.hp).toBe(9900); expect(far.hp).toBe(10000); w.ultimate.update(w); expect(center.hp).toBe(9900);
  w.elapsed = u.releaseAt + C.earthbreaker.waveInterval * 3; w.ultimate.update(w);
  expect(u.wave).toBe(4); expect(u.pulses).toHaveLength(12); expect(far.hp).toBeLessThan(10000); expect(outside.hp).toBe(10000);
  expect(w.snapshot().ultimateDamage?.earthbreaker).toBeGreaterThan(0);
});
it('Spear sweeps skipped positions once, misses outside its width, and ends with one bounded impact on new targets', () => {
  const w = setup('ruin'), a = target(w, 80), b = target(w, 170), far = target(w, 560, 48), outside = target(w, 170, 70);
  w.ultimate.activate(w); const u = w.ultimate.warrior;
  w.elapsed = u.releaseAt + .5; w.ultimate.update(w);
  expect(a.hp).toBe(10000 - C.ruin.damage); expect(b.hp).toBe(a.hp); expect(outside.hp).toBe(10000); expect(far.hp).toBe(10000);
  w.ultimate.update(w); expect(a.hp).toBe(10000 - C.ruin.damage);
  w.elapsed = u.releaseAt + C.ruin.range / C.ruin.speed; w.ultimate.update(w);
  expect(u.spear?.active).toBe(false); expect(far.hp).toBe(10000 - C.ruin.impactDamage); expect(b.hp).toBe(a.hp);
  const hp = far.hp; w.ultimate.update(w); expect(far.hp).toBe(hp); expect(w.snapshot().ultimateDamage?.ruin).toBeGreaterThan(0);
});
it.each(['earthbreaker', 'ruin'] as const)('%s respects cumulative boss/Guardian caps with global damage multipliers', kind => {
  const w = setup(kind), boss = target(w, 0, 0, 'charger'), guardian = target(w, 35, 0, 'guardian'); w.stats.damage = 1000;
  w.ultimate.activate(w); const before = [boss.hp, guardian.hp];
  for (let i = 0; i < 70; i++) { w.elapsed += .05; w.ultimate.update(w); }
  for (const [i, e] of [boss, guardian].entries()) { expect(before[i] - e.hp).toBeGreaterThan(0); expect(before[i] - e.hp).toBeLessThanOrEqual(e.maxHp * C[kind].bossFraction + 1e-6); }
});
it('a real spear kill grants score/XP once, and an empty cast cannot replay hits after expiry', () => {
  const w = setup('ruin'), e = target(w, 80); e.hp = 5;
  w.ultimate.activate(w); w.elapsed += .9; w.ultimate.update(w);
  expect(w.kills).toBe(1); expect(w.score).toBeGreaterThan(0); expect(w.orbs.length).toBeGreaterThan(0);
  const score = w.score; w.elapsed += 5; w.ultimate.update(w); const later = target(w, 80); w.ultimate.update(w);
  expect(later.hp).toBe(10000); expect(w.score).toBe(score);
});
it.each(['earthbreaker', 'ruin'] as const)('%s freezes its origin/direction and uses current accepted north poses at contact', kind => {
  const w = setup(kind), anim = new WarriorHeroAnimation();
  for (const aim of [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: -1 }, { x: -1, y: -1 }, { x: -1, y: 0 }, { x: -1, y: 1 }]) {
    w.ultimate.warrior.clear(); w.ultimate.activeUntil = 0; w.ultimate.charge = 10; w.facing = direction(aim.x, aim.y); w.ultimate.activate(w);
    w.elapsed += C[kind].windup; w.ultimate.update(w); const pose = anim.view(w, false);
    expect(pose.motion).toBe(`ultimate-${kind}`); expect(pose.index).toBe(aim.y < 0 ? kind === 'ruin' ? 5 : 8 : 6);
    const fixed = { ...w.ultimate.warrior.direction }; w.facing = { x: 1, y: 0 }; w.player.x += 5;
    expect(w.ultimate.warrior.direction).toEqual(fixed);
  }
  expect(warriorUltimateBody('north-west', kind, .1).flipX).toBe(true);
  expect(warriorUltimateBody('north-east', kind, .1).flipX).toBe(false);
});
