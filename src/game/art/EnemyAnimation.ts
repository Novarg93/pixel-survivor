import type { World } from '../systems/World';
import type { Enemy } from '../entities/types';
import { ENEMY_CLIPS, isHdEnemy, type EnemyPlayback, type EnemyFacing, type HdEnemyKind, type EnemyPose } from './enemyPack';
interface Track { enemy: Readonly<Enemy>; x: number; y: number; time: number; hit: number; hurt: number; casting: boolean; attack: number; playback: EnemyPlayback }
export interface EnemyCorpse { active: boolean; id: number; kind: HdEnemyKind; x: number; y: number; elite: boolean; facing: EnemyFacing; started: number }
// Shared by the newly drawn regular families; separate from Runner's approved observer.
export class EnemyAnimation {
  private runId = '';
  private tracks = new Map<number, Track>();
  readonly corpses: EnemyCorpse[] = [];
  replaced = 0;
  prepare(w: World) { if (this.runId !== w.runId) { this.clear(); this.runId = w.runId; } for (const e of w.enemies) if (isHdEnemy(e.kind)) this.track(e, w); }
  private track(e: Readonly<Enemy>, w: World): Track {
    let t = this.tracks.get(e.id);
    if (!t) { t = { enemy: e, x: e.x, y: e.y, time: w.elapsed, hit: 0, hurt: -Infinity, casting: false, attack: -Infinity, playback: { pose: 'idle', facing: e.x > w.player.x ? 'left' : 'right', started: w.elapsed - e.id % 3 / 3 } }; if (this.tracks.size < 150) this.tracks.set(e.id, t); }
    return t;
  }
  view(e: Readonly<Enemy>, w: World) {
    const t = this.track(e, w), dx = e.x - t.x, dy = e.y - t.y, hit = e.hitUntil > t.hit && e.hitUntil > w.elapsed;
    if (hit) { t.hit = e.hitUntil; t.hurt = w.elapsed; }
    if (w.elapsed !== t.time || hit) {
      if (t.casting && !e.aim) t.attack = w.elapsed; t.casting = !!e.aim;
      const hurting = w.elapsed - t.hurt < ENEMY_CLIPS.hurt.frames / ENEMY_CLIPS.hurt.fps;
      if (Math.abs(dx) > .001 && !hurting) t.playback.facing = dx < 0 ? 'left' : 'right';
      const phase = e.boss?.phase ?? e.rush?.phase;
      const pose: EnemyPose = hurting ? 'hurt' : phase === 'windup' || e.aim ? 'windup' : phase === 'charge' || w.elapsed - t.attack < .17 ? 'attack' : phase === 'recover' ? 'recover' : dx * dx + dy * dy > .0001 ? 'walk' : 'idle';
      if (pose !== t.playback.pose || hit) t.playback = { pose, facing: t.playback.facing, started: pose === 'hurt' ? t.hurt : w.elapsed - (pose === 'walk' || pose === 'idle' ? e.id % ENEMY_CLIPS[pose].frames / ENEMY_CLIPS[pose].fps : 0) };
      t.x = e.x; t.y = e.y; t.time = w.elapsed;
    }
    return t.playback;
  }
  finish(w: World) {
    for (const c of this.corpses) if (w.elapsed - c.started >= .5) c.active = false;
    const live = new Set(w.enemies.map(e => e.id));
    for (const [id, t] of this.tracks) if (!live.has(id)) {
      if (t.enemy.hp === 0 && t.enemy.deathSource !== 'ultimate-lightning' && isHdEnemy(t.enemy.kind)) {
        let c = this.corpses.find(c => !c.active);
        if (!c && this.corpses.length < 24) { c = { active: false, id, kind: t.enemy.kind, x: 0, y: 0, elite: false, facing: 'right', started: 0 }; this.corpses.push(c); }
        if (!c) { c = this.corpses.reduce((a, b) => a.started <= b.started ? a : b); this.replaced++; }
        Object.assign(c, { active: true, id, kind: t.enemy.kind, x: t.enemy.x, y: t.enemy.y, elite: t.enemy.elite, facing: t.playback.facing, started: w.elapsed });
      }
      this.tracks.delete(id);
    }
  }
  get tracked() { return this.tracks.size; }
  clear() { this.tracks.clear(); this.corpses.length = 0; this.replaced = 0; }
}
