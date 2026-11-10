import type { World } from '../systems/World';
import type { Enemy } from '../entities/types';
import { GUARDIAN_ORBS } from '../config/guardianOrbs';
import { GUARDIAN_ENCOUNTER } from '../config/encounters';
import { FINAL_BOSS } from '../config/finalBoss';
import { unfrozenDelta } from '../systems/UltimateFreeze';
import { guardianDuration, guardianFrame, guardianWindupFrame } from './guardianPack';
interface Track { enemy: Readonly<Enemy>; clock: number; updated: number; orbIndex: number; shootingAt: number; supportNext: number; release: number; frame: string }
// Presentation reads owner clocks only; hits never interrupt a cast or delay damage.
export class GuardianAnimation {
  private runId = '';
  private previous = new Map<number, Track>();
  readonly corpses: { x: number; y: number; started: number; frame: string }[] = [];
  get corpse() { return this.corpses[0] ?? null; }
  prepare(w: World) {
    if (this.runId !== w.runId) { this.clear(); this.runId = w.runId; }
    for (const e of w.guardians) if (!this.previous.has(e.id)) this.previous.set(e.id, { enemy: e, clock: 0, updated: w.elapsed, orbIndex: w.guardianSystem.encounters.get(e.id)?.orbIndex ?? 0, shootingAt: e.shootingAt, supportNext: w.finalEncounter.supports.get(e.id)?.next ?? 0, release: -Infinity, frame: guardianFrame('idle', 0) });
  }
  frame(e: Enemy, w: World) {
    const state = this.previous.get(e.id);
    if (!state) return guardianFrame('idle', 0);
    state.clock += unfrozenDelta(e, w.elapsed, Math.max(0, w.elapsed - state.updated));
    state.updated = w.elapsed;
    const encounter = w.guardianSystem.encounters.get(e.id), orbIndex = encounter?.orbIndex ?? 0;
    const support = e.finalRole ? w.finalEncounter.supports.get(e.id) : undefined;
    if (orbIndex > state.orbIndex || support && support.next > state.supportNext && e.shootingAt > state.shootingAt) state.release = state.clock;
    state.orbIndex = orbIndex; state.shootingAt = e.shootingAt; state.supportNext = support?.next ?? 0;
    let progress: number | undefined;
    if (support?.warning) progress = 1 - (support.next - support.clock) / FINAL_BOSS.orbWarning;
    else if (encounter?.phase.endsWith('warning')) {
      const duration = encounter.phase === 'meteor-warning' ? GUARDIAN_ENCOUNTER.meteorWarning : encounter.phase === 'beam-warning' ? GUARDIAN_ENCOUNTER.beamWarning : GUARDIAN_ORBS.warning;
      progress = 1 - (encounter.until - w.elapsed) / duration;
    }
    state.frame = progress !== undefined ? guardianWindupFrame(progress)
      : state.clock - state.release < guardianDuration('release') ? guardianFrame('release', state.clock - state.release)
      : guardianFrame('idle', state.clock);
    return state.frame;
  }
  finish(w: World) {
    for (let i = this.corpses.length - 1; i >= 0; i--) if (w.elapsed - this.corpses[i].started >= .6) this.corpses.splice(i, 1);
    for (const [id, state] of this.previous) if (!w.enemies.includes(state.enemy)) {
      if (state.enemy.hp === 0 && state.enemy.deathSource !== 'ultimate-lightning' && this.corpses.length < 3) this.corpses.push({ x: state.enemy.x, y: state.enemy.y, started: w.elapsed, frame: state.frame });
      this.previous.delete(id);
    }
  }
  clear() { this.previous.clear(); this.corpses.length = 0; }
}
