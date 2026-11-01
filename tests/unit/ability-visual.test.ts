import { expect, it } from 'vitest';
import type Phaser from 'phaser';
import { abilityVisual } from '../../src/game/art/abilityVisual';
import { drawMageMagic } from '../../src/game/art/MageMagic';
import { drawWarriorMagic } from '../../src/game/art/WarriorMagic';
import { World } from '../../src/game/systems/World';
import type { AbilityId } from '../../src/game/abilities/types';

it('bounds cosmetic parameters for invalid, minimum, maximum and overflowing ranks', () => {
  expect(abilityVisual(NaN)).toEqual(abilityVisual(1)); expect(abilityVisual(-99)).toEqual(abilityVisual(1)); expect(abilityVisual(100)).toEqual(abilityVisual(5));
  for (let rank = 1; rank <= 5; rank++) { const v = abilityVisual(rank); expect(v.sparks).toBeLessThanOrEqual(14); expect(v.rings).toBeLessThanOrEqual(3); expect(v.lineWidth).toBeLessThanOrEqual(2.5); expect(v.capstone).toBe(rank === 5); }
});
it.each<AbilityId>(['fireball', 'frost', 'lightning', 'meteor', 'shield', 'cleave', 'whirlwind', 'slam', 'blades', 'iron'])('%s changes rank-I/V render commands without changing simulation, RNG or collision data', id => {
  function render(rank: number) {
    const w = new World(12345, { character: ['cleave', 'whirlwind', 'slam', 'blades', 'iron'].includes(id) ? 'warrior' : 'mage' });
    for (const a of Object.values(w.abilities)) a.level = 0;
    w.abilities[id].level = rank;
    if (id === 'fireball') w.shoot({ x: 30, y: 0, vx: 100, vy: 0, damage: 1, hostile: false, source: 'fireball' });
    if (id === 'frost' || id === 'lightning' || id === 'meteor' || id === 'cleave' || id === 'whirlwind') w.effect(id, { x: 0, y: 0 }, 60, 0xffffff, 1, { x: 70, y: 10 });
    if (id === 'meteor' || id === 'slam') w.impacts.push({ x: 50, y: 20, id: w.id(), damage: 10, radius: 60, hostile: false, landAt: .5, source: id });
    if (id === 'shield') { w.shield.charges = 1; w.shield.activeUntil = 10; }
    if (id === 'blades') w.warrior.bladesUntil = 10;
    if (id === 'iron') w.warrior.ironUntil = 10;
    const calls: unknown[] = [];
    const proxy: object = new Proxy({}, { get: (_target, method) => (...args: unknown[]) => { calls.push([method, ...args]); return proxy; } });
    const g = proxy as Phaser.GameObjects.Graphics, before = JSON.stringify(w);
    drawMageMagic(g, w, .7); drawWarriorMagic(g, w, .7, id === 'slam' ? [{ x: 50, y: 20, radius: 60, started: 0 }] : []);
    expect(JSON.stringify(w)).toBe(before); expect(calls.length).toBeLessThan(1200);
    return calls;
  }
  expect(render(5)).not.toEqual(render(1));
});
