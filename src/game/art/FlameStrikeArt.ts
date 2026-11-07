import type Phaser from 'phaser';
import type {World} from '../systems/World';
import {FINAL_BOSS as C} from '../config/finalBoss';
import {FLAME_STRIKE,FLAME_STRIKE_TEXTURE,flameStrikeView} from './flameStrikePack';

export class FlameStrikeArt {
  private glows:Phaser.GameObjects.Image[]=[];
  private images:Phaser.GameObjects.Image[]=[];
  private view:ReturnType<typeof flameStrikeView>=null;
  private active=0;
  constructor(private scene:Phaser.Scene){
    this.glow(0);
  }
  private glow(index:number){return this.glows[index]??(this.glows[index]=this.scene.add.image(0,0,FLAME_STRIKE_TEXTURE,'ground-glow').setName('flame-strike-ground-light').setOrigin(0,.5).setDepth(-.32).setVisible(false));}
  render(w:World,intensity:number,reduced:boolean){
    this.active=0;for(const glow of this.glows)glow.setVisible(false);for(const image of this.images)image?.setVisible(false);
    this.view=w.status==='menu'||w.status==='over'?null:flameStrikeView(w.finalEncounter);
    const v=this.view;if(!v)return;
    // Essential floor warning stays readable with reduced/zero decorative effects.
    if(v.glowAlpha>0)for(const wave of v.waves)this.glow(wave.index).setPosition(v.origin.x,v.origin.y).setDisplaySize(v.glowLength,v.glowWidth).setRotation(wave.rotation).setTint(0xe47b35).setAlpha(v.glowAlpha/v.waves.length).setVisible(true);
    const decor=Math.max(0,Math.min(1,intensity))*(reduced?.6:1),alpha=v.impactAge<=C.swordActive?1:.65+.35*decor;
    for(const segment of v.segments){
      const image=this.images[segment.index]??this.scene.add.image(0,0,FLAME_STRIKE_TEXTURE);this.images[segment.index]=image;
      image.setTexture(FLAME_STRIKE_TEXTURE,segment.frame).setName('flame-strike-eruption').setOrigin(FLAME_STRIKE.pivot[0]!/image.frame.realWidth,FLAME_STRIKE.pivot[1]!/image.frame.realHeight).setPosition(segment.x,segment.y).setScale(FLAME_STRIKE.worldScale).setRotation(0).setDepth(segment.y/10000+.0002).setAlpha(alpha).setVisible(true);
      this.active++;
    }
  }
  diagnostics(){const light=this.glows[0]!;return{view:this.view,activeImages:this.active+this.glows.filter(g=>g.visible).length,pooledImages:this.images.filter(Boolean).length+this.glows.length,atlasBytes:FLAME_STRIKE.rgbaBytes,groundLight:{visible:light.visible,alpha:light.alpha,rotation:light.rotation},groundLights:this.glows.filter(g=>g.visible).map(g=>({x:g.x,y:g.y,alpha:g.alpha,rotation:g.rotation})),segments:this.images.filter(image=>image?.visible).map(image=>({x:image.x,y:image.y,frame:image.frame.name,rotation:image.rotation,scale:image.scaleX}))};}
  destroy(){for(const glow of this.glows)glow.destroy();for(const image of this.images)image?.destroy();this.images=[];this.glows=[];this.view=null;}
}
