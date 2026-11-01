import { expect, it } from 'vitest';
import type Phaser from 'phaser';
import { World } from '../../src/game/systems/World';
import { beginGuardianEncounter } from '../../src/game/systems/GuardianEncounter';
import { drawGuardianDanger } from '../../src/game/art/EncounterArt';

it('points the warning arrow along the actual positive beam rotation at every quadrant', () => {
  const w = new World(), e = w.spawn('guardian', { x: 50, y: 0 })!;
  for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const triangles: number[][] = [];
    const proxy: object = new Proxy({}, { get: (_target, method) => (...args: unknown[]) => { if (method === 'fillTriangle') triangles.push(args.map(Number)); return proxy; } });
    const state = beginGuardianEncounter(w, e); state.phase = 'beam-warning'; state.angle = angle; state.length = 150;
    drawGuardianDanger(proxy as Phaser.GameObjects.Graphics, w, state);
    expect(triangles).toHaveLength(1);
    const [tx, ty, lx, ly, rx, ry] = triangles[0], dx = tx - (lx + rx) / 2, dy = ty - (ly + ry) / 2;
    const dot = dx * -Math.sin(angle + .45) + dy * Math.cos(angle + .45);
    expect(dot, `arrow direction at angle ${angle}`).toBeGreaterThan(0);
  }
});
