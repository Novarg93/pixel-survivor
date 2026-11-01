import { CombatFeedback } from '../art/CombatFeedback';
import Phaser from 'phaser';
import { LootPresentation } from '../art/LootPresentation';
import { RadarPublisher } from '../radar/RadarPublisher';
import { World, type RunOptions } from '../systems/World';
import { snapshots, commands, metrics, radarFrames, type Metrics } from '../events/bridge';
import { WorldChunkSystem } from '../systems/WorldChunkSystem';
import { AudioSystem } from '../services/AudioSystem';
import { DEFAULT_SETTINGS, type Settings } from '../services/storage';
import { GameArt, preloadGameArt, applyVisual } from '../art/GameArt';
import { type Facing } from '../art/assetRegistry';
import { drawGuardianDanger } from '../art/EncounterArt';
export class GameScene extends Phaser.Scene {
  world = new World();
  private mage!: Phaser.GameObjects.Sprite;
  private chunks!: WorldChunkSystem;
  private feedback!: CombatFeedback;
  private lootPresentation!: LootPresentation;
  private radar!: RadarPublisher;
  private effects!: Phaser.GameObjects.Graphics;
  private art!: GameArt;
  private sprites = new Map<number, Phaser.GameObjects.Sprite>();
  private spareSprites: Phaser.GameObjects.Sprite[] = [];
  private measured: Metrics = { fps: 0, updateMs: 0, enemies: 0, projectiles: 0, orbs: 0, effects: 0, bosses: 0, chunks: 0, sprites: 0, pooledSprites: 0, guardians: 0, artifacts: { items: 0, allocated: 0 }, radar: { updates: 0, markers: 0, listeners: 0 }, loot: { items: 0, chests: 0, buffs: 0, trail: 0, allocatedItems: 0, allocatedChests: 0 }, allocations: { orbs: 0, projectiles: 0, effects: 0 } };
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private publishAt = 0;
  private runOptions: RunOptions = {};
  private facing: Facing = 'down';
  private touch = { x: 0, y: 0 };
  private mobilityRequested = false;
  private audio = new AudioSystem();
  constructor(private preferences: Settings = DEFAULT_SETTINGS) { super('field'); }
  preload() { preloadGameArt(this); }
  create() {
    this.art = new GameArt(this);
    this.radar = new RadarPublisher(frame => radarFrames.emit(frame));
    this.world = new World(); this.publishAt = 0; this.facing = 'down'; this.touch = { x: 0, y: 0 };
    this.world.status = 'menu'; this.audio.settings(this.preferences.volume, this.preferences.muted);
    this.chunks = new WorldChunkSystem(this);
    this.mage = this.add.sprite(0, 0, 'hd-mage', 'mage-down-idle-0').setOrigin(0.5, 0.75).setDepth(10);
    this.feedback = new CombatFeedback(this);
    this.lootPresentation = new LootPresentation(this);
    this.effects = this.add.graphics().setName('hostile-tells').setDepth(20);
    this.cameras.main.setZoom(2).startFollow(this.mage, true, 1, 1);
    this.keys = this.input.keyboard?.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT') as Record<string, Phaser.Input.Keyboard.Key>;
    const mobilityKey = (event: KeyboardEvent) => {
      if (event.repeat || this.world.status !== 'playing' || event.target instanceof Element && event.target.closest('button,input,select,textarea,[role="dialog"]')) return;
      event.preventDefault(); this.mobilityRequested = true;
    };
    this.input.keyboard?.on('keydown-SPACE', mobilityKey);
    const off = commands.on(command => {
      if (command.type === 'mobility') { if (this.world.status === 'playing') this.mobilityRequested = true; return; }
      if (command.type === 'move') { this.touch = this.world.status === 'playing' ? command.input : { x: 0, y: 0 }; return; }
      if (command.type === 'restart' || command.type === 'menu' || command.type === 'preview') { if(command.character)this.runOptions.character=command.character; if(command.biome)this.runOptions.biome=command.biome; this.world.clearTemporaryState(); this.radar.clear(); this.lootPresentation.clear(); this.world = new World(Date.now(), this.runOptions); if (command.type !== 'restart') this.world.status = 'menu'; else this.audio.unlock(); for (const sprite of [...this.sprites.values(), ...this.spareSprites]) sprite.destroy(); this.sprites.clear(); this.spareSprites = []; if (window.__PIXEL__) window.__PIXEL__.world = this.world; }
      else if (command.type === 'upgrade') this.world.selectUpgrade(command.id, command.offer);
      else if (command.type === 'pause') this.world.pause();
      else if (command.type === 'resume') { this.world.resume(); this.audio.unlock(); }
      else if (command.type === 'settings') { this.preferences = { ...command.value }; this.audio.settings(this.preferences.volume, this.preferences.muted); this.audio.unlock(); }
      this.touch = { x: 0, y: 0 }; this.mobilityRequested = false; this.input.keyboard?.resetKeys(); snapshots.emit(this.world.snapshot());
    });
    const blur = () => { this.world.pause(); this.touch = { x: 0, y: 0 }; this.mobilityRequested = false; this.input.keyboard?.resetKeys(); snapshots.emit(this.world.snapshot()); };
    const visibility = () => { if (document.hidden) blur(); };
    this.game.events.on(Phaser.Core.Events.BLUR, blur); document.addEventListener('visibilitychange', visibility);
    if (import.meta.env.DEV && new URLSearchParams(location.search).get('test') === '1') {
      window.__PIXEL__ = { world: this.world, listeners: () => ({ commands: commands.size, snapshots: snapshots.size, metrics: metrics.size }), metrics: () => ({ ...this.measured }), restartScene: () => { this.scene.restart(); }, art: () => this.art.diagnostics() };
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { off(); this.mobilityRequested = false; this.input.keyboard?.off('keydown-SPACE', mobilityKey); this.art.destroy(); this.world.clearTemporaryState(); this.radar.clear(); this.lootPresentation.destroy(); this.feedback.destroy(); this.audio.destroy(); this.game.events.off(Phaser.Core.Events.BLUR, blur); document.removeEventListener('visibilitychange', visibility); this.chunks.destroy(); this.input.keyboard?.removeAllKeys(true); for (const sprite of [...this.sprites.values(), ...this.spareSprites]) sprite.destroy(); this.sprites.clear(); this.spareSprites = []; delete window.__PIXEL__; });
  }
  update(_time: number, delta: number) {
    const started = performance.now();
    const down = (key: string) => this.keys[key]?.isDown ? 1 : 0;
    const zoom = Math.max(this.preferences.pixelScale, Math.ceil(this.scale.width / 960), Math.ceil(this.scale.height / 640)); this.cameras.main.setZoom(zoom);
    this.world.width = this.scale.width / zoom; this.world.height = this.scale.height / zoom;
    const input = { x: Math.max(down('D'), down('RIGHT')) - Math.max(down('A'), down('LEFT')) + this.touch.x, y: Math.max(down('S'), down('DOWN')) - Math.max(down('W'), down('UP')) + this.touch.y };
    this.art.prepare(this.world);
    this.feedback.prepare(this.world);
    if (this.mobilityRequested) { this.mobilityRequested = false; this.world.mobility.activate(this.world, input); }
    this.world.step(delta / 1000, input);
    for (const cue of this.world.sounds.splice(0)) this.audio.play(cue);
    const moving = this.world.status === 'playing' && (input.x !== 0 || input.y !== 0);
    if (moving) { this.facing = input.x !== 0 ? 'side' : input.y < 0 ? 'up' : 'down'; if (input.x !== 0) this.mage.setFlipX(input.x < 0); else this.mage.setFlipX(false); }
    this.art.hero(this.mage, this.world, this.facing, moving, this.world.status === 'menu' && this.scale.width > 600 ? 2 : 1);
    this.mage.setPosition(this.world.player.x, this.world.player.y);
    if (this.world.status === 'menu' && this.scale.width > 600) { this.cameras.main.stopFollow().centerOn(this.mage.x - this.world.width * 0.23, this.mage.y); }
    else { this.cameras.main.startFollow(this.mage, true, 1, 1); }
    this.mage.setAlpha(this.world.player.invulnerableUntil > this.world.elapsed && Math.floor(this.world.elapsed * 16) % 2 === 0 ? 0.4 : 1);
    this.chunks.setBiome(this.world.biome);
    this.chunks.update(this.cameras.main.midPoint.x, this.cameras.main.midPoint.y, this.world.width, this.world.height);
    const active = new Set<number>();
    for (const entity of [...this.world.enemies, ...this.world.projectiles, ...this.world.orbs, ...this.world.loot.items, ...this.world.loot.chests, ...this.world.artifacts.items]) {
      active.add(entity.id); let sprite = this.sprites.get(entity.id);
      const pickup = 'lootKind' in entity || 'lootPool' in entity || 'artifact' in entity;
      const visual = this.art.entityVisual(entity, this.world);
      if (!sprite) { sprite = this.spareSprites.pop() ?? this.add.sprite(entity.x, entity.y, visual.texture, visual.frame); sprite.setActive(true).setVisible(true).setFlipX(false); this.sprites.set(entity.id, sprite); }
      applyVisual(sprite, visual, pickup ? Math.min(1, 0.4 + Math.max(0, this.world.elapsed - entity.born) * 4) : 1);
      sprite.setRotation('vx' in entity && !entity.hostile ? Math.atan2(entity.vy, entity.vx) : 0);
      sprite.setPosition(Math.round(entity.x), Math.round(entity.y - (pickup ? Math.sin((this.world.elapsed - entity.born) * 3) * 1.5 : 0))).setDepth(pickup ? 1 : 'kind' in entity ? entity.y / 10000 : 12);
      if ('hitUntil' in entity && entity.hitUntil > this.world.elapsed) sprite.setTint(0xffe5b3).setTintMode(Phaser.TintModes.MULTIPLY); else sprite.clearTint();
      sprite.setAlpha('hitUntil' in entity && entity.hitUntil > this.world.elapsed ? .85 : 1);
    }
    for (const [id, sprite] of this.sprites) if (!active.has(id)) { if (this.spareSprites.length < 128) { sprite.setVisible(false).setActive(false); this.spareSprites.push(sprite); } else sprite.destroy(); this.sprites.delete(id); }
    this.art.update(this.world, this.preferences.effectsIntensity ?? 0.7);
    this.feedback.update(this.world, this.preferences);
    this.lootPresentation.update(this.world, this.preferences);
    this.radar.update(this.world);
    this.effects.clear();
    drawGuardianDanger(this.effects, this.world, this.world.guardianSystem.encounter);
    for (const enemy of this.world.enemies) {
      if (enemy.kind === 'eclipse' && enemy.boss?.phase === 'windup') { this.effects.lineStyle(2, enemy.boss.stage === 2 ? 0xe3a2ff : 0x9ae5e3).strokeCircle(enemy.x, enemy.y, 40); for(let i=0;i<12;i++)if(i!==0&&i!==6){const a=Math.atan2(this.mage.y-enemy.y,this.mage.x-enemy.x)-Math.PI/12+i*Math.PI/6;this.effects.lineBetween(enemy.x+Math.cos(a)*28,enemy.y+Math.sin(a)*28,enemy.x+Math.cos(a)*47,enemy.y+Math.sin(a)*47);} }
      if (enemy.modifier === 'shielded' && (this.world.elapsed - enemy.born) % 7 < 2) this.effects.lineStyle(2, 0x9ccbf5, 0.9).strokeCircle(enemy.x, enemy.y, enemy.radius + 7);
      if (enemy.modifier === 'frenzy' && (this.world.elapsed - enemy.born) % 7 < 2) this.effects.fillStyle(0xffcd74).fillTriangle(enemy.x, enemy.y - 22, enemy.x - 4, enemy.y - 16, enemy.x + 4, enemy.y - 16);
      if (enemy.modifier === 'volatile') this.effects.lineStyle(1, 0xff83aa).strokeCircle(enemy.x, enemy.y, enemy.radius + 3);
      if (enemy.rush?.phase === 'windup') this.effects.lineStyle(18, 0xffa970, 0.18).lineBetween(enemy.x, enemy.y, enemy.rush.aim.x, enemy.rush.aim.y).lineStyle(1, 0xffd896).lineBetween(enemy.x, enemy.y, enemy.rush.aim.x, enemy.rush.aim.y);
      if ((enemy.freezeUntil ?? 0) > this.world.elapsed) this.effects.lineStyle(2, 0xa9f2e5).strokeRect(enemy.x - 12, enemy.y - 15, 24, 28);
      if (enemy.elite) this.effects.lineStyle(1, 0xffd68b, 1).strokeRect(enemy.x - enemy.radius - 3, enemy.y - enemy.radius - 8, enemy.radius * 2 + 6, enemy.radius * 2 + 8);
      if (enemy.aim) this.effects.lineStyle(1, 0xff8ba7, 0.7).lineBetween(enemy.x, enemy.y, enemy.aim.x, enemy.aim.y).strokeCircle(enemy.x, enemy.y, 19);
      if (enemy.kind === 'charger' && enemy.boss?.phase === 'windup') { this.effects.lineStyle(46, 0xff906d, 0.2).lineBetween(enemy.x, enemy.y, enemy.boss.aim.x, enemy.boss.aim.y).lineStyle(2, 0xffd2a0, 0.9).lineBetween(enemy.x, enemy.y, enemy.boss.aim.x, enemy.boss.aim.y); }
      if (enemy.boss && (Math.abs(enemy.x - this.mage.x) > this.world.width / 2 - 20 || Math.abs(enemy.y - this.mage.y) > this.world.height / 2 - 20)) {
        const angle = Math.atan2(enemy.y - this.mage.y, enemy.x - this.mage.x), r = Math.min((this.world.width / 2 - 18) / Math.max(0.01, Math.abs(Math.cos(angle))), (this.world.height / 2 - 18) / Math.max(0.01, Math.abs(Math.sin(angle))));
        const x = this.mage.x + Math.cos(angle) * r, y = this.mage.y + Math.sin(angle) * r;
        this.effects.fillStyle(0xffaf8b).fillTriangle(x + Math.cos(angle) * 6, y + Math.sin(angle) * 6, x + Math.cos(angle + 2.4) * 5, y + Math.sin(angle + 2.4) * 5, x + Math.cos(angle - 2.4) * 5, y + Math.sin(angle - 2.4) * 5);
      }
    }
    for (const impact of this.world.impacts) if (impact.hostile || impact.source !== 'meteor' && impact.source !== 'slam') this.effects.fillStyle(impact.hostile ? 0xff749e : 0xffb26f, 0.14).fillCircle(impact.x, impact.y, impact.radius).lineStyle(2, impact.hostile ? 0xff749e : 0xffb26f, 0.8).strokeCircle(impact.x, impact.y, impact.radius).lineBetween(impact.x - 6, impact.y, impact.x + 6, impact.y).lineBetween(impact.x, impact.y - 6, impact.x, impact.y + 6);
    this.measured = { fps: this.game.loop.actualFps, updateMs: performance.now() - started, enemies: this.world.regularCount, projectiles: this.world.projectiles.length, orbs: this.world.orbs.length, effects: this.world.effects.length, bosses: this.world.bosses.length, chunks: this.chunks.count, sprites: this.sprites.size, pooledSprites: this.spareSprites.length, guardians: this.world.rareGuardian ? 1 : 0, artifacts: { items: this.world.artifacts.items.length, allocated: this.world.artifacts.allocated }, radar: { updates: this.radar.updates, markers: this.radar.frame?.markers.length ?? 0, listeners: radarFrames.size }, loot: { items: this.world.loot.items.length, chests: this.world.loot.chests.length, buffs: this.world.buffs.snapshot(this.world.elapsed).length, trail: this.lootPresentation.trailCount, allocatedItems: this.world.loot.allocations.items, allocatedChests: this.world.loot.allocations.chests }, allocations: this.world.allocations };
    if (this.time.now >= this.publishAt) { this.publishAt = this.time.now + 100; snapshots.emit(this.world.snapshot()); if (import.meta.env.DEV) metrics.emit(this.measured); }
  }
}
