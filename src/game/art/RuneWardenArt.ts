import type Phaser from 'phaser';
import type { World } from '../systems/World';
import { RUNE_WARDEN_VFX as C, ARCANE_VOLLEY } from '../config/runeWarden';
import { RUNE_WARDEN_TEXTURE, RUNE_WARDEN_MANIFEST, runeDuration, runeFrameIndex, runeJudgementFrame } from './runeWardenPack';
import {createRuneFlashTexture,RUNE_FLASH_TEXTURE,RUNE_FLASH_BYTES} from './RuneJudgementFlash';

export interface RuneView { frame:string;x:number;y:number;size:number;originX:number;originY:number;rotation:number;alpha:number;depth:number }
// Pure views of simulation timestamps: pause/freeze/restart need no timers or observers.
export function runeWardenViews(w: World, intensity: number): RuneView[] {
  if(w.status==='menu'||w.status==='over')return [];
  const views:RuneView[]=[],alpha=Math.max(.45,Math.min(1,intensity));
  const add=(frame:string,x:number,y:number,size:number,originY=.5,depth=-.2,opacity=alpha,rotation=0,originX=.5)=>views.push({frame,x,y,size,originX,originY,rotation,alpha:opacity,depth});
  const judgementSize=(radius:number)=>radius*2*128/RUNE_WARDEN_MANIFEST.judgementDiameter;
  const judgementOrigin=RUNE_WARDEN_MANIFEST.judgementPivot[1]!/RUNE_WARDEN_MANIFEST.canvas;
  for(const i of w.impacts)if(i.appearance==='runic-judgement'){
    const remaining=i.landAt-w.elapsed;
    const frame=remaining>C.judgementCharge?'judgement-rune':runeJudgementFrame('charge',1-remaining/C.judgementCharge);
    add(frame,i.x,i.y,judgementSize(i.radius),judgementOrigin);
  }
  for(const e of w.bosses){
    const m=e.boss?.magic;
    if(e.kind==='sorcerer'&&m?.phase==='signal'&&m.from&&m.target)for(const p of [m.from,m.target])add('blink-rune',p.x,p.y,(e.radius+9)*2);
  }
  for(const e of w.effects){
    const age=w.elapsed-e.started;if(age<0||age>=e.duration||e.expires<=w.elapsed)continue;
    if(e.kind==='runic-judgement'){
      // New source ends in a full-canvas flash. Fade its tail quadratically so
      // the floor clears without a persistent bright rectangle or a repeat.
      const fade=(1-age/e.duration)**2;
      add(runeJudgementFrame('impact',age/e.duration),e.x,e.y,judgementSize(e.radius),judgementOrigin,14.3,alpha*fade);
    }else if(e.kind==='arcane-impact'){
      const rotation=e.target?Math.atan2(e.target.y,e.target.x):0,fade=Math.min(1,(e.duration-age)/.1);
      add(`volley-impact-${runeFrameIndex('volley-impact',age/e.duration*runeDuration('volley-impact'))}`,e.x,e.y,ARCANE_VOLLEY.displaySize,.5,12.1,alpha*fade,rotation,104/128);
    }else if(e.kind==='rune-blink'&&e.target){
      const fade=Math.min(1,(e.duration-age)/.1),frame=`blink-${runeFrameIndex('blink',age/e.duration*runeDuration('blink'))}`;
      for(const p of [e,e.target]){add('blink-rune',p.x,p.y,e.radius*2,.5,-.2,alpha*fade);add(frame,p.x,p.y,e.radius*2,.5,-.19,alpha*fade);}
    }
  }
  return views.slice(0,C.limit);
}
export class RuneWardenArt {
  private images:Phaser.GameObjects.Image[]=[];
  private active:RuneView[]=[];
  constructor(private scene:Phaser.Scene){createRuneFlashTexture(scene);}
  render(w:World,intensity:number){
    this.active=runeWardenViews(w,intensity);
    for(const [i,v]of this.active.entries()){
      const key=/^judgement-1[345]$/.test(v.frame)?RUNE_FLASH_TEXTURE:RUNE_WARDEN_TEXTURE;
      const image=this.images[i]??this.scene.add.image(0,0,key,v.frame).setName('rune-warden-vfx');this.images[i]=image;
      image.setTexture(key,v.frame).setOrigin(v.originX,v.originY).setPosition(v.x,v.y).setDisplaySize(v.size,v.size).setRotation(v.rotation).setAlpha(v.alpha).setDepth(v.depth).setVisible(true).setActive(true);
    }
    for(let i=this.active.length;i<this.images.length;i++)this.images[i]!.setVisible(false).setActive(false);
  }
  diagnostics(){return {active:this.active.map((v,i)=>({...v,texture:this.images[i]!.texture.key})),allocated:this.images.length,atlasBytes:RUNE_WARDEN_MANIFEST.rgbaBytes,flashTextureBytes:RUNE_FLASH_BYTES};}
  destroy(){for(const image of this.images)image.destroy();this.images=[];this.active=[];this.scene.textures.remove(RUNE_FLASH_TEXTURE);}
}
