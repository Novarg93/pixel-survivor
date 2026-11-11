import type {World} from '../systems/World';
import {ultimateFrozen} from '../systems/UltimateFreeze';
import type {MinibossAmbienceId} from './samples';
export type MinibossAmbienceLevels=Record<MinibossAmbienceId,number>;
export const SILENT_MINIBOSSES:MinibossAmbienceLevels={'beast-walking':0,'rune-presence':0};
const proximity=(distance:number,far:number,floor=0)=>floor+(1-floor)*Math.max(0,Math.min(1,(far-distance)/(far-220)));
// At most one loop per kind, even when several bosses of that kind are alive.
export class MinibossAmbience {
  private run='';private positions=new Map<number,{x:number;y:number;at:number;moving:boolean}>();
  levels(w:World):MinibossAmbienceLevels{
    if(this.run!==w.runId){this.clear();this.run=w.runId;}
    const levels={...SILENT_MINIBOSSES},live=new Set<number>();
    if(w.status!=='playing')return levels;
    for(const e of w.enemies){
      if(e.hp<=0||!e.boss||e.kind!=='charger'&&e.kind!=='sorcerer')continue;
      const d=Math.hypot(e.x-w.player.x,e.y-w.player.y),frozen=ultimateFrozen(e,w.elapsed);
      if(e.kind==='sorcerer'){
        if(!frozen)levels['rune-presence']=Math.max(levels['rune-presence'],.14*proximity(d,800,.35));
      }else{
        live.add(e.id);const last=this.positions.get(e.id),moving=last?.at===w.elapsed?last.moving:!!last&&Math.hypot(e.x-last.x,e.y-last.y)>.0001;
        this.positions.set(e.id,{x:e.x,y:e.y,at:w.elapsed,moving});
        if(!frozen&&moving&&e.boss.phase==='approach')levels['beast-walking']=Math.max(levels['beast-walking'],.12*proximity(d,760));
      }
    }
    for(const id of this.positions.keys())if(!live.has(id))this.positions.delete(id);
    return levels;
  }
  get tracked(){return this.positions.size;}
  clear(){this.positions.clear();}
}
