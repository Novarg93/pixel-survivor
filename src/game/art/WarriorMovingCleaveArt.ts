import Phaser from 'phaser';
import type {World} from '../systems/World';
import {WARRIOR_HERO,warriorHeroSelection,warriorHeroTexture} from './warriorHeroPack';
import {WARRIOR_SKILLS,warriorSkillsTexture} from './warriorSkillsPack';
import type {WarriorHeroAnimation} from './WarriorHeroAnimation';
import legLayers from './warriorMovingLegs.json';

// User-selected full-body attacks. The compositor remains for archived art review.
const MOVING_ATTACK_LEGS_ENABLED=false;
const KEY='warrior-moving-skills-v8',CELL=194,COLUMNS=10;
// The leg image has padding for heels; only the central body is cut from attacks.
const LEG=legLayers.upperCut;
const FRONT_SHIELD=[[110,88],[141,88],[135,136],[115,136],[109,119]];
const FRONT_HAND=[[66,88],[79,88],[81,111],[77,121],[66,121]];
const FRONT_RETURN_HAND=[[98,93],[111,96],[114,104],[110,110],[102,106],[97,101]];
const NORTH_HAND=[[106,91],[122,91],[122,107],[114,112],[106,104]];
const NORTH_SHIELD=[[64,88],[80,88],[85,115],[77,141],[63,132]];
const SHIELD=[[61,101],[85,101],[92,119],[83,143],[73,149],[62,132]];
const BLOCK_SHIELD=[[85,89],[130,89],[125,127],[102,137],[84,115]];
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
    // Restored pixels contain only this frame's moving lower body.
    // Neither the Run weapon nor the Run shield can leak into an active skill.
    const data=ctx.createImageData(legLayers.crop.width,legLayers.crop.height);
    const runs=legLayers.frames[e.frame as keyof typeof legLayers.frames];let at=0;
    for(let i=0;i<runs.length;i+=2)for(let n=0;n<runs[i];n++){data.data.set(legLayers.palette[runs[i+1]],at);at+=4;}
    ctx.putImageData(data,x+legLayers.crop.x,y+legLayers.crop.y);
   }else{
    draw(e.texture,e.frame,x,y);
    const foreground=ctx.getImageData(x,y,192,192);
    ctx.clearRect(x+LEG.x,y+LEG.y,LEG.width,LEG.height);
    // The sword and shield can cross the waist. Preserve their foreground pixels.
    ctx.save();ctx.beginPath();ctx.rect(x+LEG.x,y+LEG.y,LEG.width,LEG.height);ctx.clip();
    const restore=(points:number[][])=>{ctx.save();polygon(points,x,y);ctx.clip();draw(e.texture,e.frame,x,y);ctx.restore();};
    if(e.frame.startsWith('front')){
     const index=Number(e.frame.split('/')[1]);
     restore(FRONT_HAND);
     if(e.frame.startsWith('front-throw')&&index>=5)restore(FRONT_RETURN_HAND);
     restore(/front-(block|charge|stomp)/.test(e.frame)&&index>=2&&index<=8?BLOCK_SHIELD:FRONT_SHIELD);
    }else{restore(NORTH_HAND);restore(/north-(c1|c3|heavy|cleave)\/[4-8]$/.test(e.frame)?SHIELD:NORTH_SHIELD);}
    ctx.restore();
    if(foreground){
     // Long bright components are weapon bevels or baked VFX. A bright greave
     // by itself is not foreground: restoring it would reintroduce frozen legs.
     const highlight=new Set<number>(),weapon=new Set<number>(),throwing=e.frame.includes('-throw/');
     if(!throwing)for(let py=90;py<160;py++)for(let px=45;px<170;px++){const at=(py*192+px)*4,p=foreground.data;if(p[at+3]&&(p[at]>170&&p[at+1]>170&&p[at+2]>150||p[at]>100&&p[at+1]>115&&p[at+2]>125&&p[at+2]>=p[at]-10))highlight.add(py*192+px);}
     while(highlight.size){const seed=highlight.values().next().value!,queue=[seed];highlight.delete(seed);let minX=192,minY=192,maxX=0,maxY=0,warm=false,outside=false;
      for(let q=0;q<queue.length;q++){const at=queue[q],px=at%192,py=Math.floor(at/192),p=foreground.data;warm||=p[at*4]>170&&p[at*4+1]>170&&p[at*4+2]>150;outside||=px<LEG.x||px>=LEG.x+LEG.width;minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const next=(py+dy)*192+px+dx;if(highlight.delete(next))queue.push(next);}}
      if(queue.length<8||Math.max(maxX-minX,maxY-minY)<9||!warm&&!outside)continue;
      for(const at of queue){const px=at%192,py=Math.floor(at/192);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)weapon.add((py+dy)*192+px+dx);}
     }
     // Baked slash ribbons pass in front of the legs. Keep their exact RGBA,
     // including darker interior rows connecting the bright edges of the ribbon.
     const pixels=detailContext.createImageData(LEG.width,LEG.height),source=foreground.data;
     const bright=(px:number,py:number)=>{const i=(py*192+px)*4;return source[i+3]>0&&source[i]+source[i+1]+source[i+2]>330;};
     for(let dy=0;dy<LEG.height;dy++){
      const py=LEG.y+dy,ribbon=!throwing&&bright(LEG.x-3,py)&&bright(LEG.x+LEG.width+3,py);
      for(let dx=0;dx<LEG.width;dx++){const from=(py*192+LEG.x+dx)*4,to=(dy*LEG.width+dx)*4;
       if(source[from+3]&&(ribbon||weapon.has(py*192+LEG.x+dx)))pixels.data.set(source.subarray(from,from+4),to);
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
  if(!MOVING_ATTACK_LEGS_ENABLED){this.hide();return;}
  this.ensure();this.owner=owner;
  if(this.run!==w.runId){this.run=w.runId;this.stride=0;this.x=w.player.x;this.y=w.player.y;this.elapsed=w.elapsed;}
  this.stride+=Math.min(Math.hypot(w.player.x-this.x,w.player.y-this.y),Math.max(0,w.elapsed-this.elapsed)*w.effectiveSpeed*1.5)/118;
  this.x=w.player.x;this.y=w.player.y;this.elapsed=w.elapsed;
  const layered=(moving||pose.motion==='charge')&&['attack','stomp','block','throw','charge'].includes(pose.motion);
  if(!layered){this.lower?.setVisible(false).setActive(false);this.lowerFrame='';return;}
  // The waist cut and foreground belong to the attack's projection. Keep the
  // Run legs in that same view (including its mirror) when moving away from a
  // target or turning mid-swing; actual distance still advances the gait.
  const legs=warriorHeroSelection(pose.direction,'run',this.stride);
  const upperFrame='upper/'+pose.frame,lowerFrame='lower/'+legs.frame;
  owner.setTexture(this.locations.get(upperFrame)!,upperFrame);
  this.lower??=this.scene.add.image(0,0,this.locations.get(lowerFrame)!,lowerFrame).setName('warrior-moving-skill-legs');
  this.lower.setTexture(this.locations.get(lowerFrame)!,lowerFrame).setOrigin(legs.origin.x,legs.origin.y).setDisplaySize(size,size).setFlipX(legs.flipX).setPosition(w.player.x,w.player.y).setDepth(owner.depth-.001).setVisible(true).setActive(true);
  this.lowerFrame=legs.frame;this.sync();
 }
 hide(){this.lower?.setVisible(false).setActive(false);this.lowerFrame='';}
 sync(){if(this.lower?.visible&&this.owner)this.lower.setAlpha(this.owner.alpha).setTint(this.owner.tintTopLeft);}
 diagnostics(){return {layered:!!this.lower?.visible,lowerFrame:this.lowerFrame,lowerFlipX:this.lower?.flipX??false,stride:this.stride,allocated:this.lower?1:0};}
 destroy(){this.lower?.destroy();this.lower=undefined;this.owner=undefined;for(const key of this.textureKeys)if(this.scene.textures.exists(key))this.scene.textures.remove(key);this.textureKeys=[];this.locations.clear();this.lowerFrame='';this.run='';}
}
