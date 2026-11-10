import manifest from './runeWardenManifest.json';
import type { BossFacing, BossPose } from './bossPack';
import {runeVfxFrame} from './runeWardenVfxPack';
export const RUNE_WARDEN_TEXTURE = 'rune-warden-v1';
export const RUNE_WARDEN_URLS = { image: 'assets/hd/rune-warden-v1/atlas.png', data: 'assets/hd/rune-warden-v1/atlas.json' } as const;
export const RUNE_WARDEN_MANIFEST = manifest;
export type RuneClip = keyof typeof manifest.clips;
export function runeDuration(clip: RuneClip) { return manifest.clips[clip].durationsMs.reduce((a,b)=>a+b,0)/1000; }
export function runeFrameIndex(clip: RuneClip, age: number, loop = false, count = manifest.clips[clip].frameCount) {
  const durations=manifest.clips[clip].durationsMs.slice(0,count),total=durations.reduce((a,b)=>a+b,0);
  let ms=Math.max(0,age)*1000;
  if(loop)ms%=total;
  for(let i=0;i<durations.length;i++){if(ms<durations[i]!-1e-7)return i;ms-=durations[i]!;}
  return durations.length-1;
}
export function runeBodyFrame(facing: BossFacing, pose: BossPose, age: number, remaining = 0) {
  const cast=pose==='windup'||pose==='attack';
  const index=pose==='windup'?runeFrameIndex('cast',Math.max(0,age)/Math.max(.001,age+remaining)*runeDuration('cast')):pose==='attack'?manifest.clips.cast.frameCount-1:pose==='walk'?runeFrameIndex('walk',age,true):0;
  return `sorcerer-1-${facing}-${cast?'cast':'walk'}-${index}`;
}
export function runeVolleyFrame(age: number) {
  return runeVfxFrame('flight',age);
}
export function runeJudgementFrame(phase:'charge'|'impact',progress:number){
  const hit=manifest.judgementHitFrame,charge=manifest.clips.judgement.durationsMs.slice(0,hit).reduce((a,b)=>a+b,0)/1000;
  const t=Math.max(0,Math.min(1,progress));
  const frame=phase==='charge'?runeFrameIndex('judgement',t*charge,false,hit):runeFrameIndex('judgement',charge+t*(runeDuration('judgement')-charge));
  return `judgement-${frame}`;
}
export function runeFlashOpacity(x:number,y:number){
  const t=Math.max(0,Math.min(1,(62-Math.hypot(x-63.5,y-63.5))/16));
  return t*t*(3-2*t);
}
