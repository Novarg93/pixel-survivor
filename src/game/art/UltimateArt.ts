import Phaser from 'phaser';
import type { World } from '../systems/World';
import type { Point } from '../utils/math';
import { ULTIMATE as C } from '../config/ultimates';
import { enemyVisual, visualDimensions } from './assetRegistry';
import { lightningCinematic } from '../ultimates/lightningCinematic';
import { LightningGroundArt } from './LightningGroundArt';
import { FrostUltimateArt } from './FrostUltimateArt';
import { FireUltimateArt } from './FireUltimateArt';

// One batch and sixteen reusable ash silhouettes. No emitters, timers, tweens or gameplay writes.
export class UltimateArt {
  private g: Phaser.GameObjects.Graphics;
  private ash: Phaser.GameObjects.Image[]=[];
  private ashCount=0;
  private lighting: Phaser.GameObjects.Graphics;
  private glow: Phaser.GameObjects.Image[]=[];
  private state=lightningCinematic(0,-Infinity,-Infinity,false);
  private ground:LightningGroundArt;
  private frost:FrostUltimateArt;
  private fire:FireUltimateArt;
  constructor(private scene:Phaser.Scene){this.g=scene.add.graphics().setName('ultimate-feedback').setDepth(14.2);this.lighting=scene.add.graphics().setName('lightning-world-light').setDepth(9);this.ground=new LightningGroundArt(scene);this.frost=new FrostUltimateArt(scene);this.fire=new FireUltimateArt(scene);}
  render(w:World,intensity:number,hands:readonly Point[],reducedMotion:boolean,reducedFlash:boolean,hero?:Phaser.GameObjects.Sprite){
    const g=this.g.clear(),u=w.ultimate,now=w.elapsed,age=now-u.started, strength=Math.max(.35,intensity), live=w.status!=='over'&&!!u.selected;
    const state=this.state=lightningCinematic(now,u.started,u.released,live&&u.selected==='lightning',intensity,reducedMotion||reducedFlash);
    this.ground.render(u.ground,now,live&&u.selected==='lightning',intensity,reducedMotion||reducedFlash);
    this.frost.render(w,intensity,reducedMotion||reducedFlash);
    this.fire.render(w,intensity,reducedMotion,reducedFlash);
    this.lighting.clear();
    if(state.dim>0||state.flash>0){
      const camera=this.scene.cameras.main,area=camera.worldView;
      // World-space bounds follow camera zoom/resize. HUD is Vue; hostile tells depth20.
      this.lighting.fillStyle(0x060c21,state.dim).fillRect(area.x-8,area.y-8,area.width+16,area.height+16);
      this.lighting.fillStyle(0xd5f3ff,state.flash).fillRect(area.x-8,area.y-8,area.width+16,area.height+16);
    }
    for(let i=0;i<2;i++){
      if(state.aura&&hero){
        const image=this.glow[i]??this.scene.add.image(0,0,hero.texture.key,hero.frame.name).setName('lightning-silhouette');this.glow[i]=image;
        image.setTexture(hero.texture.key,hero.frame.name).setPosition(hero.x,hero.y).setOrigin(hero.originX,hero.originY).setFlipX(hero.flipX)
          .setDisplaySize(hero.displayWidth*(i?1.035:1.11),hero.displayHeight*(i?1.025:1.06)).setTint(i?0xe6fcff:0x419dff).setTintMode(Phaser.TintModes.FILL)
          .setAlpha((i?.7:.4)*state.auraStrength*Math.max(0,intensity)).setDepth(9.8+i*.05).setVisible(true).setActive(true);
      }else this.glow[i]?.setVisible(false).setActive(false);
    }
    this.ashCount=0;
    if(live){
      const palm=hands.length?{x:hands.reduce((s,p)=>s+p.x,0)/hands.length,y:hands.reduce((s,p)=>s+p.y,0)/hands.length}:{x:w.player.x+w.facing.x*8,y:w.player.y-7};
      if(u.selected==='lightning'){
        const hand=hands.length?hands.reduce((a,b)=>state.casting?(a.y<b.y?a:b):((a.x-u.origin.x)*u.direction.x+(a.y-u.origin.y)*u.direction.y>(b.x-u.origin.x)*u.direction.x+(b.y-u.origin.y)*u.direction.y?a:b)):palm;
        if(state.casting){
          // Small silhouette-following glow, never a radial gameplay aura.
          if(state.sky){
            const top=this.scene.cameras.main.worldView.top-16;
            this.bolt({x:hand.x-9,y:top},hand,age,7,state.skyAlpha*intensity,reducedMotion);
            for(const side of [-1,1])this.bolt({x:hand.x+side*26,y:top+20},{x:hand.x-4,y:hand.y-45},age+side,1.5,state.skyAlpha*intensity*.65,reducedMotion);
            g.fillStyle(0xe5fbff,state.skyAlpha*(reducedFlash?.25:.7)*intensity).fillEllipse(hand.x,hand.y,13,9);
          }
          g.fillStyle(0xe3faff,.9*intensity).fillRect(Math.round(hand.x)-2,Math.round(hand.y)-2,4,4);
          if(state.aura){
            const x=w.player.x,y=w.player.y,phase=reducedMotion?0:Math.floor(age*32),alpha=intensity*state.auraStrength;
            for(const side of [-1,1]){
              const points=[{x:x+side*4,y:y-24},{x:x+side*7,y:y-17},{x:x+side*6,y:y-10},{x:x+side*8,y:y-3},{x:x+side*4,y:y+5}];
              for(let i=0;i<points.length-1;i++)this.bolt(points[i],points[i+1],age+i,1,alpha*.65,reducedMotion);
              const p=points[phase%points.length];this.bolt(p,{x:p.x+side*4,y:p.y-3},age,1,alpha,reducedMotion);
            }
            this.bolt(hand,{x:x+3,y:y-5},age,1.2,alpha*.7,reducedMotion);
          }else for(let i=0;i<4;i++){const a=i*Math.PI/2+age*3,r=4+(1-age/C.lightning.invocation)*4;g.fillStyle(0x88c7ff,.7*intensity).fillRect(Math.round(hand.x+Math.cos(a)*r),Math.round(hand.y+Math.sin(a)*r),1,2);}
        }else{
          const t=now-u.released,hold=C.lightning.reveal+C.lightning.hold,fade=t<hold?1:Math.max(0,1-(t-hold)/C.lightning.fade);
          if(t>=0&&fade>0){
            for(const [i,n]of u.nodes.entries()){
              const alpha=fade*Math.max(0,intensity)*(reducedFlash?.55:1)*(i===0?1:Math.min(1,t/C.lightning.reveal));
              this.bolt(i===0?hand:n.from,n.at,t,i===0?9:2.1,alpha,reducedMotion);
              g.lineStyle(1,0xc6f5ff,alpha*.8).strokeCircle(n.at.x,n.at.y,4+Math.min(8,t*60));
              if(!reducedFlash)g.fillStyle(0xbdefff,alpha*.12).fillCircle(n.at.x,n.at.y,7);
            }
          }
        }
      }

      for(const a of u.ashes){
        const t=(now-a.started)/.85;if(t<0||t>=1)continue;
        if(this.ashCount<16){const v=enemyVisual(a.kind,a.elite,0,a.id),size=visualDimensions(v),image=this.ash[this.ashCount]??this.scene.add.image(0,0,v.texture,v.frame);this.ash[this.ashCount++]=image;
          image.setTexture(v.texture,v.frame).setPosition(a.at.x,a.at.y-t*4).setOrigin(.5).setDisplaySize(size.width,size.height*(1-t*.65)).setTint(0x6e7981).setAlpha(Math.max(0,1-t*2.5)).setDepth(a.at.y/10000+.1).setVisible(true).setActive(true);
        }
        g.fillStyle(0x555d62,(1-t)*strength*.3).fillEllipse(a.at.x,a.at.y+6,12,3);
        for(let i=0;i<5;i++){const x=a.at.x+(i-2)*(2+t*4),y=a.at.y-i%3*3-t*(reducedMotion?4:19);g.fillStyle(i%2?0xa8b5bc:0x747e87,(1-t)*strength*.8).fillRect(Math.round(x),Math.round(y),2,2);}
      }
    }
    for(let i=this.ashCount;i<this.ash.length;i++)this.ash[i].setVisible(false).setActive(false);
  }
  private bolt(from:Point,to:Point,time:number,width:number,alpha:number,reduced:boolean){
    const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy)||1,g=this.g,phase=reduced?0:Math.floor(time*24);
    for(const [stroke,color,mul]of [[width+4,0x3e83cf,.3],[width,0x8dd5ff,.9],[Math.max(.7,width*.34),0xe7fbff,1]]){
      g.lineStyle(stroke,color,alpha*mul).beginPath().moveTo(Math.round(from.x),Math.round(from.y));
      for(let i=1;i<=5;i++){const p=i/5,offset=i===5?0:(((i*13+phase*7)%11)-5)*1.3*Math.min(1,len/30);g.lineTo(Math.round(from.x+dx*p-dy/len*offset),Math.round(from.y+dy*p+dx/len*offset));}g.strokePath();
    }
  }
  diagnostics(){return{batches:9,fire:this.fire.diagnostics(),ground:this.ground.diagnostics(),frost:this.frost.diagnostics(),allocatedAsh:this.ash.length,activeAsh:this.ashCount,allocatedAura:this.glow.length,activeAura:this.glow.filter(i=>i.visible).length,...this.state};}
  destroy(){this.g.destroy();this.lighting.destroy();this.ground.destroy();this.frost.destroy();this.fire.destroy();for(const image of [...this.ash,...this.glow])image.destroy();this.ash=[];this.glow=[];}
}
