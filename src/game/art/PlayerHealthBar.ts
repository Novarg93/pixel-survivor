import type Phaser from 'phaser';
import type { World } from '../systems/World';

// Above the hero (10), below projectiles (12), friendly magic (14) and tells (20).
export const PLAYER_HEALTH_BAR = { width: 34, height: 5, offsetY: -33, depth: 11, hpColor: 0x77cf8a, absorbColor: 0xb9eeff } as const;
export function playerHealthLayout(w: Pick<World, 'player' | 'effectiveMaxHp' | 'elapsed' | 'mobility' | 'status'>) {
  const c = PLAYER_HEALTH_BAR;
  return { x: w.player.x - c.width / 2, y: w.player.y + c.offsetY, width: c.width, height: c.height,
    hp: Math.max(0, Math.min(1, w.player.hp / w.effectiveMaxHp)), absorb: Math.max(0, Math.min(1, w.mobility.absorbValue(w.elapsed) / w.effectiveMaxHp)), visible: w.status !== 'menu' && w.status !== 'over' };
}
export class PlayerHealthBar {
  private graphics: Phaser.GameObjects.Graphics;
  private layout?: ReturnType<typeof playerHealthLayout>;
  constructor(scene: Phaser.Scene) { this.graphics = scene.add.graphics().setName('player-health').setDepth(PLAYER_HEALTH_BAR.depth); }
  update(w: World) {
    const g = this.graphics.clear(), c = PLAYER_HEALTH_BAR, p = this.layout = playerHealthLayout(w);
    if (!p.visible) return;
    g.fillStyle(0x0b1821, .95).fillRect(p.x - 1, p.y - 1, p.width + 2, p.height + 2);
    g.fillStyle(0x263d3b, 1).fillRect(p.x, p.y, p.width, p.height);
    g.fillStyle(c.hpColor, 1).fillRect(p.x, p.y, p.width * p.hp, p.height);
    if (p.absorb > 0) {
      // Only the upper two pixels are overlaid; green HP stays visible below.
      g.fillStyle(c.absorbColor, .75).fillRect(p.x, p.y, p.width * p.absorb, 2);
      g.fillStyle(0xe4faff, 1).fillRect(p.x, p.y, p.width * p.absorb, 1);
    }
  }
  diagnostics() { return { ...this.layout, depth: PLAYER_HEALTH_BAR.depth, objects: this.graphics.active ? 1 : 0 }; }
  destroy() { this.graphics.destroy(); }
}
