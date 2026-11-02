import { MOBILITY } from '../config/encounters';
import { direction, distance, segmentDistance, type Point } from '../utils/math';
import type { World } from './World';
import { effectiveCooldown } from './Cooldown';
import { MOBILITY_MAX_RANK, MOBILITY_SPECIALIZATION_LEVEL, MOBILITY_SPECIALIZATIONS as S, MOBILITY_UPGRADES, type MobilityVariant } from '../config/mobilityUpgrades';
import type { MobilityWall } from '../entities/types';

export function insideMobilityWall(target: Point & { radius: number }, wall: MobilityWall) {
  const dx = wall.to.x - wall.from.x, dy = wall.to.y - wall.from.y, length2 = dx * dx + dy * dy;
  if (length2 < 1) return false;
  const t = ((target.x - wall.from.x) * dx + (target.y - wall.from.y) * dy) / length2;
  return t >= 0 && t <= 1 && segmentDistance(target, wall.from, wall.to) <= wall.width / 2 + target.radius;
}
export class MobilitySystem {
  readyAt = 0; protectedUntil = 0; remaining = 0; distance = 0; sequence = 0;
  started = -Infinity; upgradeStarted = -Infinity; castCooldown = 0;
  variant: MobilityVariant | null = null; rank = 0;
  from: Point = { x: 0, y: 0 }; to: Point = { x: 0, y: 0 }; arrival: Point = { x: 0, y: 0 };
  direction: Point = { x: 0, y: 1 };
  absorb = 0; absorbUntil = 0;
  private dashHits = new Set<number>();
  private arrivedSequence = 0;
  upgrade(w: World, variant: MobilityVariant) {
    const definition = MOBILITY_UPGRADES.find(u => u.id === variant);
    if (!definition || w.experience.level < MOBILITY_SPECIALIZATION_LEVEL || !['playing', 'upgrade'].includes(w.status) || definition.character !== w.character || this.variant && this.variant !== variant || this.rank >= MOBILITY_MAX_RANK) return false;
    this.variant = variant; this.rank++; return true;
  }
  absorbValue(now: number) { return now < this.absorbUntil ? this.absorb : 0; }
  absorbDamage(now: number, amount: number) { const used = Math.min(this.absorbValue(now), amount); this.absorb = Math.max(0, this.absorbValue(now) - used); return used; }
  private arrive(w: World) {
    if (w.status !== 'playing' || this.arrivedSequence === this.sequence || distance(this.from, w.player) < 1 || !this.variant) return;
    this.arrivedSequence = this.sequence; this.arrival = { x: w.player.x, y: w.player.y }; this.upgradeStarted = w.elapsed;
    const rank = this.rank - 1;
    if (this.variant === 'flame-trail' || this.variant === 'slowing-flame') {
      const walls = w.zones.filter(z => z.wall);
      if (walls.length >= S.wallCap) w.zones = w.zones.filter(z => z.id !== walls[0].id);
      if (w.impacts.length + w.zones.length >= 24) return;
      w.zones.push({ id: w.id(), x: (this.from.x + this.arrival.x) / 2, y: (this.from.y + this.arrival.y) / 2, radius: 0,
        damage: this.variant === 'flame-trail' ? S.flameDamage[rank] * w.stats.damage : 0, source: 'mobility', expires: w.elapsed + S.wallDuration, nextTick: w.elapsed,
        wall: { variant: this.variant, from: { ...this.from }, to: { ...this.arrival }, width: this.variant === 'flame-trail' ? S.flameWidth[rank] : S.slowingWidth[rank], nextHit: new Map() } });
    } else if (this.variant === 'arcane-sprint') w.buffs.refresh('arcane-sprint', w.elapsed, S.sprintDuration, { speed: S.sprintSpeed[rank] });
    else if (this.variant === 'absorb-shield') { this.absorb = w.effectiveMaxHp * S.absorbFraction[rank]; this.absorbUntil = w.elapsed + S.absorbDuration; }
    else if (this.variant === 'berserk') w.buffs.refresh('berserk', w.elapsed, S.berserkDuration, { damage: S.berserkDamage[rank], cooldown: S.berserkCooldown[rank] });
  }
  activate(w: World, input: Point = { x: 0, y: 0 }) {
    if (w.status !== 'playing' || w.elapsed < this.readyAt || this.remaining > 0 || !Number.isFinite(input.x + input.y + w.player.x + w.player.y)) return false;
    const c = MOBILITY[w.character], v = direction(input.x, input.y);
    this.direction = v.x || v.y ? v : { ...w.facing };
    if (!Number.isFinite(this.direction.x + this.direction.y) || !Math.hypot(this.direction.x, this.direction.y)) return false;
    this.distance = Math.min(c.distance, Math.max(24, Math.min(w.width, w.height) * MOBILITY.viewportFraction));
    this.from = { x: w.player.x, y: w.player.y };
    this.to = { x: this.from.x + this.direction.x * this.distance, y: this.from.y + this.direction.y * this.distance };
    this.castCooldown = effectiveCooldown(c.cooldown, w.effectiveCooldown);
    this.started = w.elapsed; this.readyAt = w.elapsed + this.castCooldown; this.protectedUntil = w.elapsed + c.protection; this.sequence++;
    this.dashHits.clear(); w.facing = { ...this.direction };
    if (w.character === 'mage') { w.player.x = this.to.x; w.player.y = this.to.y; this.arrive(w); }
    else this.remaining = this.distance;
    return true;
  }
  update(w: World, dt: number) {
    if (w.status !== 'playing' || this.remaining <= 0 || dt <= 0 || !Number.isFinite(dt)) return false;
    const from = { x: w.player.x, y: w.player.y }, amount = Math.min(this.remaining, this.distance / MOBILITY.warrior.duration * dt);
    w.player.x += this.direction.x * amount; w.player.y += this.direction.y * amount;
    this.remaining = Math.max(0, this.remaining - amount);
    if (this.variant === 'cleaving-dash') for (const e of [...w.combatTargets]) {
      if (!this.dashHits.has(e.id) && segmentDistance(e, from, w.player) <= e.radius + S.cleaveWidth[this.rank - 1] / 2) {
        this.dashHits.add(e.id); w.damageEnemy(e, S.cleaveDamage[this.rank - 1] * w.stats.damage, 'mobility');
      }
    }
    if (this.remaining === 0) this.arrive(w);
    return true;
  }
  tick(w: World) {
    if (w.status !== 'playing') return;
    if (w.elapsed >= this.absorbUntil) this.absorb = 0;
    for (const z of w.zones) if (z.wall && z.expires > w.elapsed) {
      const wall = z.wall, live = new Set(w.enemies.map(e => e.id));
      for (const id of wall.nextHit.keys()) if (!live.has(id)) wall.nextHit.delete(id);
      for (const e of [...w.combatTargets]) if (insideMobilityWall(e, wall)) {
        if (wall.variant === 'slowing-flame') {
          // Preserve the existing boss/Guardian control immunity.
          if (!e.boss && e.kind !== 'guardian') e.mobilitySlowUntil = Math.max(e.mobilitySlowUntil ?? 0, Math.min(z.expires, w.elapsed + S.slowRefresh));
        } else if ((wall.nextHit.get(e.id) ?? 0) <= w.elapsed) {
          wall.nextHit.set(e.id, w.elapsed + S.wallTick); w.damageEnemy(e, z.damage, 'mobility');
        }
      }
    }
  }
  snapshot(w: World) { const c = MOBILITY[w.character], specialization = MOBILITY_UPGRADES.find(u => u.id === this.variant); return { name: c.name, cooldown: effectiveCooldown(c.cooldown, w.effectiveCooldown), castCooldown: this.castCooldown, readyIn: Math.max(0, this.readyAt - w.elapsed), active: this.remaining > 0, sequence: this.sequence, variant: this.variant, rank: this.rank, specialization: specialization?.name ?? null, category: specialization?.category ?? null, absorb: this.absorbValue(w.elapsed), absorbRemaining: Math.max(0, this.absorbUntil - w.elapsed) }; }
  clear() { this.readyAt = this.protectedUntil = this.remaining = this.castCooldown = this.absorb = this.absorbUntil = 0; this.started = this.upgradeStarted = -Infinity; this.variant = null; this.rank = 0; this.dashHits.clear(); this.arrivedSequence = 0; }
}
