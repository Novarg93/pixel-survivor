import { describe, expect, it } from 'vitest';
import { ATMOSPHERE_PHASES } from '../../src/game/config/atmosphere';
import { AtmospherePhaseController } from '../../src/game/systems/AtmospherePhaseController';

const controller = new AtmospherePhaseController();
describe('run atmosphere presentation clock', () => {
  it.each([[0, 'normal'], [240, 'normal'], [299.99, 'normal'], [305, 'dusk'], [315, 'dusk'], [599.99, 'dusk'], [605, 'dying'], [615, 'dying'], [899.99, 'dying'], [905, 'burning'], [915, 'burning'], [36000, 'burning']] as const)('samples %ss as %s', (elapsed, phase) => {
    const state = controller.sample(elapsed);
    expect(state.phase).toBe(phase); expect(state.target).toBe(phase); expect(state.blend).toBe(1);
    expect(state.style).toEqual(ATMOSPHERE_PHASES.find(p => p.id === phase)!.style);
  });

  it('starts exactly at 5/10/15 minutes and transforms over five run seconds', () => {
    expect(ATMOSPHERE_PHASES.slice(1).map(p => [p.start, p.end])).toEqual([[300, 305], [600, 605], [900, 905]]);
  });

  it.each(ATMOSPHERE_PHASES.slice(1))('smoothly blends every channel in the $id window', phase => {
    const previous = ATMOSPHERE_PHASES[ATMOSPHERE_PHASES.indexOf(phase) - 1];
    const start = controller.sample(phase.start), mid = controller.sample((phase.start + phase.end) / 2), end = controller.sample(phase.end);
    expect(start).toMatchObject({ phase: previous.id, target: phase.id, blend: 0, style: previous.style });
    expect(mid).toMatchObject({ phase: previous.id, target: phase.id, blend: .5 }); expect(end.style).toEqual(phase.style);
    let last = start;
    for (let t = phase.start + 1 / 60; t < phase.end; t += 1 / 60) {
      const current = controller.sample(t); expect(current.blend).toBeGreaterThanOrEqual(last.blend);
      const maxBlendStep = 1.5 / (60 * (phase.end - phase.start)) + 1e-8;
      expect(current.blend - last.blend).toBeLessThan(maxBlendStep);
      for (const key of ['fog', 'glow', 'embers', 'veil', 'vignette'] as const) expect(Math.abs(current.style[key] - last.style[key])).toBeLessThan(maxBlendStep);
      for (const shift of [0, 8, 16]) expect(Math.abs(((current.style.tint >> shift) & 255) - ((last.style.tint >> shift) & 255))).toBeLessThanOrEqual(1);
      last = current;
    }
    expect(controller.sample(phase.start + .01).blend).toBeLessThan(.0001);
    expect(controller.sample(phase.end - .01).blend).toBeGreaterThan(.9999);
  });

  it('supports pause, backward seeks and restart without retained state or config mutation', () => {
    const config = JSON.stringify(ATMOSPHERE_PHASES), normal = controller.sample(0);
    for (let i = 0; i < 10; i++) {
      expect(controller.sample(915)).toEqual(controller.sample(915));
      controller.sample(585); expect(controller.sample(0)).toEqual(normal);
    }
    expect(controller.sample(-1)).toEqual(normal); expect(controller.sample(NaN)).toEqual(normal);
    expect(controller.sample(Infinity).phase).toBe('burning'); expect(JSON.stringify(ATMOSPHERE_PHASES)).toBe(config);
  });
});
