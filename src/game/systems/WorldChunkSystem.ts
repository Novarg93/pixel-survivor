import Phaser from 'phaser';
import { chunkKeys } from '../utils/worldTiles';
import { mapDefinition, type BiomePresentationConfig } from '../config/biomes';
import { type AtmospherePhase } from '../config/atmosphere';
import { AtmospherePhaseController } from './AtmospherePhaseController';
import { createGroveArtAtlas, GROVE_ART_BUDGET, paintGroveRegion } from '../art/groveArtPack';

interface Surface { phase: AtmospherePhase; image: Phaser.GameObjects.Image }
interface Chunk { key: string; x: number; y: number; base: Surface; next?: Surface }
export class WorldChunkSystem {
  private chunks = new Map<string, Chunk>();
  private atlas = createGroveArtAtlas();
  private controller: AtmospherePhaseController;
  private state: ReturnType<AtmospherePhaseController['sample']>;
  private elapsed = 0;
  private builds = 0;
  private peakSurfaces = 0;
  private atmosphereTint = 0xffffff;
  setAtmosphereTint(tint: number) {
    if (tint === this.atmosphereTint) return;
    this.atmosphereTint = tint;
    for (const c of this.chunks.values()) for (const s of [c.base,c.next]) s?.image.setTint(tint).setTintMode(Phaser.TintModes.MULTIPLY);
  }
  setPresentationTime(elapsed: number) { this.elapsed = elapsed; this.state = this.controller.sample(elapsed); }
  constructor(private scene: Phaser.Scene, private presentation: BiomePresentationConfig = mapDefinition('grove').presentation) {
    this.controller = new AtmospherePhaseController(presentation.phases); this.state = this.controller.sample(0);
  }
  private surface(c: Pick<Chunk,'key'|'x'|'y'>, phase: AtmospherePhase): Surface {
    const key = `${c.key}-${phase}`;
    // Immutable Canvas source: avoid CanvasTexture's unnecessary ImageData readback/copy.
    const canvas = paintGroveRegion(this.atlas,phase,c.x*8,c.y*8);
    const texture = this.scene.textures.create(key,canvas)!;
    texture.add('__BASE',0,0,0,canvas.width,canvas.height);
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.builds++;
    return { phase, image: this.scene.add.image(c.x*128,c.y*128,key).setOrigin(0).setDisplaySize(128,128).setDepth(-30).setTint(this.atmosphereTint).setTintMode(Phaser.TintModes.MULTIPLY) };
  }
  private dispose(s: Surface) { const key=s.image.texture.key;s.image.destroy();this.scene.textures.remove(key); }
  update(x: number, y: number, width: number, height: number, padding = 1) {
    const required=chunkKeys(x,y,width,height,padding),keys=new Set(required.map(c=>c.key));
    for(const [key,c]of this.chunks)if(!keys.has(key)){this.dispose(c.base);if(c.next)this.dispose(c.next);this.chunks.delete(key);}
    const {phase,target,blend}=this.state;
    for(const position of required) {
      let c=this.chunks.get(position.key);
      if(!c){c={...position,base:this.surface(position,phase)};this.chunks.set(c.key,c);}
      if(c.base.phase!==phase){
        this.dispose(c.base);
        if(c.next?.phase===phase){c.base=c.next;c.next=undefined;}else{if(c.next)this.dispose(c.next);c.next=undefined;c.base=this.surface(c,phase);}
        c.base.image.setAlpha(1).setDepth(-30);
      }
      if(c.next && c.next.phase!==target && target!==phase){this.dispose(c.next);c.next=undefined;}
      if(target!==phase){
        if(!c.next)c.next=this.surface(c,target);
        // Opaque base + alpha target avoids a dark midpoint and needs no shader.
        c.next.image.setAlpha(blend).setDepth(-29.9);
      }else if(c.next)c.next.image.setAlpha(0);
    }
    // Prepare one hidden surface per frame before the transition; no milestone decode.
    const upcoming=this.presentation.phases.find(p=>p.start>this.elapsed&&p.start-this.elapsed<=GROVE_ART_BUDGET.warmupSeconds);
    if(upcoming) {
      const c=[...this.chunks.values()].find(c=>!c.next);
      if(c){c.next=this.surface(c,upcoming.id);c.next.image.setAlpha(0).setDepth(-29.9);}
    }else if(target===phase)for(const c of this.chunks.values())if(c.next){this.dispose(c.next);c.next=undefined;}
    this.peakSurfaces=Math.max(this.peakSurfaces,this.surfaces);
  }
  get count() { return this.chunks.size; }
  private get surfaces() { return [...this.chunks.values()].reduce((n,c)=>n+1+(c.next?1:0),0); }
  atmosphereDiagnostics() { return [...this.chunks.values()].map(c=>({key:c.key,tint:c.base.image.tintTopLeft,phase:c.base.phase,target:c.next?.phase??c.base.phase,blend:c.next?.image.alpha??0,x:c.x*128,y:c.y*128})); }
  diagnostics() {
    const surfaces=this.surfaces,chunkBytes=surfaces*256*256*4;
    return { ...this.state,chunks:this.count,surfaces,peakSurfaces:this.peakSurfaces,builds:this.builds,
      atlasBytes:this.atlas.width*this.atlas.height*4,chunkTextureBytes:chunkBytes,
      // RGBA backing canvases plus uploaded GPU surfaces; excludes driver overhead.
      estimatedResidentBytes:this.atlas.width*this.atlas.height*4+chunkBytes*2,
      textureKeys:[...this.chunks.values()].flatMap(c=>[c.base.image.texture.key,...c.next?[c.next.image.texture.key]:[]]) };
  }
  destroy() { for(const c of this.chunks.values()){this.dispose(c.base);if(c.next)this.dispose(c.next);}this.chunks.clear();this.atlas.width=this.atlas.height=0; }
}
