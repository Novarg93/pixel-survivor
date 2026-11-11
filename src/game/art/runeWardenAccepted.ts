import type {BossFacing,BossPose} from './bossPack';
export const RUNE_ACCEPTED_TEXTURE='rune-warden-v2';
export const RUNE_ACCEPTED_URLS={image:'assets/hd/rune-warden-v2/atlas.png',data:'assets/hd/rune-warden-v2/atlas.json'} as const;
// The preview's release frame9 is aligned with the existing windup end.
export function acceptedRuneCast(facing:BossFacing,pose:BossPose,age:number,remaining:number){
 const index=pose==='windup'?Math.min(8,Math.floor(Math.max(0,age)/Math.max(.001,age+remaining)*9)):Math.min(12,9+Math.floor(Math.max(0,age)/.1));
 return `rune-cast-${facing}-${index}`;
}
export function acceptedRuneFlight(age:number){return `rune-flight-${Math.floor(Math.max(0,age)*10+1e-7)%9}`;}
export const RUNE_FLIGHT_ANGLE=42*Math.PI/180;
