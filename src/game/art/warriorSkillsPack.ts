import manifest from './warriorSkillsManifest.json';
import type {MageDirection} from './MageHeroAnimation';

export const WARRIOR_SKILLS=manifest;
export type WarriorSkill=keyof typeof manifest.skills;
export const warriorSkillsTexture=(page:number)=>`warrior-skills-v1-${page}`;
export const warriorSkillsUrls=(page:number)=>({image:`assets/hd/warrior-skills-v1/${page}.png`,data:`assets/hd/warrior-skills-v1/${page}.json`});
export function warriorSkillSelection(direction:MageDirection,skill:WarriorSkill,age:number){
 const route=manifest.routes[direction],id=manifest.skills[skill][route.group as 'front'|'north'];
 const clip=manifest.clips[id as keyof typeof manifest.clips];
 // Charge retains all poses within the real 180ms dash, independent of source preview FPS.
 const duration=skill==='charge'?.18:clip.periodMs/1000;
 const index=Math.min(clip.frames.length-1,Math.floor(Math.max(0,age)/duration*clip.frames.length+1e-7));
 const frame=clip.frames[index]!,location=manifest.locations[frame as keyof typeof manifest.locations];
 return {id,index,frame,texture:warriorSkillsTexture(location.page),flipX:route.flip,origin:{x:(route.flip?manifest.canvas-clip.pivot.x:clip.pivot.x)/manifest.canvas,y:clip.pivot.y/manifest.canvas},duration,slashPhase:undefined};
}
