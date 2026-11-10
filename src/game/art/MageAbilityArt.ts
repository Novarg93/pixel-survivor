import type Phaser from 'phaser';
import type {World} from '../systems/World';
import {MAGE_ABILITY_RUNTIME,MAGE_VFX_LIMIT} from './mageAbilityPack';
import {groundImpactDepth} from './groundImpactDepth';
import {MageMeteorPresentation} from './MageMeteorPresentation';
import {MAGE_METEOR} from './mageMeteorPack';
import {MAGE_SHIELD_NOVA,MAGE_SHIELD_NOVA_TEXTURE,mageShieldNovaDuration,mageShieldNovaFrame,mageNovaDisplaySize} from './mageShieldNovaPack';
import {MageShieldPresentation} from './MageShieldPresentation';

export interface MageAbilityView {texture:string;frame:string;x:number;y:number;size:number;alpha:number;depth:number;originX?:number;originY?:number;blendMode?:'NORMAL'|'SCREEN'}

// The ordinary spells use approved PixelLab pixels; Ultimate keeps its own art.
export class MageAbilityPresentation {
 private meteor=new MageMeteorPresentation();
 private shield=new MageShieldPresentation();
 clear(){this.meteor.clear();this.shield.clear();}
 get tracked(){return this.meteor.tracked;}
 views(w:World,intensity:number,reducedFlash=false):MageAbilityView[]{
  const meteors=this.meteor.views(w,intensity,reducedFlash);
  const shields=this.shield.views(w,intensity,reducedFlash);
  if(w.status==='menu'||w.status==='over')return [];
  const alpha=Math.max(0,Math.min(1,intensity)),views:MageAbilityView[]=[],depth=groundImpactDepth(w);
  for(const e of w.effects)if(e.kind==='frost'&&e.expires>w.elapsed&&w.elapsed>=e.started){
   const age=w.elapsed-e.started;if(age>=mageShieldNovaDuration('frost-nova')-1e-7)continue;
   views.push({texture:MAGE_SHIELD_NOVA_TEXTURE,frame:mageShieldNovaFrame('frost-nova',age),x:e.x,y:e.y,size:mageNovaDisplaySize(e.radius),alpha:alpha*(reducedFlash?.65:1),depth});
  }
  return [...shields,...views,...meteors].filter(v=>v.alpha>0).slice(0,MAGE_VFX_LIMIT);
 }
}

export class MageAbilityArt {
 private presentation=new MageAbilityPresentation();private images:Phaser.GameObjects.Image[]=[];private active:MageAbilityView[]=[];
 constructor(private scene:Phaser.Scene){}
 render(w:World,intensity:number,reducedFlash=false){
  this.active=this.presentation.views(w,intensity,reducedFlash);
  for(const [i,v]of this.active.entries()){
   const image=this.images[i]??this.scene.add.image(0,0,v.texture,v.frame).setName('mage-ability-vfx');this.images[i]=image;
   image.setTexture(v.texture,v.frame).setTint(0xffffff).setBlendMode(v.blendMode??'NORMAL').setRotation(0).setOrigin(v.originX??.5,v.originY??.5).setPosition(v.x,v.y).setDisplaySize(v.size,v.size).setDepth(v.depth).setAlpha(v.alpha).setVisible(true).setActive(true);
  }
  for(let i=this.active.length;i<this.images.length;i++)this.images[i]!.setVisible(false).setActive(false);
 }
 diagnostics(){return {active:this.active.map((v,i)=>({...v,texture:this.images[i]!.texture.key,frame:this.images[i]!.frame.name,depth:this.images[i]!.depth,blendMode:this.images[i]!.blendMode,tint:this.images[i]!.tintTopLeft,rotation:this.images[i]!.rotation,originX:this.images[i]!.originX,originY:this.images[i]!.originY})),allocated:this.images.length,tracked:this.presentation.tracked,atlasBytes:MAGE_ABILITY_RUNTIME.rgbaBytes+MAGE_METEOR.rgbaBytes+MAGE_SHIELD_NOVA.rgbaBytes};}
 destroy(){for(const image of this.images)image.destroy();this.images=[];this.active=[];this.presentation.clear();}
}
