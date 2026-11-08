import manifest from './astralRevenantManifest.json';
import type {BossFacing,BossPose} from './bossPack';
import {ASTRAL_VFX as C} from '../config/astralRevenant';
export const ASTRAL_REVENANT_TEXTURE='astral-revenant-v1';
export const ASTRAL_REVENANT_URLS={image:'assets/hd/astral-revenant-v1/atlas.png',data:'assets/hd/astral-revenant-v1/atlas.json'} as const;
export const ASTRAL_REVENANT_MANIFEST=manifest;
export type AstralClip=keyof typeof manifest.clips;
export function astralDuration(clip:AstralClip,first=0,last=manifest.clips[clip].frameCount-1){return manifest.clips[clip].durationsMs.slice(first,last+1).reduce((a,b)=>a+b,0)/1000;}
export function astralFrameIndex(clip:AstralClip,age:number,loop=false,first=0,last=manifest.clips[clip].frameCount-1,reverse=false){
  let ms=Math.max(0,age)*1000;if(loop)ms%=astralDuration(clip,first,last)*1000;
  for(let n=first;n<=last;n++){const i=reverse?last-(n-first):n;if(ms<manifest.clips[clip].durationsMs[i]!-1e-7)return i;ms-=manifest.clips[clip].durationsMs[i]!;}
  return reverse?first:last;
}
export function astralBodyFrame(facing:BossFacing,pose:BossPose,age:number,remaining=0){
  const cast=pose==='windup'||pose==='attack',index=pose==='windup'?astralFrameIndex('cast',Math.max(0,age)/Math.max(.001,age+remaining)*astralDuration('cast')):pose==='attack'?manifest.clips.cast.frameCount-1:pose==='walk'?astralFrameIndex('walk',age,true):0;
  return `eclipse-1-${facing}-${cast?'cast':'walk'}-${index}`;
}
export function astralProjectileFrame(age:number){return age<C.launchHold?'volley-static':`volley-flight-${astralFrameIndex('volley-flight',age-C.launchHold,true)}`;}
export function astralImpactFrame(progress:number){return `volley-impact-${astralFrameIndex('volley-impact',Math.max(0,Math.min(1,progress))*astralDuration('volley-impact',C.impactFirstFrame),false,C.impactFirstFrame)}`;}
export function astralFlameFrame(phase:'spawn'|'idle'|'vanish',age:number,duration:number){
  if(phase==='idle')return `flame-idle-${astralFrameIndex('flame-idle',age,true)}`;
  const clip=phase==='spawn'?'flame-appear':'flame-spawn';
  return `${clip}-${astralFrameIndex(clip,Math.max(0,Math.min(1,age/duration))*astralDuration(clip))}`;
}
