import Phaser from 'phaser';
import { LOOT_BALANCE as C } from '../config/gameBalance';
import type { Settings } from '../services/storage';
import type { World } from '../systems/World';
import { LOOT_COLORS } from '../loot/types';

export class LootPresentation {
  private graphics: Phaser.GameObjects.Graphics;
  private trail: { x: number; y: number; born: number }[] = [];
  private runId = '';
  private lastTrailAt = 0;
  private previous = { x: 0, y: 0 };
  get trailCount() { return this.trail.length; }
  constructor(scene: Phaser.Scene) { this.graphics = scene.add.graphics().setDepth(-1); }
  update(w: World, settings: Settings) {
    const g = this.graphics.clear(), intensity = settings.effectsIntensity ?? 0.7;
    if (w.runId !== this.runId) { this.clear(); this.runId = w.runId; this.previous = { x: w.player.x, y: w.player.y }; }
    if (w.status === 'over' || w.status === 'menu') { this.clear(); return; }
    const haste = w.buffs.active('haste', w.elapsed), moved = Math.hypot(w.player.x - this.previous.x, w.player.y - this.previous.y) > 0.1;
    this.trail = haste ? this.trail.filter(p => w.elapsed - p.born < C.trailLifetime) : [];
    if (haste && moved && w.status === 'playing' && w.elapsed - this.lastTrailAt >= C.trailInterval && intensity > 0) {
      this.lastTrailAt = w.elapsed; if (this.trail.length >= C.trailCap) this.trail.shift(); this.trail.push({ x: w.player.x, y: w.player.y, born: w.elapsed });
    }
    this.previous = { x: w.player.x, y: w.player.y };
    for (const p of this.trail) { const fade = (1 - (w.elapsed - p.born) / C.trailLifetime) * intensity * 0.4; g.fillStyle(0xffcf65, fade).fillRect(Math.round(p.x - 6), Math.round(p.y + 1), 3, 3).fillRect(Math.round(p.x + 3), Math.round(p.y - 1), 3, 3); }
    if (w.buffs.active('fury', w.elapsed)) g.fillStyle(0xf55b69, intensity * (0.08 + Math.sin(w.elapsed * 5) * 0.02)).fillCircle(w.player.x, w.player.y - 5, 22).lineStyle(1, 0xff8d80, intensity * 0.4).strokeCircle(w.player.x, w.player.y - 5, 17);
    for (const item of w.loot.items) g.fillStyle(LOOT_COLORS[item.lootKind], intensity * 0.12).fillCircle(item.x, item.y, 13).lineStyle(1, LOOT_COLORS[item.lootKind], intensity * 0.3).strokeEllipse(item.x, item.y + 6, 17, 5);
    for (const chest of w.loot.chests) g.fillStyle(0xffcf65, intensity * 0.1).fillCircle(chest.x, chest.y, 18).lineStyle(1, 0xffcf65, intensity * 0.3).strokeEllipse(chest.x, chest.y + 7, 24, 7);
    for (const item of w.artifacts.items) g.fillStyle(0xffd77c, intensity * 0.16).fillCircle(item.x, item.y, 18).lineStyle(1, 0xffe9b2, intensity * 0.65).strokeEllipse(item.x, item.y + 7, 23, 7);
    const guardian = w.rareGuardian;
    if (guardian) {
      g.fillStyle(0xffd77c, intensity * (0.1 + Math.sin(w.elapsed * 2) * 0.025)).fillCircle(guardian.x, guardian.y, 32).lineStyle(1, 0xffd77c, intensity * 0.55).strokeEllipse(guardian.x, guardian.y + 15, 50, 15);
      g.fillStyle(0x172c39).fillRect(guardian.x - 22, guardian.y - 28, 44, 4).fillStyle(0xffd77c).fillRect(guardian.x - 21, guardian.y - 27, 42 * guardian.hp / guardian.maxHp, 2);
    }
  }
  clear() { this.graphics.clear(); this.trail = []; this.lastTrailAt = 0; }
  destroy() { this.clear(); this.graphics.destroy(); }
}
