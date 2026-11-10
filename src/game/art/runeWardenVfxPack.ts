import manifest from './runeWardenVfxManifestPixellab.json';
import {BOSS_MAGIC} from '../config/bossEnrage';
export const RUNE_VFX=manifest;
export const RUNE_VFX_TEXTURE='rune-warden-pixellab-v1';
export const RUNE_VFX_URLS={image:'assets/hd/rune-warden-pixellab-v1/atlas.png',data:'assets/hd/rune-warden-pixellab-v1/atlas.json'} as const;
export type RuneVfxClip=keyof typeof manifest.clips;
export function runeVfxDuration(clip:RuneVfxClip){return manifest.clips[clip].durationsMs.reduce((a,b)=>a+b,0)/1000;}
export function runeVfxFrame(clip:RuneVfxClip,age:number,reverse=false){
 const c=manifest.clips[clip];let time=Math.max(0,age)*1000;if(c.loop)time%=runeVfxDuration(clip)*1000;
 for(let n=0;n<c.frames.length;n++){const i=reverse?c.frames.length-1-n:n;if(time<c.durationsMs[i]!-1e-7)return c.frames[i]!.name;time-=c.durationsMs[i]!;}
 return c.frames[reverse?0:c.frames.length-1]!.name;
}
// Warning marks are readable throughout the existing signal window.
// Reversing the fade would start with transparent frames and hide the warning.
export function runeBlinkSignalFrame(remaining:number){return runeVfxFrame('blink-idle',Math.max(0,BOSS_MAGIC.teleportSignal-remaining));}
