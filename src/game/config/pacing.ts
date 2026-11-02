import type { RegularKind } from './enemyDefinitions';

export interface SpawnProfile { from: number; name: string; interval: number; burst: number; cap: number; elite: number; weights: Partial<Record<RegularKind, number>> }
export const WAVES: readonly SpawnProfile[] = [
  { from: 0, name: 'Тихая поляна', interval: 1.5, burst: 1, cap: 35, elite: 0, weights: { grunt: 90, runner: 10 } },
  { from: 45, name: 'Шорох в траве', interval: .95, burst: 1, cap: 55, elite: 0, weights: { grunt: 65, runner: 35 } },
  { from: 60, name: 'Камни просыпаются', interval: .9, burst: 1, cap: 65, elite: 0, weights: { grunt: 80, runner: 17, tank: 3 } },
  { from: 120, name: 'Рунные дозорные', interval: .85, burst: 2, cap: 80, elite: .04, weights: { grunt: 45, runner: 30, tank: 13, caster: 12 } },
  { from: 180, name: 'Терновый вызов', interval: .85, burst: 2, cap: 90, elite: .06, weights: { grunt: 40, runner: 28, tank: 16, caster: 16 } },
  { from: 240, name: 'Прорыв из чащи', interval: .8, burst: 2, cap: 105, elite: .08, weights: { grunt: 35, runner: 25, tank: 15, caster: 17, rusher: 8 } },
  { from: 300, name: 'Осколочный рой', interval: .78, burst: 3, cap: 120, elite: .1, weights: { grunt: 30, runner: 24, tank: 14, caster: 14, rusher: 8, splitter: 10 } },
  { from: 360, name: 'Рунная осада', interval: .75, burst: 3, cap: 130, elite: .12, weights: { grunt: 23, runner: 23, tank: 16, caster: 20, rusher: 8, splitter: 10 } },
  { from: 420, name: 'Охота элит', interval: .7, burst: 3, cap: 140, elite: .16, weights: { grunt: 20, runner: 24, tank: 17, caster: 18, rusher: 11, splitter: 10 } },
  { from: 480, name: 'Сходятся угрозы', interval: .65, burst: 3, cap: 150, elite: .18, weights: { grunt: 18, runner: 22, tank: 18, caster: 20, rusher: 12, splitter: 10 } },
  { from: 540, name: 'Час затмения', interval: .62, burst: 3, cap: 150, elite: .2, weights: { grunt: 15, runner: 22, tank: 20, caster: 20, rusher: 12, splitter: 11 } },
  { from: 600, name: 'Survival Overdrive', interval: .6, burst: 3, cap: 150, elite: .22, weights: { grunt: 8, runner: 25, tank: 12, caster: 25, rusher: 20, splitter: 10 } },
  { from: 660, name: 'Перекрёстный огонь', interval: .6, burst: 3, cap: 150, elite: .23, weights: { grunt: 6, runner: 22, tank: 10, caster: 30, rusher: 20, splitter: 12 } },
  { from: 720, name: 'Бегущие руны', interval: .6, burst: 3, cap: 150, elite: .24, weights: { grunt: 5, runner: 30, tank: 8, caster: 22, rusher: 25, splitter: 10 } },
  { from: 840, name: 'Кольцо охоты', interval: .6, burst: 3, cap: 150, elite: .26, weights: { grunt: 5, runner: 24, tank: 12, caster: 25, rusher: 22, splitter: 12 } },
  { from: 960, name: 'Рунный натиск', interval: .6, burst: 3, cap: 150, elite: .28, weights: { grunt: 5, runner: 24, tank: 10, caster: 27, rusher: 22, splitter: 12 } },
  { from: 1200, name: 'Бесконечная чаща', interval: .5, burst: 4, cap: 150, elite: .28, weights: { grunt: 10, runner: 30, tank: 20, caster: 20, rusher: 10, splitter: 10 } },
];
export const SPEED_PACING = { perMinute: 1.05, cap: 2.25, runnerCap: 2.15, rusherCap: 2.2, maxSpeed: 128, runnerMaxSpeed: 148, rusherMaxSpeed: 138, lateFrom: 480, latePerMinute: .1, runnerLatePerMinute: .125 } as const;
export const BOSS_PACING = { firstAt: 180, interval: 180, catchUpGap: 45, guardianSafetyWindow: 25 } as const;
