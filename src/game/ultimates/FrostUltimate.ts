import { ULTIMATE } from '../config/ultimates';
import type { World } from '../systems/World';
import { freezeForUltimate } from '../systems/UltimateFreeze';
import { distance, type Point } from '../utils/math';
const C=ULTIMATE.frost;
export class FrostUltimate {
  origin:Point={x:0,y:0};radius=0;started=-Infinity;waveAt=Infinity;activeAt=Infinity;endsAt=0;thawsAt=0;
  private slammed=false;private sealed=false;
  start(w:World,viewport:{width:number;height:number}){
    this.origin={x:w.player.x,y:w.player.y};this.radius=Math.hypot(viewport.width,viewport.height)*C.radiusDiagonalRatio;this.started=w.elapsed;
    this.waveAt=w.elapsed+C.invocation+C.creation;this.activeAt=this.waveAt+C.activation;this.endsAt=this.activeAt+C.duration;this.thawsAt=this.endsAt+C.residual;this.slammed=this.sealed=false;
    w.sound('ultimate-frost');
  }
  casting(now:number){return Number.isFinite(this.started)&&now>=this.started&&now<this.activeAt;}
  view(now:number){
    const age=now-this.started;
    const phase=age<0||!Number.isFinite(age)||now>=this.endsAt?'idle':age<C.invocation?'invocation':now<this.waveAt?'creation':now<this.activeAt?'activation':'field';
    const dark=phase==='invocation'?0:Math.max(0,Math.min(1,(age-C.invocation)/C.creation));
    const light=Math.max(0,Math.min(1,(now-this.waveAt)/C.activation));
    return{phase,dark,light,active:now>=this.activeAt&&now<this.endsAt,remaining:Math.max(0,this.endsAt-now)};
  }
  update(w:World){
    if(w.status!=='playing'||!Number.isFinite(this.started))return;
    const now=w.elapsed;
    if(!this.slammed&&now>=this.started+C.invocation&&now<this.endsAt){this.slammed=true;w.sound('ultimate-frost-impact');}
    if(!this.sealed&&now>=this.waveAt&&now<this.endsAt){this.sealed=true;w.sound('ultimate-frost-seal');}
    const view=this.view(now);if(!view.active)return;
    for(const e of w.enemies)if(e.hp>0&&distance(e,this.origin)<=this.radius*view.light+e.radius)freezeForUltimate(e,now,this.thawsAt);
  }
  clear(){this.started=-Infinity;this.waveAt=this.activeAt=Infinity;this.endsAt=this.thawsAt=this.radius=0;this.slammed=this.sealed=false;}
}
