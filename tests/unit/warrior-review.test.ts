import { expect, it } from 'vitest';
import { createReviewWorld, reviewHit } from '../../art/warrior-review-v1/model';
import { DIRECTIONS, SKILLS } from '../../art/warrior-review-v1/catalog';

it('review runs all five existing skills against eight stationary, bounded targets', () => {
  const w = createReviewWorld({ action: 'all', rank: 3, direction: 'south' });
  for (let i = 0; i < 300; i++) w.step(1 / 60);
  expect(w.enemies).toHaveLength(8);
  expect(w.enemies.every(e => e.speed === 0 && e.hp < e.maxHp)).toBe(true);
  expect(w.snapshot().damageByAbility.filter(a => a.damage > 0).map(a => a.id).sort()).toEqual(['blades', 'cleave', 'slam', 'whirlwind']);
  expect(w.warrior.ironUntil).toBeGreaterThan(w.elapsed);
  expect(w.practice).toBe(true);
  expect(w.projectiles.every(p=>p.source==='blades'&&!p.hostile)).toBe(true);
});

it('individual skill reviews preserve rank and isolate damage from the other skills', () => {
  for (const skill of SKILLS) {
    const w = createReviewWorld({ action: skill.id, rank: 5, direction: 'west' });
    for (let i = 0; i < 100; i++) w.step(1 / 60);
    expect(w.abilities[skill.id].level).toBe(5);
    expect(Object.entries(w.abilities).filter(([, a]) => a.level > 0).map(([id]) => id)).toEqual([skill.id]);
    expect(w.snapshot().damageByAbility.filter(a => a.damage > 0).map(a => a.id)).toEqual(skill.id === 'iron' ? [] : [skill.id]);
    if (skill.id === 'blades') expect(w.snapshot().damageByAbility.find(a=>a.id==='blades')!.damage).toBeGreaterThan(0);
  }
});

it('review hit proves real armor and Iron Skin mitigation; fresh restart resets everything', () => {
  const plain = createReviewWorld({ action: 'idle', rank: 1, direction: 'south' });
  const iron = createReviewWorld({ action: 'iron', rank: 1, direction: 'south' });
  for (let i = 0; i < 30; i++) iron.step(1 / 60);
  expect(reviewHit(plain)).toBe(true); expect(reviewHit(iron)).toBe(true);
  expect(plain.player.hp).toBeCloseTo(133.6); expect(iron.player.hp).toBe(150);expect(iron.absorb).toBeCloseTo(21.8);
  const fresh = createReviewWorld({ action: 'all', rank: 3, direction: 'north' });
  expect(fresh.elapsed).toBe(0); expect(fresh.player.hp).toBe(150);
  expect(fresh.warrior.ironUntil).toBe(0); expect(fresh.effects).toHaveLength(0);
  expect(fresh.runId).not.toBe(iron.runId);
});

it('all eight movement directions and the existing Dash use real World movement', () => {
  for (const d of DIRECTIONS) {
    const w = createReviewWorld({ action: 'walk', rank: 3, direction: d.id });
    for (let i = 0; i < 60; i++) w.step(1 / 60, d);
    expect(Math.hypot(w.player.x, w.player.y)).toBeCloseTo(118);
    expect(Math.sign(w.player.x)).toBe(Math.sign(d.x)); expect(Math.sign(w.player.y)).toBe(Math.sign(d.y));
    expect(w.enemies).toHaveLength(0);
    const dash = createReviewWorld({ action: 'dash', rank: 3, direction: d.id });
    expect(dash.mobility.activate(dash, d)).toBe(true);
    for (let i = 0; i < 15; i++) dash.step(1 / 60);
    expect(Math.hypot(dash.player.x, dash.player.y)).toBeCloseTo(96);
    expect(dash.mobility.remaining).toBe(0);
  }
});
