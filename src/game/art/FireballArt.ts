import type Phaser from 'phaser';
import type {World} from '../systems/World';
import {FIREBALL_TEXTURE,FIREBALL_VFX as C,FIREBALL_MANIFEST,fireballClipFrame} from './fireballPack';
import {groundImpactDepth} from './groundImpactDepth';
export function fireballImpactViews(w:World,intensity:number){
  if(w.status==='menu'||w.status==='over')return [];
  const depth=groundImpactDepth(w)+.01;
  return w.effects.filter(e=>e.kind==='fireball-impact'&&e.started<=w.elapsed&&e.expires>w.elapsed).map(e=>({frame:fireballClipFrame('explosion',w.elapsed-e.started),x:e.x,y:e.y,rotation:e.target?Math.atan2(e.target.y,e.target.x):0,alpha:Math.max(.45,Math.min(1,intensity)),depth}));
}
export class FireballArt{
  private images:Phaser.GameObjects.Image[]=[];
  private active:ReturnType<typeof fireballImpactViews>=[];
  constructor(private scene:Phaser.Scene){}
  render(w:World,intensity:number){
    this.active=fireballImpactViews(w,intensity);
    for(const [i,v]of this.active.entries()){
      const image=this.images[i]??this.scene.add.image(0,0,FIREBALL_TEXTURE,v.frame).setName('mage-fireball-impact');this.images[i]=image;
      image.setTexture(FIREBALL_TEXTURE,v.frame).setOrigin(C.originX,C.originY).setPosition(v.x,v.y).setRotation(v.rotation).setDisplaySize(FIREBALL_MANIFEST.canvas.width*C.scale,FIREBALL_MANIFEST.canvas.height*C.scale).setDepth(v.depth).setAlpha(v.alpha).setVisible(true).setActive(true);
    }
    for(let i=this.active.length;i<this.images.length;i++)this.images[i]!.setVisible(false).setActive(false);
  }
  diagnostics(){return{active:this.active.map((v,i)=>({...v,depth:this.images[i]!.depth})),allocated:this.images.length,atlasBytes:FIREBALL_MANIFEST.rgbaBytes,width:FIREBALL_MANIFEST.canvas.width*C.scale,height:FIREBALL_MANIFEST.canvas.height*C.scale};}
  destroy(){for(const image of this.images)image.destroy();this.images=[];this.active=[];}
}
