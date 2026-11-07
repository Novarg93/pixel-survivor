import manifest from './flameStrikeManifest.json';
import type {FinalEncounter} from '../systems/FinalEncounter';
import {FINAL_BOSS as C} from '../config/finalBoss';

export const FLAME_STRIKE=manifest;
export const FLAME_STRIKE_TEXTURE='ash-warden-flame-strike-v1';
export const FLAME_STRIKE_URLS={image:'assets/hd/ash-warden-flame-strike-v1/atlas.png',data:'assets/hd/ash-warden-flame-strike-v1/atlas.json'};
export const flameDuration=FLAME_STRIKE.durationsMs.reduce((a,b)=>a+b,0)/1000;
export function flameIndex(age:number){
  if(age<0||age>=flameDuration)return -1;
  let ms=age*1000;for(let i=0;i<FLAME_STRIKE.frames.length;i++){ms-=FLAME_STRIKE.durationsMs[i]!;if(ms<-.000001)return i;}return FLAME_STRIKE.frames.length-1;
}
/** Presentation only. No hit checks, timers, damage or persistent spawned entities. */
export function flameStrikeView(f:FinalEncounter){
  const a=f.attack,e=f.boss;
  if(!e||f.pending||!['phase1','phase2','phase3'].includes(f.phase)||!['swordWindup','swordActive','recovery'].includes(a.kind))return null;
  const impactAge=a.kind==='swordWindup'?a.age-C.swordWindup:a.kind==='swordActive'?a.age:C.swordActive+a.age;
  const glowAlpha=a.kind==='swordWindup'?.11+.09*Math.min(1,a.age/C.swordWindup):a.kind==='swordActive'?.24:.16*Math.max(0,1-impactAge/.35);
  const waves=f.swordDirections.map((aim,index)=>({index,direction:aim,rotation:Math.atan2(aim.y,aim.x)})),segments=[];
  for(const wave of waves)for(let i=0;i<FLAME_STRIKE.segments;i++){
    const delay=FLAME_STRIKE.propagationMs/1000*i/(FLAME_STRIKE.segments-1),age=impactAge+FLAME_STRIKE.leadMs/1000-delay,index=flameIndex(age),frame=FLAME_STRIKE.frames[index];
    if(index<0||!frame)continue;
    const distance=C.swordRadius*(i+.5)/FLAME_STRIKE.segments;
    segments.push({index:wave.index*FLAME_STRIKE.segments+i,waveIndex:wave.index,frameIndex:index,frame,age,delay,x:e.x+wave.direction.x*distance,y:e.y+wave.direction.y*distance});
  }
  return{impactAge,origin:{x:e.x,y:e.y},rotation:Math.atan2(a.direction.y,a.direction.x),waves,glowAlpha,glowLength:C.swordRadius,glowWidth:C.swordWidth+12,segments};
}
