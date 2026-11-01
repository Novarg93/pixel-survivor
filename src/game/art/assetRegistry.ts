import type { CharacterId } from '../config/characters';
import type { EnemyKind } from '../config/enemyDefinitions';
import type { AbilityId } from '../abilities/types';
import type { LootKind } from '../loot/types';
import { HD_CORE_TEXTURE } from './hdCoreLayout';

export interface AssetSpec {
  status: 'hd-integrated' | 'legacy';
  category: 'actor' | 'pickup' | 'projectile' | 'effect' | 'terrain' | 'ui';
  source: { kind: 'atlas' | 'texture'; key: string; width: number; height: number } | { kind: 'graphics' | 'dom'; key: string };
  logicalSize: { width: number; height: number } | null;
  origin: { x: number; y: number };
  worldScale: number;
  clips: { idle: number; walk: number; hurt: number; death: number };
}
const origin = { x: 0.5, y: 0.5 }, single = { idle: 1, walk: 0, hurt: 0, death: 0 };
function texture(key: string, width: number, height: number, worldScale = 1, category: AssetSpec['category'] = 'actor', walk = 2): AssetSpec {
  return { status: 'legacy', category, source: { kind: 'texture', key, width, height }, logicalSize: { width, height }, origin, worldScale, clips: { ...single, walk } };
}
function hd(width: number, height: number, worldScale: number, category: AssetSpec['category'], clips = single): AssetSpec {
  return { status: 'hd-integrated', category, source: { kind: 'atlas', key: HD_CORE_TEXTURE, width: width * 4, height: height * 4 }, logicalSize: { width, height }, origin, worldScale, clips };
}
function drawn(key: string, category: AssetSpec['category'] = 'effect'): AssetSpec {
  return { status: 'legacy', category, source: { kind: category === 'ui' ? 'dom' : 'graphics', key }, logicalSize: null, origin, worldScale: 1, clips: { ...single } };
}
// One catalog: integrated art and explicit legacy fallbacks. No gameplay radii.
export const ASSET_REGISTRY = {
  mage: { ...texture('mage', 16, 20, 1.5), origin: { x: 0.5, y: 0.75 }, clips: { idle: 1, walk: 2, hurt: 0, death: 0 } },
  warrior: { ...hd(16, 20, 1.5, 'actor', { idle: 2, walk: 4, hurt: 2, death: 0 }), origin: { x: 0.5, y: 0.75 } },
  grunt: hd(16, 16, 1, 'actor', { idle: 1, walk: 4, hurt: 0, death: 0 }),
  gruntElite: hd(16, 16, 1.4, 'actor', { idle: 1, walk: 4, hurt: 0, death: 0 }),
  runner: texture('runner', 16, 16), tank: texture('tank', 16, 16, 1.6), caster: texture('caster', 16, 16),
  rusher: texture('rusher', 16, 16), splitter: texture('splitter', 16, 16), guardian: texture('guardian', 24, 28, 1.4, 'actor', 0),
  charger: texture('charger', 32, 32, 1.8), sorcerer: texture('sorcerer', 32, 32, 1.8), eclipse: texture('eclipse', 32, 32, 1.8),
  fireball: texture('fireball', 8, 8, 1, 'projectile', 0), hostile: texture('hostile', 8, 8, 1, 'projectile', 0),
  xp: texture('xp', 6, 6, 1, 'pickup', 0), healing: texture('loot-healing', 16, 16, 1, 'pickup', 0),
  haste: texture('loot-haste', 16, 16, 1, 'pickup', 0), fury: texture('loot-fury', 16, 16, 1, 'pickup', 0), magnet: texture('loot-magnet', 16, 16, 1, 'pickup', 0),
  chest: texture('loot-chest', 16, 16, 1.25, 'pickup', 0), artifact: texture('artifact', 16, 16, 1.15, 'pickup', 0),
  shadow: hd(20, 8, 1, 'effect'), cleave: hd(48, 48, 1, 'effect', { idle: 4, walk: 0, hurt: 0, death: 0 }),
  grove: { ...texture('chunk-*', 128, 128, 1, 'terrain', 0), origin: { x: 0, y: 0 } },
  darkForest: { ...hd(128, 128, 1, 'terrain'), source: { kind: 'texture', key: 'chunk-*', width: 256, height: 256 }, origin: { x: 0, y: 0 } },
  frost: drawn('CombatFeedback:frost'), lightning: drawn('CombatFeedback:lightning'), meteor: drawn('CombatFeedback:meteor'),
  shield: drawn('GameScene:shield'), whirlwind: drawn('CombatFeedback:whirlwind'), slam: drawn('GameScene:impact'),
  blades: drawn('CombatFeedback:blades'), iron: drawn('CombatFeedback:iron'), hit: drawn('CombatFeedback:hit'), death: drawn('CombatFeedback:death'),
  buffHaste: drawn('LootPresentation:haste'), buffFury: drawn('LootPresentation:fury'),
  lootGlow: drawn('LootPresentation:pickups'), guardianTell: drawn('LootPresentation:guardian'), bossTell: drawn('GameScene:boss'),
  hud: drawn('GameHUD/BossBars/GameRadar/BuffDock/RunArtifacts', 'ui'), menu: drawn('MainMenu/SettingsPanel', 'ui'),
  upgradeUI: drawn('LevelUpModal', 'ui'), deathUI: drawn('RunStatistics/GameOver/LocalRecords', 'ui'),
} satisfies Record<string, AssetSpec>;
export type AssetId = keyof typeof ASSET_REGISTRY;
export const CHARACTER_ART: Record<CharacterId, AssetId> = { mage: 'mage', warrior: 'warrior' };
export const ENEMY_ART: Record<EnemyKind, AssetId> = { grunt: 'grunt', runner: 'runner', tank: 'tank', caster: 'caster', rusher: 'rusher', splitter: 'splitter', guardian: 'guardian', charger: 'charger', sorcerer: 'sorcerer', eclipse: 'eclipse' };
export const LOOT_ART: Record<LootKind, AssetId> = { healing: 'healing', haste: 'haste', fury: 'fury', magnet: 'magnet' };
export const ABILITY_ART: Record<AbilityId, AssetId> = { fireball: 'fireball', frost: 'frost', lightning: 'lightning', meteor: 'meteor', shield: 'shield', cleave: 'cleave', whirlwind: 'whirlwind', slam: 'slam', blades: 'blades', iron: 'iron' };
export const REPLACED_LEGACY_TEXTURES: ReadonlySet<string> = new Set(['warrior', 'grunt']);
export type Facing = 'down' | 'up' | 'side';
export interface VisualSelection { asset: AssetId; texture: string; frame?: string; scale: number }
export function selectAsset(asset: AssetId, frame?: string, scale = ASSET_REGISTRY[asset].worldScale): VisualSelection { return { asset, texture: ASSET_REGISTRY[asset].source.key, frame, scale }; }
export function heroVisual(character: CharacterId, facing: Facing, moving: boolean, hurt: boolean, elapsed: number): VisualSelection {
  if (character === 'mage') return { ...selectAsset('mage'), texture: `mage-${facing}-${moving ? 1 + Math.floor(elapsed * 7) % 2 : 0}` };
  const pose = hurt ? 'hurt' : moving ? 'walk' : 'idle', clip = ASSET_REGISTRY.warrior.clips[pose], rate = pose === 'walk' ? 9 : pose === 'hurt' ? 12 : 2;
  return selectAsset('warrior', `warrior-${facing}-${pose}-${Math.floor(elapsed * rate) % clip}`);
}
export function enemyVisual(kind: EnemyKind, elite: boolean, elapsed: number, id: number): VisualSelection {
  const asset = kind === 'grunt' && elite ? 'gruntElite' : ENEMY_ART[kind], spec = ASSET_REGISTRY[asset];
  if (kind === 'grunt') return selectAsset(asset, `grunt-${elite ? 'elite' : 'normal'}-${Math.floor(elapsed * 7 + id) % 4}`);
  return { ...selectAsset(asset, undefined, spec.worldScale === 1 && elite ? 1.4 : spec.worldScale), texture: kind + (spec.clips.walk && Math.floor(elapsed * 5 + id) % 2 ? '-walk' : '') };
}
export function visualDimensions(selection: VisualSelection, multiplier = 1) {
  const size = ASSET_REGISTRY[selection.asset].logicalSize;
  if (!size) throw new Error(`Asset ${selection.asset} has no fixed world footprint`);
  return { width: size.width * selection.scale * multiplier, height: size.height * selection.scale * multiplier };
}
