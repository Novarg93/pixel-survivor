import manifest from './ashWardenPixellabManifest.json';
import type {WardenClip} from './ashWardenPack';
import type {FinalMeteor} from '../systems/FinalEncounter';
import {FINAL_BOSS} from '../config/finalBoss';
export const WARDEN_AI=manifest;
export const WARDEN_AI_PAGES=manifest.pages.map(p=>({...p,image:`assets/hd/ash-warden-pixellab-v1/${p.id}.png`,data:`assets/hd/ash-warden-pixellab-v1/${p.id}.json`}));
export const NORTH_SLAM:WardenClip=manifest.clips['north-slam'];
function index(clip:WardenClip,age:number){
 const total=clip.durationsMs.reduce((a,b)=>a+b,0);let t=Math.max(0,age)*1000;t=clip.loop?t%total:Math.min(total-.0001,t);
 for(let i=0;i<clip.durationsMs.length;i++){t-=clip.durationsMs[i]!;if(t< -1e-7)return i;}return clip.frames.length-1;
}
// Match the accepted contact pose to the simulation's exact damage tick.
export function northSlamAge(age:number,hit:number,duration:number){
 const contact=manifest.scene.northHitMs/1000,end=manifest.scene.northActionMs/1000,t=Math.max(0,Math.min(age,duration));
 return t<hit?t/hit*contact:contact+(t-hit)/(duration-hit)*(end-contact);
}
export function wardenMeteorView(m:FinalMeteor){
 if(m.age<0)return null;
 const warning=m.warning??manifest.scene.warningMs/1000,age=m.age-warning;
 const sample=(id:'meteor-flight'|'landing-impact',time:number,x:number,y:number,alpha:number)=>{
  const clip=manifest.clips[id],i=index(clip,time);return{id,index:i,layer:clip.frames[i]!.layers[0]!,x,y,alpha};
 };
 if(!m.landed){
  const views:ReturnType<typeof sample>[]=[];
  if(age>=-.3){const progress=Math.max(0,Math.min(1,(age+.3)/.3)),height=(1-progress)*180;views.push(sample('meteor-flight',progress*.64,m.x-manifest.scene.fallUnit[0]!/manifest.scene.fallUnit[1]!*height,m.y-height,1));}
  return views;
 }
 // Simulation lands with a small epsilon; avoid a blank impact at that boundary.
 return age<.5?[sample('landing-impact',Math.max(0,age),m.x,m.y,1)]:[];
}
// Sparse world-space reticle replaces the large animated ground circle.
export function wardenMeteorWarning(m:FinalMeteor){
 if(m.age<0||m.landed)return null;
 const progress=Math.max(0,Math.min(1,m.age/(m.warning??FINAL_BOSS.meteorWarning)));
 return{x:m.x,y:m.y,radius:FINAL_BOSS.meteorRadius,progress,alpha:.7+.25*progress,style:'crosshair' as const};
}
