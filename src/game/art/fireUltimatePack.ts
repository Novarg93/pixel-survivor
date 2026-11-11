export const FIRE_ULTIMATE_CLIPS=['fire-mantle','fire-perimeter'] as const;
export function fireUltimateFrame(clip:typeof FIRE_ULTIMATE_CLIPS[number],age:number,reduced=false){return `pixel-survivor-${clip} ${reduced?0:Math.floor(Math.max(0,age)*16)%16}.png`;}
export function preloadFireUltimate(scene:import('phaser').Scene){for(const key of FIRE_ULTIMATE_CLIPS)if(!scene.textures.exists(key))scene.load.atlas(key,import.meta.env.BASE_URL+`assets/hd/fire-ultimate-v1/${key}.png`,import.meta.env.BASE_URL+`assets/hd/fire-ultimate-v1/${key}.json`);}
