import type { Enemy } from '../entities/types';
import type { World } from '../systems/World';
import { RUNNER_CLIPS, RUNNER_CORPSE_CAP, type RunnerFacing, type RunnerPlayback } from './runnerPack';
type View = Pick<World, 'runId' | 'elapsed' | 'enemies' | 'player'>;
interface Track { enemy: Readonly<Enemy>; x: number; y: number; time: number; hitUntil: number; hurtStarted: number; playback: RunnerPlayback }
export interface RunnerCorpse { active: boolean; enemyId: number; x: number; y: number; elite: boolean; facing: RunnerFacing; started: number }

// Presentation observer. Retained references distinguish actual kills (hp=0)
// from despawns; it never delays or participates in the simulation's removal.
export class RunnerAnimation {
  private runId = '';
  private tracks = new Map<number, Track>();
  readonly corpses: RunnerCorpse[] = [];
  replaced = 0;
  prepare(w: View) {
    if (this.runId !== w.runId) { this.clear(); this.runId = w.runId; }
    for (const enemy of w.enemies) if (enemy.kind === 'runner') this.track(enemy, w);
  }
  private track(enemy: Readonly<Enemy>, w: View): Track {
    let track = this.tracks.get(enemy.id);
    if (!track) {
      track = { enemy, x: enemy.x, y: enemy.y, time: w.elapsed, hitUntil: 0, hurtStarted: -Infinity, playback: { pose: 'idle', facing: enemy.x > w.player.x ? 'left' : 'right', started: w.elapsed - enemy.id % 3 / RUNNER_CLIPS.idle.fps } };
      // A separate visual ceiling; the unchanged game already caps regulars at150.
      if (this.tracks.size < 150) this.tracks.set(enemy.id, track);
    }
    return track;
  }
  view(enemy: Readonly<Enemy>, w: View): RunnerPlayback {
    const track = this.track(enemy, w), dx = enemy.x - track.x, dy = enemy.y - track.y;
    const newHit = enemy.hitUntil > track.hitUntil && enemy.hitUntil > w.elapsed;
    if (newHit) { track.hitUntil = enemy.hitUntil; track.hurtStarted = w.elapsed; }
    if (w.elapsed !== track.time || newHit) {
      const hurting = w.elapsed - track.hurtStarted < RUNNER_CLIPS.hurt.frames / RUNNER_CLIPS.hurt.fps;
      if (Math.abs(dx) > 0.001 && !hurting) track.playback.facing = dx < 0 ? 'left' : 'right';
      const pose = hurting ? 'hurt' : dx * dx + dy * dy > 0.0001 ? 'walk' : 'idle';
      if (pose !== track.playback.pose || newHit) track.playback = { pose, facing: track.playback.facing, started: pose === 'hurt' ? track.hurtStarted : w.elapsed - enemy.id % RUNNER_CLIPS[pose].frames / RUNNER_CLIPS[pose].fps };
      track.x = enemy.x; track.y = enemy.y; track.time = w.elapsed;
    }
    return track.playback;
  }
  finish(w: View) {
    const live = new Set(w.enemies.filter(e => e.kind === 'runner').map(e => e.id));
    const duration = RUNNER_CLIPS.death.frames / RUNNER_CLIPS.death.fps;
    for (const corpse of this.corpses) if (w.elapsed - corpse.started >= duration) corpse.active = false;
    for (const [id, track] of this.tracks) if (!live.has(id)) {
      if (track.enemy.hp === 0) {
        let slot = this.corpses.find(c => !c.active);
        if (!slot && this.corpses.length < RUNNER_CORPSE_CAP) { slot = { active: false, enemyId: 0, x: 0, y: 0, elite: false, facing: 'right', started: 0 }; this.corpses.push(slot); }
        if (!slot) { slot = this.corpses.reduce((a, b) => a.started <= b.started ? a : b); this.replaced++; }
        Object.assign(slot, { active: true, enemyId: id, x: track.enemy.x, y: track.enemy.y, elite: track.enemy.elite, facing: track.playback.facing, started: w.elapsed });
      }
      this.tracks.delete(id);
    }
  }
  get tracked() { return this.tracks.size; }
  clear() { this.tracks.clear(); for (const corpse of this.corpses) corpse.active = false; this.replaced = 0; }
  destroy() { this.clear(); this.corpses.length = 0; }
}
