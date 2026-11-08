import manifest from './briarBeastManifest.json';
import type {BossFacing,BossPose} from './bossPack';
export const BRIAR_BEAST_TEXTURE='briar-beast-v1';
export const BRIAR_BEAST_URLS={image:'assets/hd/briar-beast-v1/atlas.png',data:'assets/hd/briar-beast-v1/atlas.json'} as const;
export const BRIAR_BEAST_MANIFEST=manifest;
export type BriarClip=keyof typeof manifest.clips;
export function briarFrameIndex(clip:BriarClip,age:number,loop=false,first=0,last=manifest.clips[clip].frameCount-1){
  const durations=manifest.clips[clip].durationsMs.slice(first,last+1),total=durations.reduce((a,b)=>a+b,0);
  let ms=Math.max(0,age)*1000;if(loop)ms%=total;
  for(let i=0;i<durations.length;i++){if(ms<durations[i]!-1e-7)return first+i;ms-=durations[i]!;}
  return last;
}
function phaseFrame(clip:BriarClip,age:number,remaining:number,first:number,last:number){
  const duration=manifest.clips[clip].durationsMs.slice(first,last+1).reduce((a,b)=>a+b,0)/1000;
  return briarFrameIndex(clip,Math.max(0,age)/Math.max(.001,age+remaining)*duration,false,first,last);
}
// Existing collision timings own playback: load, travel and braking use one charge clip.
export function briarBodyFrame(facing:BossFacing,pose:BossPose,age:number,remaining=0){
  let clip:'idle'|BriarClip='idle',index=0;
  if(pose==='walk'){clip='walk';index=briarFrameIndex('walk',age,true);}
  else if(pose==='windup'){clip='charge';index=phaseFrame('charge',age,remaining,0,2);}
  else if(pose==='attack'){clip='charge';index=phaseFrame('charge',age,remaining,3,9);}
  else if(pose==='recover'){clip='charge';index=phaseFrame('charge',age,remaining,10,11);}
  else if(pose==='slam'){clip='attack';index=phaseFrame('attack',age,Math.max(0,.6-age),0,11);}
  return `charger-1-${facing}-${clip}-${index}`;
}
