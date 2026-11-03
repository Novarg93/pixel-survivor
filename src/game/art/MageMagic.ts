import type Phaser from 'phaser';
import type { World } from '../systems/World';
import type { Effect } from '../entities/types';
import { abilityVisual } from './abilityVisual';
import { ARMAGEDDON } from '../config/mageAbilities';

export function effectPhase(now: number, started: number, duration: number) { return Math.min(1, Math.max(0, (now - started) / Math.max(.001, duration))); }
// Stepped rings and narrow bright cores. One existing Graphics batch, no particles/timers.
function ring(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, color: number, alpha: number, offset = 0, segments = 24, width = 1) {
  g.lineStyle(width, color, alpha).beginPath();
  for (let i = 0; i <= segments; i++) {
    const a = offset + i * Math.PI * 2 / segments, px = Math.round(x + Math.cos(a) * r), py = Math.round(y + Math.sin(a) * r);
    if (i) g.lineTo(px, py); else g.moveTo(px, py);
  }
  g.strokePath();
}
export function drawMageMagic(g: Phaser.GameObjects.Graphics, w: World, intensity: number, skipMeteor: (effect: Effect) => boolean = () => false) {
  for (const p of w.projectiles) if (!p.hostile) {
    const v = abilityVisual(w.abilities.fireball.level), count = 4 + Math.round(v.power * 4);
    const length = Math.hypot(p.vx, p.vy) || 1, dx = p.vx / length, dy = p.vy / length;
    for (let i = 1; i <= count; i++) { const size = Math.max(1, 3 + v.power * 2 - i * .5); g.fillStyle(i < 3 ? 0xffd38b : 0xc76a44, intensity * (1 - i / (count + 1))).fillRect(Math.round(p.x - dx * i * 3) - size / 2, Math.round(p.y - dy * i * 3) - size / 2, size, size); }
    if (v.rank >= 3) for (const side of [-1, 1]) g.lineStyle(v.lineWidth, v.capstone ? 0xfff0bd : 0xffae68, intensity * .7).lineBetween(p.x - dx * 4 - dy * 4 * side, p.y - dy * 4 + dx * 4 * side, p.x - dx * (10 + v.power * 8) - dy * 7 * side, p.y - dy * (10 + v.power * 8) + dx * 7 * side);
    if (v.capstone) ring(g, p.x, p.y, 5, 0xffe4a3, intensity * .65, w.elapsed * 5, 6);
  }
  for (const e of w.effects) {
    const t = effectPhase(w.elapsed, e.started, e.duration), fade = (1 - t) * intensity;
    if (e.kind === 'frost') {
      if (w.status === 'over' || e.expires <= w.elapsed) continue;
      const age = w.elapsed - e.started, v = abilityVisual(w.abilities.frost.level);
      const bloom = Math.min(1, age / .22), alpha = Math.min(1, (e.expires - w.elapsed) / .2) * intensity;
      const r = e.radius * (.3 + .7 * bloom);
      ring(g, e.x, e.y, r + 2, 0x254458, alpha * .8, 0, 32, 3);
      ring(g, e.x, e.y, r, 0xd9f3f7, alpha, 0, 32, 2);
      ring(g, e.x, e.y, r - 5, 0x81becf, alpha * .5, .05, 32);
      for (let i = 0; i < v.sparks; i++) {
        const a = i * Math.PI * 2 / v.sparks, x = Math.round(e.x + Math.cos(a) * r), y = Math.round(e.y + Math.sin(a) * r);
        const h = Math.round((5 + i % 3 * 3 + v.power * 3) * bloom);
        g.fillStyle(0x578ea9, alpha * .8).fillRect(x - 3, y - h, 6, h + 2);
        g.fillStyle(0xb8e4f3, alpha).fillRect(x - 2, y - h - 2, 4, h + 2);
        g.fillStyle(0xf0fcff, alpha).fillRect(x - 1, y - h - 3, 2, Math.max(2, h * .6));
      }
    } else if (e.kind === 'shield') {
      if (w.status === 'over' || e.expires <= w.elapsed) continue;
      // A spent cast must not leave a protective shell. The large evolution
      // pulse remains visible as damage feedback while the player is alive.
      if (w.character === 'mage' && w.shield.absorbValue(w.elapsed) <= 0 && e.radius <= 32) continue;
      const r = e.radius * (.65 + t * .35), color = 0xa5c4ff;
      const v = abilityVisual(w.abilities[w.character === 'warrior' ? 'iron' : 'shield'].level);
      ring(g, e.x, e.y, r, 0x263e53, fade, 0, 32); ring(g, e.x, e.y, r - 1, color, fade);
      for (let n = 0; n < v.rings; n++) ring(g, e.x, e.y, r * (.87 - n * .12), color, fade * (.3 + v.power * .2), .12, 24, v.lineWidth);
      for (let i = 0; i < v.sparks; i++) {
        const a = i * Math.PI * 2 / v.sparks, x = Math.round(e.x + Math.cos(a) * r), y = Math.round(e.y + Math.sin(a) * r);
        g.lineStyle(v.lineWidth, 0xdffff0, fade).lineBetween(x - 2, y, x + 2, y).lineBetween(x, y - 3, x, y + 3);
      }
    } else if (e.kind === 'lightning' && e.target) {
      const v = abilityVisual(w.abilities.lightning.level);
      const dx = e.target.x - e.x, dy = e.target.y - e.y, len = Math.hypot(dx, dy) || 1;
      const points = Array.from({ length: 7 }, (_, i) => { const n = i / 6, kick = i === 0 || i === 6 ? 0 : ((i + e.id) % 2 ? 1 : -1) * (3 + w.abilities.lightning.level * .35); return { x: Math.round(e.x + dx * n - dy / len * kick), y: Math.round(e.y + dy * n + dx / len * kick) }; });
      for (const [width, color, alpha] of [[4 + v.power * 3, 0x423354, .4], [2 + v.power * 1.5, 0xaf8cdd, .85], [1 + v.power * .5, 0xf3e5ff, 1]]) {
        g.lineStyle(width, color, fade * alpha).beginPath(); points.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.strokePath();
      }
      if (v.rank >= 3) for (const [i, p] of points.entries()) if (i % 2 && i < 6) g.lineStyle(v.lineWidth, 0xd4b7ff, fade * .8).lineBetween(p.x, p.y, p.x - dy / len * (4 + v.power * 5), p.y + dx / len * (4 + v.power * 5));
      if (v.capstone) ring(g, e.target.x, e.target.y, 6, 0xf3e5ff, fade, 0, 8);
      g.fillStyle(0xf3e5ff, fade).fillRect(e.target.x - 2, e.target.y - 2, 4, 4);
    } else if (e.kind === 'meteor' && e.color !== 0xff829d && !skipMeteor(e)) {
      const v = abilityVisual(w.abilities.meteor.level);
      const r = e.radius * (.3 + t * .7); ring(g, e.x, e.y, r, 0xffb779, fade * .9); ring(g, e.x, e.y, r + 3, 0x9e5d51, fade * .6);
      if (e.color === 0xffae65 && t < .18) g.fillStyle(0xffefb8, intensity * (1 - t / .18) * .38).fillCircle(e.x, e.y, e.radius * .35);
      for (let n = 1; n < v.rings; n++) ring(g, e.x, e.y, r * (1 - n * .2), 0xffe3a1, fade * .7, 0, 24, v.lineWidth);
      for (let i = 0; i < v.sparks + 2; i++) {
        const a = i * Math.PI * 2 / (v.sparks + 2) + e.id, x = e.x + Math.cos(a) * r * .8, y = e.y + Math.sin(a) * r * .8;
        g.fillStyle(i % 2 ? 0xfba35e : 0xffe0a0, fade).fillRect(Math.round(x), Math.round(y - t * 8), Math.max(1, 5 * (1 - t)), Math.max(1, 3 * (1 - t)));
      }
    }
  }
  for (const impact of w.impacts) if (!impact.hostile && impact.source === 'meteor') {
    if (impact.launchAt !== undefined && w.elapsed < impact.launchAt) continue;
    const v = abilityVisual(w.abilities.meteor.level), size = 1 + v.power * .5;
    const t = 1 - Math.min(1, Math.max(0, (impact.landAt - w.elapsed) / ARMAGEDDON.delay));
    ring(g, impact.x, impact.y, impact.radius, 0xe6a36c, intensity * .55);
    ring(g, impact.x, impact.y, impact.radius * (.5 + .5 * t), 0xfbd0a0, intensity * .4);
    if (v.capstone) for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = impact.radius * .8; g.lineStyle(2, 0xffd497, intensity * .7).lineBetween(impact.x + Math.cos(a) * r, impact.y + Math.sin(a) * r, impact.x + Math.cos(a) * (r - 5), impact.y + Math.sin(a) * (r - 5)); }
    const y = impact.y - (1 - t) * 100, x = impact.x + (1 - t) * 32;
    g.lineStyle(3 + v.power * 3, 0xa65e48, intensity * .6).lineBetween(x + 8, y - 22 - v.power * 10, x, y);
    for (let i = 1; i <= 5 + v.rank; i++) {
      const size = Math.max(1, Math.round(5 + v.power * 2 - i * .35));
      g.fillStyle(i % 2 ? 0xf59e46 : 0xffd18e, intensity * (1 - i / (7 + v.rank))).fillRect(Math.round(x + i * 2.2) - size / 2, Math.round(y - i * 6), size, size + 2);
    }
    g.fillStyle(0xb95d41, intensity).fillRect(Math.round(x - 6 * size), Math.round(y - 5 * size), 11 * size, 9 * size);
    g.fillStyle(0xe08b52, intensity).fillTriangle(x - 6 * size, y - 6 * size, x + 4 * size, y - 9 * size, x + 4 * size, y + 5 * size);
    g.fillStyle(0xffe3a1, intensity).fillTriangle(x - 3 * size, y - 4 * size, x + 2 * size, y - 6 * size, x + 2 * size, y + 2 * size);
    g.fillStyle(0x594a4e, intensity).fillRect(Math.round(x - 4 * size), Math.round(y - 3 * size), 7 * size, 6 * size);
    g.fillStyle(0x92756a, intensity).fillRect(Math.round(x - 4 * size), Math.round(y - 3 * size), 3 * size, 4 * size);
    g.fillStyle(0xffd18e, intensity).fillRect(Math.round(x - size), Math.round(y - size), size, 4 * size);
  }
  // Feet-only ice cages leave hands, projectiles and depth20 hostile tells clear.
  if (w.status !== 'over') for (const e of w.enemies) {
    if ((e.freezeUntil ?? 0) > w.elapsed) {
      const alpha = Math.min(1, ((e.freezeUntil ?? 0) - w.elapsed) / .15) * Math.max(.45, intensity);
      for (const side of [-1, 1]) {
        g.fillStyle(0x568bab, alpha).fillRect(Math.round(e.x + side * 8) - 2, Math.round(e.y), 4, 9);
        g.fillStyle(0xcceef8, alpha).fillRect(Math.round(e.x + side * 8) - 1, Math.round(e.y - 3), 2, 10);
      }
      g.lineStyle(1, 0xd9f3f7, alpha).lineBetween(e.x - 9, e.y + 7, e.x + 9, e.y + 7);
    } else if ((e.novaSlowUntil ?? 0) > w.elapsed) for (const side of [-1, 1]) g.fillStyle(0xb8e4f3, Math.max(.4, intensity)).fillRect(Math.round(e.x + side * (e.radius + 2)), Math.round(e.y + 3), 2, 4);
  }
  if (w.shield.absorbValue(w.elapsed)>0) {
    const v = abilityVisual(w.abilities.shield.level);
    const pulse = .65 + Math.sin(w.elapsed * 3) * .12;
    ring(g, w.player.x, w.player.y, 22, 0xa5c4ff, Math.max(.25, intensity) * pulse, 0, 16);
    for (let n = 1; n < v.rings; n++) ring(g, w.player.x, w.player.y, 22 - n * 3, v.capstone ? 0xece5ff : 0xbcb9ee, intensity * pulse * .6, w.elapsed * .2, 8 + v.rank * 2, v.lineWidth);
  }
}
