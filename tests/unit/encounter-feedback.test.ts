import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { BossAnimation } from '../../src/game/art/BossAnimation';
import { GuardianAnimation } from '../../src/game/art/GuardianAnimation';
import { EncounterFeedback } from '../../src/game/art/EncounterFeedback';

it('cosmetic melee has anticipation, one impact, pause, recovery and no simulation writes', () => {
  const w = new World(), boss = w.spawn('charger', { x: 25, y: 0 })!, a = new BossAnimation(), fx = new EncounterFeedback();
  a.prepare(w); fx.prepare(w); w.elapsed = .1;
  const before = JSON.stringify(w); expect(a.view(boss, w).pose).toBe('slam'); fx.update(w, a); expect(fx.bursts).toHaveLength(0); expect(JSON.stringify(w)).toBe(before);
  w.elapsed = .41; const impactState = JSON.stringify(w); a.view(boss, w); fx.update(w, a); expect(fx.bursts.map(b => b.kind)).toEqual(['slam']); expect(JSON.stringify(w)).toBe(impactState);
  w.pause(); a.view(boss, w); fx.update(w, a); expect(fx.bursts).toHaveLength(1);
  w.elapsed = .75; expect(a.view(boss, w).pose).toBe('idle');
});

it('charge arrival and teleport departures/releases are observed once and bounded; death never delays rewards', () => {
  const w = new World(), a = new BossAnimation(), fx = new EncounterFeedback(), e = w.spawn('charger', { x: 75, y: 0 })!;
  e.boss!.phase = 'charge'; a.prepare(w); fx.prepare(w);
  e.boss!.phase = 'recover'; w.elapsed += .01; fx.update(w, a); fx.update(w, a); expect(fx.bursts.map(b => b.kind)).toEqual(['arrival']);
  for (let i = 0; i < 40; i++) { e.boss!.phase = 'charge'; fx.update(w, a); e.boss!.phase = 'recover'; fx.update(w, a); }
  expect(fx.bursts).toHaveLength(24);
  w.damageEnemy(e, 999999); expect(w.loot.chests).toHaveLength(1); const before = JSON.stringify(w); fx.update(w, a); expect(JSON.stringify(w)).toBe(before); expect(fx.bursts.at(-1)?.kind).toBe('death');
  w.elapsed += .6; fx.update(w, a); expect(fx.bursts).toHaveLength(0);
  const caster = w.spawn('eclipse', { x: 90, y: 0 })!; caster.boss!.magic = { nextAt: 0, phase: 'signal', from: { x: 50, y: 0 }, teleports: 0 }; fx.prepare(w);
  caster.boss!.magic.phase = 'prepare'; fx.update(w, a); expect(fx.bursts.filter(b => b.kind === 'teleport')).toEqual([]); // Rune atlas owns the new teleport VFX.
  w.enemies = []; fx.update(w, a); expect(fx.bursts).toHaveLength(0);
  fx.prepare(new World()); expect(fx.diagnostics()).toMatchObject({ tracked: 0, active: 0 });
});

it('Guardian reads actual warning/release, preserves hit reaction and gives its existing reward immediately', () => {
  const w = new World(), e = w.spawn('guardian', { x: 60, y: 0 })!, a = new GuardianAnimation();
  w.guardianSystem.awaken(w, e); a.prepare(w); const state = w.guardianSystem.encounters.get(e.id)!;
  state.phase = 'orb-warning'; state.until = w.elapsed + .2; const before = JSON.stringify(w);
  expect(a.frame(e, w)).toContain('guardian-cast-'); expect(JSON.stringify(w)).toBe(before);
  state.phase = 'orbs'; expect(a.frame(e, w)).toBe('guardian-release-0');
  w.damageEnemy(e, 1); expect(a.frame(e, w)).toBe('guardian-hurt-0');
  w.damageEnemy(e, 999999); a.finish(w); expect(a.corpses).toHaveLength(1); expect(w.artifacts.snapshot()).toHaveLength(1); expect(w.buffs.snapshot(w.elapsed)).toHaveLength(0);
});
