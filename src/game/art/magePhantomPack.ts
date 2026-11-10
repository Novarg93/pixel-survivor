import manifest from './magePhantomManifest.json';
import type {MageDirection} from './MageHeroAnimation';
import type {MageGesture} from './MageCastingController';

export const MAGE_PHANTOM=manifest;
export const MAGE_PHANTOM_TEXTURE='mage-phantom-v1';
export const MAGE_PHANTOM_URLS={image:'assets/hd/mage-phantom-v1/atlas.png',data:'assets/hd/mage-phantom-v1/atlas.json'};
export const MAGE_PHANTOM_SECONDS=manifest.durationMs/1000;
export const isMagePhantomSpell=(ability:MageGesture):ability is 'fireball'|'lightning'=>ability==='fireball'||ability==='lightning';
export interface MagePhantomPose{direction:MageDirection;sourceDirection:MageDirection;age:number;frame:number}
const directions=manifest.directions as MageDirection[];
export function magePhantomFrame(age:number){
  let end=0;for(const [index,duration]of manifest.durationsMs.entries()){end+=duration;if(Math.max(0,age)*1000<end-1e-7)return index;}
  return manifest.durationsMs.length-1;
}
export function magePhantomTurn(from:MageDirection,to:MageDirection):MageDirection{
  const a=directions.indexOf(from),b=directions.indexOf(to),delta=((b-a+12)%8)-4;
  return directions[(a+Math.round(delta/2)+8)%8]!;
}
export function magePhantomSelection(pose:MagePhantomPose){
  const frame=pose.frame===1?'mage-phantom-manifest-'+pose.sourceDirection+'-1':pose.frame===2?'mage-phantom-manifest-'+magePhantomTurn(pose.sourceDirection,pose.direction)+'-2':manifest.clips[pose.direction].frames[pose.frame]!;
  return {texture:MAGE_PHANTOM_TEXTURE,frame};
}
export function magePhantomIntroOffset(pose:MagePhantomPose){
  const vectors=[[0,1],[Math.SQRT1_2,Math.SQRT1_2],[1,0],[Math.SQRT1_2,-Math.SQRT1_2],[0,-1],[-Math.SQRT1_2,-Math.SQRT1_2],[-1,0],[-Math.SQRT1_2,Math.SQRT1_2]],v=vectors[directions.indexOf(pose.direction)]!;
  const amount=pose.frame===1?2:pose.frame===2?5:0;
  return {x:Math.round(v[0]!*amount),y:Math.round(v[1]!*amount)};
}
