import type { FinalAttackKind } from '../systems/FinalEncounter';
export const ASH_TEXTURE='hd-ash-guard';
export const ASH_URLS={image:'assets/hd/ash-guard.png',data:'assets/hd/ash-guard.json'};
export const ASH_CLIPS={spawn:6,idle:4,walk:6,chargeWindup:5,chargeTravel:3,chargeBrake:3,swordWindup:6,swordActive:5,recovery:4,ritualEnter:5,ritualChannel:4,meteorCast:5,shieldBreak:5,phaseTransition:6,phase3Idle:3,phase3Walk:2,hit:2,death:10} as const;
export type AshPose=keyof typeof ASH_CLIPS;
export type AshFacing='down'|'up'|'side';
export function ashPose(kind:FinalAttackKind,moving=false,phase3=false):AshPose{return kind==='approach'?(phase3?(moving?'phase3Walk':'phase3Idle'):moving?'walk':'idle'):kind==='basicMelee'?'swordActive':kind==='armageddonCast'?'meteorCast':kind;}
export function ashFrame(pose:AshPose,facing:AshFacing,age:number,duration=1){
  const loop=pose==='walk'||pose==='idle'||pose==='phase3Idle'||pose==='phase3Walk'||pose==='ritualChannel'||pose==='chargeTravel';
  const rate=pose==='walk'?8:pose==='phase3Walk'?4:pose==='idle'||pose==='phase3Idle'?3:6;
  const n=loop?Math.floor(Math.max(0,age)*rate)%ASH_CLIPS[pose]:Math.min(ASH_CLIPS[pose]-1,Math.floor(Math.max(0,age)/Math.max(.01,duration)*ASH_CLIPS[pose]));
  return `ash-${facing}-${pose}-${n}`;
}
export function ashLayout(){
  const frames:{name:string;pose:AshPose;facing:AshFacing;index:number;frame:{x:number;y:number;w:number;h:number}}[]=[];
  for(const facing of ['down','up','side'] as const)for(const pose of Object.keys(ASH_CLIPS) as AshPose[])for(let index=0;index<ASH_CLIPS[pose];index++){
    const n=frames.length;frames.push({name:`ash-${facing}-${pose}-${index}`,pose,facing,index,frame:{x:n%18*128,y:Math.floor(n/18)*128,w:128,h:128}});
  }
  return{width:2304,height:Math.ceil(frames.length/18)*128,frames};
}
