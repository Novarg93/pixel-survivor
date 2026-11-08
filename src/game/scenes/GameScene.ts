import {ASTRAL_VFX} from '../config/astralRevenant';
import {startAstralPractice} from '../bootstrap/startAstralPractice';
import { startBriarPractice } from '../bootstrap/startBriarPractice';
import { ultimateFrozen } from '../systems/UltimateFreeze';
import { startBossPractice } from '../bootstrap/startBossPractice';
import { startRunePractice } from '../bootstrap/startRunePractice';
import {finalBossScenario} from '../bootstrap/finalBossScenario';
import { CombatFeedback } from '../art/CombatFeedback';
import Phaser from 'phaser';
import { LootPresentation } from '../art/LootPresentation';
import { RadarPublisher } from '../radar/RadarPublisher';
import { World, type RunOptions } from '../systems/World';
import { snapshots, commands, metrics, radarFrames, gamepadUi, gamepadNotices, inputDevices, type UiScreen, type Metrics } from '../events/bridge';
import { WorldChunkSystem } from '../systems/WorldChunkSystem';
import { AudioController } from '../audio/AudioController';
import { AudioPresentation } from '../audio/AudioPresentation';
import { PhaserAudioBackend } from '../audio/PhaserAudioBackend';
import { SeededRandom } from '../utils/SeededRandom';
import { DEFAULT_SETTINGS, type Settings } from '../services/storage';
import { GameArt, preloadGameArt, applyVisual } from '../art/GameArt';
import { type Facing } from '../art/assetRegistry';
import { drawChargePreparation, drawGuardianDanger, drawEnrageDanger } from '../art/EncounterArt';
import { CHARGE_BOSS } from '../config/chargeBoss';
import { pressureAt } from '../systems/EndgamePressure';
import { HeldInputTracker } from '../input/HeldInputTracker';
import { GamepadInputController } from '../input/GamepadInputController';
import { selectMovement } from '../input/movement';
import type { Point } from '../utils/math';
import { runCharacter } from '../bootstrap/publicCharacters';
import type { CharacterId } from '../config/characters';
import { mobileViewport } from '../../ui/mobileViewport';
import { ForestAtmosphere } from '../art/ForestAtmosphere';
import { mapDefinition } from '../config/biomes';
export class GameScene extends Phaser.Scene {
  world = new World();
  private mage!: Phaser.GameObjects.Sprite;
  private chunks!: WorldChunkSystem;
  private atmosphere!: ForestAtmosphere;
  private feedback!: CombatFeedback;
  private lootPresentation!: LootPresentation;
  private radar!: RadarPublisher;
  private effects!: Phaser.GameObjects.Graphics;
  private art!: GameArt;
  private sprites = new Map<number, Phaser.GameObjects.Sprite>();
  private spareSprites: Phaser.GameObjects.Sprite[] = [];
  private measured: Metrics = { fps: 0, updateMs: 0, enemies: 0, projectiles: 0, orbs: 0, effects: 0, bosses: 0, chunks: 0, sprites: 0, pooledSprites: 0, guardians: 0, artifacts: { items: 0, allocated: 0 }, radar: { updates: 0, markers: 0, listeners: 0 }, loot: { items: 0, chests: 0, buffs: 0, trail: 0, allocatedItems: 0, allocatedChests: 0 }, allocations: { orbs: 0, projectiles: 0, effects: 0 } };
  private heldInput!: HeldInputTracker;
  private gamepad!: GamepadInputController;
  private uiScreen: UiScreen = 'game';
  private inputStatus: World['status'] = 'menu';
  private publishAt = 0;
  private terminalPublished='';
  private runOptions: RunOptions = {};
  private testCharacter: CharacterId | undefined;
  private visualTime: number | undefined;
  private orientationResume = false;
  private facing: Facing = 'down';
  private touch = { x: 0, y: 0 };
  private mobilityRequested = false;
  private ultimateRequested = false;
  private mobilityDirection: Point | undefined;
  private audio!: AudioController;
  private audioPresentation!: AudioPresentation;
  constructor(private preferences: Settings = DEFAULT_SETTINGS) { super('field'); }
  preload() { preloadGameArt(this); }
  create() {
    const audioRng = new SeededRandom(0xa07d);
    this.audio = new AudioController(new PhaserAudioBackend(this.sound, this.cache.audio), () => audioRng.next());
    this.audio.settings(this.preferences); this.audioPresentation = new AudioPresentation(this.audio);
    this.art = new GameArt(this);
    this.radar = new RadarPublisher(frame => radarFrames.emit(frame));
    this.world = new World(); this.orientationResume = false; this.publishAt = 0; this.facing = 'down'; this.touch = { x: 0, y: 0 };
    this.world.status = 'menu'; this.audioPresentation.observe(this.world);
    const presentation = mapDefinition(this.world.biome).presentation;
    this.chunks = new WorldChunkSystem(this, presentation);
    this.atmosphere = new ForestAtmosphere(this, this.chunks, presentation.phases);
    this.mage = this.add.sprite(0, 0, 'hd-mage', 'mage-down-idle-0').setOrigin(0.5, 0.75).setDepth(10);
    this.feedback = new CombatFeedback(this);
    this.lootPresentation = new LootPresentation(this);
    this.effects = this.add.graphics().setName('hostile-tells').setDepth(20);
    this.cameras.main.setZoom(2).startFollow(this.mage, true, 1, 1);
    this.inputStatus = this.world.status;
    const heldInput = this.heldInput = new HeldInputTracker(window, () => this.world.status === 'playing' || this.world.status === 'upgrade');
    this.uiScreen = 'game';
    let gamepadAudioAttempted = false;
    const gamepad = this.gamepad = new GamepadInputController({ target: window, visibilityTarget: document, hidden: () => document.hidden,
      read: navigator.getGamepads ? () => navigator.getGamepads() : undefined,
      notice: notice => gamepadNotices.emit(notice), activity: () => {
        inputDevices.emit('gamepad');
        // A denied resume may stay pending until a browser-authorized gesture.
        // Do not queue another promise for every analog sample.
        if (!gamepadAudioAttempted) { gamepadAudioAttempted = true; this.audio.gesture(); }
      } });
    const destroyHeldInput = () => { heldInput.destroy(); gamepad.destroy(); };
    this.events.once(Phaser.Scenes.Events.DESTROY, destroyHeldInput);
    const mobilityKey = (event: KeyboardEvent) => {
      if (event.repeat || this.world.status !== 'playing' || event.target instanceof Element && event.target.closest('button,input,select,textarea,[role="dialog"]')) return;
      event.preventDefault(); this.mobilityRequested = true;
    };
    const ultimateKey = (event: KeyboardEvent) => { if(event.repeat || this.world.status !== 'playing' || event.target instanceof Element && event.target.closest('button,input,select,textarea,[role="dialog"]'))return;event.preventDefault();this.ultimateRequested=true; };
    this.input.keyboard?.on('keydown-Q',ultimateKey);
    this.input.keyboard?.on('keydown-SPACE', mobilityKey);
    const off = commands.on(command => {
      if (mobileViewport().blocked && ['restart', 'boss-practice', 'resume', 'mobility', 'ultimate'].includes(command.type)) return;
      if (command.type === 'ui-screen') { this.uiScreen = command.screen; gamepad.reset(true); return; }
      if (command.type === 'ultimate') { if(this.world.status === 'playing')this.ultimateRequested=true;return; }
      if (command.type === 'mobility') { if (this.world.status === 'playing') this.mobilityRequested = true; return; }
      if (command.type === 'move') { this.touch = this.world.status === 'playing' || this.world.status === 'upgrade' ? command.input : { x: 0, y: 0 }; return; }
      if (command.type === 'restart' || command.type === 'boss-practice' || command.type === 'menu' || command.type === 'preview') { this.orientationResume = false; this.visualTime = undefined; }
      if (command.type === 'restart' || command.type === 'boss-practice' || command.type === 'menu' || command.type === 'preview') {
        this.runOptions.character = command.type==='boss-practice'?'mage':runCharacter(import.meta.env.DEV ? this.testCharacter : undefined);
        if(command.biome)this.runOptions.biome=command.biome;if(command.type==='boss-practice')this.runOptions.biome='grove';
        this.atmosphere.clear(); this.world.clearTemporaryState(); this.radar.clear(); this.lootPresentation.clear();
        this.world = new World(Date.now(), this.runOptions);
        if(command.type==='boss-practice'){if(command.practiceBoss==='astral-revenant')startAstralPractice(this.world);else if(command.practiceBoss==='briar-beast')startBriarPractice(this.world);else if(command.practiceBoss==='rune-warden')startRunePractice(this.world);else startBossPractice(this.world);}else if (command.type !== 'restart') this.world.status = 'menu';
        for (const sprite of [...this.sprites.values(), ...this.spareSprites]) sprite.destroy(); this.sprites.clear(); this.spareSprites = [];
        if (window.__PIXEL__) window.__PIXEL__.world = this.world;
      }
      else if (command.type === 'upgrade') this.world.selectUpgrade(command.id, command.offer);
      else if (command.type === 'pause') this.world.pause();
      else if (command.type === 'resume') this.world.resume();
      else if (command.type === 'settings') { this.preferences = { ...command.value }; this.audio.settings(this.preferences); }
      this.audioPresentation.observe(this.world);
      this.audio.ui(command.type === 'restart'||command.type==='boss-practice' ? 'ui.start' : command.type === 'pause' ? 'ui.pause' : 'ui.select'); lastUiCommand = performance.now();
      this.resetInput(command.type === 'upgrade'); snapshots.emit(this.world.snapshot());
    });
    let lastUiCommand = -Infinity;
    const gesture = (event: Event) => { if (event.isTrusted) { this.audio.gesture(); inputDevices.emit(event instanceof PointerEvent && event.pointerType === 'touch' ? 'touch' : 'keyboard'); } };
    const uiClick = (event: Event) => { if (event.isTrusted && event.target instanceof Element && event.target.closest('button') && !event.target.closest('[data-upgrade]') && performance.now() - lastUiCommand > 30) this.audio.ui('ui.select'); };
    document.addEventListener('pointerdown', gesture, true); document.addEventListener('keydown', gesture, true); document.addEventListener('click', uiClick);
    const blur = () => { this.world.pause(); this.audioPresentation.observe(this.world); this.audio.stop(); this.resetInput(); snapshots.emit(this.world.snapshot()); };
    const visibility = () => { if (document.hidden) blur(); };
    this.game.events.on(Phaser.Core.Events.BLUR, blur); document.addEventListener('visibilitychange', visibility);
    if (import.meta.env.DEV && new URLSearchParams(location.search).get('test') === '1') {
      window.__PIXEL__ = { world: this.world, finalScenario: action=>finalBossScenario(this.world,action), setVisualTime: seconds => { if (seconds !== undefined && (!Number.isFinite(seconds) || seconds < 0)) throw new Error('Invalid visual time'); this.visualTime = seconds; }, setTestCharacter: character => { if (character !== 'mage' && character !== 'warrior') throw new Error('Unknown test character'); this.testCharacter = character; commands.emit({ type: 'preview' }); }, listeners: () => ({ commands: commands.size, snapshots: snapshots.size, metrics: metrics.size }), metrics: () => ({ ...this.measured }), restartScene: () => { this.visualTime = undefined; this.scene.restart(); }, art: () => this.art.diagnostics(), atmosphere: () => this.atmosphere.diagnostics(), audio: () => this.audio.diagnostics() };
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { off(); this.events.off(Phaser.Scenes.Events.DESTROY, destroyHeldInput); destroyHeldInput(); this.mobilityRequested = false; this.input.keyboard?.off('keydown-SPACE', mobilityKey); this.input.keyboard?.off('keydown-Q',ultimateKey); this.ultimateRequested=false; this.atmosphere.destroy(); this.art.destroy(); this.world.clearTemporaryState(); this.radar.clear(); this.lootPresentation.destroy(); this.feedback.destroy(); this.audio.destroy(); document.removeEventListener('pointerdown', gesture, true); document.removeEventListener('keydown', gesture, true); document.removeEventListener('click', uiClick); this.game.events.off(Phaser.Core.Events.BLUR, blur); document.removeEventListener('visibilitychange', visibility); this.chunks.destroy(); this.input.keyboard?.removeAllKeys(true); for (const sprite of [...this.sprites.values(), ...this.spareSprites]) sprite.destroy(); this.sprites.clear(); this.spareSprites = []; delete window.__PIXEL__; });
  }
  private resetInput(preserveMovement = false) {
    if (!preserveMovement) this.heldInput.clear();
    this.gamepad.reset(preserveMovement);
    this.ultimateRequested=false;
    if (!preserveMovement) this.touch = { x: 0, y: 0 }; this.mobilityRequested = false; this.mobilityDirection = undefined;
    this.input.keyboard?.resetKeys(); // Keep action-key cleanup, including Space.
    this.inputStatus = this.world.status;
  }
  private syncInputState() {
    if (this.world.status !== this.inputStatus && this.world.status !== 'playing' && this.world.status !== 'upgrade') this.resetInput();
    this.inputStatus = this.world.status;
  }
  update(_time: number, delta: number) {
    const started = performance.now();
    const viewport = mobileViewport();
    if (viewport.blocked && this.world.status === 'playing') { this.orientationResume = true; this.world.pause(); this.resetInput(); }
    if (!viewport.blocked && this.orientationResume) { this.orientationResume = false; if (!document.hidden && this.world.status === 'paused') this.world.resume(); }
    this.syncInputState();
    const context = () => `${this.uiScreen}:${this.world.runId}:${this.world.status}:${this.world.status === 'upgrade' ? this.world.offerId : ''}`;
    const beforeInput = context(), pad = this.gamepad.poll(beforeInput);
    if (!viewport.blocked && pad.actions.includes('pause') && this.uiScreen === 'game') {
      if (this.world.status === 'playing') commands.emit({ type: 'pause' });
      else if (this.world.status === 'paused') commands.emit({ type: 'resume' });
    } else if (this.world.status === 'playing' && pad.actions.includes('ultimate')) { this.ultimateRequested=true;
    } else if (this.world.status === 'playing' && pad.actions.includes('mobility')) {
      this.mobilityRequested = true; this.mobilityDirection = pad.movement;
    } else if (!viewport.blocked && this.world.status !== 'playing') {
      const action = pad.actions.find(a => a === 'confirm') ?? pad.actions.find(a => a !== 'mobility' && a !== 'pause' && a !== 'ultimate');
      if (action) gamepadUi.emit({ scope: this.world.status === 'upgrade' ? 'upgrade' : 'shell', action });
    }
    const baseZoom = Math.max(this.preferences.pixelScale, Math.ceil(this.scale.width / 960), Math.ceil(this.scale.height / 640));
    const zoom = baseZoom * (viewport.touch ? .83 : 1) / (viewport.touch && !viewport.blocked ? 1.3 : 1); this.cameras.main.setZoom(zoom);
    this.world.width = this.scale.width / baseZoom; this.world.height = this.scale.height / baseZoom;
    const input = selectMovement(this.heldInput.input(), this.touch, context() === beforeInput ? pad.movement : { x: 0, y: 0 });
    this.world.ultimate.viewport={width:this.scale.width/zoom,height:this.scale.height/zoom};
    this.art.prepare(this.world);
    this.feedback.prepare(this.world);
    if (this.mobilityRequested) { this.mobilityRequested = false; this.world.mobility.activate(this.world, this.mobilityDirection ?? input); this.mobilityDirection = undefined; }
    if (!viewport.blocked) this.world.step(delta / 1000, input);
    if(this.world.status==='over'&&this.terminalPublished!==this.world.runId){this.terminalPublished=this.world.runId;snapshots.emit(this.world.snapshot());}
    if(this.ultimateRequested){this.ultimateRequested=false;if(!viewport.blocked)this.world.ultimate.activate(this.world);}
    this.syncInputState();
    this.art.observeCasts(this.world);
    this.audioPresentation.observe(this.world);
    const moving = !this.world.ultimate.casting && this.world.status === 'playing' && (input.x !== 0 || input.y !== 0);
    if (moving) { this.facing = input.x !== 0 ? 'side' : input.y < 0 ? 'up' : 'down'; if (input.x !== 0) this.mage.setFlipX(input.x < 0); else this.mage.setFlipX(false); }
    if(this.world.ultimate.casting){const u=this.world.ultimate,target=u.nodes[0]?.at??u.origin,dx=target.x-u.origin.x,dy=target.y-u.origin.y;this.facing=Math.abs(dx)>=Math.abs(dy)?'side':dy<0?'up':'down';this.mage.setFlipX(this.facing==='side'&&dx<0);}
    this.art.hero(this.mage, this.world, this.facing, moving, this.world.status === 'menu' && this.scale.width > 600 ? 2 : 1);
    this.mage.setPosition(this.world.player.x, this.world.player.y);
    if (this.world.status === 'menu' && this.scale.width > 600) { this.cameras.main.stopFollow().centerOn(this.mage.x - this.world.width * 0.23, this.mage.y); }
    else { this.cameras.main.startFollow(this.mage, true, 1, 1); }
    this.mage.setAlpha(this.world.player.invulnerableUntil > this.world.elapsed && Math.floor(this.world.elapsed * 16) % 2 === 0 ? 0.4 : 1);
    const atmosphereStatus=this.world.status==='over'&&this.world.finalEncounter.phase!=='inactive'?'paused':this.world.status;
    this.atmosphere.render(this.visualTime ?? this.world.elapsed, atmosphereStatus, this.preferences, viewport.touch);
    this.chunks.update(this.cameras.main.midPoint.x, this.cameras.main.midPoint.y, this.scale.width / zoom, this.scale.height / zoom, viewport.touch ? 0 : 1);
    const active = new Set<number>();
    for (const entity of [...this.world.enemies, ...this.world.projectiles, ...this.world.orbs, ...this.world.loot.items, ...this.world.loot.chests, ...this.world.artifacts.items]) {
      if('kind' in entity&&entity.kind==='ashGuard')continue; // Layered accepted pack is owned by FinalBossArt.
      active.add(entity.id); let sprite = this.sprites.get(entity.id);
      const pickup = 'lootKind' in entity || 'lootPool' in entity || 'artifact' in entity;
      const visual = this.art.entityVisual(entity, this.world);
      if (!sprite) { sprite = this.spareSprites.pop() ?? this.add.sprite(entity.x, entity.y, visual.texture, visual.frame); sprite.setActive(true).setVisible(true).setFlipX(false); this.sprites.set(entity.id, sprite); }
      applyVisual(sprite, visual, pickup ? Math.min(1, 0.4 + Math.max(0, this.world.elapsed - entity.born) * 4) : 1);
      sprite.setVisible(!('homing'in entity&&entity.homing));
      sprite.setFlipX('kind' in entity&&entity.kind==='ashGuard'&&Math.abs(this.world.finalEncounter.attack.direction.x)>.6&&this.world.finalEncounter.attack.direction.x<0);
      sprite.setRotation('vx' in entity && (!entity.hostile||entity.appearance!==undefined) ? Math.atan2(entity.vy, entity.vx) : 0);
      sprite.setPosition(Math.round(entity.x), Math.round(entity.y - (pickup ? Math.sin((this.world.elapsed - entity.born) * 3) * 1.5 : 0))).setDepth(pickup ? 1 : 'kind' in entity ? entity.y / 10000 : 12);
      const preparingCharge = 'kind' in entity && entity.kind === 'charger' && entity.boss?.phase === 'windup';
      if('kind' in entity&&ultimateFrozen(entity,this.world.elapsed))sprite.setTint(0x96d9ec).setTintMode(Phaser.TintModes.MULTIPLY);
      else if (preparingCharge && entity.boss!.until - this.world.elapsed <= CHARGE_BOSS.flashDuration) sprite.setTint(0xffe6b8).setTintMode(Phaser.TintModes.FILL);
      else if ('hitUntil' in entity && entity.hitUntil > this.world.elapsed) sprite.setTint(0xffe5b3).setTintMode(Phaser.TintModes.MULTIPLY);
      else if('kind' in entity&&entity.kind==='eclipse'&&entity.boss?.stage===2)sprite.setTint(ASTRAL_VFX.stage2Tint).setTintMode(Phaser.TintModes.ADD);else sprite.clearTint();
      sprite.setAlpha(!preparingCharge && 'hitUntil' in entity && entity.hitUntil > this.world.elapsed ? .85 : 1);
    }
    for (const [id, sprite] of this.sprites) if (!active.has(id)) { if (this.spareSprites.length < 128) { sprite.setVisible(false).setActive(false); this.spareSprites.push(sprite); } else sprite.destroy(); this.sprites.delete(id); }
    this.art.update(this.world, this.preferences.effectsIntensity ?? 0.7, this.preferences.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches, this.preferences.reducedFlash || matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.feedback.update(this.world, this.preferences);
    this.lootPresentation.update(this.world, this.preferences);
    this.radar.update(this.world);
    this.effects.clear();
    drawEnrageDanger(this.effects,this.world);
    for (const e of this.world.guardians) drawGuardianDanger(this.effects, this.world, this.world.guardianSystem.encounters.get(e.id) ?? null, e.id);
    for (const enemy of this.world.enemies) {
      if (enemy.modifier === 'shielded' && (this.world.elapsed - enemy.born) % 7 < 2) this.effects.fillStyle(0x9ccbf5).fillRect(enemy.x - 3, enemy.y - 18, 6, 2).fillRect(enemy.x - 2, enemy.y - 16, 4, 3);
      if (enemy.modifier === 'frenzy' && (this.world.elapsed - enemy.born) % pressureAt(this.world.elapsed).frenzyCycle < .4) this.effects.fillStyle(0xffcd74).fillTriangle(enemy.x, enemy.y - 22, enemy.x - 3, enemy.y - 17, enemy.x + 3, enemy.y - 17);
      if (enemy.modifier === 'volatile') this.effects.fillStyle(0xff83aa).fillRect(enemy.x - 2, enemy.y - 18, 4, 3);
      if (enemy.rush?.phase === 'windup') this.effects.lineStyle(18, 0xffa970, 0.18).lineBetween(enemy.x, enemy.y, enemy.rush.aim.x, enemy.rush.aim.y).lineStyle(1, 0xffd896).lineBetween(enemy.x, enemy.y, enemy.rush.aim.x, enemy.rush.aim.y);
      if (enemy.aim) {
        const a = Math.atan2(enemy.aim.y - enemy.y, enemy.aim.x - enemy.x), x = enemy.x + Math.cos(a) * 15, y = enemy.y + Math.sin(a) * 15;
        this.effects.lineStyle(2, 0xffb1b7).lineBetween(enemy.x + Math.cos(a) * 7, enemy.y + Math.sin(a) * 7, x, y).fillStyle(0xffe1c4).fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
      }
      drawChargePreparation(this.effects, this.world, enemy);
      if (enemy.boss && !enemy.finalRole && (Math.abs(enemy.x - this.mage.x) > this.world.width / 2 - 20 || Math.abs(enemy.y - this.mage.y) > this.world.height / 2 - 20)) {
        const angle = Math.atan2(enemy.y - this.mage.y, enemy.x - this.mage.x), r = Math.min((this.world.width / 2 - 18) / Math.max(0.01, Math.abs(Math.cos(angle))), (this.world.height / 2 - 18) / Math.max(0.01, Math.abs(Math.sin(angle))));
        const x = this.mage.x + Math.cos(angle) * r, y = this.mage.y + Math.sin(angle) * r;
        this.effects.fillStyle(0xffaf8b).fillTriangle(x + Math.cos(angle) * 6, y + Math.sin(angle) * 6, x + Math.cos(angle + 2.4) * 5, y + Math.sin(angle + 2.4) * 5, x + Math.cos(angle - 2.4) * 5, y + Math.sin(angle - 2.4) * 5);
      }
    }
    for (const impact of this.world.impacts) {
      if(impact.appearance==='runic-judgement')continue;
      if (impact.hostile || impact.source !== 'meteor' && impact.source !== 'slam') this.effects.fillStyle(impact.hostile ? 0xff749e : 0xffb26f, 0.14).fillCircle(impact.x, impact.y, impact.radius).lineStyle(2, impact.hostile ? 0xff749e : 0xffb26f, 0.8).strokeCircle(impact.x, impact.y, impact.radius).lineBetween(impact.x - 6, impact.y, impact.x + 6, impact.y).lineBetween(impact.x, impact.y - 6, impact.x, impact.y + 6);
    }
    this.measured = { fps: this.game.loop.actualFps, updateMs: performance.now() - started, enemies: this.world.regularCount, projectiles: this.world.projectiles.length, orbs: this.world.orbs.length, effects: this.world.effects.length, bosses: this.world.bosses.length, chunks: this.chunks.count, sprites: this.sprites.size, pooledSprites: this.spareSprites.length, guardians: this.world.guardians.length, artifacts: { items: this.world.artifacts.items.length, allocated: this.world.artifacts.allocated }, radar: { updates: this.radar.updates, markers: this.radar.frame?.markers.length ?? 0, listeners: radarFrames.size }, loot: { items: this.world.loot.items.length, chests: this.world.loot.chests.length, buffs: this.world.buffs.snapshot(this.world.elapsed).length, trail: this.lootPresentation.trailCount, allocatedItems: this.world.loot.allocations.items, allocatedChests: this.world.loot.allocations.chests }, allocations: this.world.allocations };
    if (this.time.now >= this.publishAt) { this.publishAt = this.time.now + 100; snapshots.emit(this.world.snapshot()); if (import.meta.env.DEV) metrics.emit(this.measured); }
  }
}
