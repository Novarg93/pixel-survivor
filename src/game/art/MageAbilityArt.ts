import type Phaser from 'phaser';
import type {World} from '../systems/World';
import {MAGE_ABILITY_TEXTURE,MAGE_ABILITY_MANIFEST,MAGE_ABILITY_TUNING as tuning,MAGE_VFX_LIMIT,METEOR_DISPLAY_SIZE,METEOR_IMPACT_DISPLAY_SIZE,METEOR_IMPACT_ORIGIN_Y,METEOR_FALL_OFFSET,mageAbilityPlaybackDuration,mageAbilityPlaybackFrame} from './mageAbilityPack';
import {ARMAGEDDON} from '../config/mageAbilities';
import {createSoftLightTexture,SOFT_LIGHT_SIZE} from './softLightTexture';

export const NOVA_LIGHT_TEXTURE='mage-nova-soft-light',NOVA_LIGHT_COLOR=0x68caff;
const GROUND_FADE_SECONDS=.2,EXPLOSION_FADE_SECONDS=.15;
interface Burst {x:number;y:number;started:number;duration:number;explosionDuration:number;keepUntil:number}
export interface MageAbilityView {texture:string;frame:string;x:number;y:number;size:number;alpha:number;depth:number;originY?:number}

// Presentation only. Simulation retains control, damage, launch and landing times.
export class MageAbilityPresentation {
  private run='';
  private bursts=new Map<number,Burst>();
  clear(){this.bursts.clear();}
  views(w:World,intensity:number):MageAbilityView[]{
    if(this.run!==w.runId){this.clear();this.run=w.runId;}
    if(w.status==='menu'||w.status==='over'){this.clear();return [];}
    const now=w.elapsed,alpha=Math.max(0,Math.min(1,intensity)),views:MageAbilityView[]=[];
    for(const [id,b] of this.bursts)if(b.keepUntil<=now)this.bursts.delete(id);
    for(const e of w.effects)if(e.expires>now&&e.kind==='meteor'&&e.source==='meteor'&&!this.bursts.has(e.id)&&this.bursts.size<96){
      const duration=mageAbilityPlaybackDuration('meteor-ground-impact');
      const explosionDuration=mageAbilityPlaybackDuration('meteor-explosion-impact');
      this.bursts.set(e.id,{x:e.x,y:e.y,started:e.started,duration,explosionDuration,keepUntil:Math.max(e.expires,e.started+duration,e.started+explosionDuration)});
    }
    for(const e of w.effects)if(e.kind==='frost'&&e.expires>now&&now>=e.started){
      const age=(now-e.started)*tuning.novaPlaybackRate;if(age>=e.duration)continue;
      const fade=Math.min(1,(e.duration-age)/Math.max(.001,e.duration*.25));
      const bloom=Math.min(1,age/.12);
      views.push({texture:NOVA_LIGHT_TEXTURE,frame:'__BASE',x:e.x,y:e.y,size:e.radius*2,alpha:alpha*MAGE_ABILITY_MANIFEST.frostAlpha*bloom*fade,depth:-.12});
    }
    for(const i of w.impacts)if(!i.hostile&&i.source==='meteor'){
      const launch=i.launchAt??i.landAt-ARMAGEDDON.delay;if(now<launch||now>=i.landAt)continue;
      const t=Math.max(0,Math.min(1,(now-launch)/Math.max(.001,i.landAt-launch)));
      views.push({texture:MAGE_ABILITY_TEXTURE,frame:'meteor-fall-0',x:i.x+(1-t)*METEOR_FALL_OFFSET.x,y:i.y+(1-t)*METEOR_FALL_OFFSET.y,size:METEOR_DISPLAY_SIZE,alpha,depth:14.2});
    }
    for(const b of this.bursts.values()){
      const age=now-b.started;if(age<0)continue;
      if(age<b.duration){
        const fade=Math.min(1,(b.duration-age)/GROUND_FADE_SECONDS);
        views.push({texture:MAGE_ABILITY_TEXTURE,frame:mageAbilityPlaybackFrame('meteor-ground-impact',age),x:b.x,y:b.y,size:METEOR_IMPACT_DISPLAY_SIZE,originY:METEOR_IMPACT_ORIGIN_Y,alpha:alpha*fade,depth:-.14});
      }
      if(age<b.explosionDuration){
        const fade=Math.min(1,(b.explosionDuration-age)/EXPLOSION_FADE_SECONDS);
        views.push({texture:MAGE_ABILITY_TEXTURE,frame:mageAbilityPlaybackFrame('meteor-explosion-impact',age),x:b.x,y:b.y,size:METEOR_IMPACT_DISPLAY_SIZE,originY:METEOR_IMPACT_ORIGIN_Y,alpha:alpha*fade,depth:14.1});
      }
    }
    for(const z of w.zones)if(z.source==='meteor'&&!z.wall&&z.expires>now){
      if([...this.bursts.values()].some(b=>now<b.started+Math.max(b.duration,b.explosionDuration)&&Math.hypot(b.x-z.x,b.y-z.y)<1))continue;
      views.push({texture:MAGE_ABILITY_TEXTURE,frame:`meteor-ground-impact-${MAGE_ABILITY_MANIFEST.clips['meteor-ground-impact'].frameCount-1}`,x:z.x,y:z.y,size:METEOR_IMPACT_DISPLAY_SIZE,originY:METEOR_IMPACT_ORIGIN_Y,alpha:alpha*.25*Math.min(1,(z.expires-now)/.4),depth:-.14});
    }
    return views.filter(v=>v.alpha>0).slice(0,MAGE_VFX_LIMIT);
  }
  get tracked(){return this.bursts.size;}
}

export class MageAbilityArt {
  private presentation=new MageAbilityPresentation();
  private images:Phaser.GameObjects.Image[]=[];
  private active: MageAbilityView[]=[];
  constructor(private scene:Phaser.Scene){createSoftLightTexture(scene,NOVA_LIGHT_TEXTURE);}
  render(w:World,intensity:number){
    this.active=this.presentation.views(w,intensity);
    for(const [i,v] of this.active.entries()){
      const light=v.texture===NOVA_LIGHT_TEXTURE;
      const image=this.images[i]??this.scene.add.image(0,0,v.texture,v.frame).setName('mage-ability-vfx');this.images[i]=image;
      image.setTexture(v.texture,v.frame).setTint(light?NOVA_LIGHT_COLOR:0xffffff).setBlendMode(light?'ADD':'NORMAL').setRotation(0).setOrigin(.5,v.originY??.5).setPosition(v.x,v.y).setDisplaySize(v.size,v.size).setDepth(v.depth).setAlpha(v.alpha).setVisible(true).setActive(true);
    }
    for(let i=this.active.length;i<this.images.length;i++)this.images[i]!.setVisible(false).setActive(false);
  }
  diagnostics(){return {active:this.active.map((v,i)=>({...v,texture:this.images[i]!.texture.key,frame:this.images[i]!.frame.name,blendMode:this.images[i]!.blendMode,tint:this.images[i]!.tintTopLeft,rotation:this.images[i]!.rotation,originY:this.images[i]!.originY})),allocated:this.images.length,tracked:this.presentation.tracked,atlasBytes:MAGE_ABILITY_MANIFEST.rgbaBytes,glowTextureBytes:SOFT_LIGHT_SIZE*SOFT_LIGHT_SIZE*4};}
  destroy(){for(const image of this.images)image.destroy();this.images=[];this.active=[];this.presentation.clear();this.scene.textures.remove(NOVA_LIGHT_TEXTURE);}
}
