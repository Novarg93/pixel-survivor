import Phaser from 'phaser';
import type {World} from '../systems/World';
import {mageDirection} from './MageHeroAnimation';
import {WARRIOR_HERO,warriorHeroSelection,warriorHeroTexture} from './warriorHeroPack';
import {WARRIOR_SKILLS,warriorSkillsTexture} from './warriorSkillsPack';
import type {WarriorHeroAnimation} from './WarriorHeroAnimation';

const KEY='warrior-moving-skills-v4',CELL=194,COLUMNS=10;
const LEG={x:76,y:108,width:40,height:43};
const SWORD=[[72,104],[78,101],[106,128],[102,133]];
const SWORD_HORIZONTAL=[[69,103],[122,105],[122,115],[69,112]];
const FRONT_SHIELD=[[110,96],[141,96],[135,136],[115,136],[109,119]];
const NORTH_SHIELD=[[64,93],[80,93],[85,115],[79,127],[63,118]];
const SHIELD=[[61,101],[85,101],[92,119],[87,133],[66,128]];
const BLOCK_SHIELD=[[85,89],[130,89],[125,127],[102,137],[84,115]];
const SPEAR_THROW=[[88,92],[100,94],[157,151],[146,158]];
export const movingCleaveLegCrop=LEG;
// Derived display layers only. Accepted PNGs/atlases are never edited.
export class WarriorMovingCleaveArt{
 private lower?:Phaser.GameObjects.Image;private owner?:Phaser.GameObjects.Sprite;
 private textureKeys:string[]=[];private locations=new Map<string,string>();
 private lowerFrame='';private run='';private stride=0;private x=0;private y=0;private elapsed=0;
 constructor(private scene:Phaser.Scene){}
 private ensure(){
  if(this.textureKeys.length)return;
  const upper=new Map<string,string>(),lower=new Map<string,string>();
  for(const[id,c]of Object.entries(WARRIOR_HERO.clips))if(/-(c1|c3|heavy)$/.test(id))for(const frame of c.frames)upper.set(frame,warriorHeroTexture(WARRIOR_HERO.locations[frame as keyof typeof WARRIOR_HERO.locations].page));
  for(const[id,clip]of Object.entries(WARRIOR_SKILLS.clips))if(!id.endsWith('whirlwind'))for(const frame of clip.frames)upper.set(frame,warriorSkillsTexture(WARRIOR_SKILLS.locations[frame as keyof typeof WARRIOR_SKILLS.locations].page));
  for(const id of ['front-run','north-run']as const)for(const frame of WARRIOR_HERO.clips[id].frames)lower.set(frame,warriorHeroTexture(WARRIOR_HERO.locations[frame as keyof typeof WARRIOR_HERO.locations].page));
  const entries=[...upper].map(([frame,texture])=>({frame,texture,part:'upper'})).concat([...lower].map(([frame,texture])=>({frame,texture,part:'lower'})));
  for(let offset=0;offset<entries.length;offset+=180){
  const pageEntries=entries.slice(offset,offset+180),key=KEY+'-'+offset/180;this.textureKeys.push(key);
  const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=Math.ceil(pageEntries.length/COLUMNS)*CELL;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Warrior layer canvas unavailable');ctx.imageSmoothingEnabled=false;
  const detail=document.createElement('canvas');detail.width=LEG.width;detail.height=LEG.height;
  const detailContext=detail.getContext('2d');if(!detailContext)throw Error('Warrior foreground canvas unavailable');
  const draw=(texture:string,frame:string,x:number,y:number)=>{const f=this.scene.textures.getFrame(texture,frame),step=frame.startsWith('north-stomp')?Math.round(14*Math.min(1,Number(frame.split('/')[1])/10)):0;ctx.drawImage(f.source.image as CanvasImageSource,f.cutX,f.cutY,192,192,x-step,y+step,192,192);};
  const polygon=(points:number[][],x:number,y:number)=>{ctx.beginPath();points.forEach(([px,py],i)=>i?ctx.lineTo(x+px,y+py):ctx.moveTo(x+px,y+py));ctx.closePath();};
  const frames:{name:string;x:number;y:number}[]=[];
  for(const[i,e]of pageEntries.entries()){
   const x=i%COLUMNS*CELL+1,y=Math.floor(i/COLUMNS)*CELL+1;frames.push({name:e.part+'/'+e.frame,x,y});
   if(e.part==='lower'){
    ctx.save();ctx.beginPath();ctx.rect(x+LEG.x,y+LEG.y-2,LEG.width,LEG.height+2);ctx.clip();draw(e.texture,e.frame,x,y);
    if(e.frame.startsWith('front')){
     const original=ctx.getImageData(x,y,192,192);
     ctx.globalCompositeOperation='destination-out';polygon(SWORD,x,y);ctx.fill();
     const legs=ctx.getImageData(x+LEG.x,y+LEG.y-2,LEG.width,LEG.height+2);
     // The Run sword occludes a few shin pixels. Reuse visible steel from the
     // opposite leg there, instead of leaving a sword-shaped hole in the gait.
     for(let dy=0;dy<legs.height;dy++)for(let dx=0;dx<legs.width;dx++){
      const px=LEG.x+dx,py=LEG.y-2+dy,mirror=188-px,to=(dy*legs.width+dx)*4,from=(py*192+mirror)*4,p=original.data;
      if(legs.data[to+3]===0&&ctx.isPointInPath(x+px+.5,y+py+.5)&&!ctx.isPointInPath(x+mirror+.5,y+py+.5)&&p[from+3]>0&&p[from+2]>=p[from]&&p[from+1]>=p[from]*.9)legs.data.set(p.subarray(from,from+4),to);
     }
     ctx.putImageData(legs,x+LEG.x,y+LEG.y-2);
    }
    ctx.restore();
   }else{
    draw(e.texture,e.frame,x,y);
    const foreground=ctx.getImageData(x,y,192,192);
    ctx.clearRect(x+LEG.x,y+LEG.y,LEG.width,LEG.height);
    // The sword and shield can cross the waist. Preserve their foreground pixels.
    ctx.save();ctx.beginPath();ctx.rect(x+LEG.x,y+LEG.y,LEG.width,LEG.height);ctx.clip();
    const restore=(points:number[][])=>{ctx.save();polygon(points,x,y);ctx.clip();draw(e.texture,e.frame,x,y);ctx.restore();};
    if(e.frame.startsWith('front')){
     const index=Number(e.frame.split('/')[1]);
     restore(/front-(block|charge|stomp)/.test(e.frame)&&index>=2&&index<=8?BLOCK_SHIELD:FRONT_SHIELD);
     if(e.frame.startsWith('front-c1'))restore(index===5||index===6?SWORD_HORIZONTAL:SWORD);
     else if(e.frame.startsWith('front-throw')){if(index>=5&&index<=10)restore(SPEAR_THROW);}
     else if(/front-(c3|heavy|cleave)/.test(e.frame)&&(e.frame.startsWith('front-heavy')?index<3||index>11:index<2||index>10))restore(SWORD);
    }else restore(/north-(c1|c3|heavy|cleave)\/[4-8]$/.test(e.frame)?SHIELD:NORTH_SHIELD);
    ctx.restore();
    if(foreground){
     // Baked slash ribbons pass in front of the legs. Keep their exact RGBA,
     // including darker interior rows connecting the bright edges of the ribbon.
     const pixels=detailContext.createImageData(LEG.width,LEG.height),source=foreground.data;
     const bright=(px:number,py:number)=>{const i=(py*192+px)*4;return source[i+3]>0&&source[i]+source[i+1]+source[i+2]>330;};
     for(let dy=0;dy<LEG.height;dy++){
      const py=LEG.y+dy,ribbon=bright(LEG.x-3,py)&&bright(LEG.x+LEG.width+3,py);
      for(let dx=0;dx<LEG.width;dx++){const from=(py*192+LEG.x+dx)*4,to=(dy*LEG.width+dx)*4;
       if(source[from+3]&&(ribbon||source[from]+source[from+1]+source[from+2]>375&&source[from+1]>120&&source[from+2]>90))pixels.data.set(source.subarray(from,from+4),to);
      }
     }
     detailContext.putImageData(pixels,0,0);ctx.drawImage(detail,x+LEG.x,y+LEG.y);
    }
   }
  }
  const texture=this.scene.textures.addCanvas(key,canvas);if(!texture)throw Error('Warrior layer texture unavailable');
  for(const f of frames){texture.add(f.name,0,f.x,f.y,192,192);this.locations.set(f.name,key);}texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 }
 }
 render(owner:Phaser.GameObjects.Sprite,w:World,pose:ReturnType<WarriorHeroAnimation['view']>,moving:boolean,size:number){
  this.ensure();this.owner=owner;
  if(this.run!==w.runId){this.run=w.runId;this.stride=0;this.x=w.player.x;this.y=w.player.y;this.elapsed=w.elapsed;}
  this.stride+=Math.min(Math.hypot(w.player.x-this.x,w.player.y-this.y),Math.max(0,w.elapsed-this.elapsed)*w.effectiveSpeed*1.5)/118;
  this.x=w.player.x;this.y=w.player.y;this.elapsed=w.elapsed;
  const layered=(moving||pose.motion==='charge')&&['attack','stomp','block','throw','charge'].includes(pose.motion);
  if(!layered){this.lower?.setVisible(false).setActive(false);this.lowerFrame='';return;}
  const facing=pose.motion==='charge'?w.mobility.direction:w.facing,direction=mageDirection(facing.x,facing.y,pose.direction),legs=warriorHeroSelection(direction,'run',this.stride);
  const upperFrame='upper/'+pose.frame,lowerFrame='lower/'+legs.frame;
  owner.setTexture(this.locations.get(upperFrame)!,upperFrame);
  this.lower??=this.scene.add.image(0,0,this.locations.get(lowerFrame)!,lowerFrame).setName('warrior-moving-skill-legs');
  this.lower.setTexture(this.locations.get(lowerFrame)!,lowerFrame).setOrigin(legs.origin.x,legs.origin.y).setDisplaySize(size,size).setFlipX(legs.flipX).setPosition(w.player.x,w.player.y).setDepth(owner.depth-.001).setVisible(true).setActive(true);
  this.lowerFrame=legs.frame;this.sync();
 }
 hide(){this.lower?.setVisible(false).setActive(false);this.lowerFrame='';}
 sync(){if(this.lower?.visible&&this.owner)this.lower.setAlpha(this.owner.alpha).setTint(this.owner.tintTopLeft);}
 diagnostics(){return {layered:!!this.lower?.visible,lowerFrame:this.lowerFrame,stride:this.stride,allocated:this.lower?1:0};}
 destroy(){this.lower?.destroy();this.lower=undefined;this.owner=undefined;for(const key of this.textureKeys)if(this.scene.textures.exists(key))this.scene.textures.remove(key);this.textureKeys=[];this.locations.clear();this.lowerFrame='';this.run='';}
}
