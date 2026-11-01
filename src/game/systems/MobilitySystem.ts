import { MOBILITY } from '../config/encounters';
import { direction, type Point } from '../utils/math';
import type { World } from './World';

export class MobilitySystem {
  readyAt = 0;
  protectedUntil = 0;
  remaining = 0;
  distance = 0;
  sequence = 0;
  started = -Infinity;
  from: Point = { x: 0, y: 0 };
  to: Point = { x: 0, y: 0 };
  direction: Point = { x: 0, y: 1 };
  activate(w: World, input: Point = { x: 0, y: 0 }) {
    if (w.status !== 'playing' || w.elapsed < this.readyAt || this.remaining > 0) return false;
    const c = MOBILITY[w.character], v = direction(input.x, input.y);
    this.direction = v.x || v.y ? v : { ...w.facing };
    this.distance = Math.min(c.distance, Math.max(24, Math.min(w.width, w.height) * MOBILITY.viewportFraction));
    this.from = { x: w.player.x, y: w.player.y };
    this.to = { x: this.from.x + this.direction.x * this.distance, y: this.from.y + this.direction.y * this.distance };
    this.started = w.elapsed; this.readyAt = w.elapsed + c.cooldown; this.protectedUntil = w.elapsed + c.protection; this.sequence++;
    w.facing = { ...this.direction };
    if (w.character === 'mage') { w.player.x = this.to.x; w.player.y = this.to.y; }
    else this.remaining = this.distance;
    return true;
  }
  update(w: World, dt: number) {
    if (this.remaining <= 0) return false;
    const amount = Math.min(this.remaining, this.distance / MOBILITY.warrior.duration * dt);
    w.player.x += this.direction.x * amount; w.player.y += this.direction.y * amount;
    this.remaining = Math.max(0, this.remaining - amount);
    return true;
  }
  snapshot(w: World) { const c = MOBILITY[w.character]; return { name: c.name, cooldown: c.cooldown, readyIn: Math.max(0, this.readyAt - w.elapsed), active: this.remaining > 0, sequence: this.sequence }; }
  clear() { this.readyAt = 0; this.protectedUntil = 0; this.remaining = 0; this.started = -Infinity; }
}
