import manifest from './ashWardenManifest.json';
import type {FinalEncounter} from '../systems/FinalEncounter';
import type {Point} from '../utils/math';
export interface WardenLayer {frame:string;pivot:number[];scale:number}
export interface WardenFrame {layers:WardenLayer[];flipX:boolean;overlay?:WardenLayer|null}
export interface WardenClip {durationsMs:number[];loop:boolean;frames:WardenFrame[];events:unknown}
export const WARDEN=manifest as unknown as {pages:number;rgbaBytes:number;uniqueTextures:number;locations:Record<string,number>;clips:Record<string,WardenClip>};
export const wardenTexture=(page:number)=>`ash-warden-v1-${page}`;
export function wardenFacing(p:Point){return Math.abs(p.x)>Math.abs(p.y)?p.x<0?'west':'east':p.y<0?'north':'south';}
export function wardenIndex(clip:WardenClip,age:number){
  const total=clip.durationsMs.reduce((a,b)=>a+b,0);let t=Math.max(0,age)*1000;
  t=clip.loop?t%total:Math.min(total-.0001,t);
  for(let i=0;i<clip.durationsMs.length;i++){t-=clip.durationsMs[i]!;if(t<0)return i;}return clip.frames.length-1;
}
export function wardenPose(f:FinalEncounter){
  const a=f.attack,face=wardenFacing(a.direction);let clip='south-idle',age=a.age;
  if(f.phase==='intro')clip='spawn';
  else if(f.phase==='dying'||f.phase==='defeated')clip='death-a';
  else if(f.pending)clip=f.pending==='phase3'?'transformation':'south-idle';
  else if(a.kind==='approach'){clip=`${face}-${f.moving?'walk':'idle'}`;age=f.bossClock;}
  else if(a.kind==='basicMelee')clip=`${face}-melee`;
  else if(a.kind==='meteorCast')clip=`cast-${face}`;
  else if(a.kind==='armageddonCast')clip='armageddon-cast';
  else if(a.kind==='ritualEnter')clip='ritual-enter';
  else if(a.kind==='ritualChannel')clip='ritual-channel';
  else if(a.kind==='shieldBreak'){
    if(age<1.04)clip='shield-break';else if(age<2.3){clip='stagger';age-=1.04;}else{clip='stagger-recover';age-=2.3;}
  }else if(a.kind.startsWith('charge'))clip=`south-${a.kind}`;
  else if(a.kind==='swordWindup'||a.kind==='swordActive'||a.kind==='recovery'){clip='south-cleave';age+=a.kind==='swordActive'?.9:a.kind==='recovery'?1.05:0;}
  const data=WARDEN.clips[clip]!;return{clip,age,index:wardenIndex(data,age),frame:data.frames[wardenIndex(data,age)]!,combatDirection:face,presentationDirection:clip.startsWith(face)||clip===`cast-${face}`?face:'south'};
}
