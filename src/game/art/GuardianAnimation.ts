import type { World } from '../systems/World';
import type { Enemy } from '../entities/types';
import { guardianFrame } from './guardianPack';
export class GuardianAnimation {
  private runId = '';
  private previous: Readonly<Enemy> | undefined;
  private hit = 0;
  private hurt = -Infinity;
  corpse: { x: number; y: number; started: number } | null = null;
  prepare(w: World) {
    if (this.runId !== w.runId) { this.clear(); this.runId = w.runId; }
    if (w.rareGuardian && w.rareGuardian.id !== this.previous?.id) { this.previous = w.rareGuardian; this.hit = 0; this.hurt = -Infinity; }
  }
  frame(e: Enemy, w: World) {
    if (e.hitUntil > this.hit && e.hitUntil > w.elapsed) { this.hit = e.hitUntil; this.hurt = w.elapsed; }
    return w.elapsed - this.hurt < 3 / 14 ? guardianFrame('hurt', w.elapsed - this.hurt) : guardianFrame('idle', w.elapsed);
  }
  finish(w: World) {
    if (this.corpse && w.elapsed - this.corpse.started >= .6) this.corpse = null;
    if (this.previous && !w.enemies.includes(this.previous)) { if (this.previous.hp === 0) this.corpse = { x: this.previous.x, y: this.previous.y, started: w.elapsed }; this.previous = undefined; }
  }
  clear() { this.previous = undefined; this.corpse = null; this.hit = 0; this.hurt = -Infinity; }
}
