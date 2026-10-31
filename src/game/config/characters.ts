export type CharacterId = 'mage' | 'warrior';
export const CHARACTERS = { mage: { name: 'Mage', hp: 100, speed: 135, armor: 0 }, warrior: { name: 'Warrior', hp: 150, speed: 118, armor: 0.18 } } as const;
