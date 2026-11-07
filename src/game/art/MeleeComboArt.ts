import type Phaser from 'phaser';
import type {World} from '../systems/World';
import {MELEE_COMBO,MELEE_COMBO_TEXTURE,meleeComboView} from './meleeComboPack';
export class MeleeComboArt {
  private glow:Phaser.GameObjects.Image;
  private slash:Phaser.GameObjects.Image;
  private view:ReturnType<typeof meleeComboView>=null;
  constructor(scene:Phaser.Scene){
    this.glow=scene.add.image(0,0,MELEE_COMBO_TEXTURE,'melee-ground-light').setName('melee-ground-light').setOrigin(.5).setDepth(-.31).setVisible(false);
    this.slash=scene.add.image(0,0,MELEE_COMBO_TEXTURE).setName('warden-rd-slash').setVisible(false);
  }
  render(w:World){
    this.glow.setVisible(false);this.slash.setVisible(false);this.view=w.status==='menu'||w.status==='over'?null:meleeComboView(w.finalEncounter);const v=this.view;if(!v)return;
    if(v.glowAlpha>0)this.glow.setPosition(v.origin.x,v.origin.y).setScale(v.glowScale).setRotation(v.rotation).setAlpha(v.glowAlpha).setTint(0xe47b35).setVisible(true);
    if(v.slash){const s=v.slash;this.slash.setTexture(MELEE_COMBO_TEXTURE,s.frame).setOrigin(MELEE_COMBO.slash.pivot[0]!/this.slash.frame.realWidth,MELEE_COMBO.slash.pivot[1]!/this.slash.frame.realHeight).setPosition(s.x,s.y).setScale(MELEE_COMBO.slash.scale).setFlipX(s.flipX).setRotation(0).setAlpha(1).setDepth(v.origin.y/10000+.001).setVisible(true);}
  }
  diagnostics(){return{view:this.view,activeImages:Number(this.glow.visible)+Number(this.slash.visible),pooledImages:2,atlasBytes:MELEE_COMBO.rgbaBytes,groundLight:{visible:this.glow.visible,alpha:this.glow.alpha},slash:{visible:this.slash.visible,frame:this.slash.frame.name,flipX:this.slash.flipX,x:this.slash.x,y:this.slash.y}};}
  destroy(){this.glow.destroy();this.slash.destroy();this.view=null;}
}
