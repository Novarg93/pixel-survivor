import Phaser from 'phaser';
import { LOOT_BALANCE as C } from '../config/gameBalance';
import type { Settings } from '../services/storage';
import type { World } from '../systems/World';
import { LOOT_COLORS } from '../loot/types';
import {selectAsset,visualDimensions} from './assetRegistry';

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
    for (const p of this.trail) { const fade = (1 - (w.elapsed - p.born) / C.trailLifetime) * intensity * .4; for (const side of [-1, 1]) { const x = Math.round(p.x + side * 5), y = Math.round(p.y + 2); g.fillStyle(0xd8b476, fade).fillTriangle(x, y - 3, x + side * 3, y, x, y + 2).lineStyle(1, 0xffefc6, fade).lineBetween(x, y - 3, x, y + 2); } }
    if (w.buffs.active('fury', w.elapsed)) for (const side of [-1, 1]) { const x = w.player.x + side * 17, y = w.player.y - 3, pulse = Math.sin(w.elapsed * 5) * 2; g.fillStyle(0xa94761, intensity * .25).fillTriangle(x, y + 9, x + side * 4, y - 4, x, y - 12 - pulse).lineStyle(1, 0xffb39a, intensity * .4).lineBetween(x, y + 5, x, y - 9 - pulse); }
    const seal = (x: number, y: number, r: number, color: number, born: number, rare = false) => {
      const age = Math.max(0, w.elapsed - born), radius = r * Math.min(1, .5 + age * 2), yy = y + 7;
      g.lineStyle(1, color, intensity * (rare ? .65 : .4)).beginPath();
      for (let i = 0; i <= 8; i++) { const a = i * Math.PI / 4, px = Math.round(x + Math.cos(a) * radius), py = Math.round(yy + Math.sin(a) * radius * .3); if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.strokePath();
      if (rare) { g.lineStyle(1, 0xffefd0, intensity * .5).lineBetween(x - r - 2, yy, x - r + 1, yy).lineBetween(x + r - 1, yy, x + r + 2, yy); g.fillStyle(0xffd77c, intensity * .1).fillRect(x - 1, y - 18, 2, 20); }
      if (age < .35) g.lineStyle(1, color, intensity * (1 - age / .35)).strokeRect(x - r * age * 3, y - r * age * 3, r * age * 6, r * age * 6);
    };
    for (const item of w.loot.items) seal(item.x, item.y, 10, LOOT_COLORS[item.lootKind], item.born);
    for (const chest of w.loot.chests) seal(chest.x, chest.y, 13, 0xd8b476, chest.born, true);
    for (const item of w.artifacts.items) seal(item.x, item.y, 12, 0xffd77c, item.born, true);
    for (const guardian of w.guardians) {
      const top=guardian.y-visualDimensions(selectAsset('guardian')).height/2-6;
      g.fillStyle(0x172c39).fillRect(guardian.x - 22, top, 44, 4).fillStyle(0xffd77c).fillRect(guardian.x - 21, top+1, 42 * guardian.hp / guardian.maxHp, 2);
    }
  }
  clear() { this.graphics.clear(); this.trail = []; this.lastTrailAt = 0; }
  destroy() { this.clear(); this.graphics.destroy(); }
}
