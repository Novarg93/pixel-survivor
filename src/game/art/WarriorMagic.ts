import type Phaser from 'phaser';
import type { World } from '../systems/World';
import type { Impact, Effect } from '../entities/types';
import { bladePositions } from '../abilities/warrior';
import { effectPhase } from './MageMagic';

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
function arc(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, angle: number, alpha: number) {
  for (const [offset, width, color, opacity] of [[0, 5, 0x405469, .9], [-1, 2, 0xc9dfe2, 1], [-3, 1, 0xffe1aa, .85]]) {
    g.lineStyle(width, color, alpha * opacity).beginPath();
    for (let i = 0; i <= 12; i++) { const a = angle - 1.1 + i / 12 * 2.2, px = Math.round(x + Math.cos(a) * (r + offset)), py = Math.round(y + Math.sin(a) * (r + offset)); if (i) g.lineTo(px, py); else g.moveTo(px, py); }
    g.strokePath();
  }
}
export function drawWarriorMagic(g: Phaser.GameObjects.Graphics, w: World, intensity: number, slams: readonly SlamView[]) {
  for (const e of w.effects) if (e.kind === 'whirlwind') {
    const t = effectPhase(w.elapsed, e.started, e.duration), fade = Math.sin(Math.PI * Math.min(.99, .1 + t * .9)) * intensity;
    const aim = w.elapsed * 9;
    for (let i = 0; i < 2 + (w.abilities.whirlwind.level >= 4 ? 1 : 0); i++) arc(g, e.x, e.y, e.radius * (.8 + .2 * t), aim + i * Math.PI, fade * .65);
  }
  for (const p of bladePositions(w)) {
    const a = Math.atan2(p.y - w.player.y, p.x - w.player.x) + Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
    const point = (x: number, y: number) => ({ x: Math.round(p.x + x * c - y * s), y: Math.round(p.y + x * s + y * c) });
    const polygon = (points: number[][], color: number) => { g.fillStyle(color, intensity).beginPath(); points.map(([x, y]) => point(x, y)).forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.closePath().fillPath(); };
    arc(g, w.player.x, w.player.y, 58 * w.stats.area, a - Math.PI / 2 - .65, intensity * .17);
    polygon([[-2, 5], [-3, -5], [0, -13], [3, -5], [2, 5]], 0x263647);
    polygon([[-1, 3], [-2, -5], [0, -11], [0, 3]], 0xe0edf0);
    polygon([[0, 3], [0, -11], [2, -5], [1, 3]], 0x819cae);
    polygon([[-4, 3], [4, 3], [4, 5], [-4, 5]], 0xd8b47e);
    const h = point(0, 8); g.fillStyle(0xb58a64, intensity).fillRect(h.x - 1, h.y - 2, 2, 5);
  }
  if (w.warrior.ironUntil > w.elapsed) {
    const alpha = Math.max(.2, intensity) * Math.min(1, (w.warrior.ironUntil - w.elapsed) * 3);
    for (const side of [-1, 1]) {
      const x = w.player.x + side * 18, y = w.player.y;
      g.fillStyle(0x405469, alpha * .8).fillTriangle(x, y - 15, x + side * 5, y - 6, x, y + 10);
      g.lineStyle(1, 0xd5e7e6, alpha).lineBetween(x, y - 15, x + side * 5, y - 6).lineBetween(x + side * 5, y - 6, x, y + 10);
      g.fillStyle(0xe2bc80, alpha).fillRect(x - 1, y - 4, 2, 3);
    }
  }
  for (const i of w.impacts) if (i.source === 'slam' && !i.hostile) {
    const t = 1 - Math.min(1, Math.max(0, (i.landAt - w.elapsed) / .65));
    g.lineStyle(1, 0xc4a677, intensity * .7);
    for (let n = 0; n < 8; n++) { const a = n * Math.PI / 4, r = i.radius, x = i.x + Math.cos(a) * r, y = i.y + Math.sin(a) * r; g.lineBetween(x, y, i.x + Math.cos(a) * (r - 6 - t * 4), i.y + Math.sin(a) * (r - 6 - t * 4)); }
    g.lineStyle(2, 0xe6cda2, intensity * .7).lineBetween(i.x - 5, i.y, i.x + 5, i.y).lineBetween(i.x, i.y - 5, i.x, i.y + 5);
  }
  for (const b of slams) {
    const t = effectPhase(w.elapsed, b.started, .5), fade = (1 - t) * intensity;
    for (let n = 0; n < 8; n++) {
      const a = n * Math.PI / 4, dx = Math.cos(a), dy = Math.sin(a), r = b.radius * t;
      g.lineStyle(2, 0x342e36, fade).lineBetween(b.x + dx * 8, b.y + dy * 8, b.x + dx * r, b.y + dy * r);
      g.lineStyle(1, 0xc6a77b, fade).lineBetween(b.x + dx * 10, b.y + dy * 10 - 1, b.x + dx * r, b.y + dy * r - 1);
      g.fillStyle(0xd7c09a, fade * .6).fillRect(Math.round(b.x + dx * r), Math.round(b.y + dy * r - t * 5), 3, 2);
    }
    for (let n = 0; n < 3; n++) arc(g, b.x, b.y, b.radius * (.3 + .7 * t), n * Math.PI * 2 / 3, fade * .6);
  }
}
