import manifest from './ashWardenManifest.json';
import type {FinalEncounter} from '../systems/FinalEncounter';
import type {Point} from '../utils/math';
import {FINAL_BOSS as C} from '../config/finalBoss';
import {MELEE_A_CLIPS} from './meleeComboPack';
import {NORTH_SLAM,northSlamAge} from './ashWardenPixellabPack';
export interface WardenLayer {frame:string;pivot:number[];scale:number;texture?:string}
export interface WardenFrame {layers:WardenLayer[];flipX:boolean;overlay?:WardenLayer|null}
export interface WardenClip {durationsMs:number[];loop:boolean;frames:WardenFrame[];events:unknown}
export const WARDEN=manifest as unknown as {pages:number;rgbaBytes:number;uniqueTextures:number;locations:Record<string,number>;clips:Record<string,WardenClip>};
// Keep the six-frame windup; halve only the release/follow-through frame times.
// Source timings and pixels stay unchanged, as does the combat recovery window.
export const CLEAVE_PLAYBACK:WardenClip={...WARDEN.clips['south-cleave']!,durationsMs:WARDEN.clips['south-cleave']!.durationsMs.map((ms,i)=>i<6?ms:ms/2)};
const CLEAVE_WINDUP=CLEAVE_PLAYBACK.durationsMs.slice(0,6).reduce((a,b)=>a+b,0)/1000;
// B reaches its overhead pose in frame6; only the following downswing is faster.
export const MELEE_B_PLAYBACK:Record<string,WardenClip>=Object.fromEntries(Object.entries(WARDEN.clips).filter(([id])=>id.endsWith('-melee')).map(([id,clip])=>[id,{...clip,durationsMs:clip.durationsMs.map((ms,i)=>i<7?ms:ms/2)}]));
export const wardenTexture=(page:number)=>`ash-warden-v1-${page}`;
export function wardenFacing(p:Point){return Math.abs(p.x)>Math.abs(p.y)?p.x<0?'west':'east':p.y<0?'north':'south';}
export function wardenIndex(clip:WardenClip,age:number){
  const total=clip.durationsMs.reduce((a,b)=>a+b,0);let t=Math.max(0,age)*1000;
  t=clip.loop?t%total:Math.min(total-.0001,t);
  for(let i=0;i<clip.durationsMs.length;i++){t-=clip.durationsMs[i]!;if(t< -1e-7)return i;}return clip.frames.length-1;
}
export function wardenPose(f:FinalEncounter){
  const a=f.attack,face=wardenFacing(a.direction);let clip='south-idle',age=a.age;
  if(f.phase==='intro')clip='spawn';
  else if(f.phase==='dying'||f.phase==='defeated')clip='death-a';
  else if(f.pending)clip=f.pending==='phase3'?'transformation':'south-idle';
  else if(a.kind==='approach'){clip=`${face}-${f.moving?'walk':'idle'}`;age=f.bossClock;}
  else if(a.kind==='basicMelee'){
    if(face==='north'){clip='north-melee';age=northSlamAge(a.age,f.meleeHitTime,C.meleeDuration/(C.meleeSpeedMultiplier*(a.meleeVariant==='a'?C.meleeASpeedMultiplier:1)));}
    else{
      age*=C.meleeSpeedMultiplier;
      if(face==='south'){clip='south-cleave';age=age<C.meleeHit?age*CLEAVE_WINDUP/C.meleeHit:CLEAVE_WINDUP+age-C.meleeHit;}
      else clip=a.meleeVariant==='a'?`${face}-melee-a`:`${face}-melee`;
    }
  }
  else if(a.kind==='meteorCast')clip=`cast-${face}`;
  else if(a.kind==='armageddonCast')clip='armageddon-cast';
  else if(a.kind==='ritualEnter')clip='ritual-enter';
  else if(a.kind==='ritualChannel')clip='ritual-channel';
  else if(a.kind==='shieldBreak'){
    if(age<1.04)clip='shield-break';else if(age<2.3){clip='stagger';age-=1.04;}else{clip='stagger-recover';age-=2.3;}
  }else if(a.kind.startsWith('charge')){clip=`south-${a.kind}`;if(a.kind==='chargeTravel')age*=C.chargeSpeedMultiplier;}
  else if(a.kind==='swordWindup'||a.kind==='swordActive'||a.kind==='recovery'){clip='south-cleave';age=a.kind==='swordWindup'?age*CLEAVE_WINDUP/C.swordWindup:age+CLEAVE_WINDUP+(a.kind==='recovery'?C.swordActive:0);}
  const data=clip==='north-melee'&&a.kind==='basicMelee'?NORTH_SLAM:clip==='south-cleave'?CLEAVE_PLAYBACK:MELEE_A_CLIPS[clip]??MELEE_B_PLAYBACK[clip]??WARDEN.clips[clip]!,index=wardenIndex(data,age),sourceFrame=data.frames[index]!,mirrorSpecial=a.kind.startsWith('charge')&&face==='west'||clip==='south-cleave'&&a.kind!=='basicMelee'&&a.direction.x<0,frame=mirrorSpecial?{...sourceFrame,flipX:!sourceFrame.flipX}:sourceFrame;
  return{clip,age,index,frame,combatDirection:face,presentationDirection:mirrorSpecial?'west':clip.startsWith(face)||clip===`cast-${face}`?face:'south'};
}
