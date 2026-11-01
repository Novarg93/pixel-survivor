import Phaser from 'phaser';
import { chunkKeys, tileHash } from '../utils/worldTiles';
import { biomeTile, type BiomeId } from '../config/biomes';
import { createHdForestChunk } from '../art/hdForest';
import { ASSET_REGISTRY } from '../art/assetRegistry';
export class WorldChunkSystem {
  private chunks = new Map<string, Phaser.GameObjects.Image>();
  private lastBounds = '';
  private biome: BiomeId = 'grove';
  setBiome(biome: BiomeId) { if(this.biome!==biome){this.destroy();this.biome=biome;} }
  constructor(private scene: Phaser.Scene) {}
  update(x: number, y: number, width: number, height: number) {
    const bounds = [Math.floor((x - width / 2) / 128), Math.floor((y - height / 2) / 128), Math.floor((x + width / 2) / 128), Math.floor((y + height / 2) / 128)].join(',');
    if (bounds === this.lastBounds) return; this.lastBounds = bounds;
    const required = chunkKeys(x, y, width, height), keys = new Set(required.map(c => c.key));
    for (const [key, image] of this.chunks) if (!keys.has(key)) { image.destroy(); this.scene.textures.remove(key); this.chunks.delete(key); }
    for (const chunk of required) if (!this.chunks.has(chunk.key)) {
      if (this.biome === 'dark-forest') {
        this.scene.textures.addCanvas(chunk.key, createHdForestChunk(chunk.x, chunk.y))!.setFilter(Phaser.Textures.FilterMode.NEAREST);
        const size = ASSET_REGISTRY.darkForest.logicalSize!;
        this.chunks.set(chunk.key, this.scene.add.image(chunk.x * size.width, chunk.y * size.height, chunk.key).setOrigin(0).setDisplaySize(size.width, size.height).setDepth(-30));
        continue;
      }
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      for (let tx = 0; tx < 8; tx++) for (let ty = 0; ty < 8; ty++) {
        const wx = chunk.x * 8 + tx, wy = chunk.y * 8 + ty, px = tx * 16, py = ty * 16, tile=biomeTile(wx,wy,this.biome), {hash,dirt}=tile;
        g.fillStyle(tile.ground).fillRect(px, py, 16, 16);
        for (let i = 0; i < 4; i++) { const h = tileHash(wx * 5 + i, wy); const dx = px + h % 14, dy = py + (h >>> 8) % 14; g.fillStyle(dirt ? 0x686750 : 0x3a5542).fillRect(dx, dy, 1, 2); if (!dirt) g.fillStyle(0x4c6347).fillRect(dx - 1, dy - 1, 1, 1); }
        if (!dirt && hash % 29 === 0) { g.fillStyle(0x1d322d).fillRect(px + 3, py + 7, 11, 7); g.fillStyle(0x59746c).fillRect(px + 4, py + 5, 9, 7); g.fillStyle(0x83978a).fillRect(px + 5, py + 5, 6, 2); g.fillStyle(0x3e5c53).fillRect(px + 10, py + 8, 3, 3); }
        else if (!dirt && hash % 23 === 0) { g.fillStyle(0x1d342e).fillRect(px + 1, py + 7, 14, 8); g.fillStyle(0x4a6546).fillRect(px + 2, py + 5, 12, 7).fillRect(px + 4, py + 3, 8, 4); g.fillStyle(0x82935c).fillRect(px + 5, py + 3, 4, 2).fillRect(px + 2, py + 6, 4, 2); }
        else if (!dirt && hash % 13 === 0) { g.fillStyle(0x8eae77).fillRect(px + 8, py + 8, 1, 5); g.fillStyle(hash % 2 ? 0xd8be84 : 0xabbba8).fillRect(px + 7, py + 7, 3, 2); }
        if (dirt && hash % 7 === 0) g.fillStyle(0x93937a).fillRect(px + 4, py + 9, 3, 2);
      }
      g.generateTexture(chunk.key, 128, 128); g.destroy();
      this.chunks.set(chunk.key, this.scene.add.image(chunk.x * 128, chunk.y * 128, chunk.key).setOrigin(0).setDepth(-30));
    }
  }
  get count() { return this.chunks.size; }
  destroy() { for (const [key, image] of this.chunks) { image.destroy(); this.scene.textures.remove(key); } this.chunks.clear(); this.lastBounds = ''; }
}
