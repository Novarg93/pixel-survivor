import { ULTIMATE as C, type WarriorAttackUltimate } from '../config/ultimates';
import type { World } from '../systems/World';
import type { Enemy } from '../entities/types';
import { direction, distance, segmentDistance, type Point } from '../utils/math';

// Coordinates follow the three paths of the selected Earthbreaker A artwork.
const BRANCHES = [
  [[0, 0], [36, -27], [70, -26], [91, -41], [138, -50]],
  [[0, 0], [36, -2], [72, -10], [105, 4], [158, 0]],
  [[0, 0], [26, 23], [70, 27], [110, 37], [138, 51]],
] as const;
export interface EarthbreakerPulse { from: Point; to: Point; started: number; wave: number; branch: number }
export class WarriorUltimates {
  kind: WarriorAttackUltimate | null = null;
  started = -Infinity; releaseAt = Infinity; bodyEndsAt = -Infinity; endsAt = -Infinity;
  origin: Point = { x: 0, y: 0 }; direction: Point = { x: 1, y: 0 };
  released = false; wave = 0; pulses: EarthbreakerPulse[] = [];
  spear: (Point & { from: Point; active: boolean; impactedAt: number }) | null = null;
  private hits = new Set<number>(); private spent = new Map<number, number>();
  private finished = false;
  start(kind: WarriorAttackUltimate, now: number, origin: Point, aim: Point) {
    this.clear(); this.kind = kind; this.started = now; this.origin = { ...origin };
    const v = direction(aim.x, aim.y); this.direction = v.x || v.y ? v : { x: 0, y: 1 };
    const c = C[kind]; this.releaseAt = now + c.windup; this.bodyEndsAt = now + c.bodyDuration;
    this.endsAt = this.releaseAt + (kind === 'ruin' ? C.ruin.range / C.ruin.speed + C.ruin.aftermath : (C.earthbreaker.waves - 1) * C.earthbreaker.waveInterval + C.earthbreaker.aftermath);
  }
  bodyActive(now: number) { return !!this.kind && now >= this.started && now < this.bodyEndsAt; }
  casting(now: number) { return this.bodyActive(now) && now < this.releaseAt; }
  branchPoint(branch: number, node: number): Point {
    const p = BRANCHES[branch][node], scale = C.earthbreaker.range / 158, d = this.direction;
    return { x: this.origin.x + (p[0] * d.x - p[1] * d.y) * scale, y: this.origin.y + (p[0] * d.y + p[1] * d.x) * scale };
  }
  private hit(w: World, e: Enemy, damage: number) {
    if (!this.kind) return;
    const cap = e.boss || e.kind === 'guardian' ? e.maxHp * C[this.kind].bossFraction : Infinity;
    const remaining = Math.max(0, cap - (this.spent.get(e.id) ?? 0));
    if (!remaining) return;
    const before = e.hp;
    w.damageEnemy(e, damage * w.stats.damage, this.kind === 'ruin' ? 'ultimate-ruin' : 'ultimate-earthbreaker', remaining);
    if (Number.isFinite(cap)) this.spent.set(e.id, (this.spent.get(e.id) ?? 0) + Math.max(0, before - e.hp));
  }
  update(w: World) {
    if (w.status !== 'playing' || !this.kind || this.finished || w.elapsed < this.releaseAt) return;
    const now = w.elapsed;
    if (!this.released) { this.released = true; w.feedback({ type: 'ability', ability: this.kind === 'ruin' ? 'blades' : 'slam' }); }
    if (this.kind === 'earthbreaker') {
      while (this.wave < C.earthbreaker.waves && now + 1e-7 >= this.releaseAt + this.wave * C.earthbreaker.waveInterval) {
        const wave = this.wave++, started = this.releaseAt + wave * C.earthbreaker.waveInterval;
        const segments = BRANCHES.map((_, branch) => ({ from: this.branchPoint(branch, wave), to: this.branchPoint(branch, wave + 1), started, wave, branch }));
        this.pulses.push(...segments);
        for (const e of [...w.combatTargets]) if (segments.some(s => segmentDistance(e, s.from, s.to) <= C.earthbreaker.halfWidth + e.radius)) this.hit(w, e, C.earthbreaker.damage);
      }
      this.pulses = this.pulses.filter(p => now - p.started < C.earthbreaker.aftermath);
    } else {
      const p = this.spear ??= { ...this.origin, from: { ...this.origin }, active: true, impactedAt: Infinity };
      if (p.active) {
        const arrived = now + 1e-7 >= this.releaseAt + C.ruin.range / C.ruin.speed;
        const traveled = arrived ? C.ruin.range : Math.min(C.ruin.range, Math.max(0, now - this.releaseAt) * C.ruin.speed);
        p.from = { x: p.x, y: p.y }; p.x = this.origin.x + this.direction.x * traveled; p.y = this.origin.y + this.direction.y * traveled;
        for (const e of [...w.combatTargets]) if (!this.hits.has(e.id) && this.hits.size < 160 && segmentDistance(e, p.from, p) <= C.ruin.hitRadius + e.radius) {
          this.hits.add(e.id); this.hit(w, e, C.ruin.damage);
        }
        if (arrived) {
          p.active = false; p.impactedAt = this.releaseAt + C.ruin.range / C.ruin.speed;
          for (const e of [...w.combatTargets]) if (!this.hits.has(e.id) && this.hits.size < 160 && distance(e, p) <= C.ruin.impactRadius + e.radius) {
            this.hits.add(e.id); this.hit(w, e, C.ruin.impactDamage);
          }
        }
      }
    }
    if (now >= this.endsAt) { this.finished = true; this.pulses = []; this.spear = null; this.hits.clear(); this.spent.clear(); }
  }
  clear() {
    this.kind = null; this.started = this.bodyEndsAt = this.endsAt = -Infinity; this.releaseAt = Infinity;
    this.finished = false; this.released = false; this.wave = 0; this.pulses = []; this.spear = null; this.hits.clear(); this.spent.clear();
    this.origin = { x: 0, y: 0 }; this.direction = { x: 1, y: 0 };
  }
}
