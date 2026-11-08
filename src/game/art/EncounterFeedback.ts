import type Phaser from 'phaser';
import type { Enemy } from '../entities/types';
import type { World } from '../systems/World';
import type { BossAnimation } from './BossAnimation';

type BurstKind = 'slam' | 'arrival' | 'cast' | 'death' | 'teleport';
interface Burst { kind: BurstKind; x: number; y: number; started: number; color: number; owner: number; ownerKind: Enemy['kind'] }
interface Track { enemy: Readonly<Enemy>; phase: string; magic: string; slam: number; shootingAt: number }
// Cosmetic observer only. Fixed batch, at most 24 short-lived bursts, no Clock/tweens/RNG.
export class EncounterFeedback {
  private runId = '';
  private tracks = new Map<number, Track>();
  readonly bursts: Burst[] = [];
  prepare(w: World) {
    if (this.runId !== w.runId) { this.clear(); this.runId = w.runId; }
    for (const e of [...w.bosses, ...w.guardians]) if (!this.tracks.has(e.id)) this.tracks.set(e.id, { enemy: e, phase: this.phase(e, w), magic: e.boss?.magic?.phase ?? '', slam: -Infinity, shootingAt: e.shootingAt });
  }
  private phase(e: Readonly<Enemy>, w: World) { return e.boss?.phase ?? w.guardianSystem.encounters.get(e.id)?.phase ?? ''; }
  private emit(w: World, e: Readonly<Enemy>, kind: BurstKind, color: number, x = e.x, y = e.y) {
    if (this.bursts.length === 24) this.bursts.shift();
    this.bursts.push({ kind, x, y, started: w.elapsed, color, owner: e.id, ownerKind: e.kind });
  }
  update(w: World, bosses: BossAnimation) {
    for (let i = this.bursts.length - 1; i >= 0; i--) if (w.elapsed - this.bursts[i].started >= .6) this.bursts.splice(i, 1);
    const live = new Set([...w.bosses, ...w.guardians].map(e => e.id));
    for (const [id, t] of this.tracks) {
      const e = t.enemy, phase = this.phase(e, w), color = e.kind === 'charger' ? 0xe7bd8a : e.kind === 'sorcerer' ? 0xd4b4f3 : 0xa6e6dc;
      if (!live.has(id)) {
        if (e.hp === 0 && e.deathSource !== 'ultimate-lightning') this.emit(w, e, 'death', e.kind === 'guardian' ? 0xffdf9b : color);
        else for (let i = this.bursts.length - 1; i >= 0; i--) if (this.bursts[i].owner === id) this.bursts.splice(i, 1);
        this.tracks.delete(id); continue;
      }
      if(e.kind==='sorcerer'||e.kind==='eclipse'){t.phase=phase;t.magic=e.boss?.magic?.phase??'';t.shootingAt=e.shootingAt;continue;}
      if (e.kind === 'charger') {
        if (t.phase === 'charge' && phase === 'recover') this.emit(w, e, 'arrival', color);
        const p = bosses.view(e, w);
        if (p.pose === 'slam' && w.elapsed - p.started >= .3 && t.slam !== p.started) { t.slam = p.started; this.emit(w, e, 'slam', color); }
      } else if (t.phase.endsWith('warning') && !phase.endsWith('warning') || t.phase === 'windup' && phase === 'recover' || t.shootingAt > 0 && e.shootingAt === 0) this.emit(w, e, 'cast', color);
      const magic = e.boss?.magic?.phase ?? '';
      if (magic === 'prepare' && t.magic !== magic) { this.emit(w, e, 'teleport', color, e.x, e.y); this.emit(w, e, 'teleport', color, e.boss?.magic?.from?.x ?? e.x, e.boss?.magic?.from?.y ?? e.y); }
      t.phase = phase; t.magic = magic; t.shootingAt = e.shootingAt;
    }
  }
  draw(g: Phaser.GameObjects.Graphics, w: World, intensity: number) {
    g.clear(); if (w.status === 'over') return;
    const strength = Math.max(.3, intensity);
    for (const e of [...w.bosses, ...w.guardians]) {
      if(e.kind==='guardian'||e.kind==='sorcerer'||e.kind==='eclipse')continue;
      const phase = this.phase(e, w), preparing = phase === 'windup' || phase.endsWith('warning') || phase === 'awakening';
      const color = e.kind === 'charger' ? 0xd0a477 : 0x99dbdc;
      if (preparing) {
        const until = e.boss?.until ?? w.guardianSystem.encounters.get(e.id)?.until ?? w.elapsed;
        const p = 1 - Math.min(1, Math.max(0, until - w.elapsed) / .5);
        if (e.kind === 'charger') this.cracks(g, e.x, e.y + 17, 20 + p * 18, strength * (.5 + p * .5), color);
        else {
          const r = e.radius + 8 + (1 - p) * 7;
          g.lineStyle(1, color, .7 * strength).strokeCircle(e.x, e.y + 6, r);
          for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 - w.elapsed * .6, x = Math.round(e.x + Math.cos(a) * r), y = Math.round(e.y + 6 + Math.sin(a) * r); g.lineStyle(1, color, strength).strokeRect(x - 2, y - 2, 4, 4); }
        }
      }
      if (phase === 'charge' && e.boss) for (let i = 1; i <= 5; i++) {
        const d = e.boss.direction, offset = (Math.floor(w.elapsed * 18) + i) % 3 - 1;
        g.fillStyle(0xc1ad91, (1 - i / 6) * .5 * strength).fillRect(Math.round(e.x - d.x * i * 7 + d.y * offset * 7) - 2, Math.round(e.y + 16 - d.y * i * 7 - d.x * offset * 7) - 1, 4, 3);
      }
    }
    for (const b of this.bursts) {
      const t = Math.max(0, (w.elapsed - b.started) / .6), alpha = (1 - t) * strength, heavy = b.kind === 'arrival' || b.kind === 'slam', r = (heavy ? 30 : b.kind === 'death' ? 18 : 8) + t * (heavy ? 18 : 24), y = b.y + (heavy ? 18 : 4);
      if (b.ownerKind !== 'guardian') g.lineStyle(t < .15 ? 2 : 1, b.color, alpha).strokeEllipse(b.x, y, r * 2, r * (heavy ? .8 : 1.5));
      if (heavy) this.cracks(g, b.x, y, 30 + t * 12, alpha * .9, b.color);
      for (let i = 0; i < (b.kind === 'death' ? 12 : 8); i++) {
        const a = i * Math.PI / (b.kind === 'death' ? 6 : 4) + .2, x = Math.round(b.x + Math.cos(a) * r), py = Math.round(y + Math.sin(a) * r * .55 - Math.sin(t * Math.PI) * 9);
        const color = b.kind === 'death' ? [0x92dfc4, 0xffbd8e, 0xc4b8fa][i % 3] : b.color;
        g.fillStyle(color, alpha).fillRect(x - 1, py - 1, heavy ? 3 : 2, heavy ? 2 : 3);
      }
    }
  }
  private cracks(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, alpha: number, color: number) {
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 + .18, mx = Math.round(x + Math.cos(a + .15) * r * .55), my = Math.round(y + Math.sin(a + .15) * r * .35), ex = Math.round(x + Math.cos(a) * r), ey = Math.round(y + Math.sin(a) * r * .6);
      g.lineStyle(3, 0x242631, alpha * .8).lineBetween(x, y, mx, my).lineBetween(mx, my, ex, ey);
      g.lineStyle(1, color, alpha * .75).lineBetween(mx, my - 1, ex, ey - 1);
    }
  }
  diagnostics() { return { tracked: this.tracks.size, active: this.bursts.length, bursts: this.bursts.map(b => ({ ...b })) }; }
  clear() { this.tracks.clear(); this.bursts.length = 0; }
}
