import { ENEMIES, isBossKind, type EnemyKind } from '../config/enemyDefinitions';
import type { DamageSource } from '../entities/types';
export function emptyDamage(): Record<DamageSource, number> { return { fireball:0,frost:0,lightning:0,meteor:0,shield:0,cleave:0,whirlwind:0,slam:0,blades:0,iron:0,nova:0,unknown:0,mobility:0,'ultimate-lightning':0,'ultimate-frost':0,'ultimate-fire':0 }; }
export function emptyKillCounts(): Record<EnemyKind, number> { return { ashGuard: 0, guardian: 0, grunt: 0, runner: 0, tank: 0, caster: 0, rusher: 0, splitter: 0, charger: 0, sorcerer: 0, eclipse: 0 }; }
export class ScoreSystem {
  score = 0; kills = 0; byKind = emptyKillCounts();
  regularKills=0; eliteKills=0; bossKills=0; guardianKills=0; damage=emptyDamage();
  recordDamage(source: DamageSource, amount: number) { if(Number.isFinite(amount) && amount>0)this.damage[source]+=amount; }
  // Called only by the live->dead transition in World.damageEnemy, never by despawn.
  recordKill(kind: EnemyKind, elite: boolean) { this.score += ENEMIES[kind].score * (elite ? 3 : 1); this.kills++; this.byKind[kind]++; if(kind==='guardian')this.guardianKills++;else if(isBossKind(kind))this.bossKills++;else if(elite)this.eliteKills++;else this.regularKills++; }
}
