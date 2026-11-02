import type Phaser from 'phaser';
import { GUARDIAN_ENCOUNTER as C, MOBILITY } from '../config/encounters';
import { guardianBeamEnd, type GuardianEncounter } from '../systems/GuardianEncounter';
import type { MobilitySystem } from '../systems/MobilitySystem';
import type { World } from '../systems/World';

// Enemy danger belongs to the existing depth-20 batch and ignores cosmetic intensity.
export function drawGuardianDanger(g: Phaser.GameObjects.Graphics, w: World, state: GuardianEncounter | null) {
  const e = w.rareGuardian; if (!e) return;
  g.lineStyle(1, state ? 0xffcc83 : 0xb29c65, .9).strokeCircle(e.x, e.y, e.radius + 5);
  if (!state || state.ownerId !== e.id) return;
  if (state.phase === 'beam-warning' || state.phase === 'beam') {
    const end = guardianBeamEnd(e, state), active = state.phase === 'beam';
    g.lineStyle(C.beamWidth + 2, 0x251f3a, .8).lineBetween(e.x, e.y, end.x, end.y);
    g.lineStyle(C.beamWidth, active ? 0xff648e : 0xe893a7, active ? .8 : .24).lineBetween(e.x, e.y, end.x, end.y);
    g.lineStyle(active ? 3 : 1, active ? 0xfff0ba : 0xffb9b1, 1).lineBetween(e.x, e.y, end.x, end.y);
    const tipAngle = state.angle + .45, r = Math.min(58, state.length * .55);
    g.lineStyle(2, 0xffd698).beginPath().arc(e.x, e.y, r, state.angle, tipAngle).strokePath();
    const x = e.x + Math.cos(tipAngle) * r, y = e.y + Math.sin(tipAngle) * r;
    const tx = -Math.sin(tipAngle), ty = Math.cos(tipAngle);
    g.fillStyle(0xffd698).fillTriangle(x + tx * 4, y + ty * 4, x - tx * 3 - ty * 3, y - ty * 3 + tx * 3, x - tx * 3 + ty * 3, y - ty * 3 - tx * 3);
  }
}
export function drawMobility(g: Phaser.GameObjects.Graphics, w: World, mobility: MobilitySystem, intensity: number) {
  drawMobilityUpgrade(g, w, mobility, intensity);
  const t = (w.elapsed - mobility.started) / MOBILITY.visualDuration;
  if (t < 0 || t >= 1 || w.status === 'over') return;
  const alpha = (1 - t) * Math.max(.25, intensity), color = MOBILITY[w.character].color;
  const { from, to } = mobility;
  if (w.character === 'mage') {
    for (const p of [from, to]) {
      g.lineStyle(2, color, alpha).strokeCircle(p.x, p.y, 9 + t * 10);
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + t, r = 12 + t * 9; g.fillStyle(0xe9e2ff, alpha).fillRect(p.x + Math.cos(a) * r - 1, p.y + Math.sin(a) * r - 1, 2, 3); }
    }
    g.lineStyle(1, color, alpha * .35).lineBetween(from.x, from.y, to.x, to.y);
  } else {
    const normal = { x: -mobility.direction.y, y: mobility.direction.x };
    for (let i = -1; i <= 1; i++) g.lineStyle(i ? 2 : 4, i ? 0xf4e5c4 : color, alpha * .6).lineBetween(from.x + normal.x * i * 5, from.y + normal.y * i * 5, w.player.x + normal.x * i * 5, w.player.y + normal.y * i * 5);
  }
}

// Small stepped pixels in the existing friendly-FX batch; no emitters or timers.
export function drawMobilityUpgrade(g: Phaser.GameObjects.Graphics, w: World, m: MobilitySystem, intensity: number) {
  if (w.status === 'over' || !m.variant) return;
  const age = w.elapsed - m.upgradeStarted, t = age / .5;
  const color = m.variant === 'frost-blink' ? 0xa7eee9 : m.variant === 'impact-dash' ? 0xffda9c : 0xd9baff;
  if (t >= 0 && t < 1) {
    const radius = (38 + m.rank * 8) * (.25 + .75 * t);
    for (let i = 0; i < 24; i++) {
      const a = i * Math.PI / 12, x = Math.round(m.arrival.x + Math.cos(a) * radius), y = Math.round(m.arrival.y + Math.sin(a) * radius);
      g.fillStyle(0x37435d, (1 - t) * intensity).fillRect(x - 2, y - 2, 5, 5);
      g.fillStyle(color, (1 - t) * intensity).fillRect(x - 1, y - 1, 3, 3);
      if (i % 3 === 0) g.fillStyle(0xfff0d3, (1 - t) * intensity).fillRect(x, y - 3, 1, 2);
    }
  }
  const buff = Math.max(m.sprintUntil, m.armorUntil, m.momentumUntil);
  if (buff > w.elapsed) for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + age * 2, r = m.armorUntil > w.elapsed ? 14 : 18;
    g.fillStyle(m.armorUntil > w.elapsed ? 0xc8dce8 : color, .7 * intensity).fillRect(Math.round(w.player.x + Math.cos(a) * r), Math.round(w.player.y + Math.sin(a) * r), 2, 3);
  }
}
