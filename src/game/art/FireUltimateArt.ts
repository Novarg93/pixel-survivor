import Phaser from 'phaser';
import type { World } from '../systems/World';
import { ULTIMATE } from '../config/ultimates';
import { FIRE_PRESENTATION } from '../ultimates/FireUltimate';
import { enemyVisual, visualDimensions } from './assetRegistry';

const GLOW='living-inferno-light';
// Four reusable batches and one cached 128px light pool; no per-flame objects or timers.
export class FireUltimateArt {
  private ground:Phaser.GameObjects.Graphics;
  private back:Phaser.GameObjects.Graphics;
  private front:Phaser.GameObjects.Graphics;
  private reactions:Phaser.GameObjects.Graphics;
  private light:Phaser.GameObjects.Image;
  private phase='idle';private burning=0;private bursts=0;private tongues=0;private heat=0;
  private ownsTexture=false;
  constructor(private scene:Phaser.Scene){
    if(!scene.textures.exists(GLOW)){
      const texture=scene.textures.createCanvas(GLOW,128,128);
      if(!texture)throw new Error('Unable to create inferno light pool');
      const ctx=texture.context,gradient=ctx.createRadialGradient(64,64,0,64,64,64);
      for(const [stop,color]of [[0,'rgba(255,247,170,.95)'],[.12,'rgba(255,217,75,.8)'],[.32,'rgba(255,147,30,.55)'],[.58,'rgba(234,66,12,.22)'],[.83,'rgba(180,37,8,.055)'],[1,'rgba(160,25,0,0)']] as const)gradient.addColorStop(stop,color);
      ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);texture.refresh();this.ownsTexture=true;
    }
    this.light=scene.add.image(0,0,GLOW).setName('inferno-ground-light').setDepth(-2).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    this.ground=scene.add.graphics().setName('inferno-trail-heat').setDepth(-.7);
    this.back=scene.add.graphics().setName('inferno-back-flames').setDepth(9.65);
    // Body at10, hands at10.05, health at11. Fire never tints or hides the sprite.
    this.front=scene.add.graphics().setName('inferno-body-flames').setDepth(10.02);
    this.reactions=scene.add.graphics().setName('inferno-singe-feedback').setDepth(12.5);
  }
  render(w:World,intensity:number,reducedMotion:boolean,reducedFlash:boolean){
    const ground=this.ground.clear(),back=this.back.clear(),front=this.front.clear(),reactions=this.reactions.clear();
    this.light.setVisible(false);this.phase='idle';this.burning=this.bursts=this.tongues=this.heat=0;
    if(w.ultimate.selected!=='fire'||w.status==='over'||w.status==='menu')return;
    const f=w.ultimate.fire,now=w.elapsed,view=f.view(now),strength=Math.max(0,Math.min(1,intensity)),energy=view.energy*strength;
    this.phase=view.phase;
    const time=reducedMotion?0:now,x=w.player.x,y=w.player.y,pulse=reducedMotion?1:1+.035*Math.sin(time*6),flare=view.ignition*(reducedFlash?.22:1);
    if(energy>0){
      const r=ULTIMATE.fire.radius;
      this.light.setPosition(x,y+5).setDisplaySize(r*2.65*pulse,r*1.95*pulse).setAlpha(energy*(.88+flare*.1)).setVisible(true);
      // Billowing fire is concentrated on the body, never on the gameplay boundary.
      for(let i=0;i<11;i++){
        const offset=(i-5)*2.3,wave=Math.sin(time*8+i*2.1),height=22+(i%4)*3+wave*3+flare*10;
        this.flame(back,x+offset,y+5+(i%3),height,energy*(.55+(i%3)*.1),time+i,5.5);
        this.tongues++;
      }
      for(let i=0;i<7;i++){
        const offset=(i-3)*2.4,height=9+(i%3)*2.5+Math.sin(time*10+i)*2+flare*3;
        this.flame(front,x+offset,y+6,height,energy*.86,time+i*1.7,4);
        this.tongues++;
      }
      if(!reducedMotion){
        for(let i=0;i<9;i++){
          const rise=(time*(.6+i%3*.1)+i*.147)%1,px=x+Math.sin(i*7.3)*16+Math.sin(time*3+i)*3;
          back.fillStyle(i%3?0xffaf39:0xffed98,energy*(1-rise)*.65).fillRect(Math.round(px),Math.round(y+3-rise*37),1,i%3?2:1);
        }
      }
      // Short, faint rising wisps imply hot air without refracting the whole screen.
      const columns=reducedMotion?3:7;
      for(let i=0;i<columns;i++){
        const side=i%2?-1:1,px=x+side*(17+(i%4)*9),py=y+17-(i%3)*12;
        ground.lineStyle(1,i%2?0xffae55:0xffd78a,energy*.11).beginPath().moveTo(px,py);
        for(let j=1;j<=5;j++)ground.lineTo(px+Math.sin(time*4+i+j*1.3)*(reducedMotion?1:3),py-j*4);
        ground.strokePath();this.heat++;
      }
      for(const trail of w.ultimate.trails){
        const alpha=Math.min(1,(trail.expires-now)/.4)*energy*.4;
        if(alpha<=0)continue;
        const steps=Math.min(8,Math.max(1,Math.ceil(Math.hypot(trail.to.x-trail.from.x,trail.to.y-trail.from.y)/12)));
        for(let i=0;i<=steps;i++){
          const t=i/steps,tx=trail.from.x+(trail.to.x-trail.from.x)*t,ty=trail.from.y+(trail.to.y-trail.from.y)*t;
          ground.fillStyle(0xff7e28,alpha*.2).fillEllipse(tx,ty,15,7);
          this.flame(ground,tx,ty,5+(i%3)*2,alpha,time+i,3);
        }
      }
    }
    for(const e of w.enemies){
      const burn=f.burning.get(e.id);if(!burn)continue;
      const alpha=Math.min(1,(burn.until-now)/.16)*strength;
      if(alpha<=0)continue;
      const size=visualDimensions(enemyVisual(e.kind,e.elite,0,e.id)),heavy=!!e.boss||e.kind==='guardian';
      const height=Math.min(heavy?15:12,size.height*.4),foot=e.y+size.height*.34;
      for(const side of [-1,1])this.flame(reactions,e.x+side*size.width*.21,foot,height,alpha*(heavy?.58:.72),time+e.id+side,3.5);
      reactions.fillStyle(0xffd272,alpha*.65).fillRect(Math.round(e.x+Math.sin(e.id*3)*size.width*.2),Math.round(foot-4-(time*8+e.id)%height),1,2);
      this.burning++;
    }
    for(const b of f.bursts){
      const age=(now-b.started)/FIRE_PRESENTATION.burst;if(age<0||age>=1)continue;
      const alpha=(1-age)**1.5*strength,spread=reducedMotion?3:3+age*10;
      this.flame(reactions,b.x,b.y+3,8+(1-age)*7,alpha*.85,time+b.id,4);
      reactions.fillStyle(0xffedb1,alpha*(reducedFlash?.25:.6)).fillEllipse(b.x,b.y,7*(1-age),5*(1-age));
      for(let i=0;i<(reducedMotion?2:5);i++){
        const a=i*2.4+b.id*1.7,px=b.x+Math.cos(a)*spread,py=b.y+Math.sin(a)*spread-age*5;
        reactions.fillStyle(i%2?0xffac42:0xffe5a4,alpha*.8).fillRect(Math.round(px),Math.round(py),1,2);
      }
      this.bursts++;
    }
  }
  private flame(g:Phaser.GameObjects.Graphics,x:number,y:number,h:number,alpha:number,time:number,width:number){
    const bend=Math.sin(time*7)*2;x=Math.round(x);y=Math.round(y);
    g.fillStyle(0xe85619,alpha*.52).fillTriangle(x-width,y+1,x+bend,y-h,x+width,y+1);
    g.fillStyle(0xffa92f,alpha*.84).fillTriangle(x-width*.6,y,x+bend*.7,y-h*.8,x+width*.6,y);
    g.fillStyle(0xffed9c,alpha*.8).fillTriangle(x-width*.28,y,x-bend*.3,y-h*.46,x+width*.28,y);
  }
  diagnostics(){return{phase:this.phase,objects:5,batches:4,radius:ULTIMATE.fire.radius,glowWidth:this.light.displayWidth,glowHeight:this.light.displayHeight,glowAlpha:this.light.visible?this.light.alpha:0,bodyFlames:this.tongues,heatColumns:this.heat,burning:this.burning,bursts:this.bursts,ring:false};}
  destroy(){this.light.destroy();this.ground.destroy();this.back.destroy();this.front.destroy();this.reactions.destroy();if(this.ownsTexture)this.scene.textures.remove(GLOW);}
}
