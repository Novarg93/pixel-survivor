import {it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {rgbaPng} from '../helpers/rgbaPng';
import {ASTRAL_FLAME as F,ASTRAL_FLAME_TEXTURE,astralFlameAiFrame} from '../../src/game/art/astralFlamePixellabPack';
import atlas from '../../public/assets/hd/astral-flame-pixellab-v1/atlas.json';
import {World} from '../../src/game/systems/World';
import {astralRevenantViews,necroticGroundViews} from '../../src/game/art/AstralRevenantArt';
it('packs all26 accepted AI flame cels exactly, including RGB under transparency and2px padding',()=>{
 const image=rgbaPng('public/assets/hd/astral-flame-pixellab-v1/atlas.png');expect(F.frameCount).toBe(26);expect(F.rgbaBytes).toBe(1951488);for(const c of Object.values(F.clips))for(const f of c.frames){const r=atlas.frames[f.name as keyof typeof atlas.frames].frame,p=Buffer.alloc(65536);for(let y=0;y<128;y++)image.pixels.copy(p,y*512,((r.y+y)*image.width+r.x)*4,((r.y+y)*image.width+r.x+128)*4);expect(p.equals(rgbaPng(f.source).pixels),f.source).toBe(true);expect(createHash('sha256').update(p).digest('hex')).toBe(f.pixelSHA256);for(let y=-2;y<130;y++)for(let x=-2;x<130;x++)if(x<0||y<0||x>=128||y>=128)expect(image.pixels[((r.y+y)*image.width+r.x+x)*4+3]).toBe(0);}
});
it('plays the accepted600ms rise/800ms loop/600ms vanish at the same fixed ground anchor',()=>{
 expect(F.clips.idle.frames.map(f=>f.sourceIndex)).toEqual([1,2,3,4,5,6,7,8]);for(const c of Object.values(F.clips)){expect(c.pivot).toEqual({x:60,y:116});expect(c.size).toBe(62);}
 expect(astralFlameAiFrame('spawn',0)).toBe('eclipse-flame-ai-spawn-0');expect(astralFlameAiFrame('spawn',.2)).toBe('eclipse-flame-ai-spawn-3');expect(astralFlameAiFrame('spawn',.35)).toBe('eclipse-flame-ai-spawn-5');expect(astralFlameAiFrame('spawn',.6)).toBe('eclipse-flame-ai-spawn-8');
 for(let i=0;i<8;i++)expect(astralFlameAiFrame('idle',i*.1+.001)).toBe(`eclipse-flame-ai-idle-${i}`);expect(astralFlameAiFrame('idle',.8)).toBe('eclipse-flame-ai-idle-0');expect(astralFlameAiFrame('vanish',.6)).toBe('eclipse-flame-ai-vanish-8');
 for(const f of [F.clips.spawn.frames[0]!,F.clips.vanish.frames.at(-1)!])expect(rgbaPng(f.source).pixels.filter((_,i)=>i%4===3).every(a=>a===0)).toBe(true);
});
it('retains real warning geometry, stage and damage clocks, pause and cleanup without mutating simulation from art',()=>{
 const w=new World(42,{spawnRate:0});w.elapsed=630;w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;const e=w.spawn('eclipse',{x:180,y:0})!;e.boss!.magic=undefined;e.boss!.until=Infinity;w.necroticFlames.queue(w,e,w.elapsed+1);const z=w.zones[0]!,n=z.necrotic!;expect(n.activeAt-n.spawnAt).toBeCloseTo(.6);expect(n.fadeAt-n.activeAt).toBeCloseTo(3);expect(z.expires-n.fadeAt).toBeCloseTo(.6);expect(necroticGroundViews(w,1)).toHaveLength(4);expect(astralRevenantViews(w,1)).toEqual([]);
 for(const [t,prefix]of [[n.spawnAt,'spawn'],[n.activeAt,'idle'],[n.fadeAt,'vanish']] as const){w.elapsed=t;const before=JSON.stringify(w),v=astralRevenantViews(w,1);expect(v).toHaveLength(4);expect(v.every(v=>v.texture===ASTRAL_FLAME_TEXTURE&&v.frame===`eclipse-flame-ai-${prefix}-0`&&v.originX===60/128&&v.originY===116/128&&v.size===62)).toBe(true);expect(JSON.stringify(w)).toBe(before);}
 w.pause();const v=astralRevenantViews(w,1);w.step(1);expect(astralRevenantViews(w,1)).toEqual(v);w.elapsed=z.expires;expect(astralRevenantViews(w,1)).toEqual([]);w.status='over';expect(necroticGroundViews(w,1)).toEqual([]);
});
