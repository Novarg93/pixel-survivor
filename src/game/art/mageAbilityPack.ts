import manifest from './mageAbilityManifest.json';
import runtimeManifest from './mageAbilityRuntimeManifest.json';
import tuning from '../config/mageAbilityTuning.json';

export const MAGE_ABILITY_TEXTURE='hd-mage-abilities';
export const MAGE_ABILITY_URLS={image:'assets/hd/mage-frost-ultimate-runtime-v1/atlas.png',data:'assets/hd/mage-frost-ultimate-runtime-v1/atlas.json'} as const;
export const MAGE_ABILITY_MANIFEST=manifest;
export const MAGE_ABILITY_RUNTIME=runtimeManifest;
export const MAGE_ABILITY_TUNING=tuning;
// Uniform world scale, independent of the damage radius. Padding stays invisible.
export const METEOR_DISPLAY_SIZE=manifest.meteorModelWorldSize*manifest.clips['meteor-fall'].canvas/manifest.modelCanvas;
export const METEOR_IMPACT_DISPLAY_SIZE=manifest.meteorModelWorldSize*manifest.clips['meteor-ground-impact'].canvas/manifest.modelCanvas*tuning.meteorImpactScale;
export const METEOR_IMPACT_ORIGIN_Y=manifest.clips['meteor-ground-impact'].origin.y;
// Measured silhouette axis of PNG 1981710313; angle is from screen-up toward right.
const fallAngle=tuning.meteorFallAngleDegrees*Math.PI/180;
export const METEOR_FALL_OFFSET={x:Math.sin(fallAngle)*tuning.meteorFallDistance,y:-Math.cos(fallAngle)*tuning.meteorFallDistance};
export type MageAbilityClip=keyof typeof manifest.clips;
export const MAGE_VFX_LIMIT=144;
const playbackTimings={
  'frost-nova':manifest.clips['frost-nova'].durationsMs,
  'frost-nova-ultimate':manifest.clips['frost-nova-ultimate'].durationsMs,
  'meteor-fall':manifest.clips['meteor-fall'].durationsMs,
  'meteor-ground-impact':manifest.clips['meteor-ground-impact'].durationsMs.map(ms=>ms/tuning.meteorGroundPlaybackRate),
  'meteor-explosion-impact':manifest.clips['meteor-explosion-impact'].durationsMs.map(ms=>ms/tuning.meteorExplosionPlaybackRate),
};
export type FrostClip='frost-nova'|'frost-nova-ultimate';
export function frostDisplaySize(clip:FrostClip,radius:number){const data=manifest.clips[clip];return radius*2*data.canvas/data.sourceCanvas;}
export function mageAbilityDuration(clip:MageAbilityClip){return manifest.clips[clip].durationsMs.reduce((a,b)=>a+b,0)/1000;}
export function mageAbilityPlaybackDuration(clip:MageAbilityClip){return playbackTimings[clip].reduce((a,b)=>a+b,0)/1000;}
export function mageAbilityPlaybackFrame(clip:MageAbilityClip,age:number){return frameAtTime(clip,Math.max(0,age)*1000,playbackTimings[clip]);}
function frameAtTime(clip:MageAbilityClip,time:number,durations:readonly number[],reverse=false){
  const data=manifest.clips[clip];
  let end=0;
  for(let step=0;step<data.frameCount;step++){
    const index=reverse?data.frameCount-1-step:step;
    end+=durations[index]!;if(time<end-1e-7)return `${clip}-${index}`;
  }
  return `${clip}-${reverse?0:data.frameCount-1}`;
}
export function mageAbilityFrame(clip:MageAbilityClip,age:number,duration=mageAbilityDuration(clip),reverse=false){
  const time=Math.max(0,age)/Math.max(.001,duration)*mageAbilityDuration(clip)*1000;
  return frameAtTime(clip,time,manifest.clips[clip].durationsMs,reverse);
}
