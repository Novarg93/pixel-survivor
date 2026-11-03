import { PlayerHealthBar } from './PlayerHealthBar';
import Phaser from 'phaser';
import type { World } from '../systems/World';
import type { Enemy, Projectile, XpOrb } from '../entities/types';
import type { LootItem, Chest } from '../loot/types';
import type { ArtifactDrop } from '../loot/ArtifactSystem';
import { ASSET_REGISTRY, LOOT_ART, ARTIFACT_ART, heroVisual, enemyVisual, selectAsset, visualDimensions, type Facing, type VisualSelection } from './assetRegistry';
import { HD_CORE_TEXTURE, HD_CORE_URLS } from './hdCoreLayout';
import { RUNNER_TEXTURE, RUNNER_URLS, RUNNER_CLIPS, runnerFrame } from './runnerPack';
import { RunnerAnimation } from './RunnerAnimation';
import { MAGE_TEXTURE, MAGE_URLS, mageFrame } from './magePack';
import { MAGE_CAST_TEXTURE, MAGE_CAST_URLS, castingBodyFrame } from './mageCastingPack';
import { MageCastingController } from './MageCastingController';
import { MageCastingArt } from './MageCastingArt';
import { ENEMY_TEXTURE, ENEMY_URLS, isHdEnemy, packedEnemyFrame } from './enemyPack';
import { EnemyAnimation } from './EnemyAnimation';
import { GUARDIAN_TEXTURE, GUARDIAN_URLS, guardianFrame } from './guardianPack';
import { GuardianAnimation } from './GuardianAnimation';
import { EliteAdornment } from './EliteAdornment';
import { BOSS_TEXTURE, BOSS_URLS, isHdBoss, bossFrame } from './bossPack';
import { BossAnimation } from './BossAnimation';
import { LOOT_TEXTURE, LOOT_URLS, ARTIFACT_KEYS, lootFrame } from './lootPack';
import { PickupAnimation } from './PickupAnimation';
import { abilityVisual } from './abilityVisual';
type RenderEntity = Enemy | Projectile | XpOrb | LootItem | Chest | ArtifactDrop;
export function preloadGameArt(scene: Phaser.Scene) {
  if (!scene.textures.exists(HD_CORE_TEXTURE)) scene.load.atlas(HD_CORE_TEXTURE, import.meta.env.BASE_URL + HD_CORE_URLS.image, import.meta.env.BASE_URL + HD_CORE_URLS.data);
  if (!scene.textures.exists(RUNNER_TEXTURE)) scene.load.atlas(RUNNER_TEXTURE, import.meta.env.BASE_URL + RUNNER_URLS.image, import.meta.env.BASE_URL + RUNNER_URLS.data);
  if (!scene.textures.exists(MAGE_TEXTURE)) scene.load.atlas(MAGE_TEXTURE, import.meta.env.BASE_URL + MAGE_URLS.image, import.meta.env.BASE_URL + MAGE_URLS.data);
  if (!scene.textures.exists(MAGE_CAST_TEXTURE)) scene.load.atlas(MAGE_CAST_TEXTURE, import.meta.env.BASE_URL + MAGE_CAST_URLS.image, import.meta.env.BASE_URL + MAGE_CAST_URLS.data);
  if (!scene.textures.exists(ENEMY_TEXTURE)) scene.load.atlas(ENEMY_TEXTURE, import.meta.env.BASE_URL + ENEMY_URLS.image, import.meta.env.BASE_URL + ENEMY_URLS.data);
  if (!scene.textures.exists(GUARDIAN_TEXTURE)) scene.load.atlas(GUARDIAN_TEXTURE, import.meta.env.BASE_URL + GUARDIAN_URLS.image, import.meta.env.BASE_URL + GUARDIAN_URLS.data);
  if (!scene.textures.exists(BOSS_TEXTURE)) scene.load.atlas(BOSS_TEXTURE, import.meta.env.BASE_URL + BOSS_URLS.image, import.meta.env.BASE_URL + BOSS_URLS.data);
  if (!scene.textures.exists(LOOT_TEXTURE)) scene.load.atlas(LOOT_TEXTURE, import.meta.env.BASE_URL + LOOT_URLS.image, import.meta.env.BASE_URL + LOOT_URLS.data);
}
export function applyVisual(sprite: Phaser.GameObjects.Sprite, selection: VisualSelection, multiplier = 1) {
  const spec = ASSET_REGISTRY[selection.asset], size = visualDimensions(selection, multiplier);
  sprite.setTexture(selection.texture, selection.frame).setOrigin(spec.origin.x, spec.origin.y).setDisplaySize(size.width, size.height);
}
export function entityVisual(entity: RenderEntity, elapsed: number): VisualSelection {
  if ('kind' in entity) return enemyVisual(entity.kind, entity.elite, elapsed, entity.id);
  if ('value' in entity) return selectAsset('xp', lootFrame('xp', elapsed));
  if ('lootKind' in entity) return selectAsset(LOOT_ART[entity.lootKind], lootFrame(entity.lootKind, elapsed));
  if ('lootPool' in entity) return selectAsset('chest', lootFrame('chest', elapsed));
  if ('artifact' in entity) return selectAsset(ARTIFACT_ART[entity.artifact], lootFrame(ARTIFACT_KEYS[entity.artifact], elapsed));
  return entity.hostile ? selectAsset('hostile', `hostile-${Math.floor(elapsed * 12) % 4}`) : selectAsset('fireball', `fireball-${Math.floor(elapsed * 12) % 4}`);
}
// Reads simulation state; no timers, inputs, damage, collision bodies or RNG.
export class GameArt {
  private shadows: Phaser.GameObjects.Image[] = [];
  private cleaves: Phaser.GameObjects.Image[] = [];
  private runner = new RunnerAnimation();
  private runnerCorpses: Phaser.GameObjects.Image[] = [];
  private packed = new EnemyAnimation();
  private packedCorpses: Phaser.GameObjects.Image[] = [];
  private guardian = new GuardianAnimation();
  private guardianCorpses: Phaser.GameObjects.Image[] = [];
  private elites: EliteAdornment;
  private bosses = new BossAnimation();
  private bossCorpses: Phaser.GameObjects.Image[] = [];
  private pickups = new PickupAnimation();
  private pickupImages: Phaser.GameObjects.Image[] = [];
  private playerHealth: PlayerHealthBar;
  private worldTime = 0;
  private heroDeathAge = 0;
  private heroRunId = '';
  private heroHp = 100;
  private heroHurtStarted = -Infinity;
  private heroSprite?: Phaser.GameObjects.Sprite;
  private heroMoving = false;
  private heroCasting = false;
  private casting = new MageCastingController();
  private castingArt: MageCastingArt;
  heroFrame = '';
  constructor(private scene: Phaser.Scene) { this.playerHealth = new PlayerHealthBar(scene); this.elites = new EliteAdornment(scene); this.castingArt = new MageCastingArt(scene,this.casting); for (const key of [HD_CORE_TEXTURE, RUNNER_TEXTURE, MAGE_TEXTURE, MAGE_CAST_TEXTURE, ENEMY_TEXTURE, GUARDIAN_TEXTURE, BOSS_TEXTURE, LOOT_TEXTURE]) scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST); }
  prepare(world: World) { this.runner.prepare(world); this.packed.prepare(world); this.guardian.prepare(world); this.bosses.prepare(world); this.pickups.prepare(world); }
  observeCasts(world: World) { this.casting.observe(world); }
  entityVisual(entity: RenderEntity, world: World): VisualSelection {
    if ('kind' in entity && entity.kind === 'runner') return enemyVisual('runner', entity.elite, world.elapsed, entity.id, this.runner.view(entity, world));
    if ('kind' in entity && entity.kind === 'guardian') return selectAsset('guardian', this.guardian.frame(entity, world));
    if ('kind' in entity && isHdBoss(entity.kind)) { const p = this.bosses.view(entity, world); return selectAsset(entity.kind, bossFrame(entity.kind, p.facing, p.pose, world.elapsed - p.started, p.stage)); }
    if ('kind' in entity && isHdEnemy(entity.kind)) { const p = this.packed.view(entity, world), visual = enemyVisual(entity.kind, entity.elite, world.elapsed, entity.id); return { ...visual, frame: packedEnemyFrame(entity.kind, p.facing, p.pose, world.elapsed - p.started) }; }
    return entityVisual(entity, world.elapsed);
  }
  hero(sprite: Phaser.GameObjects.Sprite, world: World, facing: Facing, moving: boolean, multiplier = 1) {
    if (this.heroRunId !== world.runId) { this.heroHp = world.player.hp; this.heroHurtStarted = -Infinity; this.heroMoving = false; }
    if (this.heroRunId !== world.runId || world.status !== 'over') this.heroDeathAge = 0;
    this.heroRunId = world.runId;
    if (world.player.hp < this.heroHp) this.heroHurtStarted = world.elapsed;
    this.heroHp = world.player.hp; this.heroSprite = sprite;
    if (world.status !== 'paused' && world.status !== 'upgrade') this.heroMoving = moving;
    if (world.status === 'over') this.heroDeathAge += Math.min(.05, this.scene.game.loop.delta / 1000);
    const hurt = world.character === 'mage' && world.elapsed - this.heroHurtStarted < .25;
    const cast = this.casting.view(world.elapsed);
    this.heroCasting = world.character === 'mage' && world.status !== 'menu' && world.status !== 'over' && !hurt && cast.mode === 'cast' && !!cast.active;
    const recoil = cast.active?.ability === 'fireball' && cast.frame === 2;
    const visual = world.character === 'mage' && world.status === 'over' ? selectAsset('mage', mageFrame(facing, 'death', this.heroDeathAge)) : hurt ? selectAsset('mage', mageFrame(facing, 'hurt', world.elapsed - this.heroHurtStarted)) : this.heroCasting ? selectAsset('mageCasting',castingBodyFrame(facing,this.heroMoving,world.elapsed,recoil)) : heroVisual(world.character, facing, this.heroMoving, world.character !== 'mage' && world.player.invulnerableUntil > world.elapsed, world.elapsed);
    this.heroFrame = visual.frame ?? visual.texture; applyVisual(sprite, visual, multiplier);
  }
  update(world: World, intensity: number) {
    if(this.heroSprite)this.castingArt.render(this.heroSprite,world,this.heroMoving,this.heroCasting,intensity);
    this.playerHealth.update(world);
    this.worldTime = world.elapsed;
    this.pickups.update(world);
    for (const [i, p] of this.pickups.bursts.entries()) {
      const age = world.elapsed - p.started, t = age / .5, image = this.pickupImages[i] ?? this.scene.add.image(0, 0, LOOT_TEXTURE, lootFrame(p.key, 0)); this.pickupImages[i] = image;
      const size = p.open ? 20 : p.key === 'xp' ? 6 : p.key.startsWith('artifact-') ? 18.4 : 16;
      image.setTexture(LOOT_TEXTURE, lootFrame(p.key, age, p.open)).setPosition(p.x, p.y - (p.open ? 0 : t * 15)).setDisplaySize(size * (p.open ? 1 : 1 - t * .25), size * (p.open ? 1 : 1 - t * .25)).setDepth(3).setAlpha(1 - t * t).setVisible(true).setActive(true);
    }
    for (let i = this.pickups.bursts.length; i < this.pickupImages.length; i++) this.pickupImages[i].setVisible(false).setActive(false);
    this.runner.finish(world);
    this.packed.finish(world);
    this.guardian.finish(world); this.elites.update(world);
    this.bosses.finish(world);
    for (let i = 0; i < this.bosses.corpses.length; i++) {
      const c = this.bosses.corpses[i]; if (!c.active) { this.bossCorpses[i]?.setVisible(false).setActive(false); continue; }
      const age = world.elapsed - c.started, size = visualDimensions(selectAsset(c.kind)), image = this.bossCorpses[i] ?? this.scene.add.image(0, 0, BOSS_TEXTURE, bossFrame(c.kind, c.facing, 'death', 0, c.stage)); this.bossCorpses[i] = image;
      image.setTexture(BOSS_TEXTURE, bossFrame(c.kind, c.facing, 'death', age, c.stage)).setPosition(c.x, c.y).setOrigin(.5).setDisplaySize(size.width, size.height).setDepth(c.y / 10000 - .02).setAlpha(1 - (age / .6) ** 2).setVisible(true).setActive(true);
    }
    for (let i = this.bosses.corpses.length; i < this.bossCorpses.length; i++) this.bossCorpses[i].setVisible(false).setActive(false);
    for (const [i, corpse] of this.guardian.corpses.entries()) {
      const image = this.guardianCorpses[i] ?? this.scene.add.image(0, 0, GUARDIAN_TEXTURE, 'guardian-death-0'); this.guardianCorpses[i] = image;
      const age = world.elapsed - corpse.started, size = visualDimensions(selectAsset('guardian'));
      image.setTexture(GUARDIAN_TEXTURE, guardianFrame('death', age)).setPosition(corpse.x, corpse.y).setDisplaySize(size.width, size.height).setDepth(corpse.y / 10000 - .02).setAlpha(1 - (age / .6) ** 2).setVisible(true).setActive(true);
    }
    for (let i = this.guardian.corpses.length; i < this.guardianCorpses.length; i++) this.guardianCorpses[i].setVisible(false).setActive(false);
    for (let i = 0; i < this.packed.corpses.length; i++) {
      const c = this.packed.corpses[i];
      if (!c.active) { this.packedCorpses[i]?.setVisible(false).setActive(false); continue; }
      const visual = enemyVisual(c.kind, c.elite, world.elapsed, c.id), size = visualDimensions(visual), age = world.elapsed - c.started;
      const image = this.packedCorpses[i] ?? this.scene.add.image(0, 0, ENEMY_TEXTURE, packedEnemyFrame(c.kind, c.facing, 'death', 0)); this.packedCorpses[i] = image;
      image.setTexture(ENEMY_TEXTURE, packedEnemyFrame(c.kind, c.facing, 'death', age)).setOrigin(.5).setPosition(c.x, c.y).setDisplaySize(size.width, size.height).setDepth(c.y / 10000 - .02).setAlpha(1 - (age / .5) ** 2).setVisible(true).setActive(true);
    }
    for (let i = this.packed.corpses.length; i < this.packedCorpses.length; i++) this.packedCorpses[i].setVisible(false).setActive(false);
    for (let i = 0; i < this.runner.corpses.length; i++) {
      const corpse = this.runner.corpses[i];
      if (!corpse.active) { this.runnerCorpses[i]?.setVisible(false).setActive(false); continue; }
      const image = this.runnerCorpses[i] ?? this.scene.add.image(0, 0, RUNNER_TEXTURE, 'runner-right-death-0'); this.runnerCorpses[i] = image;
      const age = Math.max(0, world.elapsed - corpse.started), t = age / (RUNNER_CLIPS.death.frames / RUNNER_CLIPS.death.fps), size = visualDimensions(selectAsset('runner', undefined, corpse.elite ? 1.4 : 1));
      image.setTexture(RUNNER_TEXTURE, runnerFrame('death', corpse.facing, age)).setPosition(corpse.x, corpse.y).setOrigin(0.5).setDisplaySize(size.width, size.height)
        .setDepth(corpse.y / 10000 - 0.02).setAlpha(1 - t * t).setVisible(true).setActive(true);
    }
    for (let i = this.runner.corpses.length; i < this.runnerCorpses.length; i++) this.runnerCorpses[i].setVisible(false).setActive(false);
    let count = 0;
    const shadow = (x: number, y: number, scale: number) => {
      const image = this.shadows[count] ?? this.scene.add.image(0, 0, HD_CORE_TEXTURE, 'shadow').setDepth(-2); this.shadows[count++] = image;
      const size = ASSET_REGISTRY.shadow.logicalSize!;
      image.setPosition(x, y).setDisplaySize(size.width * scale, size.height * scale).setVisible(true);
    };
    shadow(world.player.x, world.player.y + 6, 1.3);
    for (const e of world.enemies) shadow(Math.round(e.x), Math.round(e.y + (e.boss ? 23 : 6)), e.boss ? 2.5 : e.kind === 'tank' ? 1.6 : e.elite ? 1.4 : 1);
    for (let i = count; i < this.shadows.length; i++) this.shadows[i].setVisible(false);
    count = 0;
    for (const e of world.effects) if (e.kind === 'cleave') {
      const rank = abilityVisual(world.abilities.cleave.level);
      const t = Math.min(1, Math.max(0, (world.elapsed - e.started) / e.duration));
      const image = this.cleaves[count] ?? this.scene.add.image(0, 0, HD_CORE_TEXTURE, 'cleave-0').setDepth(14); this.cleaves[count++] = image;
      const displaySize = e.radius * 48 / 21 * (0.75 + t * 0.25);
      image.setTexture(HD_CORE_TEXTURE, `cleave-${Math.min(3, Math.floor(t * 4))}`).setPosition(e.x, e.y)
        .setRotation(e.target ? Math.atan2(e.target.y - e.y, e.target.x - e.x) : 0).setDisplaySize(displaySize, displaySize).setAlpha((1 - t) * intensity * rank.brightness).setVisible(true);
      if (rank.capstone) image.setTint(0xffe5b4); else image.clearTint();
    }
    for (let i = count; i < this.cleaves.length; i++) this.cleaves[i].setVisible(false);
  }
  diagnostics() {
    const textures = this.scene.textures.getTextureKeys(), atlas = this.scene.textures.get(HD_CORE_TEXTURE);
    // Diagnostic reads only, pinned Phaser 4.2.1. Never used by gameplay.
    const clock = ['_active', '_pendingInsertion', '_pendingRemoval'].map(key => { const value: unknown = Reflect.get(this.scene.time, key); return Array.isArray(value) ? value.length : null; });
    return { heroFrame: this.heroFrame, atlasFrames: atlas.frameTotal - 1, runner: { atlasFrames: this.scene.textures.get(RUNNER_TEXTURE).frameTotal - 1, tracked: this.runner.tracked, activeDeaths: this.runner.corpses.filter(c => c.active).length, allocatedDeaths: this.runnerCorpses.filter(Boolean).length, replaced: this.runner.replaced, corpses: this.runner.corpses.flatMap((c, i) => c.active ? [{ ...c, frame: runnerFrame('death', c.facing, this.worldTime - c.started), width: this.runnerCorpses[i]?.displayWidth ?? 0, height: this.runnerCorpses[i]?.displayHeight ?? 0 }] : []) }, textures, chunks: textures.filter(t => t.startsWith('chunk-')).length,
      casting: {...this.casting.view(this.worldTime),...this.castingArt.diagnostics(),bodyFrame:this.heroFrame},
      playerHealth: this.playerHealth.diagnostics(),
      textureBytes: textures.reduce((n, key) => { const source = this.scene.textures.get(key).getSourceImage() as HTMLCanvasElement; return n + source.width * source.height * 4; }, 0),
      loot: { tracked: this.pickups.tracked, active: this.pickups.bursts.length, allocated: this.pickupImages.length, frames: this.pickups.bursts.map(p => lootFrame(p.key, this.worldTime - p.started, p.open)) },
      packed: { tracked: this.packed.tracked, activeDeaths: this.packed.corpses.filter(c => c.active).length, allocatedDeaths: this.packedCorpses.length, replaced: this.packed.replaced, corpses: this.packed.corpses.filter(c => c.active).map(c => ({ ...c, frame: packedEnemyFrame(c.kind, c.facing, 'death', this.worldTime - c.started) })) },
      guardian: { activeDeaths: this.guardian.corpses.length, allocatedDeaths: this.guardianCorpses.length, frame: this.guardian.corpse ? guardianFrame('death', this.worldTime - this.guardian.corpse.started) : null }, eliteAdornments: this.elites.count,
      bosses: { tracked: this.bosses.tracked, activeDeaths: this.bosses.corpses.filter(c => c.active).length, allocatedDeaths: this.bossCorpses.length, corpses: this.bosses.corpses.filter(c => c.active).map(c => ({ ...c, frame: bossFrame(c.kind, c.facing, 'death', this.worldTime - c.started, c.stage) })) },
      shadows: this.shadows.length, cleaves: this.cleaves.length, objects: this.scene.children.length, layers: this.scene.children.getAll().filter(o => o.name === 'friendly-feedback' || o.name === 'hostile-tells').map(o => ({ name: o.name, depth: (o as Phaser.GameObjects.Graphics).depth })), tweens: this.scene.tweens.getTweens().length, clock,
      blurListeners: this.scene.game.events.listenerCount(Phaser.Core.Events.BLUR),
      actors: this.scene.children.getAll().filter(o => o.type === 'Sprite' && o.active).map(o => { const s = o as Phaser.GameObjects.Sprite; return { texture: s.texture.key, frame: s.frame.name, width: s.displayWidth, height: s.displayHeight, x: s.x, y: s.y }; }),
    };
  }
  destroy() { this.castingArt.destroy(); this.playerHealth.destroy(); for (const image of [...this.shadows, ...this.cleaves, ...this.runnerCorpses, ...this.packedCorpses, ...this.bossCorpses, ...this.pickupImages]) image.destroy(); this.pickupImages = []; this.pickups.clear(); this.bossCorpses = []; this.bosses.clear(); for (const image of this.guardianCorpses) image.destroy(); this.guardianCorpses = []; this.elites.destroy(); this.guardian.clear(); this.shadows = []; this.cleaves = []; this.runnerCorpses = []; this.packedCorpses = []; this.runner.destroy(); this.packed.clear(); }
}
