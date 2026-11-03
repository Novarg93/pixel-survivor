import {bossAggressionAt} from './encounterDirector';
import type {EnemyKind} from './enemyDefinitions';
export const BOSS_BIRTHS=[
  {movement:1.10,frequency:1.15,projectiles:3},{movement:1.20,frequency:1.30,projectiles:4},
  {movement:1.30,frequency:1.45,projectiles:4},{movement:1.40,frequency:1.60,projectiles:5},
  {movement:1.50,frequency:1.75,projectiles:6},{movement:1.60,frequency:2.00,projectiles:7},
] as const;
export const BOSS_MAGIC={from:600,teleportSignal:.45,sorcererTell:.55,eclipseTell:.6,contactGrace:.15,initialTeleport:3,teleportCooldown:24,minTeleportCooldown:5.5,minRecovery:.55,minApproach:.7,ringMin:100,ringMax:180,landingGap:18,attempts:24} as const;
export const MAGIC_ATTACKS={sorcerer:{windup:1.1,recovery:1.8,cooldown:2.6,speed:105},eclipse:{windup:1.25,recovery:2,cooldown:3,stageCooldown:1.5,speed:95}} as const;
export function bossBirth(index:number){return BOSS_BIRTHS[Math.min(5,Math.max(0,Math.floor(index)-1))];}
export function bossBirthAggression(minute:number,kind:EnemyKind,index:number){
  const base=bossAggressionAt(minute);if(!index)return base;const extra=bossBirth(index);
  return{wave:base.wave,movement:Math.min(kind==='charger'?1.92:3.072,base.movement*extra.movement),frequency:Math.min(kind==='charger'?2.6:5.2,base.frequency*extra.frequency)};
}
