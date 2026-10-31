import { GUARDIAN_BALANCE as C } from '../config/gameBalance';
import { radarRadius } from '../radar/radar';
import { SeededRandom } from '../utils/SeededRandom';
import { distance, type Point } from '../utils/math';
import type { World } from './World';
export function guardianVisible(w: Pick<World, 'player' | 'width' | 'height'>, at: Point) { return Math.abs(at.x - w.player.x) <= Math.max(0, w.width / 2 - 17) && Math.abs(at.y - w.player.y) <= Math.max(0, w.height / 2 - 20); }

export class RareGuardianSystem {
  readonly rng: SeededRandom;
  nextAt: number;
  notice: { text: string; until: number } | null = null;
  constructor(seed: number) { this.rng = new SeededRandom(seed ^ 0x31c5e7); this.nextAt = this.interval(); }
  private interval() { return C.intervalMin + this.rng.next() * (C.intervalMax - C.intervalMin); }
  spawnPoint(w: World) {
    const angle = this.rng.next() * Math.PI * 2, dx = Math.cos(angle), dy = Math.sin(angle);
    const edge = Math.min(w.width / 2 / Math.max(0.0001, Math.abs(dx)), w.height / 2 / Math.max(0.0001, Math.abs(dy)));
    const detection = radarRadius(w.width, w.height), near = Math.max(edge + C.spawnPadding, detection * C.radarDistanceMin);
    const radius = near + this.rng.next() * Math.max(0, detection * C.radarDistanceMax - near);
    return { x: w.player.x + dx * radius, y: w.player.y + dy * radius };
  }
  spawned(w: World) { this.nextAt = w.elapsed + this.interval(); this.notice = { text: 'Редкий хранитель пробудился · ищите золотую звезду на радаре', until: w.elapsed + C.noticeDuration }; }
  update(w: World) {
    if (w.status !== 'playing') return;
    if (this.notice && this.notice.until <= w.elapsed) this.notice = null;
    const current = w.rareGuardian;
    if (current && guardianVisible(w, current)) current.discovered = true;
    if (current && (w.elapsed - current.born >= C.lifetime || distance(current, w.player) > radarRadius(w.width, w.height) * C.abandonRadiusMultiplier)) {
      w.enemies.splice(w.enemies.indexOf(current), 1); this.nextAt = w.elapsed + this.interval(); this.notice = null; return;
    }
    if (w.elapsed < this.nextAt) return;
    if (w.rareGuardian || !w.artifacts.canDrop(w.elapsed)) { this.nextAt = w.elapsed + this.interval(); return; }
    if (!w.spawn('guardian', this.spawnPoint(w))) this.nextAt = w.elapsed + C.retry;
  }
  clear() { this.nextAt = this.interval(); this.notice = null; }
}
