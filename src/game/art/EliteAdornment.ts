import type Phaser from 'phaser';
import type { World } from '../systems/World';
import type { RegularKind } from '../config/enemyDefinitions';
import { ASSET_REGISTRY, ELITE_ART } from './assetRegistry';

// Individual heraldry over the original clips; one bounded batch for <=150 elites.
export class EliteAdornment {
  private graphics: Phaser.GameObjects.Graphics;
  count = 0;
  constructor(scene: Phaser.Scene) { this.graphics = scene.add.graphics().setName('elite-adornment').setDepth(2); }
  update(w: World) {
    const g = this.graphics.clear(); this.count = 0;
    if (w.encounterDirector.crowded(w)) return;
    for (const e of w.enemies) {
      const asset = ELITE_ART[e.kind as RegularKind]; if (!e.elite || !asset) continue; this.count++;
      const scale = ASSET_REGISTRY[asset].worldScale, x = Math.round(e.x), y = Math.round(e.y), alpha = e.hitUntil > w.elapsed ? .85 : 1;
      const shape = (points: number[][], color: number) => {
        g.fillStyle(color, alpha).lineStyle(.5, 0x453546, alpha).beginPath();
        points.forEach(([px, py], i) => i ? g.lineTo(x + px * scale, y + py * scale) : g.moveTo(x + px * scale, y + py * scale)); g.closePath().fillPath().strokePath();
      };
      if (e.kind === 'tank') {
        for (const s of [-1, 1]) { shape([[s * 3, -3], [s * 4, -6], [s * 6, -7], [s * 6.6, -3.5], [s * 5, -2]], 0xd9cba4); shape([[s * 4.6, -5], [s * 6, -6], [s * 6, -3.8]], 0xffedbd); }
      } else if (e.kind === 'caster') {
        shape([[-3.3, -2], [-3.6, -5], [-1.8, -6.4], [-2.1, -4.2], [-.5, -3.3], [1.5, -4.1], [1, -2.2], [-1, -1.5]], 0xe8c394);
        shape([[-.8, -4], [0, -5], [.8, -4], [0, -3]], 0xffe6b4);
      } else if (e.kind === 'runner') {
        shape([[-3.3, -1], [-4.7, -4.6], [-1.9, -3.3], [-1.6, -6], [.4, -3.5], [2, -4.8], [1.6, -1.5]], 0xc69168);
        shape([[-2.8, -2.4], [-1.8, -4.3], [0, -2.7], [1.2, -3.5], [.6, -1.6]], 0xffd397);
      } else if (e.kind === 'rusher') {
        for (const s of [-1, 1]) shape([[s, -1.3], [s * 2.6, -5], [s * 4.4, -3.5], [s * 5.8, -4.4], [s * 4.8, -.6], [s * 2.8, .2]], 0xd8b181);
        shape([[-1.5, -2], [0, -3], [1.4, -2], [0, 0]], 0xffdda0);
      } else if (e.kind === 'splitter') {
        for (const s of [-1, 1]) { shape([[s * 1.7, -1.8], [s * 3.5, -3.2], [s * 5, -1.8], [s * 4, -.5], [s * 2, .3]], 0xc9a86e); shape([[s * 2, 1], [s * 4.3, .2], [s * 3.8, 2], [s * 2, 2.8]], 0xdbc08c); }
        g.lineStyle(.7, 0xffe1a4, alpha).lineBetween(x, y - 3 * scale, x, y + 3 * scale);
      }
      // Grunt already has its separately authored crown and body in hd-core.
    }
  }
  destroy() { this.graphics.destroy(); this.count = 0; }
}
