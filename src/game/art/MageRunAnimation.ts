import type {MageDirection} from './MageHeroAnimation';
import {mageHeroFrame,mageRunResumeAge,mageRunStopSeconds,MAGE_RUN_START_SECONDS} from './mageHeroPack';
export type MageRunMotion='run-start'|'run'|'run-stop';
export interface MageLocomotion {motion:MageRunMotion;direction:MageDirection;age:number;stopFrame?:string}

// Cosmetic transitions only: the player moves/stops immediately in World.
export class MageRunAnimation{
  private motion:MageRunMotion|'idle'='idle';
  private age=0;private direction:MageDirection='south';private stopFrame?:string;
  clear(){this.motion='idle';this.age=0;this.stopFrame=undefined;}
  current():MageLocomotion|undefined{return this.motion==='idle'?undefined:{motion:this.motion,direction:this.direction,age:this.age,...(this.stopFrame?{stopFrame:this.stopFrame}:{})};}
  view(dt:number,distance:number,direction:MageDirection,moving:boolean):MageLocomotion|undefined{
    if(moving){
      if(this.motion==='idle'){this.motion='run-start';this.age=0;}
      else if(this.motion==='run-stop'){
        this.age=mageRunResumeAge(mageHeroFrame({...this.current()!,casting:false}));this.motion='run';this.stopFrame=undefined;
      }else this.age+=this.motion==='run-start'?dt:distance/135;
      this.direction=direction;
      if(this.motion==='run-start'&&this.age>=MAGE_RUN_START_SECONDS){this.age-=MAGE_RUN_START_SECONDS;this.motion='run';}
    }else if(this.motion!=='idle'){
      if(this.motion!=='run-stop'){this.stopFrame=mageHeroFrame({...this.current()!,casting:false});this.motion='run-stop';this.age=0;}
      else this.age+=dt;
      if(this.age>=mageRunStopSeconds(this.stopFrame!))this.clear();
    }
    return this.current();
  }
}
