import { WARDEN,wardenTexture } from './ashWardenPack';
import { RUNE_WARDEN_TEXTURE, runeBodyFrame } from './runeWardenPack';
import { ARCANE_VOLLEY } from '../config/runeWarden';
import type { CharacterId } from '../config/characters';
import type { EnemyKind, RegularKind } from '../config/enemyDefinitions';
import type { AbilityId } from '../abilities/types';
import type { LootKind } from '../loot/types';
import { HD_CORE_TEXTURE } from './hdCoreLayout';
import { RUNNER_TEXTURE, RUNNER_CLIPS, runnerFrame, type RunnerPlayback } from './runnerPack';
import { MAGE_TEXTURE, MAGE_CLIPS, mageFrame } from './magePack';
import { MAGE_CAST_TEXTURE } from './mageCastingPack';
import { ENEMY_TEXTURE, ENEMY_CLIPS, isHdEnemy, packedEnemyFrame } from './enemyPack';
import { GUARDIAN_TEXTURE, guardianFrame } from './guardianPack';
import { BOSS_TEXTURE, BOSS_CLIPS, isHdBoss, bossFrame } from './bossPack';
import { LOOT_TEXTURE } from './lootPack';
import type { ArtifactId } from '../loot/ArtifactSystem';

export interface AssetSpec {
  status: 'hd-integrated' | 'legacy';
  category: 'actor' | 'pickup' | 'projectile' | 'effect' | 'terrain' | 'ui';
  source: { kind: 'atlas' | 'texture'; key: string; width: number; height: number } | { kind: 'graphics' | 'dom'; key: string };
  logicalSize: { width: number; height: number } | null;
  origin: { x: number; y: number };
  worldScale: number;
  clips: { idle: number; walk: number; hurt: number; death: number };
  adornment?: string;
  retainedReason?: string;
}
const origin = { x: 0.5, y: 0.5 }, single = { idle: 1, walk: 0, hurt: 0, death: 0 };
function hd(width: number, height: number, worldScale: number, category: AssetSpec['category'], clips = single): AssetSpec {
  return { status: 'hd-integrated', category, source: { kind: 'atlas', key: HD_CORE_TEXTURE, width: width * 4, height: height * 4 }, logicalSize: { width, height }, origin, worldScale, clips };
}
function drawn(key: string, category: AssetSpec['category'] = 'effect'): AssetSpec {
  return { status: 'legacy', category, source: { kind: category === 'ui' ? 'dom' : 'graphics', key }, logicalSize: null, origin, worldScale: 1, clips: { ...single } };
}
function packedActor(worldScale = 1) {
  return { ...hd(16, 16, worldScale, 'actor'), source: { kind: 'atlas' as const, key: ENEMY_TEXTURE, width: 64, height: 64 }, clips: { idle: ENEMY_CLIPS.idle.frames, walk: ENEMY_CLIPS.walk.frames, hurt: ENEMY_CLIPS.hurt.frames, death: ENEMY_CLIPS.death.frames } };
}
function runnerActor(worldScale = 1) { return { ...hd(16, 16, worldScale, 'actor'), source: { kind: 'atlas' as const, key: RUNNER_TEXTURE, width: 64, height: 64 }, clips: { idle: RUNNER_CLIPS.idle.frames, walk: RUNNER_CLIPS.walk.frames, hurt: RUNNER_CLIPS.hurt.frames, death: RUNNER_CLIPS.death.frames } }; }
function bossActor() { return { ...hd(32, 32, 1.8, 'actor'), source: { kind: 'atlas' as const, key: BOSS_TEXTURE, width: 128, height: 128 }, clips: { idle: BOSS_CLIPS.idle.frames, walk: BOSS_CLIPS.walk.frames, hurt: BOSS_CLIPS.hurt.frames, death: BOSS_CLIPS.death.frames } }; }
function lootAsset(size = 16, scale = 1): AssetSpec { return { ...hd(size, size, scale, 'pickup'), source: { kind: 'atlas', key: LOOT_TEXTURE, width: size === 6 ? 24 : 64, height: size === 6 ? 24 : 64 }, clips: { ...single, idle: 3 } }; }
// One catalog: integrated art and explicit legacy fallbacks. No gameplay radii.
export const ASSET_REGISTRY = {
  mage: { ...hd(16, 20, 1.5, 'actor'), source: { kind: 'atlas', key: MAGE_TEXTURE, width: 64, height: 80 }, origin: { x: 0.5, y: 0.75 }, clips: { idle: MAGE_CLIPS.idle.frames, walk: MAGE_CLIPS.walk.frames, hurt: MAGE_CLIPS.hurt.frames, death: MAGE_CLIPS.death.frames } },
  mageCasting: { ...hd(16,20,1.5,'effect'), source:{kind:'atlas',key:MAGE_CAST_TEXTURE,width:64,height:80},origin:{x:.5,y:.75},clips:{idle:3,walk:6,hurt:0,death:0} },
  warrior: { ...hd(16, 20, 1.5, 'actor', { idle: 2, walk: 4, hurt: 2, death: 0 }), origin: { x: 0.5, y: 0.75 } },
  grunt: hd(16, 16, 1, 'actor', { idle: 1, walk: 4, hurt: 0, death: 0 }),
  gruntElite: hd(16, 16, 1.4, 'actor', { idle: 1, walk: 4, hurt: 0, death: 0 }),
  runner: runnerActor(), runnerElite: { ...runnerActor(1.4), adornment: 'copper-crest' },
  tank: packedActor(1.6), caster: packedActor(),
  rusher: packedActor(), splitter: packedActor(),
  tankElite: { ...packedActor(1.6), adornment: 'quartz-mantle' }, casterElite: { ...packedActor(1.4), adornment: 'bone-crescent' },
  rusherElite: { ...packedActor(1.4), adornment: 'thorn-collar' }, splitterElite: { ...packedActor(1.4), adornment: 'gilded-seams' },
  guardian: { ...hd(24, 28, 1.4, 'actor', { idle: 3, walk: 0, hurt: 3, death: 6 }), source: { kind: 'atlas', key: GUARDIAN_TEXTURE, width: 96, height: 112 } },
  ashGuard: {...hd(192,192,.6548310811,'actor',{idle:4,walk:8,hurt:8,death:12}),source:{kind:'atlas',key:wardenTexture(0),width:192,height:192},origin:{x:.5,y:154/192}},
  charger: bossActor(), sorcerer: { ...bossActor(), source: {kind:'atlas',key:RUNE_WARDEN_TEXTURE,width:128,height:128}, clips:{idle:1,walk:12,hurt:0,death:0} }, eclipse: bossActor(),
  runeVolley: { ...hd(32,32,ARCANE_VOLLEY.displaySize/32,'projectile'), source:{kind:'atlas',key:RUNE_WARDEN_TEXTURE,width:128,height:128}, origin:{x:104/128,y:.5} },
  fireball: { ...hd(8, 8, 1, 'projectile'), source: { kind: 'atlas', key: MAGE_TEXTURE, width: 32, height: 32 }, clips: { ...single, idle: 4 } }, hostile: { ...hd(8, 8, 1, 'projectile'), source: { kind: 'atlas', key: BOSS_TEXTURE, width: 32, height: 32 }, clips: { ...single, idle: 4 } },
  xp: lootAsset(6), healing: lootAsset(), haste: lootAsset(), fury: lootAsset(), magnet: lootAsset(), chest: lootAsset(16, 1.25),
  artifactHealth: lootAsset(16, 1.15), artifactDamage: lootAsset(16, 1.15), artifactSpeed: lootAsset(16, 1.15), artifactCooldown: lootAsset(16, 1.15), artifactExperience: lootAsset(16, 1.15),
  shadow: hd(20, 8, 1, 'effect'), cleave: hd(48, 48, 1, 'effect', { idle: 4, walk: 0, hurt: 0, death: 0 }),
  grove: { ...hd(128, 128, 1, 'terrain'), source: { kind: 'texture', key: 'chunk-*', width: 256, height: 256 }, origin: { x: 0, y: 0 } },
  darkForest: { ...hd(128, 128, 1, 'terrain'), source: { kind: 'texture', key: 'chunk-*', width: 256, height: 256 }, origin: { x: 0, y: 0 } },
  frost: { ...drawn('MageMagic:frost'), status: 'hd-integrated' }, lightning: { ...drawn('MageMagic:lightning'), status: 'hd-integrated' }, meteor: { ...drawn('MageMagic:meteor'), status: 'hd-integrated' },
  shield: { ...drawn('MageMagic:shield'), status: 'hd-integrated' }, whirlwind: { ...drawn('WarriorMagic:whirlwind'), status: 'hd-integrated' }, slam: { ...drawn('WarriorMagic:slam'), status: 'hd-integrated' },
  blades: { ...drawn('WarriorMagic:blades'), status: 'hd-integrated' }, iron: { ...drawn('WarriorMagic:iron'), status: 'hd-integrated' }, hit: { ...drawn('CombatFeedback:hit'), status: 'hd-integrated' }, death: { ...drawn('CombatFeedback:death'), status: 'hd-integrated' },
  buffHaste: { ...drawn('LootPresentation:haste'), status: 'hd-integrated' }, buffFury: { ...drawn('LootPresentation:fury'), status: 'hd-integrated' },
  hostileImpact: { ...drawn('CombatFeedback:hostileImpact'), status: 'hd-integrated' },
  lootGlow: { ...drawn('LootPresentation:pickups'), status: 'hd-integrated' },
  guardianTell: { ...drawn('LootPresentation:guardian'), retainedReason: 'Exact runtime Guardian HP/seal geometry retained for threat readability; actor is hd-guardian.' },
  bossTell: { ...drawn('GameScene:boss'), retainedReason: 'Sorcerer/Eclipse rings and radii, modifier marks and offscreen pointers retained; Charger uses local windup sparks and actor flash without a path. Actors are hd-bosses.' },
  hud: { ...drawn('GameHUD/BossBars/GameRadar/BuffDock/RunArtifacts+hd-theme.css', 'ui'), status: 'hd-integrated' }, menu: { ...drawn('MainMenu/SettingsPanel+hd-theme.css', 'ui'), status: 'hd-integrated' },
  upgradeUI: { ...drawn('LevelUpModal+hd-theme.css', 'ui'), status: 'hd-integrated' }, deathUI: { ...drawn('RunStatistics/GameOver/LocalRecords+hd-theme.css', 'ui'), status: 'hd-integrated' },
} satisfies Record<string, AssetSpec>;
export type AssetId = keyof typeof ASSET_REGISTRY;
export const CHARACTER_ART: Record<CharacterId, AssetId> = { mage: 'mage', warrior: 'warrior' };
export const ENEMY_ART: Record<EnemyKind, AssetId> = { ashGuard:'ashGuard', grunt: 'grunt', runner: 'runner', tank: 'tank', caster: 'caster', rusher: 'rusher', splitter: 'splitter', guardian: 'guardian', charger: 'charger', sorcerer: 'sorcerer', eclipse: 'eclipse' };
export const ELITE_ART: Record<RegularKind, AssetId> = { grunt: 'gruntElite', runner: 'runnerElite', tank: 'tankElite', caster: 'casterElite', rusher: 'rusherElite', splitter: 'splitterElite' };
export const LOOT_ART: Record<LootKind, AssetId> = { healing: 'healing', haste: 'haste', fury: 'fury', magnet: 'magnet' };
export const ARTIFACT_ART: Record<ArtifactId, AssetId> = { health: 'artifactHealth', damage: 'artifactDamage', speed: 'artifactSpeed', cooldown: 'artifactCooldown', experience: 'artifactExperience' };
export const ABILITY_ART: Record<AbilityId, AssetId> = { fireball: 'fireball', frost: 'frost', lightning: 'lightning', meteor: 'meteor', shield: 'shield', cleave: 'cleave', whirlwind: 'whirlwind', slam: 'slam', blades: 'blades', iron: 'iron' };
export const REPLACED_LEGACY_TEXTURES: ReadonlySet<string> = new Set(['warrior', 'grunt', 'runner', 'mage', 'fireball', 'tank', 'caster', 'rusher', 'splitter', 'guardian', 'charger', 'sorcerer', 'eclipse', 'hostile', 'xp', 'loot-healing', 'loot-haste', 'loot-fury', 'loot-magnet', 'loot-chest', 'artifact']);
export type Facing = 'down' | 'up' | 'side';
export interface VisualSelection { asset: AssetId; texture: string; frame?: string; scale: number }
export function selectAsset(asset: AssetId, frame?: string, scale = ASSET_REGISTRY[asset].worldScale): VisualSelection { return { asset, texture: ASSET_REGISTRY[asset].source.key, frame, scale }; }
export function heroVisual(character: CharacterId, facing: Facing, moving: boolean, hurt: boolean, elapsed: number): VisualSelection {
  if (character === 'mage') return selectAsset('mage', mageFrame(facing, hurt ? 'hurt' : moving ? 'walk' : 'idle', elapsed));
  const pose = hurt ? 'hurt' : moving ? 'walk' : 'idle', clip = ASSET_REGISTRY.warrior.clips[pose], rate = pose === 'walk' ? 9 : pose === 'hurt' ? 12 : 2;
  return selectAsset('warrior', `warrior-${facing}-${pose}-${Math.floor(elapsed * rate) % clip}`);
}
export function enemyVisual(kind: EnemyKind, elite: boolean, elapsed: number, id: number, playback?: RunnerPlayback): VisualSelection {
  const asset = elite && kind !== 'ashGuard' && kind !== 'guardian' && kind !== 'charger' && kind !== 'sorcerer' && kind !== 'eclipse' ? ELITE_ART[kind] : ENEMY_ART[kind], spec = ASSET_REGISTRY[asset];
  if (kind === 'ashGuard') {const layer=WARDEN.clips['south-idle']!.frames[Math.floor(elapsed/.45)%4]!.layers[0]!;return{...selectAsset('ashGuard',layer.frame),texture:wardenTexture(WARDEN.locations[layer.frame]!)};}
  if (kind === 'grunt') return selectAsset(asset, `grunt-${elite ? 'elite' : 'normal'}-${Math.floor(elapsed * 7 + id) % 4}`);
  if (kind === 'runner') return selectAsset(asset, runnerFrame(playback?.pose ?? 'walk', playback?.facing ?? 'right', elapsed - (playback?.started ?? 0)), elite ? 1.4 : 1);
  if (kind === 'guardian') return selectAsset('guardian', guardianFrame('idle', elapsed));
  if (kind === 'sorcerer') return selectAsset('sorcerer',runeBodyFrame('right','idle',0));
  if (isHdBoss(kind)) return selectAsset(asset, bossFrame(kind, 'right', 'idle', elapsed));
  if (isHdEnemy(kind)) return selectAsset(asset, packedEnemyFrame(kind, 'right', 'walk', elapsed + id / 7), spec.worldScale === 1 && elite ? 1.4 : spec.worldScale);
  return { ...selectAsset(asset, undefined, spec.worldScale === 1 && elite ? 1.4 : spec.worldScale), texture: kind + (spec.clips.walk && Math.floor(elapsed * 5 + id) % 2 ? '-walk' : '') };
}
export function visualDimensions(selection: VisualSelection, multiplier = 1) {
  const size = ASSET_REGISTRY[selection.asset].logicalSize;
  if (!size) throw new Error(`Asset ${selection.asset} has no fixed world footprint`);
  return { width: size.width * selection.scale * multiplier, height: size.height * selection.scale * multiplier };
}
