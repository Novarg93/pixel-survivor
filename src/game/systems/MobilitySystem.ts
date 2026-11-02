import { MOBILITY } from '../config/encounters';
import { direction, type Point } from '../utils/math';
import type { World } from './World';
import { effectiveCooldown } from './Cooldown';
import { MOBILITY_MAX_RANK, MOBILITY_UPGRADES, type MobilityVariant } from '../config/mobilityUpgrades';
import { distance } from '../utils/math';

export class MobilitySystem {
  readyAt = 0;
  protectedUntil = 0;
  remaining = 0;
  distance = 0;
  sequence = 0;
  started = -Infinity;
  variant: MobilityVariant | null = null;
  rank = 0;
  upgradeStarted = -Infinity;
  arrival: Point = { x: 0, y: 0 };
  sprintUntil = 0;
  armorUntil = 0;
  momentumUntil = 0;
  castCooldown = 0;
  upgrade(w: World, variant: MobilityVariant) {
    const definition = MOBILITY_UPGRADES.find(u => u.id === variant);
    if (!definition || definition.character !== w.character || this.variant && this.variant !== variant || this.rank >= MOBILITY_MAX_RANK) return false;
    this.variant = variant; this.rank++; return true;
  }
  speedMultiplier(now: number) { return now < this.sprintUntil ? 1.1 + this.rank * .1 : 1; }
  damageMultiplier(now: number) { return now < this.armorUntil ? 1 - (.1 + this.rank * .1) : 1; }
  consumeMomentum(now: number) { const bonus = now < this.momentumUntil ? 1.1 + this.rank * .15 : 1; this.momentumUntil = 0; return bonus; }
  private arrive(w: World) {
    if (w.status !== 'playing' || distance(this.from, w.player) < 1 || !this.variant) return;
    this.arrival = { x: w.player.x, y: w.player.y }; this.upgradeStarted = w.elapsed;
    const radius = 38 + this.rank * 8;
    if (this.variant === 'shockwave' || this.variant === 'impact-dash') {
      for (const e of [...w.combatTargets]) if (distance(e, w.player) <= radius + e.radius) w.damageEnemy(e, (24 + this.rank * 12) * w.stats.damage, 'mobility');
    } else if (this.variant === 'frost-blink') {
      for (const e of w.combatTargets) if (distance(e, w.player) <= radius + e.radius && !e.boss && e.kind !== 'guardian') {
        e.mobilitySlowUntil = w.elapsed + .6 + this.rank * .4;
      }
    } else if (this.variant === 'arcane-sprint') this.sprintUntil = w.elapsed + 2;
    else if (this.variant === 'iron-charge') this.armorUntil = w.elapsed + 1.2;
    else this.momentumUntil = w.elapsed + 3;
  }
  from: Point = { x: 0, y: 0 };
  to: Point = { x: 0, y: 0 };
  direction: Point = { x: 0, y: 1 };
  activate(w: World, input: Point = { x: 0, y: 0 }) {
    if (w.status !== 'playing' || w.elapsed < this.readyAt || this.remaining > 0) return false;
    const c = MOBILITY[w.character], v = direction(input.x, input.y);
    this.direction = v.x || v.y ? v : { ...w.facing };
    if (!Number.isFinite(this.direction.x + this.direction.y) || !Math.hypot(this.direction.x, this.direction.y)) return false;
    this.distance = Math.min(c.distance, Math.max(24, Math.min(w.width, w.height) * MOBILITY.viewportFraction));
    this.from = { x: w.player.x, y: w.player.y };
    this.to = { x: this.from.x + this.direction.x * this.distance, y: this.from.y + this.direction.y * this.distance };
    this.castCooldown = effectiveCooldown(c.cooldown, w.effectiveCooldown);
    this.started = w.elapsed; this.readyAt = w.elapsed + this.castCooldown; this.protectedUntil = w.elapsed + c.protection; this.sequence++;
    w.facing = { ...this.direction };
    if (w.character === 'mage') { w.player.x = this.to.x; w.player.y = this.to.y; this.arrive(w); }
    else this.remaining = this.distance;
    return true;
  }
  update(w: World, dt: number) {
    if (w.status !== 'playing' || this.remaining <= 0 || dt <= 0) return false;
    const amount = Math.min(this.remaining, this.distance / MOBILITY.warrior.duration * dt);
    w.player.x += this.direction.x * amount; w.player.y += this.direction.y * amount;
    this.remaining = Math.max(0, this.remaining - amount);
    if (this.remaining === 0) this.arrive(w);
    return true;
  }
  snapshot(w: World) { const c = MOBILITY[w.character]; return { name: c.name, cooldown: effectiveCooldown(c.cooldown, w.effectiveCooldown), castCooldown: this.castCooldown, readyIn: Math.max(0, this.readyAt - w.elapsed), active: this.remaining > 0, sequence: this.sequence, variant: this.variant, rank: this.rank, specialization: MOBILITY_UPGRADES.find(u => u.id === this.variant)?.name ?? null }; }
  clear() { this.readyAt = this.protectedUntil = this.remaining = this.sprintUntil = this.armorUntil = this.momentumUntil = this.castCooldown = 0; this.started = this.upgradeStarted = -Infinity; this.variant = null; this.rank = 0; }
}
