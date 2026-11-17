import { ultimateDefinitions, isUltimateId } from '../config/ultimates';
import type { World } from './World';
import { ABILITIES } from '../abilities/definitions';
import { distance } from '../utils/math';
import { MOBILITY_MAX_RANK, MOBILITY_SPECIALIZATION_LEVEL, MOBILITY_UPGRADES } from '../config/mobilityUpgrades';
const RANK_TEXT = {
  fireball: '+20% base fire damage. V + Ember Heat III: an extra piercing fireball.',
  frost: 'I: 1.2s root. II: +20% radius. III: −15% base cooldown. IV: 1.7s root. V: 2s root and another +20% radius. +6 damage per rank; V + Wide Circle III retains +30% damage.',
  lightning: '+9 damage and +1 chain target (up to 7 targets).',
  meteor: '+25 damage and +7px radius. I–V: 1/1/2/2/3 meteors. Interval 0.15s; extra strikes deal 75% damage. Equally dense groups prioritize rooted targets.',
  shield: 'Absorb I–V: 15/20/25/30/35% maxHP. +1s duration per rank. Recasting refreshes the shield without stacking.',
  cleave: '+8 base damage to the wide strike.',
  whirlwind: '+4 damage to each circular pulse.',
  slam: '+15 damage and +5px strike radius.',
  blades: '+12 spear damage and +1 pierced target (up to 7 targets).',
  iron: '+5% maxHP Absorb and +0.5s Shield Block duration. Recasting refreshes the shield.',
};
export interface UpgradeDefinition { id: string; name: string; description: string; max: number; apply: (world: World) => void; eligible?: (world: World) => boolean }
export const UPGRADES: UpgradeDefinition[] = [
  ...MOBILITY_UPGRADES.map(u => ({ id: `mobility-${u.id}`, name: u.name, description: u.description + ' One specialization per run.', max: MOBILITY_MAX_RANK, eligible: (w: World) => (w.status === 'playing' || w.status === 'upgrade') && w.character === u.character && w.experience.level >= MOBILITY_SPECIALIZATION_LEVEL && (w.mobility.variant ? w.mobility.variant === u.id : w.upgradeLevel >= MOBILITY_SPECIALIZATION_LEVEL) && w.mobility.rank < MOBILITY_MAX_RANK, apply: (w: World) => { w.mobility.upgrade(w, u.id); } })),
  { id: 'damage', name: 'Ember Heat', description: '+25% ability damage.', max: 5, apply: w => { w.stats.damage += 0.25; } },
  { id: 'cooldown', name: 'Swift Ritual', description: 'Abilities recharge 10% faster.', max: 5, apply: w => { w.stats.cooldown *= 0.9; } },
  { id: 'projectiles', name: 'Double Spark', description: '+1 fireball per attack (up to 4).', max: 3, apply: w => { w.stats.projectiles++; } },
  { id: 'speed', name: 'Light Step', description: '+13.5px/s movement speed.', max: 4, apply: w => { w.player.speed += 13.5; } },
  { id: 'health', name: 'Root Strength', description: '+20 maximum health and heal 30 HP.', max: 5, apply: w => { w.player.maxHp += 20; w.player.hp = Math.min(w.effectiveMaxHp, w.player.hp + 30); } },
  { id: 'pickup', name: 'Attraction', description: '+20 crystal pickup radius.', max: 5, apply: w => { w.stats.pickup += 20; } },
  { id: 'area', name: 'Wide Circle', description: '+15% area magic radius.', max: 4, apply: w => { w.stats.area += 0.15; } },
  ...ABILITIES.filter(a => a.id !== 'fireball' && a.id !== 'cleave').map(a => ({ id: `unlock-${a.id}`, name: a.name, description: a.description ?? `Unlock: ${a.id === 'lightning' ? 'lightning jumps between enemies' : 'a periodic shield absorbs hits'}.`, max: 1, eligible: (w: World) => w.abilityDefinitions.includes(a) && w.abilities[a.id].level === 0, apply: (w: World) => { w.abilities[a.id].level = 1; } })),
  ...ABILITIES.map(a => ({ id: `rank-${a.id}`, name: `${a.name} +`, description: RANK_TEXT[a.id], max: 4, eligible: (w: World) => w.abilityDefinitions.includes(a) && w.abilities[a.id].level > 0 && w.abilities[a.id].level < 5, apply: (w: World) => { w.abilities[a.id].level++; } })),
  ...ABILITIES.filter(a => !a.character).map(a => ({ id: `evolve-${a.id}`, name: `${a.name}: evolution`, description: ({ fireball: 'The first fireball hit explodes for 45% damage within 38px.', frost: 'Two hits within 4s add 0.75s to the next eligible root, at most once every 6s. Does not extend an active root or bypass subsequent immunity.', lightning: 'Two secondary bolts hit new targets for 35% damage.', meteor: 'Each strike leaves fire for 3s, ticking every 0.5s. Fire from extra meteors also deals 75% damage.', shield: 'Breaking Absorb triggers one 90px defensive pulse per shield activation.' })[a.id as 'fireball' | 'frost' | 'lightning' | 'meteor' | 'shield'], max: 1, eligible: (w: World) => w.abilityDefinitions.includes(a) && w.abilities[a.id].level >= 3, apply: () => undefined })),
];
export const SUPPLIES: UpgradeDefinition[] = [
  { id: 'restore', name: 'Sip of Life', description: 'Restore 40 HP.', max: Infinity, apply: w => { w.player.hp = Math.min(w.effectiveMaxHp, w.player.hp + 40); } },
  { id: 'nova', name: 'Flash', description: '120 damage to all enemies within 150px.', max: Infinity, apply: w => { for (const e of [...w.enemies]) if (distance(w.player, e) <= 150 + e.radius) w.damageEnemy(e, 120, 'nova'); w.effect('death', w.player, 150, 0xdabaff); } },
  { id: 'magnet', name: 'Crystal Call', description: 'Collect all crystals on the field.', max: Infinity, apply: w => { w.collectAllOrbs(); } },
];
export function eligibleUpgrades(w: World) { return UPGRADES.filter(u => (u.id !== 'projectiles' || w.character === 'mage') && (w.upgrades[u.id] ?? 0) < u.max && (!u.eligible || u.eligible(w))); }
export function upgradePool(w: World): UpgradeDefinition[] {
  const ultimates = w.ultimate.eligible(w) ? ultimateDefinitions(w.character).map(d => ({id: `ultimate-${d.id}`, name:d.name, description:d.description, max:1, apply:()=>undefined})) : [];
  if (ultimates.length >= 3) return ultimates;
  const eligible = eligibleUpgrades(w);
  if (!ultimates.length && !w.mobility.variant && w.upgradeLevel >= MOBILITY_SPECIALIZATION_LEVEL) return eligible.filter(u => u.id.startsWith('mobility-'));
  return [...ultimates, ...eligible, ...(eligible.length < 3 ? SUPPLIES : [])];
}
export function chooseUpgrades(w: World) {
  const pool = upgradePool(w), result: UpgradeDefinition[] = [];
  if(pool.every(u=>u.id.startsWith('ultimate-')) || !w.mobility.variant && w.upgradeLevel >= MOBILITY_SPECIALIZATION_LEVEL && pool.every(u=>u.id.startsWith('mobility-'))) return pool;
  while (result.length < 3 && pool.length) result.push(pool.splice(w.rng.int(pool.length), 1)[0]);
  return result;
}
export function applyUpgrade(w: World, id: string) {
  const ultimate = id.slice('ultimate-'.length);
  if(id.startsWith('ultimate-') && isUltimateId(ultimate)) return w.ultimate.choose(w,ultimate);
  const upgrade = [...UPGRADES, ...SUPPLIES].find(u => u.id === id);
  if (!upgrade || (w.upgrades[id] ?? 0) >= upgrade.max || (upgrade.eligible && !upgrade.eligible(w))) return false;
  upgrade.apply(w); w.upgrades[id] = (w.upgrades[id] ?? 0) + 1; return true;
}
