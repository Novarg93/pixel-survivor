import type Phaser from 'phaser';
import type { World } from '../systems/World';
import type { Point } from '../utils/math';
import type { MageCastingController } from './MageCastingController';
import { MAGE_CAST_TEXTURE, castingArmFrame, castingBob, castingDirection } from './mageCastingPack';
import { castingHands, CAST_COLORS } from './mageCastingPoses';

export class MageCastingArt {
  private arms: Phaser.GameObjects.Image;
  private magic: Phaser.GameObjects.Graphics;
  private hands: Point[] = [];
  private recoil = 0;
  constructor(scene: Phaser.Scene, private controller: MageCastingController) {
    this.arms = scene.add.image(0,0,MAGE_CAST_TEXTURE,'arms-fireball-down-0').setName('mage-casting-arms').setOrigin(.5,.75).setDisplaySize(24,30).setDepth(10.05).setVisible(false).setActive(false);
    this.magic = scene.add.graphics().setName('mage-casting-hands').setDepth(14.1);
  }
  render(owner: Phaser.GameObjects.Sprite, w: World, moving: boolean, allowed: boolean, intensity: number) {
    const g=this.magic.clear(), view=this.controller.view(w.elapsed), a=view.active;
    const scale=owner.displayWidth/16, bob=castingBob(moving,w.elapsed)*owner.displayHeight/30;
    // Original side-body mirroring shifts the shoulder centers from7.35 to8.65.
    const shoulderOffset=owner.flipX?1.3*scale:0;
    this.arms.setPosition(owner.x+shoulderOffset,owner.y+bob).setDisplaySize(owner.displayWidth,owner.displayHeight);
    this.arms.setRotation(owner.rotation);
    if(!allowed||!a||view.mode!=='cast'){this.arms.setVisible(false).setActive(false);this.hands=[];this.recoil=0;return;}
    const origin=a.origin??w.player, direction=castingDirection(a.target.x-origin.x,a.target.y-origin.y), frame=view.frame;
    this.recoil=a.ability==='ultimate-lightning'&&frame===4?-w.ultimate.direction.x*1.2*scale:a.ability==='fireball'&&frame===2?(owner.flipX ? .28 : -.28)*scale:0;
    this.arms.setTexture(MAGE_CAST_TEXTURE,castingArmFrame(a.ability,a.rank,direction,frame)).setPosition(owner.x+shoulderOffset+this.recoil,owner.y+bob)
      .setDisplaySize(owner.displayWidth,owner.displayHeight).setAlpha(owner.alpha).setDepth(owner.depth+.05).setVisible(true).setActive(true);
    const [lx,ly,rx,ry]=castingHands(a.ability,a.rank,direction,frame);
    const cos=Math.cos(owner.rotation),sin=Math.sin(owner.rotation);
    this.hands=[[lx,ly],[rx,ry]].map(([x,y])=>({x:this.arms.x+((x-8)*cos-(y-15)*sin)*scale,y:this.arms.y+((x-8)*sin+(y-15)*cos)*scale}));
    const age=w.elapsed-a.started, color=CAST_COLORS[a.ability], alpha=Math.max(.25,intensity)*owner.alpha;
    const dx=a.target.x-owner.x,dy=a.target.y-owner.y,length=Math.hypot(dx,dy)||1;
    // The charged silhouette belongs only to the core cast, never to recoil.
    if(a.ability==='ultimate-lightning'&&!w.ultimate.casting)return;
    for(const [side,p] of this.hands.entries()){
      const x=Math.round(p.x),y=Math.round(p.y),strong=a.rank>=4||a.ability==='meteor'||a.ability==='frost';
      const pulse=.65+.25*Math.sin(age*24+side),flash=age<.11?1-age/.11:.3;
      g.fillStyle(color,alpha*pulse*.7).fillRect(x-2,y-2,4,4).fillStyle(0xfff5dc,alpha*(.45+flash*.4)).fillRect(x-1,y-1,2,2);
      if(a.ability==='fireball'||a.ability==='ultimate-fire'){
        if(side===1||direction==='left')for(let i=1;i<=(strong?4:2);i++)g.fillStyle(i%2?0xf59e46:color,alpha*(1-i/5)*.7).fillRect(Math.round(x-dx/length*i*2),Math.round(y-dy/length*i*2),strong?2:1,1);
      }else if(a.ability==='frost'||a.ability==='ultimate-frost'){
        for(const sign of [-1,1])g.fillStyle(color,alpha*pulse).fillRect(x+sign*3,y-3,1,3).fillRect(x+sign*4,y-1,2,1);
      }else if(a.ability==='lightning'||a.ability==='ultimate-lightning'){
        if(side===1||strong)g.lineStyle(1,0xecf2ff,alpha).beginPath().moveTo(x,y).lineTo(Math.round(x+dx/length*3-dy/length*2),Math.round(y+dy/length*3+dx/length*2)).lineTo(Math.round(x+dx/length*5+dy/length),Math.round(y+dy/length*5-dx/length)).lineTo(Math.round(x+dx/length*8),Math.round(y+dy/length*8)).strokePath();
      }else if(a.ability==='meteor'){
        for(let i=0;i<3;i++)g.fillStyle(i%2?0xffe8a0:0xf59e46,alpha*(1-i*.2)).fillRect(x+(side?1:-1)*i*2,y-4-i*3,2,2);
        if(w.elapsed-a.lastBeat<.13)g.lineStyle(1,0xffe3a1,alpha).lineBetween(x,y,Math.round(x+dx/length*8),Math.round(y+dy/length*8));
      }else g.fillStyle(0xb58cfa,alpha*.6).fillRect(x-4,y-4,2,7).fillRect(x+3,y-4,2,7).fillStyle(0xe6ddff,alpha).fillRect(x-3,y-4,6,1);
    }
    // Two bounded accents preserve short simultaneous cues without frame resets.
    for(const accent of view.accents){if(accent.ability===a.ability)continue;const fade=1-(w.elapsed-accent.at)/.18;for(const p of this.hands)g.fillStyle(CAST_COLORS[accent.ability],alpha*fade).fillRect(Math.round(p.x-3),Math.round(p.y-5),2,2);}
  }
  diagnostics(){return{visible:this.arms.visible,armsFrame:this.arms.frame.name,x:this.arms.x,y:this.arms.y,width:this.arms.displayWidth,height:this.arms.displayHeight,rotation:this.arms.rotation,origin:{x:this.arms.originX,y:this.arms.originY},hands:this.hands.map(p=>({...p})),recoil:this.recoil};}
  destroy(){this.arms.destroy();this.magic.destroy();this.hands=[];this.controller.clear();}
}
