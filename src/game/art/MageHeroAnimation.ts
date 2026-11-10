import type {World} from '../systems/World';
import type {MageCastingController,MageGesture} from './MageCastingController';
import {ULTIMATE} from '../config/ultimates';
import type {MageLocomotion} from './MageRunAnimation';
import {MageRunningAnimation} from './MageRunningAnimation';
import {isMagePhantomSpell,type MagePhantomPose} from './magePhantomPack';
import {MAGE_RUN_V2} from './mageRunPackV2';
import {mageCastFamily} from './mageCastPackV2';
export type {MageLocomotion} from './MageRunAnimation';

export const MAGE_DIRECTIONS=['south','south-east','east','north-east','north','north-west','west','south-west'] as const;
export type MageDirection=typeof MAGE_DIRECTIONS[number];
export type MageMotion='idle'|'walk'|'run-start'|'run'|'run-stop'|'fireball'|'lightning'|'meteor'|'defensive'|'death';
type CastView=ReturnType<MageCastingController['view']>;
export interface MageHeroPose {motion:MageMotion;direction:MageDirection;age:number;progress?:number;casting:boolean;locomotion?:MageLocomotion;walk?:{direction:MageDirection;age:number};stopFrame?:string;phantom?:MagePhantomPose;bodyDirection?:MageDirection;castAbility?:MageGesture;castVariant?:1|2;castDuration?:number}
export function mageDirection(x:number,y:number,fallback:MageDirection='south'):MageDirection{
  if(!x&&!y)return fallback;
  const clockwise=['east','south-east','south','south-west','west','north-west','north','north-east'] as const;
  return clockwise[(Math.round(Math.atan2(y,x)/(Math.PI/4))+8)%8]!;
}
export function mageCastMotion(ability:MageGesture):MageMotion{
  if(ability==='blink'||ability==='shield'||ability==='frost'||ability==='ultimate-frost'||ability==='ultimate-fire')return 'defensive';
  return ability==='ultimate-lightning'?'lightning':ability;
}

// Presentation clock only. The simulation still owns speed, auto-cast timing,
// Blink and ultimate movement locks. Pause cannot advance a stride or gesture.
export class MageHeroAnimation{
  private run='';
  private x=0;private y=0;private elapsed=0;
  private direction:MageDirection='south';
  private locomotion=new MageRunningAnimation();
  // Retain the shared distance clock for moving-cast diagnostics.
  private walking?:{direction:MageDirection;age:number};
  private gestures=new Map<string,{direction:MageDirection;variant:1|2}>();
  private variants={south:0,east:0};
  clear(){this.run='';this.direction='south';this.locomotion.clear();this.walking=undefined;this.gestures.clear();this.variants={south:0,east:0};}
  view(w:World,cast:CastView,moving:boolean,deathAge:number):MageHeroPose{
    if(this.run!==w.runId){this.clear();this.run=w.runId;this.x=w.player.x;this.y=w.player.y;this.elapsed=w.elapsed;}
    const dt=Math.max(0,w.elapsed-this.elapsed),distance=Math.hypot(w.player.x-this.x,w.player.y-this.y);
    if(w.status==='playing'){
      if(moving)this.direction=mageDirection(w.facing.x,w.facing.y,this.direction);
      if(w.ultimate.casting){this.locomotion.clear();this.walking=undefined;}
      else{
        const travel=Math.min(distance,dt*w.effectiveSpeed*1.5);
        this.locomotion.view(dt,travel,this.direction,moving);
        this.walking=moving?{direction:this.direction,age:(this.walking?.age??0)+travel/MAGE_RUN_V2.referenceSpeed}:undefined;
      }
    }
    this.x=w.player.x;this.y=w.player.y;this.elapsed=w.elapsed;
    if(w.status==='over'&&w.outcome!=='victory'){this.locomotion.clear();this.walking=undefined;return {motion:'death',direction:this.direction,age:deathAge,casting:false};}
    if(w.status==='menu'){this.locomotion.clear();this.walking=undefined;return {motion:'idle',direction:'south',age:w.elapsed,casting:false};}
    const locomotion=this.locomotion.current();
    // Direct shots use the immediate shared projection channel; an old body
    // queue entry must not replay a phantom after its projectile has already left.
    const a=cast.directional??(cast.active&&!isMagePhantomSpell(cast.active.ability)?cast.active:undefined);
    const live=new Set([cast.active,cast.directional].flatMap(g=>g?[g.ability+':'+g.started]:[]));
    for(const key of this.gestures.keys())if(!live.has(key))this.gestures.delete(key);
    if(a&&cast.mode==='cast'){
      const from=a.origin??w.player;
      const targetDirection=mageDirection(a.target.x-from.x,a.target.y-from.y,mageDirection(w.facing.x,w.facing.y,this.direction));
      const key=a.ability+':'+a.started;
      let gesture=this.gestures.get(key);
      if(!gesture){const family=mageCastFamily(targetDirection),variant=family==='north'?1:(this.variants[family]++%2+1) as 1|2;gesture={direction:targetDirection,variant};this.gestures.set(key,gesture);}
      const direction=gesture.direction;
      if(!this.walking)this.direction=direction;
      const age=Math.max(0,w.elapsed-a.started);
      let progress=Math.max(0,Math.min(1,age/Math.max(.001,a.duration)));
      if(a.ability==='ultimate-lightning'){
        const release=ULTIMATE.lightning.preparation,end=release+ULTIMATE.lightning.reveal+ULTIMATE.lightning.hold+ULTIMATE.lightning.fade;
        // Keep the native pointing frames through the actual beam, then retract.
        progress=age<release?age/release*.28:age<end?.28+(age-release)/(end-release)*.25:.53+Math.min(1,(age-end)/Math.max(.001,a.duration-end))*.47;
      }
      return {motion:mageCastMotion(a.ability),direction,age,progress,casting:true,castAbility:a.ability,castVariant:gesture.variant,castDuration:a.duration,...(locomotion?{locomotion}:{}),...(this.walking?{walk:{direction:this.walking.direction,age:this.walking.age}}:{})};
    }
    return locomotion?{...locomotion,locomotion,casting:false,...(this.walking?{walk:this.walking}:{})}:{motion:'idle',direction:this.direction,age:w.elapsed,casting:false};
  }
}
