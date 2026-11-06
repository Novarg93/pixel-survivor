import { ULTIMATE } from '../config/ultimates';
import type { World } from '../systems/World';
import { freezeForUltimate } from '../systems/UltimateFreeze';
import { distance, type Point } from '../utils/math';
const C=ULTIMATE.frost;
export class FrostUltimate {
  origin:Point={x:0,y:0};radius=0;started=-Infinity;waveAt=Infinity;activeAt=Infinity;endsAt=0;thawsAt=0;
  private slammed=false;private sealed=false;
  private waveRadius=-1;private waveComplete=false;private hits=new Set<number>();
  start(w:World,viewport:{width:number;height:number}){
    this.origin={x:w.player.x,y:w.player.y};this.radius=Math.hypot(viewport.width,viewport.height)*C.radiusDiagonalRatio;this.started=w.elapsed;
    this.waveAt=w.elapsed+C.invocation+C.creation;this.activeAt=this.waveAt+C.activation;this.endsAt=this.activeAt+C.duration;this.thawsAt=this.endsAt+C.residual;this.slammed=this.sealed=false;
    this.waveRadius=-1;this.waveComplete=false;this.hits.clear();
    w.sound('ultimate-frost');
  }
  casting(now:number){return Number.isFinite(this.started)&&now>=this.started&&now<this.activeAt;}
  view(now:number){
    const age=now-this.started;
    const phase=age<0||!Number.isFinite(age)||now>=this.endsAt?'idle':age<C.invocation?'invocation':now<this.waveAt?'creation':now<this.activeAt?'activation':'field';
    const dark=phase==='invocation'?0:Math.max(0,Math.min(1,(age-C.invocation)/C.creation));
    const light=Math.max(0,Math.min(1,(now-this.waveAt)/C.activation));
    const avalancheAge=now-this.activeAt-C.waveDelay;
    const avalanche=Math.max(0,Math.min(1,avalancheAge/C.waveDuration));
    return{phase,dark,light,active:now>=this.activeAt&&now<this.endsAt,remaining:Math.max(0,this.endsAt-now),avalanche,avalancheVisible:phase==='field'&&avalancheAge>=0&&avalancheAge<C.waveDuration};
  }
  update(w:World){
    if(w.status!=='playing'||!Number.isFinite(this.started))return;
    const now=w.elapsed;
    if(!this.slammed&&now>=this.started+C.invocation&&now<this.endsAt){this.slammed=true;w.sound('ultimate-frost-impact');}
    if(!this.sealed&&now>=this.waveAt&&now<this.endsAt){this.sealed=true;w.sound('ultimate-frost-seal');}
    const view=this.view(now);if(!view.active)return;
    for(const e of w.enemies)if(e.hp>0&&distance(e,this.origin)<=this.radius*view.light+e.radius)freezeForUltimate(e,now,this.thawsAt);
    if(now<this.activeAt+C.waveDelay||this.waveComplete)return;
    const radius=this.radius*view.avalanche;
    // Swept front: low frame rates cannot skip targets; late entrants behind it are not hit.
    for(const e of [...w.enemies]){
      const d=distance(e,this.origin);
      if(e.hp<=0||this.hits.has(e.id)||this.hits.size>=156||d-e.radius>radius||d+e.radius<this.waveRadius)continue;
      this.hits.add(e.id);
      const cap=e.boss||e.kind==='guardian'?e.maxHp*C.bossFraction:Infinity;
      w.damageEnemy(e,C.damage*w.stats.damage,'ultimate-frost',cap);
    }
    this.waveRadius=radius;this.waveComplete=view.avalanche>=1;
  }
  clear(){this.started=-Infinity;this.waveAt=this.activeAt=Infinity;this.endsAt=this.thawsAt=this.radius=0;this.slammed=this.sealed=false;this.waveRadius=-1;this.waveComplete=false;this.hits.clear();}
}
