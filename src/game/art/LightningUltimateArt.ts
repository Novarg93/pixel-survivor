import type Phaser from 'phaser';
import type {World} from '../systems/World';
import type {Point} from '../utils/math';
import {ULTIMATE} from '../config/ultimates';
import {LIGHTNING_ULTIMATE_TEXTURE,LIGHTNING_ULTIMATE_MANIFEST as pack,LIGHTNING_ULTIMATE_VFX as V,lightningUltimateFrame,type LightningUltimateClip} from './lightningUltimatePack';
import {lightningBeamPath} from './lightningBeamPath';
const C=ULTIMATE.lightning;
export interface LightningUltimateView {kind:'sky'|'primary'|'branch'|'impact';frame:string;x:number;y:number;width:number;height:number;originX:number;originY:number;rotation:number;depth:number;alpha:number;targetId?:number;segmentIndex?:number;segmentCount?:number}
export function lightningUltimateViews(w:World,hands:readonly Point[],heroDepth=10,reduced=false):LightningUltimateView[]{
  const u=w.ultimate,now=w.elapsed;
  if(w.status==='menu'||w.status==='over'||u.selected!=='lightning'||!Number.isFinite(u.started))return [];
  const views:LightningUltimateView[]=[],age=now-u.started,after=now-u.released;
  const single=(clip:LightningUltimateClip,kind:LightningUltimateView['kind'],at:Point,scale:number,progress:number,depth:number,targetId?:number)=>{
    const c=pack.clips[clip];views.push({kind,frame:lightningUltimateFrame(clip,progress),x:at.x,y:at.y,width:c.width*scale,height:c.height*scale,originX:c.pivot.x/c.width,originY:c.pivot.y/c.height,rotation:0,depth,alpha:reduced?.5:1,targetId});
  };
  // The entire original sky clip ends at release. Depth guarantees that the
  // opaque hero/arms stay above both its column and the native contact ring.
  if(u.released<u.started&&age>=C.invocation&&age<C.preparation)single('sky','sky',{x:w.player.x,y:w.player.y-7},V.skyScale,(age-C.invocation)/(C.preparation-C.invocation),heroDepth-.4);
  const duration=C.reveal+C.hold+C.fade;
  if(after<0||after>=duration)return views;
  const palm=hands.length?hands.reduce((a,b)=>(a.x-u.origin.x)*u.direction.x+(a.y-u.origin.y)*u.direction.y>(b.x-u.origin.x)*u.direction.x+(b.y-u.origin.y)*u.direction.y?a:b):{x:w.player.x+u.direction.x*8,y:w.player.y-7};
  let remaining:number=V.segmentBudget;
  for(const [i,n]of u.nodes.slice(0,C.targetCap).entries()){
    const from=i===0?palm:n.from,clipId='branch' as const,clip=pack.clips[clipId],path=lightningBeamPath(from,n.at,n.id);
    const alpha=(reduced?.5:1)*(after<C.reveal+C.hold?1:Math.max(0,(duration-after)/C.fade));
    for(const [segmentIndex,s]of path.entries()){
      if(remaining<=0)break;remaining--;
      const dx=s.to.x-s.from.x,dy=s.to.y-s.from.y,len=Math.hypot(dx,dy);
      views.push({kind:i===0?'primary':'branch',frame:lightningUltimateFrame(clipId,reduced?.4:after/duration),x:s.from.x,y:s.from.y,width:clip.width*len/(V.beamEndX-clip.pivot.x),height:clip.height*(i===0?V.primaryThickness:V.branchThickness),originX:clip.pivot.x/clip.width,originY:clip.pivot.y/clip.height,rotation:Math.atan2(dy,dx),depth:14.2,alpha,targetId:n.id,segmentIndex,segmentCount:path.length});
    }
    single('impact','impact',n.at,V.impactScale,reduced?.18:after/duration,14.3,n.id);views[views.length-1]!.alpha=alpha;
  }
  return views;
}
export class LightningUltimateArt{
  private images:Phaser.GameObjects.Image[]=[];
  private active:LightningUltimateView[]=[];
  constructor(private scene:Phaser.Scene){}
  render(w:World,intensity:number,hands:readonly Point[],reduced:boolean,heroDepth=10){
    this.active=lightningUltimateViews(w,hands,heroDepth,reduced);
    for(const [i,v]of this.active.entries()){
      const image=this.images[i]??this.scene.add.image(0,0,LIGHTNING_ULTIMATE_TEXTURE,v.frame);this.images[i]=image;
      image.setName('lightning-ultimate-'+v.kind).setTexture(LIGHTNING_ULTIMATE_TEXTURE,v.frame).setPosition(v.x,v.y).setOrigin(v.originX,v.originY).setDisplaySize(v.width,v.height).setRotation(v.rotation).setDepth(v.depth).setAlpha(v.alpha*Math.max(0,Math.min(1,intensity))).setVisible(true).setActive(true);
    }
    for(let i=this.active.length;i<this.images.length;i++)this.images[i]!.setVisible(false).setActive(false);
  }
  diagnostics(){return{active:this.active,allocated:this.images.length,limit:1+C.targetCap+V.segmentBudget,segmentLength:V.segmentLength,atlasBytes:pack.rgbaBytes};}
  destroy(){for(const image of this.images)image.destroy();this.images=[];this.active=[];}
}
