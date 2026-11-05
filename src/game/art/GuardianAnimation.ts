import type { World } from '../systems/World';
import type { Enemy } from '../entities/types';
import { guardianFrame } from './guardianPack';
export class GuardianAnimation {
  private runId = '';
  private previous = new Map<number, { enemy: Readonly<Enemy>; hit: number; hurt: number; phase: string; release: number }>();
  readonly corpses: { x: number; y: number; started: number }[] = [];
  get corpse() { return this.corpses[0] ?? null; }
  prepare(w: World) {
    if (this.runId !== w.runId) { this.clear(); this.runId = w.runId; }
    for (const e of w.guardians) if (!this.previous.has(e.id)) this.previous.set(e.id, { enemy: e, hit: 0, hurt: -Infinity, phase: '', release: -Infinity });
  }
  frame(e: Enemy, w: World) {
    const state = this.previous.get(e.id); if (!state) return guardianFrame('idle', w.elapsed);
    if (e.hitUntil > state.hit && e.hitUntil > w.elapsed) { state.hit = e.hitUntil; state.hurt = w.elapsed; }
    const encounter = w.guardianSystem.encounters.get(e.id), phase = encounter?.phase ?? '';
    if (state.phase === 'orb-warning' && phase === 'orbs') state.release = w.elapsed;
    state.phase = phase;
    if (w.elapsed - state.hurt < 3 / 14) return guardianFrame('hurt', w.elapsed - state.hurt);
    if (phase.endsWith('warning') || phase === 'awakening') return guardianFrame('cast', Math.max(0, .5 - ((encounter?.until ?? w.elapsed) - w.elapsed)));
    if (w.elapsed - state.release < .25) return guardianFrame('release', w.elapsed - state.release);
    return w.elapsed - state.hurt < 3 / 14 ? guardianFrame('hurt', w.elapsed - state.hurt) : guardianFrame('idle', w.elapsed);
  }
  finish(w: World) {
    for (let i = this.corpses.length - 1; i >= 0; i--) if (w.elapsed - this.corpses[i].started >= .6) this.corpses.splice(i, 1);
    for (const [id, state] of this.previous) if (!w.enemies.includes(state.enemy)) {
      if (state.enemy.hp === 0 && state.enemy.deathSource !== 'ultimate-lightning' && this.corpses.length < 3) this.corpses.push({ x: state.enemy.x, y: state.enemy.y, started: w.elapsed });
      this.previous.delete(id);
    }
  }
  clear() { this.previous.clear(); this.corpses.length = 0; }
}
