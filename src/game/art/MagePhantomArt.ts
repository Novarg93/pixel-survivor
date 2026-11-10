import Phaser from 'phaser';
import type {Point} from '../utils/math';
import type {MageHeroPose} from './MageHeroAnimation';
import {MAGE_HERO} from './mageHeroPack';
import waists from './mageHeroWaists.json';
import {MAGE_PHANTOM,MAGE_PHANTOM_TEXTURE,magePhantomSelection,magePhantomIntroOffset} from './magePhantomPack';
import {magePhantomTurn} from './magePhantomPack';
import {MAGE_PHANTOM_REST_PALMS} from './mageCastPalms';

// One pooled additive upper body. All timing is driven by the existing cast clock.
export class MagePhantomArt{
  private image?:Phaser.GameObjects.Image;
  private owner?:Phaser.GameObjects.Sprite;
  private view?:{direction:string;sourceDirection:string;frame:number;frameKey:string;anchor:Point;hand:Point;ageMs:number;depth:number};
  constructor(private scene:Phaser.Scene){scene.textures.get(MAGE_PHANTOM_TEXTURE).setFilter(Phaser.Textures.FilterMode.NEAREST);}
  render(owner:Phaser.GameObjects.Sprite,pose:MageHeroPose,bodyFrame:string,multiplier:number,position:Point){
    this.owner=owner;const phantom=pose.phantom;
    if(!phantom){this.hide();return;}
    const selection=magePhantomSelection(phantom),waist=(waists.frames as Record<string,Point>)[bodyFrame]!;
    const scale=MAGE_HERO.displaySize*multiplier/MAGE_HERO.canvas,size=MAGE_HERO.displaySize*multiplier;
    const shoulderY=waist.y-(pose.locomotion?24.75:27.5625);
    const anchor={x:position.x+(waist.x-MAGE_HERO.pivot.x)*scale,y:position.y+(shoulderY-MAGE_HERO.pivot.y)*scale};
    const intro=magePhantomIntroOffset(phantom),nativeScale=size/MAGE_PHANTOM.sourceCanvas;
    const x=anchor.x+intro.x*nativeScale,y=anchor.y+intro.y*nativeScale;
    const behind=phantom.direction.startsWith('north'),depth=owner.depth+(behind?-.01:.02);
    const introDirection=phantom.frame===2?magePhantomTurn(phantom.sourceDirection,phantom.direction):phantom.sourceDirection;
    const rest=MAGE_PHANTOM_REST_PALMS[introDirection],palm=phantom.frame<=2||phantom.frame===11?[rest.x+intro.x,rest.y+intro.y]:MAGE_PHANTOM.clips[phantom.direction].palms[phantom.frame]!;
    const hand={x:anchor.x+(palm[0]!-128)*nativeScale,y:anchor.y+(palm[1]!-64)*nativeScale};
    this.image??=this.scene.add.image(x,y,selection.texture,selection.frame).setName('mage-phantom-cast');
    this.image.setTexture(selection.texture,selection.frame).setOrigin(.5,.25).setPosition(x,y).setDisplaySize(size,size).setRotation(0).setFlipX(false)
      .setDepth(depth).setVisible(phantom.frame>0&&phantom.frame<11).setActive(phantom.frame>0&&phantom.frame<11);
    this.view={direction:phantom.direction,sourceDirection:phantom.sourceDirection,frame:phantom.frame,frameKey:selection.frame,anchor,hand,ageMs:phantom.age*1000,depth};
    this.sync();
  }
  private hide(){this.image?.setVisible(false).setActive(false);this.view=undefined;}
  sync(){if(this.image?.visible&&this.owner)this.image.setAlpha(this.owner.alpha).setTint(this.owner.tintTopLeft);}
  diagnostics(){return {visible:!!this.image?.visible,sharedAnimation:'arcane-phantom-cast',...this.view,alpha:this.image?.visible?this.image.alpha:0,allocated:this.image?1:0};}
  destroy(){this.image?.destroy();this.image=undefined;this.owner=undefined;this.view=undefined;}
}
