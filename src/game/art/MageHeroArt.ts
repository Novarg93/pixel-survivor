import type Phaser from 'phaser';
import type {World} from '../systems/World';
import type {Point} from '../utils/math';
import {MageHeroAnimation,type MageHeroPose,type MageDirection} from './MageHeroAnimation';
import type {MageCastingController} from './MageCastingController';
import {MAGE_HERO,MAGE_HERO_ORIGIN,mageHeroSelection} from './mageHeroPack';
import {mageMovingLayers} from './mageHeroLayers';
import {MagePhantomArt} from './MagePhantomArt';
import {mageNativeCastPalm,MAGE_PHANTOM_REST_PALMS} from './mageCastPalms';
import type {MageMuzzle} from './MageSpellOrigins';
import waists from './mageHeroWaists.json';
import {MAGE_IDLE,mageIdleSelection} from './mageIdlePack';
import {mageRunSelection} from './mageRunPackV2';
import {MAGE_CAST_V2,mageCastSelectionV2} from './mageCastPackV2';
import {mageMovingCastLayersV2} from './mageMovingCastV2';

// Legacy palm helper for archived pack inspection. Active authored casts use
// their own per-frame marks in mageCastPackV2; damage origins remain in World.
const PALMS:Record<MageDirection,Point>={
  south:{x:216,y:97},'south-east':{x:218,y:78},east:{x:213,y:77},'north-east':{x:180,y:70},
  north:{x:105,y:57},'north-west':{x:45,y:73},west:{x:35,y:82},'south-west':{x:61,y:83}
};
export function mageHeroPalm(pose:MageHeroPose):Point{
  if(pose.castAbility==='fireball'||pose.castAbility==='lightning'){
    const index=Math.min(16,Math.floor(Math.max(0,pose.progress??0)*17)),p=mageNativeCastPalm(pose.castAbility,pose.direction,index);
    return {x:p.x*MAGE_HERO.canvas/MAGE_HERO.sourceCanvas,y:p.y*MAGE_HERO.canvas/MAGE_HERO.sourceCanvas};
  }
  const progress=pose.progress??0,amount=Math.max(0,Math.min(1,progress/.2,(1-progress)/.2));
  const from={x:pose.direction.includes('west')?94:159,y:151};
  const to=pose.motion==='defensive'?{x:128,y:113}:PALMS[pose.direction];
  return {x:(from.x+(to.x-from.x)*amount)*MAGE_HERO.canvas/MAGE_HERO.sourceCanvas,y:(from.y+(to.y-from.y)*amount)*MAGE_HERO.canvas/MAGE_HERO.sourceCanvas};
}
export class MageHeroArt{
  private animation=new MageHeroAnimation();
  private pose?:MageHeroPose;
  private owner?:Phaser.GameObjects.Sprite;
  private bodyOrigin?:Point;
  private hands:Point[]=[];
  private upper?:Phaser.GameObjects.Image;
  private layers?:ReturnType<typeof mageMovingLayers>;
  private movingCast?:ReturnType<typeof mageMovingCastLayersV2>;
  private idle?:ReturnType<typeof mageIdleSelection>;
  private running?:ReturnType<typeof mageRunSelection>;
  private authoredCast?:ReturnType<typeof mageCastSelectionV2>;
  private phantom:MagePhantomArt;
  constructor(private scene:Phaser.Scene,private controller:MageCastingController){this.phantom=new MagePhantomArt(scene);}
  render(owner:Phaser.GameObjects.Sprite,w:World,moving:boolean,deathAge:number,multiplier:number,hurt:boolean){
    this.owner=owner;
    this.bodyOrigin={x:w.player.x,y:w.player.y};
    const cast=this.controller.view(w.elapsed);
    this.pose=this.animation.view(w,hurt?{...cast,active:undefined,mode:'hurt'}:cast,moving,deathAge);
    this.idle=this.pose.motion==='idle'?mageIdleSelection(this.pose.direction,this.pose.age):undefined;
    this.running=this.pose.motion==='run-start'||this.pose.motion==='run'||this.pose.motion==='run-stop'?mageRunSelection(this.pose.direction,this.pose.motion,this.pose.age):undefined;
    this.authoredCast=this.pose.casting?mageCastSelectionV2(this.pose):undefined;
    this.movingCast=mageMovingCastLayersV2(this.pose);
    this.layers=this.authoredCast||this.pose.phantom?undefined:mageMovingLayers(this.pose);
    const bodyPose:MageHeroPose=this.pose.phantom?this.pose.locomotion?{...this.pose.locomotion,casting:false}:{motion:'idle',direction:this.pose.bodyDirection!,age:w.elapsed,casting:false}:this.pose;
    const native=this.movingCast?.lower??this.authoredCast??this.running??this.idle;
    const v=native??this.layers?.lower??mageHeroSelection(bodyPose),size=(native?MAGE_IDLE.displaySize:MAGE_HERO.displaySize)*multiplier,scale=size/MAGE_HERO.canvas;
    const origin=native?.origin??MAGE_HERO_ORIGIN;
    owner.setTexture(v.texture,v.frame).setOrigin(origin.x,origin.y).setDisplaySize(size,size).setFlipX(native?.flipX??false).setRotation(0).setCrop();
    if(hurt)owner.setTint(0xffd4af);else owner.clearTint();
    if(this.movingCast){
      const l=this.movingCast,s=size/l.canvas;
      owner.setCrop(l.lowerCrop.x,l.lowerCrop.y,l.lowerCrop.width,l.lowerCrop.height);
      this.upper??=this.scene.add.image(0,0,l.upper.texture,l.upper.frame).setName('mage-moving-cast-upper');
      this.upper.setTexture(l.upper.texture,l.upper.frame).setOrigin(l.upper.origin.x,l.upper.origin.y).setDisplaySize(size,size)
        .setPosition(w.player.x+l.offset.x*s,w.player.y+l.offset.y*s).setDepth(owner.depth+.01).setRotation(0).setFlipX(l.upper.flipX)
        .setCrop().setVisible(true).setActive(true);
    }else if(this.layers){
      const l=this.layers;
      owner.setCrop(l.lowerCrop.x,l.lowerCrop.y,l.lowerCrop.width,l.lowerCrop.height);
      this.upper??=this.scene.add.image(0,0,l.upper.texture,l.upper.frame).setName('mage-moving-cast-upper');
      this.upper.setTexture(l.upper.texture,l.upper.frame).setOrigin(MAGE_HERO_ORIGIN.x,MAGE_HERO_ORIGIN.y).setDisplaySize(size,size)
        .setPosition(w.player.x+l.offset.x*scale,w.player.y+l.offset.y*scale).setDepth(owner.depth+.01).setRotation(0).setFlipX(false)
        .setCrop(l.upperCrop.x,l.upperCrop.y,l.upperCrop.width,l.upperCrop.height).setVisible(true).setActive(true);
    }else this.upper?.setVisible(false).setActive(false);
    this.phantom.render(owner,this.pose,v.frame,multiplier,w.player);
    const phantom=this.phantom.diagnostics();
    if(this.authoredCast){const c=this.authoredCast,s=size/MAGE_CAST_V2.canvas,offset=this.movingCast?.offset??{x:0,y:0};this.hands=[{x:w.player.x+(c.hand.x-c.pivot.x+offset.x)*s,y:w.player.y+(c.hand.y-c.pivot.y+offset.y)*s}];}
    else if(this.pose.phantom&&phantom.hand)this.hands=[phantom.hand];
    else if(this.pose.casting&&!this.pose.phantom){
      const p=mageHeroPalm(this.pose),offset=this.layers?.offset??{x:0,y:0};
      this.hands=[{x:w.player.x+(p.x-MAGE_HERO.pivot.x+offset.x)*scale,y:w.player.y+(p.y-MAGE_HERO.pivot.y+offset.y)*scale}];
    }else this.hands=[];
    this.sync();
  }
  sync(){if(this.upper?.visible&&this.owner)this.upper.setAlpha(this.owner.alpha).setTint(this.owner.tintTopLeft);this.phantom.sync();}
  muzzle(elapsed:number):MageMuzzle|undefined{
    if(!this.pose||!this.owner||!this.bodyOrigin||this.pose.motion==='death')return;
    if(this.pose.casting&&this.hands[0])return {hand:{...this.hands[0]},gestureStarted:elapsed-this.pose.age};
    const native=this.running??this.idle;
    if(native){const v=native,scale=this.owner.displayWidth/MAGE_IDLE.canvas;return {hand:{x:this.bodyOrigin.x+(v.hand.x-v.pivot.x)*scale,y:this.bodyOrigin.y+(v.hand.y-v.pivot.y)*scale},gestureStarted:-1};}
    // Hurt/Blink can suppress the cosmetic gesture without suppressing an
    // actual auto-shot. Keep that shot at the physical hand, never at the feet.
    const rest=MAGE_PHANTOM_REST_PALMS[this.pose.direction],anchors=waists.frames as Record<string,Point>;
    const current=anchors[String(this.owner.frame.name)]!,idle=anchors[mageHeroSelection({motion:'idle',direction:this.pose.direction,age:0,casting:false}).frame]!;
    const scale=this.owner.displayWidth/MAGE_HERO.canvas;
    return {hand:{x:this.bodyOrigin.x+(rest.x*MAGE_HERO.canvas/256+current.x-idle.x-MAGE_HERO.pivot.x)*scale,y:this.bodyOrigin.y+(rest.y*MAGE_HERO.canvas/256+current.y-idle.y-MAGE_HERO.pivot.y)*scale},gestureStarted:-1};
  }
  diagnostics(){
    const o=this.owner;
    const phantom=this.phantom.diagnostics();
    const running=this.movingCast?.lower??this.running;
    const castFrame=this.pose?.casting?(this.movingCast?.upper.frame??phantom.frameKey??this.layers?.upper.frame??String(o?.frame.name??'')):'';
    return {visible:!!this.pose?.casting,armsFrame:castFrame,castFrame,nativeBody:true,layered:!!(this.movingCast||this.layers),bodyCropped:o?.isCropped??false,lowerFrame:String(o?.frame.name??''),
      upperFrame:this.upper?.visible?String(this.upper.frame.name):'',upperTexture:this.upper?.visible?this.upper.texture.key:'',layers:this.movingCast??this.layers,upperPosition:this.upper?.visible?{x:this.upper.x,y:this.upper.y,alpha:this.upper.alpha}:undefined,
      phantom,pose:this.pose,authoredCast:this.authoredCast?{id:this.authoredCast.id,index:this.authoredCast.index,variant:this.authoredCast.variant,flipX:this.authoredCast.flipX}:undefined,idle:this.idle?{body:this.idle.body,index:this.idle.index,flipX:this.idle.flipX}:undefined,running:running?{body:running.body,index:running.index,motion:running.motion,flipX:running.flipX}:undefined,x:o?.x??0,y:o?.y??0,width:o?.displayWidth??0,height:o?.displayHeight??0,rotation:o?.rotation??0,origin:{x:o?.originX??MAGE_HERO_ORIGIN.x,y:o?.originY??MAGE_HERO_ORIGIN.y},hands:this.hands.map(p=>({...p})),recoil:0,allocated:(this.upper?1:0)+phantom.allocated};
  }
  destroy(){this.owner?.setCrop();this.upper?.destroy();this.upper=undefined;this.phantom.destroy();this.animation.clear();this.pose=this.owner=undefined;this.bodyOrigin=undefined;this.layers=undefined;this.movingCast=undefined;this.idle=this.running=this.authoredCast=undefined;this.hands=[];}
}
