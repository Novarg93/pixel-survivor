import manifest from './mageWalkManifest.json';
import type {MageDirection} from './MageHeroAnimation';

export const MAGE_WALK=manifest;
export const MAGE_WALK_TEXTURE='mage-walk-v2';
export const MAGE_WALK_URLS={image:'assets/hd/mage-walk-v2/atlas.png',data:'assets/hd/mage-walk-v2/atlas.json'};
export function mageWalkSelection(direction:MageDirection,age:number){
 const body=direction.startsWith('north')?'north':'south';
 const flipX=direction==='west'||direction==='south-west'||direction==='north-east',clip=manifest.clips[body];
 let time=Math.floor(Math.max(0,age)*1000+1e-7)%clip.periodMs,index=0;
 while(index<clip.frames.length-1&&time>=clip.frames[index]!.durationMs){time-=clip.frames[index]!.durationMs;index++;}
 const f=clip.frames[index]!,pivot={x:flipX?manifest.canvas-clip.pivot.x:clip.pivot.x,y:clip.pivot.y};
 return{texture:MAGE_WALK_TEXTURE,frame:f.frame,body,index,flipX,pivot,origin:{x:pivot.x/manifest.canvas,y:pivot.y/manifest.canvas},hand:{x:flipX?manifest.canvas-f.hand.x:f.hand.x,y:f.hand.y}};
}
