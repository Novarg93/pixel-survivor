import type {World} from '../systems/World';
import type {MageAbilityView} from './MageAbilityArt';
import {PLAYER_VISUALS} from '../config/playerVisuals';
import {MAGE_SHIELD_NOVA as C,MAGE_SHIELD_NOVA_TEXTURE as texture,mageShieldNovaFrame,mageShieldNovaDuration} from './mageShieldNovaPack';

// One shell following the actor. State only observes Absorb and World.elapsed;
// refreshes never stack sprites or change shield mechanics.
export class MageShieldPresentation{
 private run='';private alive=false;private started=0;private until=0;private ended?:number;
 clear(){this.alive=false;this.started=this.until=0;this.ended=undefined;}
 views(w:World,intensity:number,reducedFlash=false):MageAbilityView[]{
  if(this.run!==w.runId){this.clear();this.run=w.runId;}
  if(w.character!=='mage'||w.status==='menu'||w.status==='over'||!PLAYER_VISUALS.arcaneShield){this.clear();return [];}
  const now=w.elapsed,active=w.shield.absorbValue(now)>0,fade=mageShieldNovaDuration('shield-fade');
  if(active){
   if(!this.alive){
    const cast=w.effects.find(e=>e.kind==='shield'&&e.radius===25&&e.started<=now&&now-e.started<fade);
    this.started=cast?.started??now-fade;
   }
   this.alive=true;this.until=w.shield.absorbUntil;this.ended=undefined;
  }else if(this.alive){this.alive=false;this.ended=Math.min(now,this.until);}
  const alpha=Number.isFinite(intensity)?Math.max(0,Math.min(1,intensity))*(reducedFlash?.65:1):0;
  if(alpha===0||w.ultimate.selected==='fire'&&w.ultimate.fire.view(now).phase!=='idle')return [];
  let frame:string;
  if(this.alive){const age=Math.max(0,now-this.started);frame=age<fade-1e-7?mageShieldNovaFrame('shield-fade',age,true):mageShieldNovaFrame('shield-loop',age-fade);}
  else if(this.ended!==undefined&&now-this.ended<fade-1e-7)frame=mageShieldNovaFrame('shield-fade',now-this.ended);
  else return [];
  return [{texture,frame,x:w.player.x,y:w.player.y,size:C.canvas*C.shieldScale,originX:64/C.canvas,originY:108/C.canvas,alpha,depth:10.03}];
 }
}
