// Exercise the retained enabled presentation; default-off policy is tested separately.
vi.mock('../../src/game/config/playerVisuals',()=>({PLAYER_VISUALS:{arcaneBlink:true,legacyArcaneBlink:true,arcaneShield:true,legacyArcaneShield:true}}));
import { expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { abilityVisual } from '../../src/game/art/abilityVisual';
import { drawMageMagic } from '../../src/game/art/MageMagic';
import { MageAbilityPresentation } from '../../src/game/art/MageAbilityArt';
import { frostNova } from '../../src/game/abilities/frostNova';
import { meteor } from '../../src/game/abilities/meteor';
import { drawWarriorMagic } from '../../src/game/art/WarriorMagic';
import { World } from '../../src/game/systems/World';
import type { AbilityId } from '../../src/game/abilities/types';
import {selectAsset,visualDimensions} from '../../src/game/art/assetRegistry';
import {fireballFlightFrame} from '../../src/game/art/fireballPack';
import {regularLightningViews} from '../../src/game/art/RegularLightningArt';

it('bounds cosmetic parameters for invalid, minimum, maximum and overflowing ranks', () => {
  expect(abilityVisual(NaN)).toEqual(abilityVisual(1)); expect(abilityVisual(-99)).toEqual(abilityVisual(1)); expect(abilityVisual(100)).toEqual(abilityVisual(5));
  for (let rank = 1; rank <= 5; rank++) { const v = abilityVisual(rank); expect(v.sparks).toBeLessThanOrEqual(14); expect(v.rings).toBeLessThanOrEqual(3); expect(v.lineWidth).toBeLessThanOrEqual(2.5); expect(v.capstone).toBe(rank === 5); }
});
it.each<AbilityId>(['fireball', 'frost', 'lightning', 'meteor', 'shield', 'cleave', 'whirlwind', 'slam', 'blades', 'iron'])('%s respects its rank presentation policy without changing simulation, RNG or collision data', id => {
  function render(rank: number) {
    const w = new World(12345, { character: ['cleave', 'whirlwind', 'slam', 'blades', 'iron'].includes(id) ? 'warrior' : 'mage' });
    for (const a of Object.values(w.abilities)) a.level = 0;
    w.abilities[id].level = rank;
    if (id === 'fireball') w.shoot({ x: 30, y: 0, vx: 100, vy: 0, damage: 1, hostile: false, source: 'fireball' });
    if (id === 'frost' || id === 'meteor') {w.spawn('tank',{x:100,y:0})!.hp=10000;if(id==='frost'){frostNova(w);w.elapsed=.2;}else {meteor(w);w.elapsed=.4;}}
    if (id === 'lightning' || id === 'cleave' || id === 'whirlwind') w.effect(id, { x: 0, y: 0 }, 60, 0xffffff, 1, { x: 70, y: 10 });
    if (id === 'slam') w.impacts.push({ x: 50, y: 20, id: w.id(), damage: 10, radius: 60, hostile: false, landAt: .5, source: id });
    if (id === 'shield') w.shield.refreshAbsorb(15,10);
    if (id === 'blades') w.warrior.bladesUntil = 10;
    if (id === 'iron') w.warrior.ironUntil = 10;
    const calls: unknown[] = [];
    const proxy: object = new Proxy({}, { get: (_target, method) => (...args: unknown[]) => { calls.push([method, ...args]); return proxy; } });
    const g = proxy as Phaser.GameObjects.Graphics, before = JSON.stringify(w);
    drawMageMagic(g, w, .7); drawWarriorMagic(g, w, .7, id === 'slam' ? [{ x: 50, y: 20, radius: 60, started: 0 }] : []);
    calls.push(...new MageAbilityPresentation().views(w,.7));
    if(id==='lightning')calls.push(...regularLightningViews(w,.7));
    if(id==='fireball')calls.push({...selectAsset('fireball',fireballFlightFrame(.3)),...visualDimensions(selectAsset('fireball'))});
    expect(JSON.stringify(w)).toBe(before); expect(calls.length).toBeLessThan(1200);
    return calls;
  }
  if(id==='fireball'||id==='lightning')expect(render(5)).toEqual(render(1));else expect(render(5)).not.toEqual(render(1));
});
