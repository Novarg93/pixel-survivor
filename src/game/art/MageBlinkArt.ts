import type Phaser from 'phaser';
import type {World} from '../systems/World';
import {PLAYER_VISUALS} from '../config/playerVisuals';
import {MAGE_BLINK,MAGE_BLINK_TEXTURE,mageBlinkFrame} from './mageBlinkPack';

// Four images maximum: back/front at the two immutable world-space endpoints.
// The instant teleport, protection, cooldown and upgrades remain in MobilitySystem.
export function mageBlinkViews(w:World,intensity:number,reducedFlash=false){
 const index=mageBlinkFrame(w.elapsed-w.mobility.started),alpha=Number.isFinite(intensity)?Math.max(0,Math.min(1,intensity)):0;
 if(!PLAYER_VISUALS.arcaneBlink||w.character!=='mage'||w.mobility.sequence===0||w.status==='menu'||w.status==='over'||index===undefined||index===7||alpha===0)return [];
 return (['departure','arrival'] as const).flatMap(id=>{
  const at=id==='departure'?w.mobility.from:w.mobility.to;
  return (['back','front'] as const).map(layer=>({endpoint:id,layer,index,frame:MAGE_BLINK.clips[id][layer][index]!.frame,x:at.x,y:at.y,depth:layer==='back'?9.99:10.02,alpha:alpha*(reducedFlash?.65:1),tint:reducedFlash?0xc3b3e5:0xffffff}));
 });
}
export class MageBlinkArt{
 private images:Phaser.GameObjects.Image[]=[];
 private active:ReturnType<typeof mageBlinkViews>=[];
 constructor(private scene:Phaser.Scene){}
 render(w:World,intensity:number,reducedFlash=false){
  this.active=mageBlinkViews(w,intensity,reducedFlash);
  for(const [i,v]of this.active.entries()){
   const image=this.images[i]??this.scene.add.image(v.x,v.y,MAGE_BLINK_TEXTURE,v.frame).setName('mage-blink-'+v.endpoint+'-'+v.layer);this.images[i]=image;
   image.setTexture(MAGE_BLINK_TEXTURE,v.frame).setPosition(v.x,v.y).setOrigin(MAGE_BLINK.pivot.x/MAGE_BLINK.canvas,MAGE_BLINK.pivot.y/MAGE_BLINK.canvas)
    .setDisplaySize(MAGE_BLINK.displaySize,MAGE_BLINK.displaySize).setDepth(v.depth).setAlpha(v.alpha).setTint(v.tint).setRotation(0).setVisible(true).setActive(true);
  }
  for(let i=this.active.length;i<this.images.length;i++)this.images[i]!.setVisible(false).setActive(false);
 }
 diagnostics(){return{active:this.active,allocated:this.images.length,atlasBytes:MAGE_BLINK.rgbaBytes};}
 destroy(){for(const image of this.images)image.destroy();this.images=[];this.active=[];}
}
