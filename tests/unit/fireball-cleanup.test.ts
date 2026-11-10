import { expect, it } from 'vitest';
import type Phaser from 'phaser';
import { World } from '../../src/game/systems/World';
import { fireball } from '../../src/game/abilities/fireball';
import { drawMageMagic } from '../../src/game/art/MageMagic';
import { BALANCE } from '../../src/game/config/gameBalance';
import {selectAsset,visualDimensions} from '../../src/game/art/assetRegistry';
import {fireballFlightFrame} from '../../src/game/art/fireballPack';

it.each([[1, 0], [3, 0], [5, 0], [5, 3]])(
  'Fireball rank %i / damage upgrades %i keeps fixed native art and mechanics without legacy Graphics',
  (rank, damageUpgrades) => {
    const world = new World(12345, { spawnRate: 0 });
    for (const ability of Object.values(world.abilities)) ability.level = 0;
    world.abilities.fireball.level = rank;
    world.upgrades.damage = damageUpgrades;
    world.stats.projectiles = 1;
    world.stats.damage = 1.6;
    world.spawn('tank', { x: 200, y: 0 });
    expect(fireball(world)).toBe(true);
    const evolved = rank === 5 && damageUpgrades === 3;
    expect(world.projectiles).toHaveLength(evolved ? 2 : 1);
    for (const shot of world.projectiles) {
      expect(Math.hypot(shot.vx, shot.vy)).toBeCloseTo(BALANCE.fireballSpeed);
      expect(shot.damage).toBeCloseTo(BALANCE.fireballDamage * (1 + (rank - 1) * .2) * 1.6);
      expect(shot.pierce).toBe(evolved ? 1 : 0);
    }
    const before = JSON.stringify(world), calls: (string | symbol)[] = [];
    const proxy: object = new Proxy({}, { get: (_target, method) => () => { calls.push(method); return proxy; } });
    drawMageMagic(proxy as Phaser.GameObjects.Graphics, world, .7);
    expect(JSON.stringify(world)).toBe(before);
    expect(calls.filter(method => method === 'lineBetween')).toHaveLength(0);
    expect(calls.filter(method => method === 'fillRect')).toHaveLength(0);
    expect(calls.filter(method => method === 'strokePath')).toHaveLength(0);
    expect(selectAsset('fireball',fireballFlightFrame(.3))).toMatchObject({texture:'mage-fireball-pixellab-v1',frame:'fireball-idle-1'});
    expect(visualDimensions(selectAsset('fireball'))).toEqual({width:64,height:64});
  },
);
