import manifest from './regularLightningManifest.json';
export const REGULAR_LIGHTNING_TEXTURE='mage-regular-lightning-v1';
export const REGULAR_LIGHTNING_URLS={image:'assets/hd/regular-lightning-v1/atlas.png',data:'assets/hd/regular-lightning-v1/atlas.json'} as const;
export const REGULAR_LIGHTNING_MANIFEST=manifest;
// Full-length source endpoints; length changes along X, thickness stays fixed.
export const REGULAR_LIGHTNING_VFX={startX:17,endX:239,axisY:49,thicknessScale:.5} as const;
export function regularLightningFrame(progress:number){
  let ms=Math.max(0,Math.min(1,progress))*manifest.durationMs;
  for(const f of manifest.frames){if(ms<f.durationMs-1e-7)return `regular-lightning-${f.index}`;ms-=f.durationMs;}
  return `regular-lightning-${manifest.frames.length-1}`;
}
