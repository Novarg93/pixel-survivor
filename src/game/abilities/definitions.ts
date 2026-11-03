import type { AbilityDefinition, AbilityId, AbilityState } from './types';
import type { CharacterId } from '../config/characters';
import { FROST_NOVA, ARMAGEDDON } from '../config/mageAbilities';
export const ABILITIES: AbilityDefinition[] = [
  { id: 'fireball', name: 'Огненный шар', cooldown: 0.8, color: 0xfba35e, icon: '✦' },
  { id: 'frost', name: 'Морозная нова', cooldown: FROST_NOVA.cooldown, color: 0x91e4dc, icon: '❄', description: 'Ледяное кольцо по плотной группе в пределах 310px и экрана. Root 1.2с не мешает стрелкам атаковать; после root иммунитет 2с. Боссы и Guardian: ограниченный slow.' },
  { id: 'lightning', name: 'Цепная молния', cooldown: 3.4, color: 0xdab5ff, icon: 'ϟ' },
  { id: 'meteor', name: 'Армагеддон', cooldown: ARMAGEDDON.cooldown, color: 0xffc078, icon: '☄', description: 'Автоматический метеор по плотной группе в пределах 310px и экрана. Падение через 0.85с; на III/V рангах 2/3 удара с интервалом 0.15с.' },
  { id: 'shield', name: 'Тайный щит', cooldown: 12, color: 0xa5c4ff, icon: '◇', description:'Absorb 15/20/25/30/35% maxHP на 6–10с. Излишек урона проходит в HP. Повторное применение заменяет остаток, не складывает щиты.' },
  { id: 'cleave', name: 'Cleave', cooldown: 0.85, color: 0xf4d2a0, icon: '⚔', character: 'warrior', description: 'Автоматический широкий удар по ближайшим врагам.' },
  { id: 'whirlwind', name: 'Whirlwind', cooldown: 3.6, color: 0xd7e8bd, icon: '◎', character: 'warrior', description: 'Серия круговых ударов в течение 1.2с.' },
  { id: 'slam', name: 'Ground Slam', cooldown: 4.8, color: 0xe5c48a, icon: '⌁', character: 'warrior', description: 'Размеченный удар по области после задержки 0.65с.' },
  { id: 'blades', name: 'Bladestorm', cooldown: 6.6, color: 0xc4e2ec, icon: '✧', character: 'warrior', description: 'Клинки вращаются вокруг героя и поражают при касании.' },
  { id: 'iron', name: 'Iron Skin', cooldown: 11, color: 0xacb8cb, icon: '▣', character: 'warrior', description: 'На время уменьшает получаемый урон на 50%.' },
];
export function abilitiesFor(character: CharacterId) { return ABILITIES.filter(a => (a.character ?? 'mage') === character); }
export function initialAbilities(character: CharacterId = 'mage'): Record<AbilityId, AbilityState> {
  return { fireball: { level: character === 'mage' ? 1 : 0, readyAt: 0 }, frost: { level: 0, readyAt: 0 }, lightning: { level: 0, readyAt: 0 }, meteor: { level: 0, readyAt: 0 }, shield: { level: 0, readyAt: 0 }, cleave: { level: character === 'warrior' ? 1 : 0, readyAt: 0 }, whirlwind: { level: 0, readyAt: 0 }, slam: { level: 0, readyAt: 0 }, blades: { level: 0, readyAt: 0 }, iron: { level: 0, readyAt: 0 } };
}
