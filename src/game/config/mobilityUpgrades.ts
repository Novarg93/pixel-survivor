import type { CharacterId } from './characters';

export const MOBILITY_MAX_RANK = 3;
export const MOBILITY_FROST_SLOW = .35;
export const MOBILITY_UPGRADES = [
  { id: 'shockwave', character: 'mage', name: 'Shockwave', description: 'Blink: волна в точке прибытия. Ранги I–III: 36/48/60 урона, радиус 46/54/62px.' },
  { id: 'frost-blink', character: 'mage', name: 'Frost Blink', description: 'Blink: замедление на 65% вокруг прибытия на 1/1.4/1.8с. Радиус 46/54/62px.' },
  { id: 'arcane-sprint', character: 'mage', name: 'Arcane Sprint', description: 'После Blink: +20/30/40% скорости на 2с. Эффект обновляется, не складывается.' },
  { id: 'impact-dash', character: 'warrior', name: 'Impact Dash', description: 'В конце Dash: волна 36/48/60 урона, радиус 46/54/62px.' },
  { id: 'iron-charge', character: 'warrior', name: 'Iron Charge', description: 'В конце Dash: снижение урона на 20/30/40% в течение 1.2с.' },
  { id: 'battle-momentum', character: 'warrior', name: 'Battle Momentum', description: 'В конце Dash: следующий Cleave за 3с сильнее на 25/40/55%. Один усиленный удар.' },
] as const satisfies readonly { id: string; character: CharacterId; name: string; description: string }[];
export type MobilityVariant = typeof MOBILITY_UPGRADES[number]['id'];
