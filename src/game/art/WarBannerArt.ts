import type Phaser from 'phaser';
import type {World} from '../systems/World';
import {ULTIMATE} from '../config/ultimates';
import {WARRIOR_ULTIMATE_TEXTURE,warriorUltimateFx} from './warriorUltimatesPack';

export const WAR_BANNER_TEXTURE='war-banner-v1';
export const WAR_BANNER_URL='assets/hd/war-banner-v1/object.png';
// Accepted animated Banner A; its anchored healing boundary is original Graphics.
export class WarBannerArt{
 private flag:Phaser.GameObjects.Image;private ground:Phaser.GameObjects.Graphics;private live=false;
 constructor(scene:Phaser.Scene){this.flag=scene.add.image(0,0,WARRIOR_ULTIMATE_TEXTURE,'vfx-war-banner/0').setOrigin(.5,131/192).setDisplaySize(112,112).setDepth(3).setName('war-banner-object').setVisible(false);this.ground=scene.add.graphics().setDepth(-.8).setName('war-banner-healing-zone');}
 render(w:World,intensity:number){
  this.ground.clear();const banner=w.ultimate.banner;
  this.live=w.ultimate.selected==='banner'&&w.status!=='over'&&w.status!=='menu'&&banner.active(w.elapsed);
  this.flag.setVisible(this.live);if(!this.live)return;
  const {x,y}=banner.origin,r=ULTIMATE.banner.radius,alpha=.15+.2*intensity;
  this.flag.setTexture(WARRIOR_ULTIMATE_TEXTURE,warriorUltimateFx('vfx-war-banner',w.elapsed-banner.started)).setPosition(x,y).setAlpha(.35+.65*Math.max(0,Math.min(1,intensity)));
  this.ground.fillStyle(0x91be91,.04+.04*intensity).fillCircle(x,y,r).lineStyle(1,0x9bc5a5,alpha).strokeCircle(x,y,r);
  for(let i=0;i<16;i++){const a=i*Math.PI/8,px=Math.round(x+Math.cos(a)*r),py=Math.round(y+Math.sin(a)*r);this.ground.fillStyle(0xd3d8a7,alpha+.12).fillRect(px-1,py-1,2,2);}
  if(banner.contains(w.player)&&w.player.hp<w.effectiveMaxHp){const px=Math.round(w.player.x),py=Math.round(w.player.y-45);this.ground.fillStyle(0xadd5a0,.8).fillRect(px-1,py-4,2,8).fillRect(px-4,py-1,8,2);}
 }
 diagnostics(){return {active:this.live,allocated:2,frame:this.live?String(this.flag.frame.name):null};}
 destroy(){this.flag.destroy();this.ground.destroy();this.live=false;}
}
