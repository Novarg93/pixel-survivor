import manifest from './mageBlinkManifestV1.json';

export const MAGE_BLINK=manifest;
export const MAGE_BLINK_TEXTURE='mage-blink-v1';
export const MAGE_BLINK_URLS={image:'assets/hd/mage-blink-v1/atlas.png',data:'assets/hd/mage-blink-v1/atlas.json'};
export function mageBlinkFrame(age:number){
 if(!Number.isFinite(age)||age<0||age*1000>=manifest.durationMs)return undefined;
 return Math.min(7,Math.floor((age*1000+1e-7)/manifest.frameMs));
}
