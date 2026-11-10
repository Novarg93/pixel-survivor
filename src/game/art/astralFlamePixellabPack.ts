import manifest from './astralFlameManifestPixellab.json';
export const ASTRAL_FLAME=manifest;
export const ASTRAL_FLAME_TEXTURE='astral-flame-pixellab-v1';
export const ASTRAL_FLAME_URLS={image:'assets/hd/astral-flame-pixellab-v1/atlas.png',data:'assets/hd/astral-flame-pixellab-v1/atlas.json'} as const;
export function astralFlameAiFrame(id:'spawn'|'idle'|'vanish',age:number){const c=manifest.clips[id],total=c.durationsMs.reduce((a,b)=>a+b,0);let ms=Math.max(0,age)*1000;if(c.loop)ms%=total;for(let i=0;i<c.frames.length;i++){if(ms<c.durationsMs[i]!-1e-7)return c.frames[i]!.name;ms-=c.durationsMs[i]!;}return c.frames.at(-1)!.name;}
