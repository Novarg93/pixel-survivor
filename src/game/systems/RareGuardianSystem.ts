import { GUARDIAN_BALANCE as C } from '../config/gameBalance';
import { radarRadius } from '../radar/radar';
import { SeededRandom } from '../utils/SeededRandom';
import { distance, type Point } from '../utils/math';
import type { World } from './World';
import type { Enemy } from '../entities/types';
import { BOSS_PACING } from '../config/pacing';
import { beginGuardianEncounter, guardianExpired, updateGuardianEncounter, type GuardianEncounter } from './GuardianEncounter';
export function guardianVisible(w: Pick<World, 'player' | 'width' | 'height'>, at: Point) { return Math.abs(at.x - w.player.x) <= Math.max(0, w.width / 2 - 17) && Math.abs(at.y - w.player.y) <= Math.max(0, w.height / 2 - 20); }

export class RareGuardianSystem {
  readonly rng: SeededRandom;
  nextAt: number;
  notice: { text: string; until: number } | null = null;
  encounter: GuardianEncounter | null = null;
  constructor(seed: number) { this.rng = new SeededRandom(seed ^ 0x31c5e7); this.nextAt = this.interval(); }
  private interval() { return C.intervalMin + this.rng.next() * (C.intervalMax - C.intervalMin); }
  spawnPoint(w: World) {
    const angle = this.rng.next() * Math.PI * 2, dx = Math.cos(angle), dy = Math.sin(angle);
    const edge = Math.min(w.width / 2 / Math.max(0.0001, Math.abs(dx)), w.height / 2 / Math.max(0.0001, Math.abs(dy)));
    const detection = radarRadius(w.width, w.height), near = Math.max(edge + C.spawnPadding, detection * C.radarDistanceMin);
    const radius = near + this.rng.next() * Math.max(0, detection * C.radarDistanceMax - near);
    return { x: w.player.x + dx * radius, y: w.player.y + dy * radius };
  }
  spawned(w: World) { this.nextAt = w.elapsed + this.interval(); this.notice = { text: 'Редкий хранитель дремлет · ищите золотую звезду на радаре', until: w.elapsed + C.noticeDuration }; }
  awaken(w: World, e: Enemy) {
    if (this.encounter?.ownerId === e.id) { this.encounter.lastDamageAt = w.elapsed; return; }
    this.encounter = beginGuardianEncounter(w, e);
    this.notice = { text: 'Хранитель пробуждён! Следите за лучом и розовыми метками', until: w.elapsed + 3 };
  }
  complete(w: World, ownerId: number) { w.clearOwnedEffects(ownerId); if (this.encounter?.ownerId === ownerId) this.encounter = null; this.notice = null; }
  dismiss(w: World) {
    const e = w.rareGuardian; if (e) { this.complete(w, e.id); w.enemies.splice(w.enemies.indexOf(e), 1); }
    this.nextAt = w.elapsed + this.interval(); this.notice = null;
  }
  update(w: World, dt = 0) {
    if (w.status !== 'playing') return;
    if (this.notice && this.notice.until <= w.elapsed) this.notice = null;
    const current = w.rareGuardian;
    if (current && guardianVisible(w, current)) current.discovered = true;
    if (!current && this.encounter) this.complete(w, this.encounter.ownerId);
    if (current && (!this.encounter && w.elapsed - current.born >= C.lifetime || distance(current, w.player) > radarRadius(w.width, w.height) * C.abandonRadiusMultiplier || this.encounter && guardianExpired(w, current, this.encounter))) {
      this.dismiss(w); return;
    }
    if (current && this.encounter) updateGuardianEncounter(w, current, this.encounter, dt);
    if (w.status !== 'playing') return;
    if (w.elapsed < this.nextAt) return;
    if (w.rareGuardian || !w.artifacts.canDrop(w.elapsed)) { this.nextAt = w.elapsed + this.interval(); return; }
    if (w.bosses.length || w.bossScheduler.nextAt - w.elapsed <= BOSS_PACING.guardianSafetyWindow || w.elapsed - w.bossScheduler.lastAt < BOSS_PACING.guardianSafetyWindow) { this.nextAt = w.elapsed + C.retry; return; }
    if (!w.spawn('guardian', this.spawnPoint(w))) this.nextAt = w.elapsed + C.retry;
  }
  clear(w?: World) { if (w && this.encounter) w.clearOwnedEffects(this.encounter.ownerId); this.encounter = null; this.nextAt = this.interval(); this.notice = null; }
}
