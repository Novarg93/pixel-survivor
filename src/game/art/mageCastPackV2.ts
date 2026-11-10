import manifest from './mageCastManifestV2.json';
import type {MageDirection,MageHeroPose} from './MageHeroAnimation';
import {ULTIMATE} from '../config/ultimates';

export const MAGE_CAST_V2=manifest;
export const MAGE_CAST_V2_TEXTURE='mage-cast-v2';
export const MAGE_CAST_V2_URLS={image:'assets/hd/mage-cast-v2/atlas.png',data:'assets/hd/mage-cast-v2/atlas.json'};
export function mageCastFamily(direction:MageDirection){return direction.startsWith('north')?'north':direction==='east'||direction==='west'?'east':'south';}
export function mageCastSelectionV2(pose:Pick<MageHeroPose,'direction'|'age'|'progress'|'castAbility'|'castVariant'|'castDuration'>){
 const family=mageCastFamily(pose.direction),variant=pose.castVariant??1;
 const id=family==='north'?pose.direction as 'north'|'north-east'|'north-west':`${family}-v${variant}` as const,clip=manifest.clips[id];
 const flipX=pose.direction==='west'||pose.direction==='south-west',last=clip.frames.length-1;
 let index=Math.min(last,Math.floor(Math.max(0,pose.progress??pose.age/(clip.periodMs/1000))*clip.frames.length));
 if(pose.castAbility==='ultimate-lightning'){
  const c=ULTIMATE.lightning,release=c.preparation,end=release+c.reveal+c.hold+c.fade;
  if(pose.age<release)index=Math.min(clip.releaseFrame-1,Math.floor(Math.max(0,pose.age)/release*clip.releaseFrame));
  else if(pose.age<end)index=Math.min(clip.holdEndFrame,clip.releaseFrame+Math.floor((pose.age-release)/(end-release)*(clip.holdEndFrame-clip.releaseFrame+1)));
  else index=Math.min(last,clip.holdEndFrame+1+Math.floor((pose.age-end)/Math.max(.001,(pose.castDuration??.975)-end)*(last-clip.holdEndFrame)));
 }
 const frame=clip.frames[index]!,pivot={x:flipX?manifest.canvas-clip.pivot.x:clip.pivot.x,y:clip.pivot.y};
 return{texture:MAGE_CAST_V2_TEXTURE,frame:frame.frame,id,index,variant,flipX,pivot,origin:{x:pivot.x/manifest.canvas,y:pivot.y/manifest.canvas},hand:{x:flipX?manifest.canvas-frame.hand.x:frame.hand.x,y:frame.hand.y}};
}
