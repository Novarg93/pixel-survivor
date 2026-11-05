import type Phaser from 'phaser';
import type { GroundDischarge } from '../ultimates/UltimateSystem';
import type { Point } from '../utils/math';
import { ULTIMATE } from '../config/ultimates';
const C=ULTIMATE.lightning;
// The main bolt/web finishes first; residual electricity follows65ms later.
export const AFTERSHOCK={delay:C.reveal+C.hold+C.fade+.065,stagger:.01,repeat:.32,life:.065,duration:1.6,passes:5,peak:.44} as const;
export interface AftershockArc { points:Point[];reveal:number;until:number;cell:number;pass:number }
const CELLS:readonly (readonly [number,number])[]=[
  [-.86,-.82],[-.43,-.82],[0,-.82],[.43,-.82],[.86,-.82],
  [-.86,0],[-.43,0],[.43,0],[.86,0],
  [-.86,.82],[-.43,.82],[0,.82],[.43,.82],[.86,.82],
  [-.23,-.28],[.06,-.34],[.25,-.13],[.23,.26],[-.06,.34],[-.25,.13],
  [-.64,-.42],[-.20,-.62],[.62,-.42],[.64,.42],[.20,.62],[-.62,.42],
];
const ORDER=[0,6,20,10,2,15,8,21,4,17,12,22,1,19,7,23,13,16,3,24,11,18,5,25,14,9] as const;
const SHAPES:readonly (readonly (readonly [number,number])[])[]=[
  [[-6,1],[-2,-2],[0,2],[2,-1],[6,0]],
  [[-5,-1],[-2,1],[0,-2],[1,2],[5,0]],
  [[-7,0],[-3,2],[-1,-1],[2,1],[3,-2],[7,0]],
  [[-5,1],[-1,-2],[0,1],[2,-1],[5,1]],
];
// Twenty-six fixed local zones. All five passes share the same authored point arrays.
// No gameplay or cosmetic RNG and no radial paths from the Mage.
export function aftershockArcs(origin:Point,radius:number,viewport={width:radius*1.65,height:radius*.85}):AftershockArc[]{
  if(!Number.isFinite(radius+origin.x+origin.y+viewport.width+viewport.height)||radius<=4)return[];
  const arcs:AftershockArc[]=[],scale=Math.max(.35,Math.min(1.15,radius/340));
  for(const [step,cell]of ORDER.entries()){
    const [cx,cy]=CELLS[cell],angle=((cell*5)%11-5)*.16,cos=Math.cos(angle),sin=Math.sin(angle),flip=cell%2?-1:1;
    const points=SHAPES[cell%SHAPES.length].map(([sx,sy])=>{
      const x=cx*viewport.width/2+(sx*cos-sy*sin)*scale,y=cy*viewport.height/2+(sx*sin+sy*cos)*scale*flip;
      const clamp=Math.min(1,(radius-3)/(Math.hypot(x,y)||1));
      return{x:Math.round(origin.x+x*clamp),y:Math.round(origin.y+y*clamp)};
    });
    for(let pass=1;pass<=AFTERSHOCK.passes;pass++){const reveal=AFTERSHOCK.delay+step*AFTERSHOCK.stagger+(pass-1)*AFTERSHOCK.repeat;arcs.push({points,reveal,until:reveal+AFTERSHOCK.life,cell,pass});}
  }
  return arcs;
}
export function aftershockAlpha(arc:AftershockArc,age:number,reduced=false){
  const local=age-arc.reveal;
  if(!Number.isFinite(local)||local<0||age>=arc.until||age>=AFTERSHOCK.delay+AFTERSHOCK.duration)return 0;
  const attack=Math.min(1,local/.008),fade=Math.max(0,Math.min(1,(AFTERSHOCK.life-local)/(AFTERSHOCK.life-.012)));
  return AFTERSHOCK.peak*attack*fade*(arc.pass===1?1:.72)*(reduced?.55:1);
}
export class LightningGroundArt {
  private g:Phaser.GameObjects.Graphics;
  private current:GroundDischarge|null=null;
  private arcs:AftershockArc[]=[];
  private alpha=0;private segments=0;private builds=0;private pass=0;
  private visibleCells:number[]=[];
  constructor(private scene:Phaser.Scene){this.g=scene.add.graphics().setName('lightning-ground-scars').setDepth(-.5);}
  render(ground:GroundDischarge|null,now:number,enabled:boolean,intensity:number,reduced:boolean){
    this.g.clear();this.alpha=this.segments=this.pass=0;this.visibleCells.length=0;
    if(ground!==this.current){this.current=ground;this.arcs=[];if(ground&&enabled){this.arcs=aftershockArcs(ground.origin,ground.radius,this.scene.cameras.main.worldView);this.builds++;}}
    if(!ground||!enabled)return;
    const age=now-ground.started,strength=Math.max(0,Math.min(1,intensity));
    if(age<0)return;
    if(age>=AFTERSHOCK.delay+AFTERSHOCK.duration){this.arcs=[];return;}
    for(const arc of this.arcs){
      const alpha=aftershockAlpha(arc,age,reduced)*strength;if(alpha<=0)continue;
      this.alpha=Math.max(this.alpha,alpha);this.visibleCells.push(arc.cell);this.pass=arc.pass;this.segments+=arc.points.length-1;
      this.stroke(arc,2.5,0x397fda,alpha*.08);
      this.stroke(arc,1.1,0x65c9ff,alpha*.8);
      this.stroke(arc,.65,0xe1f9ff,alpha);
    }
  }
  private stroke(arc:AftershockArc,width:number,color:number,alpha:number){
    const g=this.g;g.lineStyle(width,color,alpha).beginPath().moveTo(arc.points[0].x,arc.points[0].y);
    for(let i=1;i<arc.points.length;i++)g.lineTo(arc.points[i].x,arc.points[i].y);g.strokePath();
  }
  diagnostics(){return{segments:this.segments,alpha:this.alpha,sparks:0,radius:this.current?.radius??0,arcs:this.visibleCells.length,geometry:this.arcs.length,builds:this.builds,pass:this.pass,activeCells:[...this.visibleCells]};}
  destroy(){this.g.destroy();this.current=null;this.arcs=[];this.visibleCells.length=0;}
}
