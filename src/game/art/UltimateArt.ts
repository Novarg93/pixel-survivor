import Phaser from 'phaser';
import type { World } from '../systems/World';
import type { Point } from '../utils/math';
import {LightningUltimateArt} from './LightningUltimateArt';
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
  private lightning:LightningUltimateArt;
  constructor(private scene:Phaser.Scene){this.lightning=new LightningUltimateArt(scene);this.g=scene.add.graphics().setName('ultimate-feedback').setDepth(14.2);this.lighting=scene.add.graphics().setName('lightning-world-light').setDepth(9);this.ground=new LightningGroundArt(scene);this.frost=new FrostUltimateArt(scene);this.fire=new FireUltimateArt(scene);}
  render(w:World,intensity:number,hands:readonly Point[],reducedMotion:boolean,reducedFlash:boolean,hero?:Phaser.GameObjects.Sprite){
    const g=this.g.clear(),u=w.ultimate,now=w.elapsed, strength=Math.max(.35,intensity), live=w.status!=='over'&&!!u.selected;
    const state=this.state=lightningCinematic(now,u.started,u.released,live&&u.selected==='lightning',intensity,reducedMotion||reducedFlash);
    this.ground.render(u.ground,now,live&&u.selected==='lightning',intensity,reducedMotion||reducedFlash);
    this.frost.render(w,intensity,reducedMotion||reducedFlash);
    this.fire.render(w,intensity,reducedMotion,reducedFlash);
    this.lightning.render(w,intensity,hands,reducedMotion||reducedFlash,hero?.depth??10);
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
  diagnostics(){return{lightning:this.lightning.diagnostics(),batches:9,fire:this.fire.diagnostics(),ground:this.ground.diagnostics(),frost:this.frost.diagnostics(),allocatedAsh:this.ash.length,activeAsh:this.ashCount,allocatedAura:this.glow.length,activeAura:this.glow.filter(i=>i.visible).length,...this.state};}
  destroy(){this.lightning.destroy();this.g.destroy();this.lighting.destroy();this.ground.destroy();this.frost.destroy();this.fire.destroy();for(const image of [...this.ash,...this.glow])image.destroy();this.ash=[];this.glow=[];}
}
