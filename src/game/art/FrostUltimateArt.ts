import type Phaser from 'phaser';
import type { World } from '../systems/World';
import { ultimateFrozen } from '../systems/UltimateFreeze';
import { enemyVisual,visualDimensions } from './assetRegistry';
import {frostUltimateNovaView,frostUltimateRuneView,frostUltimateFrame} from './frostUltimatePack';
export {frostUltimateNovaView} from './frostUltimatePack';
// Two bounded batches plus one authored atlas image; ice on at most156 actors.
export class FrostUltimateArt {
  private ground:Phaser.GameObjects.Graphics;private ice:Phaser.GameObjects.Graphics;
  private nova:Phaser.GameObjects.Image;private rune:Phaser.GameObjects.Image;
  private runeView:ReturnType<typeof frostUltimateRuneView>=null;
  private phase='idle';private frozen=0;private active:ReturnType<typeof frostUltimateNovaView>=null;
  constructor(scene:Phaser.Scene){
    this.ground=scene.add.graphics().setName('eternal-winter-seal').setDepth(-1.5);this.ice=scene.add.graphics().setName('ultimate-frozen-silhouettes').setDepth(4.8);
    this.rune=scene.add.image(0,0,'ice-crystal',frostUltimateFrame('ice-crystal',0)).setName('frost-ultimate-rune').setVisible(false);
    this.nova=scene.add.image(0,0,'ice-wave',frostUltimateFrame('ice-wave',0)).setName('frost-nova-ultimate').setVisible(false).setActive(false);
  }
  render(w:World,intensity:number,reduced:boolean){
    const g=this.ground.clear(),ice=this.ice.clear(),f=w.ultimate.frost,now=w.elapsed,view=f.view(now),strength=Math.max(0,Math.min(1,intensity));this.frozen=0;this.phase='idle';
    this.runeView=frostUltimateRuneView(w,intensity,reduced);this.rune.setVisible(false);
    if(this.runeView){const v=this.runeView;this.rune.setFrame(v.frame).setPosition(v.x,v.y).setDisplaySize(v.size,v.size).setDepth(v.depth).setAlpha(v.alpha).setVisible(true);}
    this.active=frostUltimateNovaView(w,intensity);this.nova.setVisible(false).setActive(false);
    if(this.active){const v=this.active;this.nova.setFrame(v.frame).setOrigin(.5).setTint(0xffffff).setBlendMode('NORMAL').setPosition(v.x,v.y).setDisplaySize(v.size,v.size).setDepth(v.depth).setAlpha(v.alpha).setVisible(true).setActive(true);}
    if(w.status==='over'||w.status==='menu')return;
    if(w.ultimate.selected==='frost'&&view.phase!=='idle'){
      this.phase=view.phase;const x=f.origin.x,y=f.origin.y,r=f.radius,age=now-f.started,fade=view.phase==='field'?Math.min(1,view.remaining/.3):1;
      g.fillStyle(0x416bb2,(view.phase==='invocation'?.045:.065)*strength*fade).fillCircle(x,y,r);
      for(let i=0;i<12;i++){
        const a=i*2.39996323,drift=reduced?0:Math.sin(age*.5+i)*r*.045,px=x+Math.cos(a)*(r*.62+drift),py=y+Math.sin(a)*(r*.62+drift);
        g.fillStyle(i%2?0x9bcadd:0x719fc7,.05*strength*fade).fillEllipse(px,py,r*.75,r*.23);
        g.fillStyle(0xb1dbe7,.025*strength*fade).fillEllipse(px+r*.04,py-r*.02,r*.48,r*.12);
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
  diagnostics(){return{phase:this.phase,frozen:this.frozen,batches:4,nova:this.active,rune:this.runeView};}
  destroy(){this.ground.destroy();this.ice.destroy();this.nova.destroy();this.rune.destroy();this.active=this.runeView=null;}
}
