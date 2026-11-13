import type Phaser from 'phaser';
import type { World } from '../systems/World';
import type { Impact, Effect } from '../entities/types';
import { effectPhase } from './MageMagic';
import { abilityVisual } from './abilityVisual';
import type {WarriorSlash} from './warriorHeroPack';

interface SlamView { x: number; y: number; radius: number; started: number }
// Observes typed Impact.source before step; never guesses from a particle color.
export class SlamPresentation {
  private runId = '';
  private pending = new Map<number, Readonly<Impact>>();
  readonly bursts: SlamView[] = [];
  prepare(w: World) {
    if (this.runId !== w.runId) { this.clear(); this.runId = w.runId; }
    for (const i of w.impacts) if (i.source === 'slam' && !i.hostile && this.pending.size < 24) this.pending.set(i.id, i);
  }
  update(w: World) {
    for (let i = this.bursts.length - 1; i >= 0; i--) if (w.elapsed - this.bursts[i].started >= .5) this.bursts.splice(i, 1);
    const live = new Set(w.impacts.map(i => i.id));
    for (const [id, impact] of this.pending) if (!live.has(id)) {
      if (impact.landAt <= w.elapsed && this.bursts.length < 24) this.bursts.push({ x: impact.x, y: impact.y, radius: impact.radius, started: impact.landAt });
      this.pending.delete(id);
    }
  }
  owns(e: Effect) { return e.kind === 'meteor' && this.bursts.some(b => Math.abs(b.x - e.x) < .01 && Math.abs(b.y - e.y) < .01 && Math.abs(b.started - e.started) < .1); }
  clear() { this.pending.clear(); this.bursts.length = 0; }
}
function arc(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, angle: number, alpha: number, power = 0) {
  for (const [offset, width, color, opacity] of [[0, 5, 0x405469, .9], [-1, 2, 0xc9dfe2, 1], [-3, 1, 0xffe1aa, .85]]) {
    g.lineStyle(width + power * (width > 1 ? 1 : .5), color, alpha * opacity).beginPath();
    for (let i = 0; i <= 12; i++) { const a = angle - 1.1 + i / 12 * 2.2, px = Math.round(x + Math.cos(a) * (r + offset)), py = Math.round(y + Math.sin(a) * (r + offset)); if (i) g.lineTo(px, py); else g.moveTo(px, py); }
    g.strokePath();
  }
}
export function drawWarriorMagic(g: Phaser.GameObjects.Graphics, w: World, intensity: number, slams: readonly SlamView[], slash?:WarriorSlash|null) {
  const cleaves=slash===undefined?w.effects.filter(e=>e.kind==='cleave').map(e=>({x:e.x,y:e.y,radius:e.radius,phase:effectPhase(w.elapsed,e.started,e.duration),angle:e.target?Math.atan2(e.target.y-e.y,e.target.x-e.x):0})):slash?[{...w.player,...slash}]:[];
  for (const e of cleaves) {
    const v = abilityVisual(w.abilities.cleave.level), t = e.phase, aim = e.angle;
    for (let i = 0; i < v.rings; i++) arc(g, e.x, e.y, e.radius * (.8 - i * .12), aim, (1 - t) * intensity * (.2 + v.power * .4), v.power);
    if (v.capstone) for (let i = 0; i < 7; i++) { const a = aim - .9 + i * .3, r = e.radius * (.6 + t * .25); g.fillStyle(0xffedb8, (1 - t) * intensity).fillRect(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, 2, 3); }
  }
  for (const e of w.effects) if (e.kind === 'whirlwind' && slash===undefined) {
    const v = abilityVisual(w.abilities.whirlwind.level), count = 2 + Math.floor(v.rank / 2);
    const t = effectPhase(w.elapsed, e.started, e.duration), fade = Math.sin(Math.PI * Math.min(.99, .1 + t * .9)) * intensity;
    const aim = w.elapsed * 9;
    for (let i = 0; i < count; i++) arc(g, e.x, e.y, e.radius * (.8 + .2 * t), aim + i * Math.PI * 2 / count, fade * (.5 + v.power * .2), v.power);
  }
  if (w.warrior.ironUntil > w.elapsed) {
    const v = abilityVisual(w.abilities.iron.level);
    const alpha = Math.max(.2, intensity) * Math.min(1, (w.warrior.ironUntil - w.elapsed) * 3);
    for (const side of [-1, 1]) {
      const x = w.player.x + side * 18, y = w.player.y;
      g.fillStyle(0x405469, alpha * .8).fillTriangle(x, y - 15, x + side * 5, y - 6, x, y + 10);
      g.lineStyle(1, 0xd5e7e6, alpha).lineBetween(x, y - 15, x + side * 5, y - 6).lineBetween(x + side * 5, y - 6, x, y + 10);
      g.fillStyle(0xe2bc80, alpha).fillRect(x - 1, y - 4, 2, 3);
      for (let i = 1; i < v.rank; i++) g.lineStyle(v.lineWidth, v.capstone ? 0xffeac0 : 0x91c8d7, alpha * .7).lineBetween(x + side * (i % 2 ? 2 : -2), y - 12 + i * 4, x + side * (i % 2 ? 5 : -5), y - 10 + i * 4);
    }
    if (v.capstone) g.lineStyle(1.5, 0xe6d1a0, alpha * .6).strokeCircle(w.player.x, w.player.y, 20);
  }
  for (const i of w.impacts) if (i.source === 'slam' && !i.hostile) {
    const v = abilityVisual(w.abilities.slam.level);
    const t = 1 - Math.min(1, Math.max(0, (i.landAt - w.elapsed) / .65));
    g.lineStyle(1, 0xc4a677, intensity * .7);
    for (let n = 0; n < v.sparks; n++) { const a = n * Math.PI * 2 / v.sparks, r = i.radius, x = i.x + Math.cos(a) * r, y = i.y + Math.sin(a) * r; g.lineBetween(x, y, i.x + Math.cos(a) * (r - 6 - t * 4), i.y + Math.sin(a) * (r - 6 - t * 4)); }
    g.lineStyle(2, 0xe6cda2, intensity * .7).lineBetween(i.x - 5, i.y, i.x + 5, i.y).lineBetween(i.x, i.y - 5, i.x, i.y + 5);
  }
  for (const b of slams) {
    const v = abilityVisual(w.abilities.slam.level), count = 8 + Math.round(v.power * 8);
    const t = effectPhase(w.elapsed, b.started, .5), fade = (1 - t) * intensity;
    for (let n = 0; n < count; n++) {
      const a = n * Math.PI * 2 / count, dx = Math.cos(a), dy = Math.sin(a), r = b.radius * t;
      g.lineStyle(2, 0x342e36, fade).lineBetween(b.x + dx * 8, b.y + dy * 8, b.x + dx * r, b.y + dy * r);
      g.lineStyle(1, 0xc6a77b, fade).lineBetween(b.x + dx * 10, b.y + dy * 10 - 1, b.x + dx * r, b.y + dy * r - 1);
      g.fillStyle(0xd7c09a, fade * .6).fillRect(Math.round(b.x + dx * r), Math.round(b.y + dy * r - t * 5), 3, 2);
    }
    for (let n = 0; n < 2 + v.rings; n++) arc(g, b.x, b.y, b.radius * (.3 + .7 * t), n * Math.PI * 2 / (2 + v.rings), fade * .6, v.power);
  }
}
