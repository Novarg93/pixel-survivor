import type { AbilityDefinition, AbilityId, AbilityState } from './types';
import type { CharacterId } from '../config/characters';
import { FROST_NOVA, ARMAGEDDON } from '../config/mageAbilities';
export const ABILITIES: AbilityDefinition[] = [
  { id: 'fireball', name: 'Fireball', cooldown: 0.8, color: 0xfba35e, icon: '✦' },
  { id: 'frost', name: 'Frost Nova', cooldown: FROST_NOVA.cooldown, color: 0x91e4dc, icon: '❄', description: 'An ice ring targets a dense group within 310px and the screen. The 1.2s root does not stop ranged attacks; targets gain 2s root immunity afterward. Bosses and Guardians receive a limited slow.' },
  { id: 'lightning', name: 'Chain Lightning', cooldown: 3.4, color: 0xdab5ff, icon: 'ϟ' },
  { id: 'meteor', name: 'Armageddon', cooldown: ARMAGEDDON.cooldown, color: 0xffc078, icon: '☄', description: `Automatically targets a dense group within 310px and the screen. Lands after ${ARMAGEDDON.delay.toFixed(2)}s; ranks III/V add 2/3 strikes at 0.15s intervals.` },
  { id: 'shield', name: 'Arcane Shield', cooldown: 12, color: 0xa5c4ff, icon: '◇', description:'Absorbs 15/20/25/30/35% maxHP for 6–10s. Excess damage reaches HP. Recasting replaces the remaining shield without stacking.' },
  { id: 'cleave', name: 'Cleave', cooldown: 0.85, color: 0xf4d2a0, icon: '⚔', character: 'warrior', description: 'Automatically sweeps nearby enemies with a wide strike.' },
  { id: 'whirlwind', name: 'Whirlwind', cooldown: 3.6, color: 0xd7e8bd, icon: '◎', character: 'warrior', description: 'A series of circular strikes over 1.2s.' },
  { id: 'slam', name: 'Ground Stomp', cooldown: 4.8, color: 0xe5c48a, icon: '⌁', character: 'warrior', description: 'A marked area strike after a 0.65s delay.' },
  { id: 'blades', name: 'Piercing Throw', cooldown: 6.6, color: 0xc4e2ec, icon: '➶', character: 'warrior', description: 'A spear travels up to 360px with a 28px hit width, increased by area bonuses. Pierces 3–7 targets, hitting each once.' },
  { id: 'iron', name: 'Shield Block', cooldown: 11, color: 0xacb8cb, icon: '▣', character: 'warrior', description: 'Reduces damage by 50%, absorbs enemy projectiles and grants Absorb equal to 20–40% maxHP while blocking. Recasting refreshes the shield without stacking.' },
];
export function abilitiesFor(character: CharacterId) { return ABILITIES.filter(a => (a.character ?? 'mage') === character); }
export function initialAbilities(character: CharacterId = 'mage'): Record<AbilityId, AbilityState> {
  return { fireball: { level: character === 'mage' ? 1 : 0, readyAt: 0 }, frost: { level: 0, readyAt: 0 }, lightning: { level: 0, readyAt: 0 }, meteor: { level: 0, readyAt: 0 }, shield: { level: 0, readyAt: 0 }, cleave: { level: character === 'warrior' ? 1 : 0, readyAt: 0 }, whirlwind: { level: 0, readyAt: 0 }, slam: { level: 0, readyAt: 0 }, blades: { level: 0, readyAt: 0 }, iron: { level: 0, readyAt: 0 } };
}
