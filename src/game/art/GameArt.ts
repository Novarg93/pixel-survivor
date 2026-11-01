import Phaser from 'phaser';
import type { World } from '../systems/World';
import type { Enemy, Projectile, XpOrb } from '../entities/types';
import type { LootItem, Chest } from '../loot/types';
import type { ArtifactDrop } from '../loot/ArtifactSystem';
import { ASSET_REGISTRY, LOOT_ART, heroVisual, enemyVisual, selectAsset, visualDimensions, type Facing, type VisualSelection } from './assetRegistry';
import { HD_CORE_TEXTURE, HD_CORE_URLS } from './hdCoreLayout';
type RenderEntity = Enemy | Projectile | XpOrb | LootItem | Chest | ArtifactDrop;
export function preloadGameArt(scene: Phaser.Scene) {
  if (!scene.textures.exists(HD_CORE_TEXTURE)) scene.load.atlas(HD_CORE_TEXTURE, import.meta.env.BASE_URL + HD_CORE_URLS.image, import.meta.env.BASE_URL + HD_CORE_URLS.data);
}
export function applyVisual(sprite: Phaser.GameObjects.Sprite, selection: VisualSelection, multiplier = 1) {
  const spec = ASSET_REGISTRY[selection.asset], size = visualDimensions(selection, multiplier);
  sprite.setTexture(selection.texture, selection.frame).setOrigin(spec.origin.x, spec.origin.y).setDisplaySize(size.width, size.height);
}
export function entityVisual(entity: RenderEntity, elapsed: number): VisualSelection {
  if ('kind' in entity) return enemyVisual(entity.kind, entity.elite, elapsed, entity.id);
  if ('value' in entity) return selectAsset('xp');
  if ('lootKind' in entity) return selectAsset(LOOT_ART[entity.lootKind]);
  if ('lootPool' in entity) return selectAsset('chest');
  if ('artifact' in entity) return selectAsset('artifact');
  return selectAsset(entity.hostile ? 'hostile' : 'fireball');
}
// Reads simulation state; no timers, inputs, damage, collision bodies or RNG.
export class GameArt {
  private shadows: Phaser.GameObjects.Image[] = [];
  private cleaves: Phaser.GameObjects.Image[] = [];
  heroFrame = '';
  constructor(private scene: Phaser.Scene) { scene.textures.get(HD_CORE_TEXTURE).setFilter(Phaser.Textures.FilterMode.NEAREST); }
  hero(sprite: Phaser.GameObjects.Sprite, world: World, facing: Facing, moving: boolean, multiplier = 1) {
    const visual = heroVisual(world.character, facing, moving, world.player.invulnerableUntil > world.elapsed, world.elapsed);
    this.heroFrame = visual.frame ?? visual.texture; applyVisual(sprite, visual, multiplier);
  }
  update(world: World, intensity: number) {
    let count = 0;
    const shadow = (x: number, y: number, scale: number) => {
      const image = this.shadows[count] ?? this.scene.add.image(0, 0, HD_CORE_TEXTURE, 'shadow').setDepth(-2); this.shadows[count++] = image;
      const size = ASSET_REGISTRY.shadow.logicalSize!;
      image.setPosition(x, y).setDisplaySize(size.width * scale, size.height * scale).setVisible(true);
    };
    shadow(world.player.x, world.player.y + 6, 1.3);
    for (const e of world.enemies) shadow(Math.round(e.x), Math.round(e.y + 6), e.boss ? 2.5 : e.kind === 'tank' ? 1.6 : e.elite ? 1.4 : 1);
    for (let i = count; i < this.shadows.length; i++) this.shadows[i].setVisible(false);
    count = 0;
    for (const e of world.effects) if (e.kind === 'cleave') {
      const t = Math.min(1, Math.max(0, (world.elapsed - e.started) / e.duration));
      const image = this.cleaves[count] ?? this.scene.add.image(0, 0, HD_CORE_TEXTURE, 'cleave-0').setDepth(14); this.cleaves[count++] = image;
      const displaySize = e.radius * 48 / 21 * (0.75 + t * 0.25);
      image.setTexture(HD_CORE_TEXTURE, `cleave-${Math.min(3, Math.floor(t * 4))}`).setPosition(e.x, e.y)
        .setRotation(e.target ? Math.atan2(e.target.y - e.y, e.target.x - e.x) : 0).setDisplaySize(displaySize, displaySize).setAlpha((1 - t) * intensity).setVisible(true);
    }
    for (let i = count; i < this.cleaves.length; i++) this.cleaves[i].setVisible(false);
  }
  diagnostics() {
    const textures = this.scene.textures.getTextureKeys(), atlas = this.scene.textures.get(HD_CORE_TEXTURE);
    // Diagnostic reads only, pinned Phaser 4.2.1. Never used by gameplay.
    const clock = ['_active', '_pendingInsertion', '_pendingRemoval'].map(key => { const value: unknown = Reflect.get(this.scene.time, key); return Array.isArray(value) ? value.length : null; });
    return { heroFrame: this.heroFrame, atlasFrames: atlas.frameTotal - 1, textures, chunks: textures.filter(t => t.startsWith('chunk-')).length,
      textureBytes: textures.reduce((n, key) => { const source = this.scene.textures.get(key).getSourceImage() as HTMLCanvasElement; return n + source.width * source.height * 4; }, 0),
      shadows: this.shadows.length, cleaves: this.cleaves.length, objects: this.scene.children.length, tweens: this.scene.tweens.getTweens().length, clock,
      blurListeners: this.scene.game.events.listenerCount(Phaser.Core.Events.BLUR),
      actors: this.scene.children.getAll().filter(o => o.type === 'Sprite' && o.active).map(o => { const s = o as Phaser.GameObjects.Sprite; return { texture: s.texture.key, frame: s.frame.name, width: s.displayWidth, height: s.displayHeight, x: s.x, y: s.y }; }),
    };
  }
  destroy() { for (const image of [...this.shadows, ...this.cleaves]) image.destroy(); this.shadows = []; this.cleaves = []; }
}
