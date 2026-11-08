import Phaser from 'phaser';
import type { World } from '../systems/World';
import type { Settings } from '../services/storage';
import { drawMageMagic } from './MageMagic';
import { drawWarriorMagic, SlamPresentation } from './WarriorMagic';
import { drawMobility } from './EncounterArt';
export class CombatFeedback {
  private graphics: Phaser.GameObjects.Graphics;
  private labels = new Map<number, Phaser.GameObjects.Text>();
  private spare: Phaser.GameObjects.Text[] = [];
  private slams = new SlamPresentation();
  constructor(private scene: Phaser.Scene) { this.graphics = scene.add.graphics().setName('friendly-feedback').setDepth(14); }
  prepare(w: World) { this.slams.prepare(w); }
  update(w: World, settings: Settings) {
    const g = this.graphics.clear(), intensity = settings.effectsIntensity ?? 0.7, active = new Set<number>();
    this.slams.update(w);
    drawMageMagic(g, w, intensity, e => this.slams.owns(e));
    drawWarriorMagic(g, w, intensity, this.slams.bursts);
    drawMobility(g, w, w.mobility, intensity);
    for (const z of w.zones) { if(z.wall||z.source==='meteor')continue; g.fillStyle(0xf68d57, intensity * 0.12).fillCircle(z.x, z.y, z.radius).lineStyle(1, 0xffb76b, intensity * 0.6).strokeCircle(z.x, z.y, z.radius); for (let i = 0; i < 6; i++) g.fillRect(z.x + Math.cos(i * 4) * z.radius * 0.7, z.y + Math.sin(i * 4) * z.radius * 0.7 - Math.sin(w.elapsed * 7 + i) * 4, 3, 4); }
    for (const e of w.effects) {
      if(e.kind==='arcane-impact'||e.kind==='runic-judgement'||e.kind==='rune-blink')continue;
      if (e.kind === 'cleave') continue; // HD crescent is drawn by GameArt.
      if (e.kind === 'frost' || e.kind === 'shield' || e.kind === 'lightning' || e.kind === 'meteor' && e.color !== 0xff829d) continue;
      const t = Math.min(1, (w.elapsed - e.started) / e.duration), fade = (1 - t) * intensity;
      g.fillStyle(e.color, fade).lineStyle(2, e.color, fade);
      if (e.kind === 'hit') { g.lineStyle(1.2, 0xffefcd, fade); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, r = 3 + t * 9; g.lineBetween(e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, e.x + Math.cos(a) * (r + 3 * (1 - t)), e.y + Math.sin(a) * (r + 3 * (1 - t))); } }
      else if(e.kind === 'whirlwind') continue;
      else if (e.kind === 'death') { for (let i = 0; i < (intensity < .4 ? 4 : 6); i++) { const a = i * Math.PI / 3 + e.id, r = e.radius * (.25 + t), x = Math.round(e.x + Math.cos(a) * r), y = Math.round(e.y + Math.sin(a) * r - t * 7), s = Math.max(1, 3 * (1 - t)); g.fillStyle(e.color, fade).fillTriangle(x - s, y + s, x, y - s, x + s, y); g.lineStyle(1, 0xf3d5a1, fade * .6).lineBetween(x - s, y + s, x, y - s); } }
      else if (e.kind === 'meteor') { const r = e.radius * (.3 + t * .7); g.lineStyle(1.5, 0xff8ba7, fade * .7).strokeCircle(e.x, e.y, r); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, x = Math.round(e.x + Math.cos(a) * r), y = Math.round(e.y + Math.sin(a) * r), s = Math.max(1, 3 * (1 - t)); g.fillStyle(0xd95a8d, fade).fillTriangle(x - s, y, x, y - s * 2, x + s, y + s).lineStyle(1, 0xffd0cc, fade).lineBetween(x - s, y, x, y - s * 2); } }
      else { const count = intensity < 0.4 ? 4 : 8; for (let i = 0; i < count; i++) { const r = e.radius * (0.2 + t * 1.5), size = Math.max(1, (e.kind === 'meteor' ? 9 : 4) * (1 - t)); g.fillRect(e.x + Math.cos(i * 4 + e.id) * r, e.y + Math.sin(i * 4 + e.id) * r - t * 8, size, size); } }
      if (settings.damageNumbers && !w.encounterDirector.crowded(w) && e.amount && e.kind === 'hit' && (this.labels.has(e.id) || this.labels.size < 24)) {
        active.add(e.id); let label = this.labels.get(e.id);
        if (!label) { label = this.spare.pop() ?? this.scene.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '9px', color: '#fff1cd', stroke: '#13272b', strokeThickness: 2 }).setDepth(16); this.labels.set(e.id, label); }
        label.setText(String(Math.ceil(e.amount))).setPosition(e.x - 5, e.y - 15 - t * 20).setAlpha(1 - t).setVisible(true);
      }
    }
    for (const [id, label] of this.labels) if (!active.has(id)) { label.setVisible(false); this.spare.push(label); this.labels.delete(id); }
  }
  destroy() { this.slams.clear(); this.graphics.destroy(); for (const label of [...this.labels.values(), ...this.spare]) label.destroy(); this.labels.clear(); this.spare = []; }
}
