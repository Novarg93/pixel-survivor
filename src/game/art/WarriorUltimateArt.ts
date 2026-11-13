import type Phaser from 'phaser';
import type { World } from '../systems/World';
import { ULTIMATE as C, isWarriorAttackUltimate } from '../config/ultimates';
import { WARRIOR_ULTIMATE_TEXTURE as KEY, warriorUltimateFx } from './warriorUltimatesPack';

// One ground image, one traveling spear, one bounded Graphics batch. No timers.
export class WarriorUltimateArt {
  private ground: Phaser.GameObjects.Image;
  private spear: Phaser.GameObjects.Image;
  private g: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) {
    this.ground = scene.add.image(0, 0, KEY, 'vfx-earthbreaker/0').setName('earthbreaker-paths').setDepth(.2).setVisible(false);
    this.spear = scene.add.image(0, 0, KEY, 'vfx-spear-of-ruin/0').setName('spear-of-ruin').setDepth(12.5).setVisible(false);
    this.g = scene.add.graphics().setName('warrior-ultimate-contacts').setDepth(.3);
  }
  render(w: World, intensity: number, reducedMotion: boolean) {
    this.ground.setVisible(false); this.spear.setVisible(false); const g = this.g.clear(), u = w.ultimate.warrior;
    if (w.status === 'menu' || w.status === 'over' || !isWarriorAttackUltimate(w.ultimate.selected) || w.elapsed < u.releaseAt || w.elapsed >= u.endsAt) return;
    const age = w.elapsed - u.releaseAt, angle = Math.atan2(u.direction.y, u.direction.x), strength = .35 + .65 * Math.max(0, Math.min(1, intensity));
    if (u.kind === 'earthbreaker') {
      const fade = Math.min(1, (u.endsAt - w.elapsed) / .35);
      this.ground.setTexture(KEY, warriorUltimateFx('vfx-earthbreaker', age)).setPosition(u.origin.x, u.origin.y).setOrigin(41 / 224, .5).setScale(C.earthbreaker.range / 158).setRotation(angle).setAlpha(strength * fade).setVisible(true);
      for (const p of u.pulses) {
        const t = Math.max(0, w.elapsed - p.started), alpha = Math.max(0, 1 - t / .6) * strength;
        g.lineStyle(2, 0xf2d89b, alpha).lineBetween(p.from.x, p.from.y, p.to.x, p.to.y);
        if (alpha > 0) {
          const rise = reducedMotion ? 0 : Math.sin(Math.min(1, t / .35) * Math.PI) * 10;
          g.fillStyle(0x776951, alpha).fillRect(Math.round(p.to.x) - 5, Math.round(p.to.y - rise) - 4, 10, 8);
          g.lineStyle(1, 0xe0c68e, alpha).strokeRect(Math.round(p.to.x) - 5, Math.round(p.to.y - rise) - 4, 10, 8);
        }
      }
    } else if (u.spear) {
      const p = u.spear;
      if (p.active) this.spear.setTexture(KEY, warriorUltimateFx('vfx-spear-of-ruin', age)).setPosition(p.x, p.y).setOrigin(204 / 224, .5).setScale(.7).setRotation(angle).setAlpha(strength).setVisible(true);
      else {
        const t = Math.min(1, Math.max(0, (w.elapsed - p.impactedAt) / C.ruin.aftermath));
        g.lineStyle(2, 0xd9d7b0, (1 - t) * strength).strokeCircle(p.x, p.y, C.ruin.impactRadius * (.5 + t * .5));
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = C.ruin.impactRadius * t; g.fillStyle(0xc0b38a, (1 - t) * strength).fillRect(Math.round(p.x + Math.cos(a) * r) - 2, Math.round(p.y + Math.sin(a) * r) - 2, 4, 4); }
      }
    }
  }
  diagnostics() { return { allocated: 3, earthbreaker: this.ground.visible, spear: this.spear.visible }; }
  destroy() { this.ground.destroy(); this.spear.destroy(); this.g.destroy(); }
}
