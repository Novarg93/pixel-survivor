import type { ScheduledBossKind as BossKind } from './enemyDefinitions';
import { enrageAt, SURVIVAL_ENRAGE as E } from './survivalEnrage';
export const ENCOUNTER_DIRECTOR = {
  firstMinute: 3, interval: 60, historyCap: 32, noticeDuration: 5,
  bossCap: 3, guardianCap: 3, safeGuardianRadius: 240, guardianSeparation: 160,
  activationRadius: 64, guardianStagger: .65, reliefDuration: 8, reliefSpawnFactor: .75,
} as const;
export interface EncounterPlan { minute: number; bosses: readonly BossKind[]; guardians: number; label: string }
const ALL_BOSSES = ['charger', 'sorcerer', 'eclipse'] as const;
export function encounterPlan(minute: number): EncounterPlan {
  const tick=enrageAt(minute*60).tick;
  const bosses: readonly BossKind[] = minute>=15 ? Array.from({length:3},(_,i)=>ALL_BOSSES[(tick+i)%3]) : minute>=10 ? tick>0?[ALL_BOSSES[(tick-1)%ALL_BOSSES.length]]:[] : minute === 3 ? ['charger'] : minute === 5 ? ['sorcerer'] : minute === 7 ? ['charger', 'eclipse'] : minute >= 9 ? ALL_BOSSES : [];
  const guardians = minute === 4 || minute === 6 ? 1 : minute === 8 ? 2 : minute > 10&&Number.isInteger(minute) ? 3 : 0;
  return { minute, bosses, guardians, label: minute===10?'Survival Enrage':minute > 10 ? 'Endgame Encounter' : bosses.length > 1 ? 'Multi-Boss Encounter' : bosses.length ? 'Boss Encounter' : 'Guardian Encounter' };
}
export function bossAggressionAt(minute: number) {
  const wave = minute >= 10 ? 5 : minute >= 9 ? 4 : minute >= 7 ? 3 : minute >= 5 ? 2 : 1;
  const enrage=enrageAt(minute*60);
  return { wave, movement: (1 + (wave - 1) * .15)*Math.min(E.bossMovementCap,enrage.speed), frequency: (1 + (wave - 1) * .25)*Math.min(E.bossFrequencyCap,enrage.attack) };
}
