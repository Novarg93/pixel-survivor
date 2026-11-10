import manifest from './mageMeteorManifestPixellab.json';
import tuning from '../config/mageAbilityTuning.json';
export const MAGE_METEOR=manifest;
export const MAGE_METEOR_TEXTURE='mage-meteor-pixellab-v1';
export const MAGE_METEOR_URLS={image:'assets/hd/mage-meteor-pixellab-v1/atlas.png',data:'assets/hd/mage-meteor-pixellab-v1/atlas.json'} as const;
export type MageMeteorClip=keyof typeof manifest.clips;
export const MAGE_METEOR_OFFSET={x:Math.sin(manifest.angleDegrees*Math.PI/180)*tuning.meteorFallDistance,y:-Math.cos(manifest.angleDegrees*Math.PI/180)*tuning.meteorFallDistance};
export function mageMeteorDuration(clip:MageMeteorClip){return manifest.clips[clip].durationsMs.reduce((a,b)=>a+b,0)/1000;}
export function mageMeteorFrame(clip:MageMeteorClip,age:number,loop=false){
 const data=manifest.clips[clip],duration=mageMeteorDuration(clip);let ms=Math.max(0,age)*1000;
 if(loop){ms%=duration*1000;if(duration*1000-ms<1e-7)ms=0;}
 for(let i=0;i<data.frameCount;i++){if(ms<data.durationsMs[i]!-1e-7)return data.frames[i]!.name;ms-=data.durationsMs[i]!;}
 return data.frames[data.frameCount-1]!.name;
}
export function meteorLightFrame(progress:number){return manifest.clips.illumination.frames[8-Math.floor(Math.max(0,Math.min(1,progress))*8)]!.name;}
export function meteorLandingLightFrame(age:number){return mageMeteorFrame('illumination',age);}
export function meteorLightSize(radius:number){return radius*2*manifest.canvas/(manifest.lightRadius*2);}
