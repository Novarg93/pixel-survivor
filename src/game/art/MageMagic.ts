import type Phaser from 'phaser';
import type { World } from '../systems/World';
import type { Effect } from '../entities/types';

export function effectPhase(now: number, started: number, duration: number) { return Math.min(1, Math.max(0, (now - started) / Math.max(.001, duration))); }
// Stepped rings and narrow bright cores. One existing Graphics batch, no particles/timers.
function ring(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, color: number, alpha: number, offset = 0, segments = 24) {
  g.lineStyle(1, color, alpha).beginPath();
  for (let i = 0; i <= segments; i++) {
    const a = offset + i * Math.PI * 2 / segments, px = Math.round(x + Math.cos(a) * r), py = Math.round(y + Math.sin(a) * r);
    if (i) g.lineTo(px, py); else g.moveTo(px, py);
  }
  g.strokePath();
}
export function drawMageMagic(g: Phaser.GameObjects.Graphics, w: World, intensity: number, skipMeteor: (effect: Effect) => boolean = () => false) {
  for (const p of w.projectiles) if (!p.hostile) {
    const length = Math.hypot(p.vx, p.vy) || 1, dx = p.vx / length, dy = p.vy / length;
    for (let i = 1; i <= 4; i++) { const size = Math.max(1, 3 - i * .5); g.fillStyle(i < 3 ? 0xfba35e : 0x9a4b41, intensity * (1 - i / 5)).fillRect(Math.round(p.x - dx * i * 3) - size / 2, Math.round(p.y - dy * i * 3) - size / 2, size, size); }
  }
  for (const e of w.effects) {
    const t = effectPhase(w.elapsed, e.started, e.duration), fade = (1 - t) * intensity;
    if (e.kind === 'frost' || e.kind === 'shield') {
      const frost = e.kind === 'frost', r = e.radius * (.65 + t * .35), color = frost ? 0x91e4dc : 0xa5c4ff;
      ring(g, e.x, e.y, r, 0x263e53, fade, 0, 32); ring(g, e.x, e.y, r - 1, color, fade);
      ring(g, e.x, e.y, r * .87, color, fade * .35, .12);
      const rank = w.abilities[frost ? 'frost' : 'shield'].level;
      for (let i = 0; i < 6 + Math.min(4, rank); i++) {
        const a = i * Math.PI * 2 / (6 + Math.min(4, rank)), x = Math.round(e.x + Math.cos(a) * r), y = Math.round(e.y + Math.sin(a) * r);
        g.lineStyle(1, 0xdffff0, fade).lineBetween(x - 2, y, x + 2, y).lineBetween(x, y - 3, x, y + 3);
        if (frost) g.lineStyle(1, color, fade * .65).lineBetween(x - 2, y - 2, x + 2, y + 2);
      }
    } else if (e.kind === 'lightning' && e.target) {
      const dx = e.target.x - e.x, dy = e.target.y - e.y, len = Math.hypot(dx, dy) || 1;
      const points = Array.from({ length: 7 }, (_, i) => { const n = i / 6, kick = i === 0 || i === 6 ? 0 : ((i + e.id) % 2 ? 1 : -1) * (3 + w.abilities.lightning.level * .35); return { x: Math.round(e.x + dx * n - dy / len * kick), y: Math.round(e.y + dy * n + dx / len * kick) }; });
      for (const [width, color, alpha] of [[4, 0x423354, .4], [2, 0xaf8cdd, .85], [1, 0xf3e5ff, 1]]) {
        g.lineStyle(width, color, fade * alpha).beginPath(); points.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.strokePath();
      }
      g.fillStyle(0xf3e5ff, fade).fillRect(e.target.x - 2, e.target.y - 2, 4, 4);
    } else if (e.kind === 'meteor' && e.color !== 0xff829d && !skipMeteor(e)) {
      const r = e.radius * (.3 + t * .7); ring(g, e.x, e.y, r, 0xffb779, fade * .9); ring(g, e.x, e.y, r + 3, 0x9e5d51, fade * .6);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4 + e.id, x = e.x + Math.cos(a) * r * .8, y = e.y + Math.sin(a) * r * .8;
        g.fillStyle(i % 2 ? 0xfba35e : 0xffe0a0, fade).fillRect(Math.round(x), Math.round(y - t * 8), Math.max(1, 5 * (1 - t)), Math.max(1, 3 * (1 - t)));
      }
    }
  }
  for (const impact of w.impacts) if (!impact.hostile && impact.source === 'meteor') {
    const t = 1 - Math.min(1, Math.max(0, (impact.landAt - w.elapsed) / .85));
    ring(g, impact.x, impact.y, impact.radius, 0xe6a36c, intensity * .55);
    ring(g, impact.x, impact.y, impact.radius * (.5 + .5 * t), 0xfbd0a0, intensity * .4);
    const y = impact.y - (1 - t) * 100, x = impact.x + (1 - t) * 32;
    g.lineStyle(3, 0xa65e48, intensity * .6).lineBetween(x + 8, y - 22, x, y);
    g.fillStyle(0xe08b52, intensity).fillTriangle(x - 6, y - 6, x + 4, y - 9, x + 4, y + 5);
    g.fillStyle(0xffe3a1, intensity).fillTriangle(x - 3, y - 4, x + 2, y - 6, x + 2, y + 2);
  }
  if (w.shield.charges > 0 && w.shield.activeUntil > w.elapsed) {
    const pulse = .65 + Math.sin(w.elapsed * 3) * .12;
    ring(g, w.player.x, w.player.y, 22, 0xa5c4ff, Math.max(.25, intensity) * pulse, 0, 16);
    for (let i = 0; i < Math.min(4, w.shield.charges); i++) { const x = w.player.x - 4 + i * 3; g.fillStyle(0xe6f1ff, pulse).fillRect(x, w.player.y - 24, 2, 2); }
  }
}
