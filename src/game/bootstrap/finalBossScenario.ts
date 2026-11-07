import type {World} from '../systems/World';
import {FINAL_BOSS as C} from '../config/finalBoss';
export type FinalScenario='before20'|'shield'|'breakShield'|'repeat'|'phase3'|'armageddon'|'death';
/** Called exclusively by the DEV + ?test=1 bridge; every run is excluded from records. */
export function finalBossScenario(w:World,action:FinalScenario){
  if(!import.meta.env.DEV)throw new Error('Development scenario unavailable');
  w.practice=true;
  const f=w.finalEncounter,e=f.boss;
  if(action==='before20'){if(f.phase!=='inactive')throw new Error('Requires fresh run');w.elapsed=C.at-.1;return;}
  if(!e)throw new Error('Boss has not spawned');
  if(action==='shield')w.damageEnemy(e,e.maxHp*10);
  if(action==='breakShield')for(const g of [...w.guardians])if(g.finalRole)w.damageEnemy(g,g.maxHp*10);
  if(action==='repeat'){if(f.phase!=='phase2')throw new Error('Requires open phase II');f.openTime=C.repeatAfter;}
  if(action==='phase3'){if(f.phase!=='phase2')throw new Error('Requires broken shield');w.damageEnemy(e,e.maxHp*10);}
  if(action==='armageddon'){if(f.phase!=='phase3')throw new Error('Requires phase III');f.nextVolley=f.clock;}
  if(action==='death'){if(f.phase!=='phase3'||f.pending)throw new Error('Requires active phase III');w.damageEnemy(e,e.maxHp*10);}
}
