import Phaser from 'phaser';
import { chunkKeys } from '../utils/worldTiles';
import { type BiomeId } from '../config/biomes';
import { createHdForestChunk } from '../art/hdForest';
import { createHdGroveChunk } from '../art/hdGrove';
import { ASSET_REGISTRY } from '../art/assetRegistry';
export class WorldChunkSystem {
  private chunks = new Map<string, Phaser.GameObjects.Image>();
  private lastBounds = '';
  private biome: BiomeId = 'grove';
  private atmosphereTint = 0xffffff;
  setAtmosphereTint(tint: number) {
    if (tint === this.atmosphereTint) return;
    this.atmosphereTint = tint;
    for (const image of this.chunks.values()) image.setTint(tint).setTintMode(Phaser.TintModes.MULTIPLY);
  }
  atmosphereDiagnostics() { return [...this.chunks.values()].map(image => ({ key: image.texture.key, tint: image.tintTopLeft })); }
  setBiome(biome: BiomeId) { if(this.biome!==biome){this.destroy();this.biome=biome;} }
  constructor(private scene: Phaser.Scene) {}
  update(x: number, y: number, width: number, height: number, padding = 1) {
    const bounds = [Math.floor((x - width / 2) / 128), Math.floor((y - height / 2) / 128), Math.floor((x + width / 2) / 128), Math.floor((y + height / 2) / 128)].join(',');
    const cacheKey = bounds + ':' + padding;
    if (cacheKey === this.lastBounds) return; this.lastBounds = cacheKey;
    const required = chunkKeys(x, y, width, height, padding), keys = new Set(required.map(c => c.key));
    for (const [key, image] of this.chunks) if (!keys.has(key)) { image.destroy(); this.scene.textures.remove(key); this.chunks.delete(key); }
    for (const chunk of required) if (!this.chunks.has(chunk.key)) {
      {
        this.scene.textures.addCanvas(chunk.key, this.biome === 'dark-forest' ? createHdForestChunk(chunk.x, chunk.y) : createHdGroveChunk(chunk.x, chunk.y))!.setFilter(Phaser.Textures.FilterMode.NEAREST);
        const size = ASSET_REGISTRY[this.biome === 'dark-forest' ? 'darkForest' : 'grove'].logicalSize!;
        this.chunks.set(chunk.key, this.scene.add.image(chunk.x * size.width, chunk.y * size.height, chunk.key).setOrigin(0).setDisplaySize(size.width, size.height).setDepth(-30).setTint(this.atmosphereTint).setTintMode(Phaser.TintModes.MULTIPLY));
        continue;
      }
    }
  }
  get count() { return this.chunks.size; }
  destroy() { for (const [key, image] of this.chunks) { image.destroy(); this.scene.textures.remove(key); } this.chunks.clear(); this.lastBounds = ''; }
}
