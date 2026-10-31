import Phaser from 'phaser';
import type { World } from '../systems/World';
import type { Settings } from '../services/storage';
import { bladePositions } from '../abilities/warrior';
export class CombatFeedback {
  private graphics: Phaser.GameObjects.Graphics;
  private labels = new Map<number, Phaser.GameObjects.Text>();
  private spare: Phaser.GameObjects.Text[] = [];
  constructor(private scene: Phaser.Scene) { this.graphics = scene.add.graphics().setDepth(14); }
  update(w: World, settings: Settings) {
    const g = this.graphics.clear(), intensity = settings.effectsIntensity ?? 0.7, active = new Set<number>();
    for(const p of bladePositions(w))g.lineStyle(3,0xd3e9f5,Math.max(0.4,intensity)).lineBetween(p.x-5,p.y+6,p.x+5,p.y-6).lineStyle(2,0xf2d298).lineBetween(p.x-5,p.y,p.x+2,p.y+5);
    if(w.warrior.ironUntil>w.elapsed)g.lineStyle(2,0xc0d3dc,0.8).strokeRect(w.player.x-17,w.player.y-20,34,36);
    for (const z of w.zones) { g.fillStyle(0xf68d57, intensity * 0.12).fillCircle(z.x, z.y, z.radius).lineStyle(1, 0xffb76b, intensity * 0.6).strokeCircle(z.x, z.y, z.radius); for (let i = 0; i < 6; i++) g.fillRect(z.x + Math.cos(i * 4) * z.radius * 0.7, z.y + Math.sin(i * 4) * z.radius * 0.7 - Math.sin(w.elapsed * 7 + i) * 4, 3, 4); }
    for (const p of w.projectiles) if (!p.hostile) g.lineStyle(2, 0xfdb06c, intensity * 0.5).lineBetween(p.x, p.y, p.x - p.vx * 0.045, p.y - p.vy * 0.045);
    for (const e of w.effects) {
      const t = Math.min(1, (w.elapsed - e.started) / e.duration), fade = (1 - t) * intensity;
      g.fillStyle(e.color, fade).lineStyle(2, e.color, fade);
      if(e.kind === 'cleave' || e.kind === 'whirlwind'){const aim=e.target?Math.atan2(e.target.y-e.y,e.target.x-e.x):w.elapsed*8;g.beginPath().arc(e.x,e.y,e.radius*(0.75+t*0.25),aim-1.7,aim+1.7,false).strokePath();}
      else if (e.kind === 'lightning' && e.target) { const a = e.target; g.beginPath().moveTo(e.x, e.y).lineTo((e.x + a.x) / 2 + 7, (e.y + a.y) / 2 - 6).lineTo(a.x, a.y).strokePath(); g.lineStyle(1, 0xffffff, fade).lineBetween(e.x, e.y, a.x, a.y); }
      else if (e.kind === 'frost' || e.kind === 'shield') { const radius = e.radius * (0.65 + t * 0.35); g.strokeCircle(e.x, e.y, radius); for (let i = 0; i < 8; i++) g.fillRect(e.x + Math.cos(i * Math.PI / 4) * radius - 2, e.y + Math.sin(i * Math.PI / 4) * radius - 2, 4, 4); }
      else { const count = intensity < 0.4 ? 4 : 8; for (let i = 0; i < count; i++) { const r = e.radius * (0.2 + t * 1.5), size = Math.max(1, (e.kind === 'meteor' ? 9 : 4) * (1 - t)); g.fillRect(e.x + Math.cos(i * 4 + e.id) * r, e.y + Math.sin(i * 4 + e.id) * r - t * 8, size, size); } }
      if (settings.damageNumbers && e.amount && e.kind === 'hit' && (this.labels.has(e.id) || this.labels.size < 24)) {
        active.add(e.id); let label = this.labels.get(e.id);
        if (!label) { label = this.spare.pop() ?? this.scene.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '9px', color: '#fff1cd', stroke: '#13272b', strokeThickness: 2 }).setDepth(16); this.labels.set(e.id, label); }
        label.setText(String(Math.ceil(e.amount))).setPosition(e.x - 5, e.y - 15 - t * 20).setAlpha(1 - t).setVisible(true);
      }
    }
    for (const [id, label] of this.labels) if (!active.has(id)) { label.setVisible(false); this.spare.push(label); this.labels.delete(id); }
  }
  destroy() { this.graphics.destroy(); for (const label of [...this.labels.values(), ...this.spare]) label.destroy(); this.labels.clear(); this.spare = []; }
}
