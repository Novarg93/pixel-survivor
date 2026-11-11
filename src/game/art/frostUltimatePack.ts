import {ULTIMATE} from '../config/ultimates';
import type {World} from '../systems/World';
import {groundImpactDepth} from './groundImpactDepth';
export const FROST_ULTIMATE_CLIPS=['ice-crystal','ice-wave'] as const;
export const FROST_APPEARANCE={delay:ULTIMATE.frost.invocation,duration:1,fps:16,frames:16} as const;
export function frostUltimateFrame(clip:typeof FROST_ULTIMATE_CLIPS[number],age:number,reduced=false){return `pixel-survivor-${clip} ${reduced?0:Math.min(15,Math.floor(Math.max(0,age)*16))}.png`;}
export function preloadFrostUltimate(scene:import('phaser').Scene){for(const key of FROST_ULTIMATE_CLIPS)if(!scene.textures.exists(key))scene.load.atlas(key,import.meta.env.BASE_URL+`assets/hd/frost-ultimate-v1/${key}.png`,import.meta.env.BASE_URL+`assets/hd/frost-ultimate-v1/${key}.json`);}
function live(w:World,intensity:number){return intensity>0&&w.status!=='menu'&&w.status!=='over'&&w.ultimate.selected==='frost'&&w.ultimate.frost.view(w.elapsed).phase!=='idle';}
export function frostUltimateNovaView(w:World,intensity:number){
 const f=w.ultimate.frost,age=w.elapsed-f.started-FROST_APPEARANCE.delay;
 if(!live(w,intensity)||age<0||age>=1-1e-7)return null;
 return {frame:frostUltimateFrame('ice-wave',age),x:f.origin.x,y:f.origin.y,size:f.radius*512/225,alpha:Math.min(1,intensity),depth:groundImpactDepth(w)+.02};
}
export function frostUltimateRuneView(w:World,intensity:number,reduced=false){
 const f=w.ultimate.frost,age=w.elapsed-f.started-FROST_APPEARANCE.delay;
 if(!live(w,intensity)||age<0)return null;
 return {frame:frostUltimateFrame('ice-crystal',age%1,reduced),x:f.origin.x,y:f.origin.y,size:f.radius*512/220*Math.min(1,(8+217*Math.min(1,age))/220),
  reveal:f.radius*Math.min(1,(8+217*Math.min(1,age))/220),alpha:Math.min(1,intensity)*.7*Math.min(1,Math.max(0,(f.endsAt-w.elapsed)/.3)),depth:groundImpactDepth(w)+.01};
}
