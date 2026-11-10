import manifest from './mageMovingCastManifestV2.json';
import {mageCastSelectionV2} from './mageCastPackV2';
import {mageRunSelection,mageRunMappedAge} from './mageRunPackV2';
import type {MageHeroPose} from './MageHeroAnimation';

export const MAGE_MOVING_CAST_V2=manifest;
export const MAGE_MOVING_CAST_V2_TEXTURE='mage-moving-cast-v2';
export const MAGE_MOVING_CAST_V2_URLS={image:'assets/hd/mage-moving-cast-v2/upper.png',data:'assets/hd/mage-moving-cast-v2/upper.json'};
export function mageMovingCastLayersV2(pose:MageHeroPose){
 if(!pose.casting||!pose.walk)return undefined;
 const cast=mageCastSelectionV2(pose);
 // Match the robe's projection to the torso; the stride clock still comes from
 // actual movement. Preserve the current stride phase when projecting the legs
 // into the cast's south, north or north-east torso view.
 const projection=cast.id==='north-east'?'north-east':cast.id==='north-west'?'north-west':cast.id==='north'?'north':cast.flipX?'west':'south';
 const motion=pose.locomotion?.motion??'run',age=pose.locomotion?mageRunMappedAge(pose.locomotion.direction,projection,motion,pose.locomotion.age):pose.walk.age;
 const lower=mageRunSelection(projection,motion,age),upper={...cast,texture:MAGE_MOVING_CAST_V2_TEXTURE};
 const anchors=manifest.anchors as Record<string,{x:number;y:number}>,a=anchors[lower.frame]!,b=anchors[upper.frame]!;
 const lowerWaist={x:lower.flipX?96-a.x:a.x,y:a.y},upperWaist={x:upper.flipX?96-b.x:b.x,y:b.y};
 return{lower,upper,lowerWaist,upperWaist,offset:{x:lowerWaist.x-lower.pivot.x-upperWaist.x+upper.pivot.x,y:lowerWaist.y-lower.pivot.y-upperWaist.y+upper.pivot.y},
  lowerCrop:{x:0,y:manifest.seam,width:96,height:96-manifest.seam},upperCrop:{x:0,y:0,width:96,height:96},canvas:96,gaitAge:pose.walk.age,movementDirection:pose.walk.direction};
}
