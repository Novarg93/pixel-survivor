import manifest from './mageRunManifestV2.json';
import type {MageDirection} from './MageHeroAnimation';
import type {MageRunMotion} from './MageRunAnimation';

export const MAGE_RUN_V2=manifest;
export const MAGE_RUN_V2_TEXTURE='mage-run-v2';
export const MAGE_RUN_V2_URLS={image:'assets/hd/mage-run-v2/atlas.png',data:'assets/hd/mage-run-v2/atlas.json'};
export function mageRunBody(direction:MageDirection){return direction==='north'?'north':direction==='north-east'||direction==='north-west'?'north-east':'south';}
export function mageRunDuration(direction:MageDirection,motion:MageRunMotion){return manifest.clips[mageRunBody(direction)][motion].periodMs/1000;}
export function mageRunSelection(direction:MageDirection,motion:MageRunMotion,age:number){
 const body=mageRunBody(direction),b=manifest.clips[body],clip=b[motion],flipX=direction==='west'||direction==='south-west'||direction==='north-west';
 let time=Math.floor(Math.max(0,age)*1000+1e-7);time=motion==='run'?time%clip.periodMs:Math.min(time,clip.periodMs-1);let index=0;
 while(index<clip.frames.length-1&&time>=clip.frames[index]!.durationMs){time-=clip.frames[index]!.durationMs;index++;}
 const f=clip.frames[index]!,pivot={x:flipX?manifest.canvas-b.pivot.x:b.pivot.x,y:b.pivot.y};
 return{texture:MAGE_RUN_V2_TEXTURE,frame:f.frame,body,motion,index,flipX,pivot,origin:{x:pivot.x/manifest.canvas,y:pivot.y/manifest.canvas},hand:{x:flipX?manifest.canvas-f.hand.x:f.hand.x,y:f.hand.y}};
}
export function mageRunMappedAge(from:MageDirection,to:MageDirection,motion:MageRunMotion,age:number){return age/mageRunDuration(from,motion)*mageRunDuration(to,motion);}
export function mageRunEntryAge(direction:MageDirection){const b=manifest.clips[mageRunBody(direction)],i=b.run.frames.findIndex(f=>f.sourceFrame===b.loopEntry);return i*b.run.frames[0]!.durationMs/1000;}
export function mageRunStopAge(direction:MageDirection,motion:Exclude<MageRunMotion,'run-stop'>,age:number){const frame=mageRunSelection(direction,motion,age).frame,index=(manifest.stopEntries as Record<string,number>)[frame]!;return index*manifest.clips[mageRunBody(direction)]['run-stop'].frames[0]!.durationMs/1000;}
export function mageRunResumeAgeV2(direction:MageDirection,age:number){const frame=mageRunSelection(direction,'run-stop',age).frame,index=(manifest.resumes as Record<string,number>)[frame]!;return index*manifest.clips[mageRunBody(direction)].run.frames[0]!.durationMs/1000;}
