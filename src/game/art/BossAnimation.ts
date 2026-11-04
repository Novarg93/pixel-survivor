import type { World } from '../systems/World';
import type { Enemy } from '../entities/types';
import type { BossKind } from '../config/enemyDefinitions';
import { isHdBoss, BOSS_CLIPS, type BossFacing, type BossPose } from './bossPack';
interface Playback { pose: BossPose; facing: BossFacing; started: number; stage: number }
interface Track { enemy: Readonly<Enemy>; x: number; y: number; time: number; hit: number; hurt: number; attack: number; phase: string; shootingAt: number; slam: number; nextSlam: number; playback: Playback }
export interface BossCorpse { active: boolean; kind: BossKind; x: number; y: number; started: number; facing: BossFacing; stage: number }
export class BossAnimation {
  private runId = '';
  private tracks = new Map<number, Track>();
  readonly corpses: BossCorpse[] = [];
  prepare(w: World) { if (this.runId !== w.runId) { this.clear(); this.runId = w.runId; } for (const e of w.bosses) if (isHdBoss(e.kind)) this.track(e, w); }
  private track(e: Readonly<Enemy>, w: World): Track {
    let t = this.tracks.get(e.id);
    if (!t) { t = { enemy: e, x: e.x, y: e.y, time: w.elapsed, hit: 0, hurt: -Infinity, attack: -Infinity, phase: e.boss?.phase ?? 'approach', shootingAt: e.shootingAt, slam: -Infinity, nextSlam: w.elapsed, playback: { pose: 'idle', facing: e.x > w.player.x ? 'left' : 'right', started: w.elapsed, stage: e.boss?.stage ?? 1 } }; if (this.tracks.size < 3) this.tracks.set(e.id, t); }
    return t;
  }
  view(e: Readonly<Enemy>, w: World) {
    const t = this.track(e, w), dx = e.x - t.x, dy = e.y - t.y, hit = e.hitUntil > t.hit && e.hitUntil > w.elapsed, phase = e.boss?.phase ?? 'approach';
    if (hit) { t.hit = e.hitUntil; t.hurt = w.elapsed; }
    if (w.elapsed !== t.time || hit) {
      if (t.phase === 'windup' && phase === 'recover' || t.shootingAt > 0 && e.shootingAt === 0) t.attack = w.elapsed;
      const hurting = w.elapsed - t.hurt < 3 / 14 && !(e.kind === 'charger' && phase === 'windup');
      if (!hurting) { const direction = phase === 'windup' || phase === 'charge' ? e.boss?.direction.x ?? dx : dx; if (Math.abs(direction) > .001) t.playback.facing = direction < 0 ? 'left' : 'right'; }
      if (e.kind === 'charger' && phase === 'approach' && Math.hypot(e.x - w.player.x, e.y - w.player.y) < e.radius + 22 && w.elapsed >= t.nextSlam) { t.slam = w.elapsed; t.nextSlam = w.elapsed + 1.2; }
      const slamming = phase === 'approach' && w.elapsed - t.slam < .6;
      const pose: BossPose = phase === 'windup' ? 'windup' : slamming ? 'slam' : hurting ? 'hurt' : phase === 'charge' || w.elapsed - t.attack < 4 / 12 ? 'attack' : phase === 'recover' ? 'recover' : dx * dx + dy * dy > .0001 ? 'walk' : 'idle';
      if (pose !== t.playback.pose || hit) t.playback = { pose, facing: t.playback.facing, started: pose === 'hurt' ? t.hurt : pose === 'slam' ? t.slam : w.elapsed, stage: e.boss?.stage ?? 1 };
      t.playback.stage = e.boss?.stage ?? 1; t.x = e.x; t.y = e.y; t.time = w.elapsed; t.phase = phase; t.shootingAt = e.shootingAt;
    }
    return t.playback;
  }
  finish(w: World) {
    for (const c of this.corpses) if (w.elapsed - c.started >= BOSS_CLIPS.death.frames / BOSS_CLIPS.death.fps) c.active = false;
    const live = new Set(w.bosses.map(e => e.id));
    for (const [id, t] of this.tracks) if (!live.has(id)) {
      if (t.enemy.hp === 0 && isHdBoss(t.enemy.kind)) {
        let c = this.corpses.find(c => !c.active);
        if (!c && this.corpses.length < 3) { c = { active: false, kind: t.enemy.kind, x: 0, y: 0, started: 0, facing: 'right', stage: 1 }; this.corpses.push(c); }
        c ??= this.corpses.reduce((a, b) => a.started <= b.started ? a : b);
        Object.assign(c, { active: true, kind: t.enemy.kind, x: t.enemy.x, y: t.enemy.y, started: w.elapsed, facing: t.playback.facing, stage: t.enemy.boss?.stage ?? 1 });
      }
      this.tracks.delete(id);
    }
  }
  get tracked() { return this.tracks.size; }
  clear() { this.tracks.clear(); this.corpses.length = 0; }
}
