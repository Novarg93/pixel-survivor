import type Phaser from 'phaser';
import type {World} from '../systems/World';
import {REGULAR_LIGHTNING_TEXTURE,REGULAR_LIGHTNING_MANIFEST as pack,REGULAR_LIGHTNING_VFX as C,regularLightningFrame} from './regularLightningPack';
export function regularLightningViews(w:World,intensity:number){
  if(w.status==='menu'||w.status==='over')return [];
  return w.effects.flatMap(e=>{
    if(e.kind!=='lightning'||!e.target||e.started>w.elapsed||e.expires<=w.elapsed)return [];
    const dx=e.target.x-e.x,dy=e.target.y-e.y,length=Math.hypot(dx,dy);if(length<.01)return [];
    return [{frame:regularLightningFrame((w.elapsed-e.started)/e.duration),x:e.x,y:e.y,toX:e.target.x,toY:e.target.y,length,rotation:Math.atan2(dy,dx),width:pack.canvas.width*length/(C.endX-C.startX),height:pack.canvas.height*C.thicknessScale,alpha:Math.max(0,Math.min(1,intensity))}];
  });
}
export class RegularLightningArt{
  private images:Phaser.GameObjects.Image[]=[];
  private active:ReturnType<typeof regularLightningViews>=[];
  constructor(private scene:Phaser.Scene){}
  render(w:World,intensity:number){
    this.active=regularLightningViews(w,intensity);
    for(const [i,v]of this.active.entries()){
      const image=this.images[i]??this.scene.add.image(0,0,REGULAR_LIGHTNING_TEXTURE,v.frame).setName('mage-regular-lightning');this.images[i]=image;
      image.setTexture(REGULAR_LIGHTNING_TEXTURE,v.frame).setOrigin(C.startX/pack.canvas.width,C.axisY/pack.canvas.height).setPosition(v.x,v.y).setRotation(v.rotation).setDisplaySize(v.width,v.height).setDepth(14).setAlpha(v.alpha).setVisible(true).setActive(true);
    }
    for(let i=this.active.length;i<this.images.length;i++)this.images[i]!.setVisible(false).setActive(false);
  }
  diagnostics(){return{active:this.active,allocated:this.images.length,atlasBytes:pack.rgbaBytes};}
  destroy(){for(const image of this.images)image.destroy();this.images=[];this.active=[];}
}
