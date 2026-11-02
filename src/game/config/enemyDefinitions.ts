export const ENEMIES = {
  guardian: { hp: 5400, speed: 0, damage: 20, score: 500, xp: 40, radius: 17, color: 0xf2cb72 },
  grunt: { hp: 22, speed: 38, damage: 10, score: 10, xp: 5, radius: 10, color: 0x97b975 },
  runner: { hp: 16, speed: 68, damage: 8, score: 15, xp: 7, radius: 8, color: 0xd79b65 },
  tank: { hp: 105, speed: 27, damage: 18, score: 30, xp: 16, radius: 15, color: 0x8ba2a2 },
  caster: { hp: 42, speed: 32, damage: 12, score: 25, xp: 12, radius: 10, color: 0xb78fca },
  rusher: { hp: 50, speed: 43, damage: 14, score: 25, xp: 10, radius: 10, color: 0xe1a572 },
  splitter: { hp: 65, speed: 34, damage: 12, score: 35, xp: 14, radius: 12, color: 0x7fbdac },
  charger: { hp: 4500, speed: 24, damage: 28, score: 1000, xp: 100, radius: 23, color: 0xc27c5e },
  sorcerer: { hp: 5700, speed: 18, damage: 22, score: 1000, xp: 120, radius: 22, color: 0xa58bd3 },
  eclipse: { hp: 7200, speed: 26, damage: 24, score: 1500, xp: 150, radius: 24, color: 0x8bc4d5 },
} as const;
export type EnemyKind = keyof typeof ENEMIES;
export const ENEMY_NAMES: Record<EnemyKind, string> = { guardian: 'Редкий хранитель', grunt: 'Росток', runner: 'Бегун', tank: 'Каменный голем', caster: 'Рунный стрелок', rusher: 'Рывковик', splitter: 'Осколочник', charger: 'Терновый таран', eclipse: 'Хранитель затмения', sorcerer: 'Хранитель рун' };
export type BossKind = 'charger' | 'sorcerer' | 'eclipse';
export type RegularKind = Exclude<EnemyKind, BossKind | 'guardian'>;
export function isBossKind(kind: EnemyKind): kind is BossKind { return kind === 'charger' || kind === 'sorcerer' || kind === 'eclipse'; }
