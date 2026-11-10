import type Phaser from 'phaser';
import type {World} from '../systems/World';
import type {RuneView} from './RuneWardenArt';
import {ASTRAL_VFX as C,NECROTIC_FLAME as F} from '../config/astralRevenant';
import {necroticPhase} from '../systems/NecroticFlameWalls';
import {ASTRAL_REVENANT_TEXTURE,ASTRAL_REVENANT_MANIFEST,astralImpactFrame} from './astralRevenantPack';
import {ASTRAL_PROJECTILE as AP,ASTRAL_PROJECTILE_TEXTURE,astralAiFrame} from './astralProjectilePixellabPack';
import {ASTRAL_FLAME as AF,ASTRAL_FLAME_TEXTURE,astralFlameAiFrame} from './astralFlamePixellabPack';

export function astralRevenantViews(w:World,intensity:number):RuneView[]{
  if(w.status==='menu'||w.status==='over')return [];
  const views:RuneView[]=[],alpha=Math.max(.45,Math.min(1,intensity));
  for(const z of w.zones){
    const phase=necroticPhase(z,w.elapsed),n=z.necrotic;if(!n||!phase||phase==='warning')continue;
    const start=phase==='spawn'?n.spawnAt:phase==='idle'?n.activeAt:n.fadeAt;
    const pivot=AF.clips[phase].pivot;
    views.push({texture:ASTRAL_FLAME_TEXTURE,frame:astralFlameAiFrame(phase,w.elapsed-start),x:z.x,y:z.y,size:AF.clips[phase].size,depth:z.y/10000+.015,alpha,rotation:0,originX:pivot.x/AF.canvas,originY:pivot.y/AF.canvas});
  }
  for(const e of w.effects){
    const age=w.elapsed-e.started;if(e.kind!=='astral-impact'||age<0||age>=e.duration||e.expires<=w.elapsed)continue;
    const rotation=e.target?Math.atan2(e.target.y,e.target.x):0;
    if(w.bosses.some(b=>b.id===e.ownerId&&b.kind==='eclipse'))views.push({texture:ASTRAL_PROJECTILE_TEXTURE,frame:astralAiFrame('impact',age),x:e.x,y:e.y,size:AP.clips.impact.size,depth:12.1,alpha,rotation,originX:AP.clips.impact.pivot.x/AP.canvas,originY:AP.clips.impact.pivot.y/AP.canvas});
    else views.push({frame:astralImpactFrame(age/e.duration),x:e.x,y:e.y,size:C.projectileSize,depth:12.1,alpha:alpha*Math.min(1,(e.duration-age)/.1),rotation,originX:C.projectilePivot,originY:.5});
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
      const key=v.texture??ASTRAL_REVENANT_TEXTURE,image=this.images[i]??this.scene.add.image(0,0,key,v.frame).setName('astral-revenant-vfx');this.images[i]=image;
      image.setTexture(key,v.frame).setTint(0xffffff).setBlendMode('NORMAL').setOrigin(v.originX,v.originY).setPosition(v.x,v.y).setDisplaySize(v.size,v.size).setRotation(v.rotation).setDepth(v.depth).setAlpha(v.alpha).setVisible(true).setActive(true);
    }
    for(let i=this.active.length;i<this.images.length;i++)this.images[i]!.setVisible(false).setActive(false);
  }
  diagnostics(){return {active:this.active,ground:this.ground,allocated:this.images.length,atlasBytes:ASTRAL_REVENANT_MANIFEST.rgbaBytes+AP.rgbaBytes+AF.rgbaBytes};}
  destroy(){for(const image of this.images)image.destroy();this.light.destroy();this.images=[];this.active=[];this.ground=[];}
}
