import manifest from './fireballManifest.json';
export const FIREBALL_TEXTURE='mage-fireball-v1';
export const FIREBALL_URLS={image:'assets/hd/mage-fireball-v1/atlas.png',data:'assets/hd/mage-fireball-v1/atlas.json'} as const;
export const FIREBALL_MANIFEST=manifest;
// First review uses one pixel scale at every rank; damage radius is independent.
export const FIREBALL_VFX={scale:.5,formingSeconds:.2,originX:manifest.pivot.x/manifest.canvas.width,originY:manifest.pivot.y/manifest.canvas.height} as const;
export type FireballClip=keyof typeof manifest.clips;
export function fireballDuration(clip:FireballClip){return manifest.clips[clip].durationsMs.reduce((a,b)=>a+b,0)/1000;}
export function fireballClipFrame(clip:FireballClip,age:number,loop=false){
  let ms=Math.max(0,age)*1000;if(loop)ms%=fireballDuration(clip)*1000;
  for(let i=0;i<manifest.clips[clip].frameCount;i++){
    if(ms<manifest.clips[clip].durationsMs[i]!-1e-7)return `fireball-${clip}-${i}`;
    ms-=manifest.clips[clip].durationsMs[i]!;
  }
  return `fireball-${clip}-${manifest.clips[clip].frameCount-1}`;
}
export function fireballFlightFrame(age:number){return age<FIREBALL_VFX.formingSeconds?fireballClipFrame('forming',Math.max(0,age)/FIREBALL_VFX.formingSeconds*fireballDuration('forming')):fireballClipFrame('idle',age-FIREBALL_VFX.formingSeconds,true);}
