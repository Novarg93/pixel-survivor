import type {World} from '../systems/World';
import {ARMAGEDDON} from '../config/mageAbilities';
import {groundImpactDepth} from './groundImpactDepth';
import type {MageAbilityView} from './MageAbilityArt';
import {MAGE_METEOR as C,MAGE_METEOR_TEXTURE as texture,MAGE_METEOR_OFFSET as offset,mageMeteorFrame,mageMeteorDuration,meteorLightFrame,meteorLandingLightFrame,meteorLightSize} from './mageMeteorPack';

interface Landing {x:number;y:number;radius:number;started:number;keepUntil:number}
// Fixed world targets and copied effect data survive pool reuse; no game clocks.
export class MageMeteorPresentation{
 private run='';private landings=new Map<number,Landing>();
 clear(){this.landings.clear();}
 get tracked(){return this.landings.size;}
 views(w:World,intensity:number,reducedFlash=false):MageAbilityView[]{
  if(this.run!==w.runId){this.clear();this.run=w.runId;}
  if(w.status==='menu'||w.status==='over'){this.clear();return [];}
  const now=w.elapsed,alpha=Math.max(0,Math.min(1,intensity)),ground=groundImpactDepth(w),views:MageAbilityView[]=[];
  const lightAlpha=alpha*C.lightOpacity*(reducedFlash?.6:1);
  for(const [id,b]of this.landings)if(now>=b.keepUntil)this.landings.delete(id);
  for(const e of w.effects)if(e.kind==='meteor'&&e.source==='meteor'&&e.started<=now&&e.expires>now&&!this.landings.has(e.id)&&this.landings.size<96){
   this.landings.set(e.id,{x:e.x,y:e.y,radius:e.radius,started:e.started,keepUntil:e.started+mageMeteorDuration('ground')});
  }
  const view=(clip:'flight'|'impact'|'ground',frame:string,x:number,y:number,opacity:number,depth:number):MageAbilityView=>({texture,frame,x,y,size:clip==='flight'?C.flightSize:C.impactSize,originX:C.clips[clip].pivot.x/C.canvas,originY:C.clips[clip].pivot.y/C.canvas,alpha:opacity,depth});
  for(const i of w.impacts)if(!i.hostile&&i.source==='meteor'){
   const launch=i.launchAt??i.landAt-ARMAGEDDON.delay;if(now<launch||now>=i.landAt)continue;
   const t=Math.max(0,Math.min(1,(now-launch)/Math.max(.001,i.landAt-launch)));
   views.push(view('flight',mageMeteorFrame('flight',now-launch,true),i.x+(1-t)*offset.x,i.y+(1-t)*offset.y,alpha,14.2));
   views.push({texture,frame:meteorLightFrame(t),x:i.x,y:i.y,size:meteorLightSize(i.radius),originY:.5,alpha:lightAlpha,depth:ground-.04,blendMode:'SCREEN'});
  }
  for(const b of this.landings.values()){
   const age=now-b.started;if(age<0)continue;
   if(age<mageMeteorDuration('ground'))views.push(view('ground',mageMeteorFrame('ground',age),b.x,b.y,alpha*Math.min(1,(mageMeteorDuration('ground')-age)/.2),ground));
   if(age<mageMeteorDuration('impact'))views.push(view('impact',mageMeteorFrame('impact',age),b.x,b.y,alpha,ground+.01));
   if(age<mageMeteorDuration('illumination'))views.push({texture,frame:meteorLandingLightFrame(age),x:b.x,y:b.y,size:meteorLightSize(b.radius),originY:.5,alpha:lightAlpha,depth:ground-.04,blendMode:'SCREEN'});
  }
  for(const z of w.zones)if(z.source==='meteor'&&!z.wall&&z.expires>now){
   if([...this.landings.values()].some(b=>now<b.keepUntil&&Math.hypot(b.x-z.x,b.y-z.y)<1))continue;
   views.push(view('ground',C.clips.ground.frames[C.residueFrameIndex]!.name,z.x,z.y,alpha*.25*Math.min(1,(z.expires-now)/.4),ground));
  }
  return views.filter(v=>v.alpha>0);
 }
}
