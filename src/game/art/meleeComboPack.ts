import manifest from './meleeComboManifest.json';
import type {WardenClip} from './ashWardenPack';
import type {FinalEncounter} from '../systems/FinalEncounter';
import {FINAL_BOSS as C} from '../config/finalBoss';
export const MELEE_COMBO=manifest;
export const MELEE_COMBO_TEXTURE=manifest.texture;
export const MELEE_COMBO_URLS={image:'assets/hd/ash-warden-melee-combo-v1/atlas.png',data:'assets/hd/ash-warden-melee-combo-v1/atlas.json'};
const a=manifest.bodyA;
const east:WardenClip={durationsMs:a.durationsMs.map(ms=>ms/C.meleeASpeedMultiplier),loop:false,events:{},frames:a.frames.map((frame,i)=>({flipX:false,layers:frame?[{frame,pivot:a.pivot,scale:a.scale,texture:MELEE_COMBO_TEXTURE}]:[],overlay:a.overlays[i]?{frame:a.overlays[i]!,pivot:a.pivot,scale:a.scale,texture:MELEE_COMBO_TEXTURE}:null}))};
export const MELEE_A_CLIPS:Record<string,WardenClip>={'east-melee-a':east,'west-melee-a':{...east,frames:east.frames.map(f=>({...f,flipX:true}))}};
export function meleeComboView(f:FinalEncounter){
  const e=f.boss,a=f.attack;if(!e||f.pending||!['phase1','phase2','phase3'].includes(f.phase)||a.kind!=='basicMelee')return null;
  const side=Math.abs(a.direction.x)>Math.abs(a.direction.y),west=a.direction.x<0,variant=a.meleeVariant??(side?'b':a.direction.y>0?'overhead':'b'),hitAge=(a.age-f.meleeHitTime)*C.meleeSpeedMultiplier;
  const glowAlpha=0;
  const age=hitAge+manifest.slash.leadMs/1000;let remaining=age*1000,index=-1;if(age>=0)for(let i=0;i<manifest.slash.frames.length;i++){remaining-=manifest.slash.durationsMs[i]!;if(remaining<-.000001){index=i;break;}}
  const frame=side&&variant==='b'&&index>=0?manifest.slash.frames[index]:null;
  return{variant,side,origin:{x:e.x,y:e.y},rotation:Math.atan2(a.direction.y,a.direction.x),glowAlpha,glowScale:C.meleeRadius/60,slash:frame?{frame,index,x:e.x+(west?-50:50),y:e.y-28,flipX:west}:null};
}
