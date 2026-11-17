import type { AbilityId } from '../game/abilities/types';
import type { Snapshot } from '../game/systems/World';
import { FROST_NOVA, ARMAGEDDON } from '../game/config/mageAbilities';
import { MOBILITY_SPECIALIZATIONS as M } from '../game/config/mobilityUpgrades';
import { upgradeIdentity } from './upgradeIdentity';

export type UpgradeEmblem = AbilityId | 'ultimate-lightning' | 'ultimate-frost' | 'ultimate-fire' | 'ultimate-banner' | 'ultimate-earthbreaker' | 'ultimate-ruin' | 'projectiles' | 'damage' | 'cooldown' | 'health' | 'speed' | 'pickup' | 'area' | 'nova' | 'rune';
const general = {
  damage: ['+25%', 'ability damage', 'damage'], cooldown: ['−10%', 'cooldown', 'cooldown'],
  projectiles: ['+1', 'fireball', 'projectiles'], health: ['+20 HP', 'maximum health', 'health'],
  speed: ['+13.5', 'pixels per second', 'speed'], pickup: ['+20', 'pickup radius', 'pickup'],
  area: ['+15%', 'area magic radius', 'area'], restore: ['+40 HP', 'healing', 'health'],
  nova: ['120', 'area damage', 'nova'], magnet: ['All XP', 'collect crystals', 'pickup'],
} as const satisfies Record<string, readonly [string, string, UpgradeEmblem]>;
const familyNames: Record<AbilityId, string> = { fireball: 'Fire', frost: 'Frost Nova', lightning: 'Chain Lightning', meteor: 'Armageddon', shield: 'Arcane Shield', cleave: 'Cleave', whirlwind: 'Whirlwind', slam: 'Ground Stomp', blades: 'Piercing Throw', iron: 'Shield Block' };
const summaries: Record<AbilityId, string> = {
  fireball: 'Fire automatically finds the nearest enemy. Increase the power of your fireballs.',
  frost: 'An ice ring roots a group of enemies. Bosses and Guardians receive a limited slow.',
  lightning: 'Lightning jumps between distinct targets, striking a chain of enemies.',
  meteor: 'Meteors strike a dense group. Extra strikes deal 75% damage.',
  shield: 'The shield takes damage before HP. Recasting refreshes its strength without stacking.',
  cleave: 'A wide automatic strike against enemies near the Warrior.',
  whirlwind: 'A series of circular pulses against nearby enemies.',
  slam: 'Strikes a marked area after a short windup.',
  blades: 'The 28px hit width scales with area bonuses. The spear pierces 3–7 targets, hitting each once.',
  iron: 'Shield Block: −50% damage taken, projectile absorption and 20–40% maxHP Absorb without stacking.',
};
const evolution = {
  'evolve-fireball': ['45%', 'explosion on hit', 'The first fireball hit causes an explosion within 38px.'],
  'evolve-frost': ['+0.75s', 'next eligible root', 'Two hits empower the next eligible root. The active effect and immunity remain unchanged.'],
  'evolve-lightning': ['+2', 'secondary bolts', 'Secondary bolts hit new targets for 35% damage.'],
  'evolve-meteor': ['3s', 'fire after each strike', 'Each meteor leaves fire. Extra fire deals 75% damage.'],
  'evolve-shield': ['90px', 'defensive pulse', 'Breaking Absorb triggers one defensive pulse per shield activation.'],
} as const;
const rankBonuses: Record<AbilityId, (tier: number) => readonly [string, string]> = {
  fireball: () => ['+20%', 'base fire damage'], frost: t => [`${FROST_NOVA.root[t - 1] ?? 2}s`, 'root duration'],
  lightning: () => ['+1 target', 'and +9 damage'], meteor: t => [`${ARMAGEDDON.count[t - 1] ?? 3} strikes`, 'per cast'],
  shield: t => [`${10 + t * 5}%`, 'maxHP as Absorb'], cleave: () => ['+8', 'base damage'],
  whirlwind: () => ['+4', 'damage per pulse'], slam: () => ['+15', 'base damage'],
  blades: () => ['+12', 'spear damage and +1 target'], iron: () => ['+5% HP', 'Absorb and +0.5s block'],
};
export function upgradeCard(choice: Pick<Snapshot['choices'][number], 'id' | 'tier' | 'description'>) {
  if(choice.id.startsWith('ultimate-')) { return {...upgradeIdentity(choice.id),value:'10/10',caption:'first charge ready',icon:choice.id as UpgradeEmblem,label:'ULTIMATE',summary:choice.description}; }
  const { id, tier } = choice, identity = upgradeIdentity(id), rank = Math.max(0, Math.min(2, tier - 1));
  let value = 'Boost', caption = 'for this run', icon: UpgradeEmblem = 'rune', label = 'General bonus', summary = choice.description;
  if (Object.hasOwn(general, id)) [value, caption, icon] = general[id as keyof typeof general];
  if (identity.family !== 'general' && identity.family !== 'mobility') {
    icon = id === 'projectiles' ? 'projectiles' : identity.family; label = familyNames[identity.family];
    if (id !== 'projectiles') {
      summary = summaries[identity.family];
      if (Object.hasOwn(evolution, id)) { [value, caption, summary] = evolution[id as keyof typeof evolution]; label += ' · Evolution'; }
      else if (id.startsWith('rank-')) [value, caption] = rankBonuses[identity.family](tier);
      else { value = 'Unlock'; caption = 'new ability'; }
    }
  }
  if (identity.family === 'mobility') {
    label = 'Mobility specialization';
    const mobility: Record<string, readonly [string, string, UpgradeEmblem, string]> = {
      'mobility-flame-trail': [String(M.flameDamage[rank]), 'damage every 0.5s', 'fireball', 'Blink leaves a wall of fire along its actual path.'],
      'mobility-slowing-flame': ['−40%', 'regular enemy speed', 'frost', 'Cold fire remains along the Blink path. The slow does not stack.'],
      'mobility-arcane-sprint': [`+${Math.round((M.sprintSpeed[rank] - 1) * 100)}%`, 'speed after Blink', 'speed', 'A short 2s speed boost. Recasting refreshes the effect.'],
      'mobility-cleaving-dash': [String(M.cleaveDamage[rank]), 'damage along Dash path', 'cleave', 'Each target takes one hit along the actual Dash path.'],
      'mobility-absorb-shield': [`${M.absorbFraction[rank] * 100}%`, 'maxHP as Absorb', 'shield', 'Grants a shield for 3s after Dash. Recasting refreshes its strength without stacking.'],
      'mobility-berserk': [`+${Math.round((M.berserkDamage[rank] - 1) * 100)}%`, 'damage after Dash', 'damage', `For 2s: damage +${Math.round((M.berserkDamage[rank] - 1) * 100)}%, CDR ${Math.round((1 - M.berserkCooldown[rank]) * 100)}%, movement speed +${Math.round((M.berserkSpeed[rank] - 1) * 100)}%. CDR affects newly started cooldowns; another dash refreshes the effect without stacking.`],
    };
    [value, caption, icon, summary] = mobility[id] ?? [value, caption, icon, summary];
  }
  return { ...identity, value, caption, icon, label, summary };
}
