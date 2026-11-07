import type Phaser from 'phaser';
import type { World } from '../systems/World';
import { FINAL_BOSS as C } from '../config/finalBoss';
import {WARDEN,wardenTexture,wardenIndex,wardenPose,wardenFacing,type WardenLayer} from './ashWardenPack';
import {ultimateFrozen} from '../systems/UltimateFreeze';
import { enemyVisual } from './assetRegistry';
import {FlameStrikeArt} from './FlameStrikeArt';
import {MeleeComboArt} from './MeleeComboArt';
export class FinalBossArt {
  private ground:Phaser.GameObjects.Graphics;private tells:Phaser.GameObjects.Graphics;
  private images:Phaser.GameObjects.Image[]=[];private used=0;private ghosts:Phaser.GameObjects.Image[]=[];
  private labels:Phaser.GameObjects.Text[]=[];
  private deathAge=0;
  private pose:ReturnType<typeof wardenPose>|null=null;
  private flameStrike:FlameStrikeArt;
  private meleeCombo:MeleeComboArt;
  constructor(private scene:Phaser.Scene){
    this.ground=scene.add.graphics().setName('final-arena').setDepth(-.8);
    this.tells=scene.add.graphics().setName('final-telegraphs').setDepth(20.2);
    this.flameStrike=new FlameStrikeArt(scene);
    this.meleeCombo=new MeleeComboArt(scene);
  }
  private image(layer:WardenLayer,x:number,y:number,depth:number,flip=false,scale=1,alpha=1,tint=0xffffff,scaleY=scale){
    if(this.used>=48)return;
    const texture=layer.texture??wardenTexture(WARDEN.locations[layer.frame]!);
    const image=this.images[this.used]??this.scene.add.image(0,0,texture);this.images[this.used++]=image;
    image.setTexture(texture,layer.frame).setName('ash-warden-layer').setOrigin(layer.pivot[0]!/image.frame.realWidth,layer.pivot[1]!/image.frame.realHeight).setPosition(x,y).setScale(layer.scale*scale,layer.scale*scaleY).setDepth(depth).setFlipX(flip).setAlpha(alpha).setTint(tint).setVisible(true);
    return image;
  }
  private clip(id:string,age:number,x:number,y:number,depth:number,scale=1,alpha=1,scaleY=scale,flip=false){
    const c=WARDEN.clips[id]!;for(const layer of c.frames[wardenIndex(c,age)]!.layers)this.image(layer,x,y,depth,flip,scale,alpha,0xffffff,scaleY)?.setName(`ash-warden-${id}`);
  }
  private actors(w:World,intensity:number,reduced:boolean){
    const f=w.finalEncounter,e=f.boss!;const pose=wardenPose(f),depth=e.y/10000;
    const decor=Math.max(0,Math.min(1,intensity))*(reduced?.6:1),contact=.35+.65*decor;
    this.pose=pose;
    const tint=ultimateFrozen(e,w.elapsed)?0x96d9ec:e.hitUntil>w.elapsed?0xffe5b3:0xffffff;
    for(const [i,layer]of pose.frame.layers.entries())this.image(layer,e.x,e.y,depth+i*.00001,pose.frame.flipX,1,1,tint);
    if(f.phase==='phase3'){if(pose.frame.overlay)this.image(pose.frame.overlay,e.x,e.y,depth+.00004,pose.frame.flipX);this.clip('vfx-phase3Embers',f.bossClock%.6,e.x,e.y,depth+.00005,1,decor);}
    if(f.phase==='intro'){this.clip('layer-reveal',f.attack.age,e.x,e.y,depth+.0001);if(f.attack.age<.62)this.clip('vfx-spawn',f.attack.age,e.x,e.y,-.2,1,decor);}
    if(f.pending==='phase3'){this.clip('layer-overheat',f.attack.age,e.x,e.y,depth+.0001);if(f.attack.age>=.7&&f.attack.age<1.1)this.clip('vfx-overload',f.attack.age-.7,e.x,e.y,depth+.0002,1,contact);}
    if(f.attack.kind==='shieldBreak'&&f.attack.age<.42)this.clip('vfx-shatter',f.attack.age,e.x,e.y,depth+.0001,1,contact);
    if(f.attack.kind==='death'){
      const age=f.attack.age;
      this.clip('layer-fatalPulse',age,e.x,e.y,depth+.0001);this.clip('layer-extinction',age,e.x,e.y,depth+.0002);
      if(age>=.86){this.clip('layer-sword',age-.86,e.x,e.y,depth+.0003);this.clip('layer-swordExtinction',age,e.x,e.y,depth+.0004);}
      if(age>=.97&&age<1.33)this.clip('vfx-stoneHit',age-.97,e.x,e.y,-.15,1,decor);
      if(age>=1.48&&age<2.08)this.clip('vfx-deathAsh',age-1.48,e.x,e.y,depth+.0005,1,decor);
    }
    for(const event of f.events){
      if(event.name!=='chargeStart'&&event.name!=='chargeStop')continue;
      const stop=event.name==='chargeStop',age=f.clock-event.clock;if(age<0||age>=(stop?.24:.16))continue;
      const flip=wardenFacing(event.direction??f.attack.direction)==='west';
      for(const [i,layer]of ['ground','back','front'].entries())this.clip(`charge-${stop?'stop':'start'}-${layer}`,age,event.x+(flip?-1:1)*2.6193243244,event.y-1.3096621622,i===2?depth+.001:-.2+i*.001,1,decor,1,flip);
    }
    for(const m of f.meteors){
      if(m.age<0)continue;
      const visualScale=C.meteorRadius/(39*.6548310811),warning=m.warning??C.meteorWarning;
      if(!m.landed){
        this.clip('meteor-telegraph',Math.min(.899,m.age),m.x,m.y,-.3,visualScale,.85,C.meteorRadius/(18*.6548310811));
        if(m.age>=warning-.3){const age=m.age-(warning-.3),height=(1-age/.3)*180;this.clip('meteor-fall',age,m.x,m.y-height,18,visualScale);}
      }else{
        const age=m.age-warning;
        if(age<.4)this.clip('meteor-impact',age,m.x,m.y,17,visualScale,contact);
        if(age>=.18)this.clip('meteor-aftermath',age-.18,m.x,m.y,-.25,visualScale,decor);
      }
    }
  }
  render(w:World,intensity:number,reduced:boolean){
    this.flameStrike.render(w,intensity,reduced);
    this.meleeCombo.render(w);
    const f=w.finalEncounter,e=f.boss,g=this.ground.clear(),t=this.tells.clear();this.used=0;for(const image of this.images)image.setVisible(false);
    this.deathAge=f.attack.kind==='death'?f.attack.age:0;
    for(const image of this.ghosts)image.setVisible(false);for(const label of this.labels)label.setVisible(false);
    if(f.phase==='inactive'||w.status==='menu'||!e)return;
    this.actors(w,intensity,reduced);
    if(f.phase==='defeated'||f.phase==='dying')return;
    if(w.status==='over')return;
    for(const [i,actor]of f.departing.entries()){
      const v=enemyVisual(actor.kind,actor.elite,0,i),image=this.ghosts[i]??this.scene.add.image(0,0,v.texture,v.frame);this.ghosts[i]=image;
      image.setTexture(v.texture,v.frame).setPosition(actor.x,actor.y-f.clock*18).setScale(v.scale*.25).setAlpha((1-f.clock/.7)*.55).setVisible(true);
    }
    // World geometry: charred roots and sparse pale ash stones, visible at zero decor intensity.
    for(let i=0;i<144;i++){
      const a=i*Math.PI/72,x=f.center.x+Math.cos(a)*C.arenaRadius,y=f.center.y+Math.sin(a)*C.arenaRadius;
      g.fillStyle(i%3?0x34434b:0x9bacad,.85).fillRect(Math.round(x)-3,Math.round(y)-2,6,4);
      if(i%3===0)g.lineStyle(2,0x7b7763,.8).lineBetween(x,y,x-Math.cos(a-.2)*20,y-Math.sin(a-.2)*20);
    }
    const a=f.attack;
    if(f.shielded){
      for(const id of f.supports.keys()){
        const support=w.enemies.find(e=>e.id===id);if(!support)continue;
        g.lineStyle(5,0x4d809f,.22).lineBetween(e.x,e.y-25,support.x,support.y-12);
        g.lineStyle(1.5,0xa8e0eb,.8).lineBetween(e.x,e.y-25,support.x,support.y-12);
        g.lineStyle(1,0xc3e8ed,.65).strokeCircle(support.x,support.y,29);
        const state=f.supports.get(id)!;
        if(state.warning)t.lineStyle(2,0xf3cb88).strokeCircle(support.x,support.y,22+Math.max(0,state.next-state.clock)*12);
      }
      g.lineStyle(2,0xb7e1ef,.85).strokeEllipse(e.x,e.y-31,91,118);
      g.lineStyle(5,0x88bdd6,.14).strokeEllipse(e.x,e.y-31,94,120);
      for(let i=0;i<6;i++){const angle=i*Math.PI/3,px=e.x+Math.cos(angle)*44,py=e.y-31+Math.sin(angle)*56;g.fillStyle(0xd2f3f7,.85).fillRect(px-2,py-2,4,4);}
    }
    if(a.kind==='shieldBreak'){
      const p=Math.min(1,a.age/.7);for(let i=0;i<12;i++){const angle=i*Math.PI/6,drift=35+p*60;g.lineStyle(2,0xc8f0f4,(1-p)*.9).lineBetween(e.x+Math.cos(angle)*drift,e.y-25+Math.sin(angle)*drift,e.x+Math.cos(angle)*drift+4,e.y-34+Math.sin(angle)*drift);}
    }
    for(const m of f.meteors)if(m.age>=0&&!m.landed){
      // Exact world danger boundary: art ellipse is decorative, gameplay circle is authoritative.
      t.lineStyle(1.5,0xffd29a,.95).strokeCircle(m.x,m.y,C.meteorRadius);
      t.lineStyle(1,0xffe9c1,.9).beginPath().arc(m.x,m.y,C.meteorRadius-3,-Math.PI/2,-Math.PI/2+Math.min(1,m.age/(m.warning??C.meteorWarning))*Math.PI*2).strokePath();
    }
    // Quantized direction buckets group nearby offscreen markers. They are world-space UI only.
    const buckets=new Map<number,{x:number;y:number;count:number;boss:boolean}>();
    const camera=this.scene.cameras.main,halfW=camera.width/camera.zoom/2,halfH=camera.height/camera.zoom/2;
    for(const target of [e,...w.guardians.filter(g=>g.finalRole)]){
      const dx=target.x-w.player.x,dy=target.y-w.player.y;
      if(Math.abs(dx)<halfW-35&&Math.abs(dy)<halfH-38)continue;
      const angle=Math.atan2(dy,dx),key=(Math.round(angle/(Math.PI/10))+20)%20,r=Math.min((halfW-32)/Math.max(.01,Math.abs(Math.cos(angle))),(halfH-44)/Math.max(.01,Math.abs(Math.sin(angle))));
      const previous=buckets.get(key);if(previous)previous.count++;else buckets.set(key,{x:w.player.x+Math.cos(angle)*r,y:w.player.y+Math.sin(angle)*r,count:1,boss:target===e});
    }
    let index=0;for(const marker of buckets.values()){
      const label=this.labels[index]??this.scene.add.text(0,0,'',{fontFamily:'monospace',fontSize:'10px',color:'#e4f1eb',backgroundColor:'#14252cd9',padding:{x:3,y:2}}).setDepth(24).setOrigin(.5);this.labels[index++]=label;
      label.setPosition(marker.x,marker.y).setText(marker.boss?'СТРАЖ':`ЩИТ${marker.count>1?' ×'+marker.count:''}`).setVisible(true);
    }
  }
  diagnostics(){const flameStrike=this.flameStrike.diagnostics(),meleeCombo=this.meleeCombo.diagnostics();return{deathAge:this.deathAge,pose:this.used?this.pose:null,bodyImages:this.images.filter(i=>i.visible&&i.name==='ash-warden-layer').map(i=>({frame:i.frame.name,flipX:i.flipX,x:i.x,y:i.y})),telegraphCommands:this.tells.commandBuffer.length,meteorWarnings:this.images.filter(i=>i.visible&&i.name==='ash-warden-meteor-telegraph').map(i=>({x:i.x,y:i.y,frame:i.frame.name})),chargeImages:this.images.filter(i=>i.visible&&i.name.startsWith('ash-warden-charge-')).map(i=>({name:i.name,frame:i.frame.name,flipX:i.flipX,x:i.x,y:i.y})),pooledImages:this.images.length+flameStrike.pooledImages+meleeCombo.pooledImages,activeImages:this.used+flameStrike.activeImages+meleeCombo.activeImages,ghosts:this.ghosts.length,labels:this.labels.length,atlasBytes:WARDEN.rgbaBytes,atlasPages:WARDEN.pages,flameStrike,meleeCombo,totalAtlasBytes:WARDEN.rgbaBytes+flameStrike.atlasBytes+meleeCombo.atlasBytes};}
  destroy(){this.meleeCombo.destroy();this.flameStrike.destroy();this.ground.destroy();this.tells.destroy();for(const image of this.images)image.destroy();for(const image of this.ghosts)image.destroy();for(const label of this.labels)label.destroy();}
}
