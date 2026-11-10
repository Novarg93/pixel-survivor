import manifest from './mageShieldNovaManifestPixellab.json';
export const MAGE_SHIELD_NOVA=manifest;
export const MAGE_SHIELD_NOVA_TEXTURE='mage-shield-nova-pixellab-v1';
export const MAGE_SHIELD_NOVA_URLS={image:'assets/hd/mage-shield-nova-pixellab-v1/atlas.png',data:'assets/hd/mage-shield-nova-pixellab-v1/atlas.json'} as const;
export type MageShieldNovaClip=keyof typeof manifest.clips;
export function mageShieldNovaDuration(clip:MageShieldNovaClip){return manifest.clips[clip].durationsMs.reduce((a,b)=>a+b,0)/1000;}
export function mageShieldNovaFrame(clip:MageShieldNovaClip,age:number,reverse=false){
 const c=manifest.clips[clip];let time=Math.max(0,age)*1000;
 if(c.loop)time%=mageShieldNovaDuration(clip)*1000;
 for(let n=0;n<c.frames.length;n++){
  const index=reverse?c.frames.length-1-n:n;
  if(time<c.durationsMs[index]!-1e-7)return c.frames[index]!.name;
  time-=c.durationsMs[index]!;
 }
 return c.frames[reverse?0:c.frames.length-1]!.name;
}
// The widest visible wave has radius about48 native pixels; include its padding.
export function mageNovaDisplaySize(radius:number){return Math.max(0,radius)*manifest.canvas/manifest.novaRadius;}
