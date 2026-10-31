import type { RegularKind } from '../config/enemyDefinitions';
import type { SeededRandom } from '../utils/SeededRandom';
export interface SpawnProfile { from: number; name: string; interval: number; burst: number; cap: number; elite: number; weights: Partial<Record<RegularKind, number>> }
export const WAVES: SpawnProfile[] = [
  { from: 0, name: 'Тихая поляна', interval: 1.5, burst: 1, cap: 35, elite: 0, weights: { grunt: 90, runner: 10 } },
  { from: 45, name: 'Шорох в траве', interval: 0.95, burst: 1, cap: 55, elite: 0, weights: { grunt: 65, runner: 35 } },
  { from: 180, name: 'Пробуждение рощи', interval: 0.85, burst: 2, cap: 85, elite: 0.05, weights: { grunt: 40, runner: 25, tank: 15, caster: 10, rusher: 5, splitter: 5 } },
  { from: 480, name: 'Рунная буря', interval: 0.7, burst: 3, cap: 120, elite: 0.12, weights: { grunt: 20, runner: 30, tank: 15, caster: 15, rusher: 10, splitter: 10 } },
  { from: 900, name: 'Ночь осколков', interval: 0.6, burst: 3, cap: 150, elite: 0.2, weights: { grunt: 15, runner: 30, tank: 15, caster: 20, rusher: 10, splitter: 10 } },
  { from: 1200, name: 'Бесконечная чаща', interval: 0.5, burst: 4, cap: 150, elite: 0.28, weights: { grunt: 10, runner: 30, tank: 20, caster: 20, rusher: 10, splitter: 10 } },
];
export function profileAt(seconds: number) { return [...WAVES].reverse().find(p => seconds >= p.from) ?? WAVES[0]; }
export function pickEnemy(profile: SpawnProfile, rng: SeededRandom): RegularKind {
  const entries = Object.entries(profile.weights) as [RegularKind, number][]; let roll = rng.next() * entries.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [kind, weight] of entries) { roll -= weight; if (roll < 0) return kind; } return 'grunt';
}
export function scalesAt(seconds: number) { return { hp: 1 + Math.min(3, seconds / 600) * 0.45, damage: 1 + Math.min(2, seconds / 900) * 0.3 }; }
