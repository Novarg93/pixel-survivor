import type Phaser from 'phaser';
import type { World } from '../systems/World';
import { ultimateFrozen } from '../systems/UltimateFreeze';
import { enemyVisual,visualDimensions } from './assetRegistry';
import type { Point } from '../utils/math';
import { FROST_AVALANCHE as A, frostAvalanchePixels } from './frostAvalancheTexture';
interface RuneLine { a:Point;b:Point;r:number }
function runeLines(radius:number):RuneLine[]{
  const lines:RuneLine[]=[];
  const add=(a:Point,b:Point)=>lines.push({a,b,r:(Math.hypot(a.x,a.y)+Math.hypot(b.x,b.y))/2});
  const at=(r:number,a:number)=>({x:Math.cos(a)*radius*r,y:Math.sin(a)*radius*r});
  for(const r of [1,.91,.68,.4])for(let i=0;i<64;i++)add(at(r,i*Math.PI/32),at(r,(i+1)*Math.PI/32));
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6;
    for(let j=0;j<4;j++)add(at(.08+j*.15,a),at(.23+j*.15,a));
    const p=at(.8,a),dx=Math.cos(a),dy=Math.sin(a),size=radius*.035;
    const mark=(x:number,y:number)=>({x:p.x+dx*x*size-dy*y*size,y:p.y+dy*x*size+dx*y*size});
    add(mark(-1,-1),mark(1,1));add(mark(1,-1),mark(-1,1));add(mark(-1,-1),mark(1,-1));add(mark(1,1),mark(2,0));
    add(at(.4,a),at(.68,a+Math.PI/6));
  }
  return lines;
}
// Two bounded batches plus one cached avalanche image; ice on at most156 actors.
export class FrostUltimateArt {
  private ground:Phaser.GameObjects.Graphics;private ice:Phaser.GameObjects.Graphics;
  private avalanche:Phaser.GameObjects.Image;private ownsTexture=false;private avalancheRadius=0;
  private lines:RuneLine[]=[];private started=-Infinity;private run='';private phase='idle';private frozen=0;private drawn=0;
  constructor(private scene:Phaser.Scene){
    this.ground=scene.add.graphics().setName('eternal-winter-seal').setDepth(-1.5);this.ice=scene.add.graphics().setName('ultimate-frozen-silhouettes').setDepth(4.8);
    if(!scene.textures.exists(A.key)){
      const texture=scene.textures.createCanvas(A.key,A.size,A.size);
      if(!texture)throw new Error('Unable to create frost avalanche texture');
      const data=texture.context.createImageData(A.size,A.size);data.data.set(frostAvalanchePixels());texture.context.putImageData(data,0,0);texture.refresh();this.ownsTexture=true;
    }
    this.avalanche=scene.add.image(0,0,A.key).setName('frost-avalanche').setDepth(4.9).setVisible(false);
  }
  render(w:World,intensity:number,reduced:boolean){
    const g=this.ground.clear(),ice=this.ice.clear(),f=w.ultimate.frost,now=w.elapsed,view=f.view(now),strength=Math.max(0,Math.min(1,intensity));this.frozen=this.drawn=0;this.phase='idle';
    this.avalanche.setVisible(false);this.avalancheRadius=0;
    if(this.run!==w.runId){this.run=w.runId;this.started=-Infinity;this.lines=[];}
    if(w.status==='over'||w.status==='menu')return;
    if(w.ultimate.selected==='frost'&&view.phase!=='idle'){
      if(this.started!==f.started){this.started=f.started;this.lines=runeLines(f.radius);}
      this.phase=view.phase;const x=f.origin.x,y=f.origin.y,r=f.radius,age=now-f.started,fade=view.phase==='field'?Math.min(1,view.remaining/.3):1;
      const pulse=reduced?1:.94+.06*Math.sin(age*2),dark=r*view.dark,light=r*view.light;
      g.fillStyle(0x416bb2,(view.phase==='invocation'?.045:.065)*strength*fade).fillCircle(x,y,r);
      for(let i=0;i<12;i++){
        const a=i*2.39996323,drift=reduced?0:Math.sin(age*.5+i)*r*.045,px=x+Math.cos(a)*(r*.62+drift),py=y+Math.sin(a)*(r*.62+drift);
        g.fillStyle(i%2?0x9bcadd:0x719fc7,.05*strength*fade).fillEllipse(px,py,r*.75,r*.23);
        g.fillStyle(0xb1dbe7,.025*strength*fade).fillEllipse(px+r*.04,py-r*.02,r*.48,r*.12);
      }
      for(const line of this.lines){if(line.r>dark)continue;const bright=line.r<=light&&(view.phase==='activation'||view.active);
        g.lineStyle(bright?1.2:1.7,bright?0x95e4f7:0x173b83,(bright?.72:.85)*strength*fade*pulse).lineBetween(x+line.a.x,y+line.a.y,x+line.b.x,y+line.b.y);this.drawn++;
      }
      if(view.phase==='activation')g.lineStyle(2,0xd0f8ff,.35*strength).strokeCircle(x,y,light);
      if(view.avalancheVisible&&view.avalanche>0){
        this.avalancheRadius=r*view.avalanche;
        const diameter=this.avalancheRadius*A.size/A.radius;
        // Hold the snow crest through the sweep, then dissolve it at the rune boundary.
        const opacity=Math.min(1,(1-view.avalanche)/.14)*strength*(reduced?.65:.9);
        this.avalanche.setPosition(x,y).setDisplaySize(diameter,diameter).setAlpha(opacity).setVisible(true);
      }
      const count=reduced?12:24;
      for(let i=0;i<count;i++){const a=i*2.39996323,p=(i*.31+(reduced?0:age*.08))%1,rad=view.phase==='invocation'?15+p*16:r*(.25+.7*p);g.fillStyle(0xc2eff8,.45*strength*fade).fillRect(Math.round(x+Math.cos(a)*rad),Math.round(y+Math.sin(a)*rad-(reduced?0:p*8)),1,i%3?1:3);}
    }
    for(const e of w.enemies){if(!ultimateFrozen(e,now))continue;this.frozen++;
      const size=visualDimensions(enemyVisual(e.kind,e.elite,0,e.id)),rx=size.width*.42,ry=size.height*.48,x=e.x,y=e.y;
      ice.fillStyle(0xa3e6f4,.1*strength).fillTriangle(x-rx,y+ry,x-rx*.7,y-ry,x+rx*.75,y-ry*.5).fillTriangle(x-rx,y+ry,x+rx*.75,y-ry*.5,x+rx,y+ry*.8);
      ice.lineStyle(1,0xc4f6ff,.5*strength).lineBetween(x-rx,y+ry,x-rx*.7,y-ry).lineBetween(x-rx*.7,y-ry,x+rx*.75,y-ry*.5).lineBetween(x+rx*.75,y-ry*.5,x+rx,y+ry*.8);
      ice.lineStyle(.8,0xe2fcff,.4*strength).lineBetween(x-rx*.7,y-ry,x+rx*.4,y+ry*.6).lineBetween(x-rx,y+ry,x+rx*.75,y-ry*.5);
      ice.fillStyle(0xe1faff,.6*strength).fillRect(Math.round(x-rx*.5),Math.round(y-ry*.6),2,3).fillRect(Math.round(x+rx*.6),Math.round(y+ry*.5),2,2);
    }
  }
  diagnostics(){return{phase:this.phase,segments:this.drawn,geometry:this.lines.length,frozen:this.frozen,batches:3,avalancheRadius:this.avalancheRadius,avalancheVisible:this.avalanche.visible};}
  destroy(){this.ground.destroy();this.ice.destroy();this.avalanche.destroy();if(this.ownsTexture)this.scene.textures.remove(A.key);this.lines=[];}
}
