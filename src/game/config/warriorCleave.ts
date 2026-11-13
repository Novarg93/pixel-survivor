import hero from '../art/warriorHeroManifest.json';
import skills from '../art/warriorSkillsManifest.json';

export type WarriorDirection=keyof typeof hero.routes;
export type CleaveVariant='c1'|'c3'|'heavy'|'skill';
export interface CleaveSwing{
 sequence:number;variant:CleaveVariant;direction:WarriorDirection;angle:number;
 started:number;duration:number;nativeDuration:number;hitAt:number;contactEnd:number;hit:boolean;radius:number;damage:number;
}
const directions=['east','south-east','south','south-west','west','north-west','north','north-east'] as const;
const variants=['c1','c3','heavy','skill'] as const;
// Gameplay and rendering share the accepted clip's contact frame and time scale.
export function cleaveTiming(sequence:number,angle:number,cooldown:number){
 const direction=directions[(Math.round(angle/(Math.PI/4))+8)%8]!;
 const variant=variants[(sequence-1)%variants.length]!;
 const group=hero.routes[direction].group as 'front'|'north';
 const id=variant==='skill'?skills.skills.cleave[group]:hero.sources[group].attack[variant];
 const clip=variant==='skill'?skills.clips[id as keyof typeof skills.clips]:hero.clips[id as keyof typeof hero.clips];
 const nativeDuration=clip.periodMs/1000,duration=Math.min(nativeDuration,Math.max(.12,cooldown));
 return {sequence,variant,direction,angle,nativeDuration,duration,contact:duration*(clip.impactFrame-1)/clip.frames.length,contactEnd:duration*(clip.impactFrame+1)/clip.frames.length};
}
