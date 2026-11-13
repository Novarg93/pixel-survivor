import manifest from './warriorHeroManifest.json';
import type {MageDirection} from './MageHeroAnimation';
import {warriorSkillSelection} from './warriorSkillsPack';

export const WARRIOR_HERO=manifest;
export const WARRIOR_ATTACKS=['c1','c3','heavy'] as const;
export type WarriorAttack=typeof WARRIOR_ATTACKS[number];
export type WarriorMotion='idle'|'run'|'attack'|'charge';
export interface WarriorSlash {phase:number;angle:number;radius:number}
export const warriorHeroTexture=(page:number)=>`warrior-hero-v1-${page}`;
export const warriorHeroUrls=(page:number)=>({image:`assets/hd/warrior-hero-v1/${page}.png`,data:`assets/hd/warrior-hero-v1/${page}.json`});
export function warriorClip(direction:MageDirection,motion:WarriorMotion,variant:WarriorAttack='c1'){
 if(motion==='charge')return 'legacy-charge';
 const route=manifest.routes[direction],group=manifest.sources[route.group as 'front'|'north'];
 return motion==='attack'?group.attack[variant]:group[motion];
}
export function warriorHeroSelection(direction:MageDirection,motion:WarriorMotion,age:number,variant:WarriorAttack='c1'){
 if(motion==='charge')return warriorSkillSelection(direction,'charge',age);
 const id=warriorClip(direction,motion,variant),clip=manifest.clips[id as keyof typeof manifest.clips];
 const tick=Math.floor(Math.max(0,age)*1000/clip.frameMs+1e-7);
 const index=clip.loop?tick%clip.frames.length:Math.min(clip.frames.length-1,tick);
 const frame=clip.frames[index]!,location=manifest.locations[frame as keyof typeof manifest.locations],flipX=manifest.routes[direction].flipX;
 const slashStart=clip.impactFrame-1,phase=(Math.max(0,age)*1000/clip.frameMs-slashStart)/3;
 return {id,index,frame,texture:warriorHeroTexture(location.page),flipX,origin:{x:(flipX?manifest.canvas-clip.pivot.x:clip.pivot.x)/manifest.canvas,y:clip.pivot.y/manifest.canvas},duration:clip.periodMs/1000,slashPhase:motion==='attack'&&phase>=0&&phase<1?phase:undefined};
}
