import manifest from './lightningUltimateManifest.json';
export const LIGHTNING_ULTIMATE_TEXTURE='mage-lightning-ultimate-v1';
export const LIGHTNING_ULTIMATE_URLS={image:'assets/hd/lightning-ultimate-v1/atlas.png',data:'assets/hd/lightning-ultimate-v1/atlas.json'} as const;
export const LIGHTNING_ULTIMATE_MANIFEST=manifest;
export type LightningUltimateClip=keyof typeof manifest.clips;
export const LIGHTNING_ULTIMATE_VFX={skyScale:.85,primaryThickness:.8,branchThickness:.55,impactScale:.5,beamEndX:229,segmentLength:80,bend:6,maxSegmentsPerLink:32,segmentBudget:1024} as const;
export function lightningUltimateFrame(clip:LightningUltimateClip,progress:number){
  const c=manifest.clips[clip];let ms=Math.max(0,Math.min(1,progress))*c.durationsMs.reduce((a,b)=>a+b,0);
  for(let i=0;i<c.frameCount;i++){if(ms<c.durationsMs[i]!-1e-7)return `ultimate-${clip}-${i}`;ms-=c.durationsMs[i]!;}
  return `ultimate-${clip}-${c.frameCount-1}`;
}
