import type {World} from '../systems/World';
import {ultimateFrozen,unfrozenDelta} from '../systems/UltimateFreeze';
import type {SoundEvent} from './catalog';

interface Track {phase:string;magic:string;teleports:number;followup:boolean;orb:number;supportNext:number;shooting:number;clock:number;updated:number;melee:number}
// Read-only presentation observer: owner state transitions, never wall-clock timers.
export class MinibossAudio {
  private tracks=new Map<number,Track>();
  observe(w:World,add:(event:SoundEvent)=>void){
    const live=new Set<number>();
    if(w.status!=='playing')return;
    for(const e of w.enemies){
      if(e.hp<=0||!['sorcerer','eclipse','charger','guardian'].includes(e.kind)||e.finalRole==='boss')continue;
      live.add(e.id);
      const phase=e.boss?.phase??'',magic=e.boss?.magic?.phase??'',teleports=e.boss?.magic?.teleports??0;
      const orb=w.guardianSystem.encounters.get(e.id)?.orbIndex??0,supportNext=w.finalEncounter.supports.get(e.id)?.next??0;
      const followup=e.kind==='eclipse'&&e.shootingAt>w.elapsed;
      let t=this.tracks.get(e.id);
      if(!t){t={phase:'',magic:'',teleports,followup:false,orb,supportNext,shooting:e.shootingAt,clock:0,updated:w.elapsed,melee:0};this.tracks.set(e.id,t);}
      t.clock+=unfrozenDelta(e,w.elapsed,Math.max(0,w.elapsed-t.updated));t.updated=w.elapsed;
      if(ultimateFrozen(e,w.elapsed))continue;
      if(e.kind==='sorcerer'||e.kind==='eclipse'){
        if(phase==='windup'&&magic!=='signal'&&(t.phase!=='windup'||t.magic!==magic)||followup&&!t.followup)add(e.kind==='sorcerer'?'mini.runeCast':'mini.astralCast');
        if(teleports>t.teleports)add('mini.teleport');
      }else if(e.kind==='charger'){
        if(phase==='windup'&&t.phase!=='windup')add('mini.briarCharge');
        if(phase==='approach'&&Math.hypot(e.x-w.player.x,e.y-w.player.y)<e.radius+22&&t.clock>=t.melee){add('mini.briarMelee');t.melee=t.clock+1.2;}
      }else if(orb>t.orb||supportNext>t.supportNext&&e.shootingAt>t.shooting)add('mini.totemCast');
      Object.assign(t,{phase,magic,teleports,followup,orb,supportNext,shooting:e.shootingAt});
    }
    for(const id of this.tracks.keys())if(!live.has(id))this.tracks.delete(id);
  }
  get tracked(){return this.tracks.size;}
  clear(){this.tracks.clear();}
}
