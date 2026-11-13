import type Phaser from 'phaser';
import type {World} from '../systems/World';
import type {Impact} from '../entities/types';
import {WARRIOR_SKILLS,warriorSkillsTexture} from './warriorSkillsPack';

export class WarriorSkillArt{
 private run='';private pending=new Map<number,Readonly<Impact>>();
 private cracks:{x:number;y:number;started:number}[]=[];private images:Phaser.GameObjects.Image[]=[];
 constructor(private scene:Phaser.Scene){}
 prepare(w:World){
  if(this.run!==w.runId){this.clear();this.run=w.runId;}
  for(const i of w.impacts)if(i.source==='slam'&&!i.hostile&&this.pending.size<24)this.pending.set(i.id,{...i});
 }
 render(w:World,intensity:number){
  const live=new Set(w.impacts.map(i=>i.id));
  for(const[id,i]of this.pending)if(!live.has(id)){
   if(w.elapsed>=i.landAt&&w.status!=='over'&&this.cracks.length<24)this.cracks.push({x:i.x,y:i.y,started:i.landAt});
   this.pending.delete(id);
  }
  this.cracks=this.cracks.filter(c=>w.elapsed-c.started<1);
  const loc=WARRIOR_SKILLS.locations['stomp-crack'];
  for(const[i,c]of this.cracks.entries()){
   const image=this.images[i]??this.scene.add.image(0,0,warriorSkillsTexture(loc.page),'stomp-crack');this.images[i]=image;
   image.setOrigin(.5,132/192).setDisplaySize(192,192).setPosition(c.x,c.y).setDepth(-.5).setAlpha(Math.min(1,(1-(w.elapsed-c.started))/.25)*intensity).setVisible(true);
  }
  for(let i=this.cracks.length;i<this.images.length;i++)this.images[i]!.setVisible(false);
 }
 private clear(){this.pending.clear();this.cracks=[];for(const image of this.images)image.setVisible(false);}
 destroy(){this.clear();for(const image of this.images)image.destroy();this.images=[];}
}
