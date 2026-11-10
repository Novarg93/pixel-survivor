import type {MageDirection} from './MageHeroAnimation';
import type {MageLocomotion,MageRunMotion} from './MageRunAnimation';
import {MAGE_RUN_V2,mageRunDuration,mageRunMappedAge,mageRunEntryAge,mageRunStopAge,mageRunResumeAgeV2} from './mageRunPackV2';

// Presentation only: input and World movement remain immediate. Transition
// clocks use simulation time; the repeated stride follows actual distance.
export class MageRunningAnimation{
 private motion:MageRunMotion|'idle'='idle';private age=0;private direction:MageDirection='south';
 clear(){this.motion='idle';this.age=0;}
 current():MageLocomotion|undefined{return this.motion==='idle'?undefined:{motion:this.motion,direction:this.direction,age:this.age};}
 view(dt:number,distance:number,direction:MageDirection,moving:boolean):MageLocomotion|undefined{
  if(moving){
   if(this.motion==='idle'){this.motion='run-start';this.age=0;this.direction=direction;}
   else if(this.motion==='run-stop'){this.age=mageRunResumeAgeV2(this.direction,this.age);this.motion='run';}
   if(direction!==this.direction){this.age=mageRunMappedAge(this.direction,direction,this.motion as MageRunMotion,this.age);this.direction=direction;}
   this.age+=this.motion==='run-start'?dt:distance/MAGE_RUN_V2.referenceSpeed;
   if(this.motion==='run-start'&&this.age>=mageRunDuration(direction,'run-start')){const extra=this.age-mageRunDuration(direction,'run-start');this.motion='run';this.age=mageRunEntryAge(direction)+(dt>0?extra*distance/dt/MAGE_RUN_V2.referenceSpeed:0);}
  }else if(this.motion!=='idle'){
   if(this.motion!=='run-stop'){this.age=mageRunStopAge(this.direction,this.motion,this.age);this.motion='run-stop';}
   else this.age+=dt;
   if(this.age>=mageRunDuration(this.direction,'run-stop'))this.clear();
  }
  return this.current();
 }
}
