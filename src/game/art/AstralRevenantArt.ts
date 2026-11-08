import type Phaser from 'phaser';
import type {World} from '../systems/World';
import type {RuneView} from './RuneWardenArt';
import {ASTRAL_VFX as C,NECROTIC_FLAME as F} from '../config/astralRevenant';
import {necroticPhase} from '../systems/NecroticFlameWalls';
import {ASTRAL_REVENANT_TEXTURE,ASTRAL_REVENANT_MANIFEST,astralFlameFrame,astralImpactFrame} from './astralRevenantPack';

export function astralRevenantViews(w:World,intensity:number):RuneView[]{
  if(w.status==='menu'||w.status==='over')return [];
  const views:RuneView[]=[],alpha=Math.max(.45,Math.min(1,intensity));
  for(const z of w.zones){
    const phase=necroticPhase(z,w.elapsed),n=z.necrotic;if(!n||!phase||phase==='warning')continue;
    const start=phase==='spawn'?n.spawnAt:phase==='idle'?n.activeAt:n.fadeAt;
    const duration=phase==='spawn'?n.activeAt-n.spawnAt:phase==='idle'?n.fadeAt-n.activeAt:z.expires-n.fadeAt;
    views.push({frame:astralFlameFrame(phase,w.elapsed-start,duration),x:z.x,y:z.y,size:F.displaySize,depth:z.y/10000+.015,alpha,rotation:0,originX:.5,originY:F.originY});
  }
  for(const e of w.effects){
    const age=w.elapsed-e.started;if(e.kind!=='astral-impact'||age<0||age>=e.duration||e.expires<=w.elapsed)continue;
    views.push({frame:astralImpactFrame(age/e.duration),x:e.x,y:e.y,size:C.projectileSize,depth:12.1,alpha:alpha*Math.min(1,(e.duration-age)/.1),rotation:e.target?Math.atan2(e.target.y,e.target.x):0,originX:C.projectilePivot,originY:.5});
  }
  return views.slice(0,C.limit);
}
export function necroticGroundViews(w:World,intensity:number){
  if(w.status==='menu'||w.status==='over')return [];
  return w.zones.flatMap(z=>{
    const n=z.necrotic,phase=necroticPhase(z,w.elapsed);if(!n||phase!=='warning')return [];
    const envelope=.4+.6*Math.min(1,(w.elapsed-n.born)/Math.max(.001,n.spawnAt-n.born));
    return [{x:z.x,y:z.y,width:n.halfWidth*2,height:n.halfDepth*2,phase,color:F.glowColor,alpha:F.glowAlpha*Math.max(.45,Math.min(1,intensity))*envelope}];
  }).slice(0,24);
}
export class AstralRevenantArt{
  private images:Phaser.GameObjects.Image[]=[];
  private active:RuneView[]=[];
  private ground:ReturnType<typeof necroticGroundViews>=[];
  private light:Phaser.GameObjects.Graphics;
  constructor(private scene:Phaser.Scene){this.light=scene.add.graphics().setName('necrotic-flame-ground').setDepth(-.4);}
  render(w:World,intensity:number){
    this.active=astralRevenantViews(w,intensity);this.ground=necroticGroundViews(w,intensity);this.light.clear();
    for(const v of this.ground){
      this.light.fillStyle(v.color,v.alpha*.3).fillEllipse(v.x,v.y,v.width+16,v.height+12);
      this.light.fillStyle(v.color,v.alpha*.6).fillEllipse(v.x,v.y,v.width+8,v.height+6);
      this.light.fillStyle(v.color,v.alpha).fillRoundedRect(v.x-v.width/2,v.y-v.height/2,v.width,v.height,5);
    }
    for(const [i,v]of this.active.entries()){
      const image=this.images[i]??this.scene.add.image(0,0,ASTRAL_REVENANT_TEXTURE,v.frame).setName('astral-revenant-vfx');this.images[i]=image;
      image.setTexture(ASTRAL_REVENANT_TEXTURE,v.frame).setOrigin(v.originX,v.originY).setPosition(v.x,v.y).setDisplaySize(v.size,v.size).setRotation(v.rotation).setDepth(v.depth).setAlpha(v.alpha).setVisible(true).setActive(true);
    }
    for(let i=this.active.length;i<this.images.length;i++)this.images[i]!.setVisible(false).setActive(false);
  }
  diagnostics(){return {active:this.active,ground:this.ground,allocated:this.images.length,atlasBytes:ASTRAL_REVENANT_MANIFEST.rgbaBytes};}
  destroy(){for(const image of this.images)image.destroy();this.light.destroy();this.images=[];this.active=[];this.ground=[];}
}
