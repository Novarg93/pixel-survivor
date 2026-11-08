import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {World} from '../../src/game/systems/World';
import {lightningUltimateViews} from '../../src/game/art/LightningUltimateArt';
import {LIGHTNING_ULTIMATE_MANIFEST as pack,LIGHTNING_ULTIMATE_VFX as V,lightningUltimateFrame} from '../../src/game/art/lightningUltimatePack';
import {ULTIMATE as C} from '../../src/game/config/ultimates';
import atlas from '../../public/assets/hd/lightning-ultimate-v1/atlas.json';
import {lightningBeamPath} from '../../src/game/art/lightningBeamPath';
function setup(){const w=new World(42,{spawnRate:0});w.elapsed=601;w.experience.level=40;w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.ultimate.choose(w,'lightning');w.facing={x:1,y:0};for(const [x,y]of [[90,0],[145,40],[150,-45],[40,70]]){const e=w.spawn('tank',{x,y})!;e.hp=e.maxHp=1e5;e.speed=0;}expect(w.ultimate.activate(w)).toBe(true);return w;}
function tick(w:World,s:number){for(let t=0;t<s-1e-8;t+=.01)w.step(Math.min(.01,s-t));}
it('preserves ten original files and74 native frames, including separate secondary chain and GIF-only impact',()=>{
  expect(Object.keys(pack.sources)).toHaveLength(10);for(const [file,hash]of Object.entries(pack.sources))expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe(hash);
  expect(Object.keys(atlas.frames)).toHaveLength(74);expect(pack.width).toBeLessThanOrEqual(2048);expect(pack.height).toBeLessThanOrEqual(2048);expect(pack.clips.impact.rgbaSource).toBe('decoded original GIF');
  expect([pack.clips.sky.frameCount,pack.clips.beam.frameCount,pack.clips.branch.frameCount,pack.clips.impact.frameCount]).toEqual([10,16,16,32]);
  expect(pack.clips.branch.frames[6]!.pixelSHA256).not.toBe(pack.clips.beam.frames[6]!.pixelSHA256);
  for(const [id,c]of Object.entries(pack.clips))for(let i=0;i<c.frameCount;i++){expect(c.frames[i]!.alphaDifferences).toBe(0);expect(atlas.frames[`ultimate-${id}-${i}` as keyof typeof atlas.frames].frame).toMatchObject({w:c.width,h:c.height});expect(lightningUltimateFrame(id as keyof typeof pack.clips,(i+.1)/c.frameCount)).toBe(`ultimate-${id}-${i}`);}
});
it('draws the sky strike behind the hero/arms throughout preparation, without changing damage time',()=>{
  const w=setup();tick(w,.35);const before=JSON.stringify(w),v=lightningUltimateViews(w,[],10);expect(JSON.stringify(w)).toBe(before);expect(v).toHaveLength(1);expect(v[0]).toMatchObject({kind:'sky',depth:9.6,x:0,y:-7,originX:.5,originY:110/128});expect(w.kills).toBe(0);
  tick(w,.15);expect(lightningUltimateViews(w,[],10)[0]!.kind).toBe('sky');expect(w.kills).toBe(0);tick(w,.03);expect(w.kills).toBe(4);expect(w.ultimate.released-w.ultimate.started).toBeCloseTo(C.lightning.preparation);
});
it('uses the actual hand for the primary, frozen graph for branches and an impact at every target',()=>{
  const w=setup();tick(w,.53);const hands=[{x:-8,y:-12},{x:10,y:-9}],before=JSON.stringify(w),views=lightningUltimateViews(w,hands),beams=views.filter(v=>v.kind==='primary'||v.kind==='branch'),impacts=views.filter(v=>v.kind==='impact');expect(JSON.stringify(w)).toBe(before);expect(new Set(beams.map(b=>b.targetId)).size).toBe(w.ultimate.nodes.length);expect(impacts).toHaveLength(w.ultimate.nodes.length);expect(beams[0]).toMatchObject({x:10,y:-9,kind:'primary'});
  for(const [i,n]of w.ultimate.nodes.entries()){
    const link=beams.filter(b=>b.targetId===n.id),b=link.at(-1)!,clip=pack.clips.branch,span=(V.beamEndX-clip.pivot.x)*b.width/clip.width;
    expect(b.x+Math.cos(b.rotation)*span).toBeCloseTo(n.at.x);expect(b.y+Math.sin(b.rotation)*span).toBeCloseTo(n.at.y);expect(impacts[i]).toMatchObject({x:n.at.x,y:n.at.y,targetId:n.id});
    if(i)expect(link[0]).toMatchObject({x:n.from.x,y:n.from.y,kind:'branch'});
    for(const [j,tile]of link.entries()){
      const length=(V.beamEndX-clip.pivot.x)*tile.width/clip.width;expect(length).toBeLessThanOrEqual(V.segmentLength);expect(tile.height).toBe(clip.height*(i===0?V.primaryThickness:V.branchThickness));expect(tile.frame).toMatch(/^ultimate-branch-/);
      if(j){const p=link[j-1]!,d=(V.beamEndX-clip.pivot.x)*p.width/clip.width;expect(tile.x).toBeCloseTo(p.x+Math.cos(p.rotation)*d);expect(tile.y).toBeCloseTo(p.y+Math.sin(p.rotation)*d);}
    }
  }
  const frozen=lightningUltimateViews(w,hands);w.pause();w.step(.05);expect(lightningUltimateViews(w,hands)).toEqual(frozen);w.resume();tick(w,.33);expect(lightningUltimateViews(w,hands)).toEqual([]);
});
it('bounds the maximum web, lowers flashes in reduced mode and clears on death/reset',()=>{
  const w=setup();tick(w,.53);const reduced=lightningUltimateViews(w,[],10,true);expect(reduced.every(v=>v.alpha<=.5)).toBe(true);expect(reduced.filter(v=>v.kind==='primary'||v.kind==='branch').every(v=>v.frame==='ultimate-branch-6')).toBe(true);
  const node=w.ultimate.nodes[0]!;w.ultimate.nodes=Array.from({length:200},(_,i)=>({...node,id:i,from:{x:0,y:0},at:{x:2000,y:0}}));expect(lightningUltimateViews(w,[]).length).toBeLessThanOrEqual(1+C.lightning.targetCap+V.segmentBudget);
  w.status='over';expect(lightningUltimateViews(w,[])).toEqual([]);w.clearTemporaryState();w.status='playing';expect(lightningUltimateViews(w,[])).toEqual([]);
});
it('repeats and bends bounded segments with exact joins and endpoints instead of stretching one image',()=>{
  for(const end of [{x:12,y:0},{x:95,y:30},{x:600,y:-250}]){
    const path=lightningBeamPath({x:0,y:0},end,7);expect(path[0]!.from).toEqual({x:0,y:0});expect(path.at(-1)!.to).toEqual(end);expect(path).toEqual(lightningBeamPath({x:0,y:0},end,7));
    for(const [i,s]of path.entries()){expect(Math.hypot(s.to.x-s.from.x,s.to.y-s.from.y)).toBeLessThanOrEqual(80);if(i)expect(s.from).toEqual(path[i-1]!.to);}
    if(Math.hypot(end.x,end.y)>80){expect(path.length).toBeGreaterThan(1);expect(new Set(path.map(s=>Math.atan2(s.to.y-s.from.y,s.to.x-s.from.x))).size).toBeGreaterThan(1);}
  }
});
it('keeps thickness at all distances and bounds pathological offscreen paths without stretched fallback',()=>{
  const w=setup();tick(w,.53);const node=w.ultimate.nodes[0]!;
  for(const x of [12,100,600]){w.ultimate.nodes=[{...node,at:{x,y:0}}];const tiles=lightningUltimateViews(w,[{x:0,y:0}]).filter(v=>v.kind==='primary');expect(tiles.every(t=>t.height===84&&t.width/258*222<=80)).toBe(true);}
  const huge=lightningBeamPath({x:0,y:0},{x:1e9,y:1e9},2);expect(huge).toHaveLength(V.maxSegmentsPerLink);expect(huge.every(s=>Math.hypot(s.to.x-s.from.x,s.to.y-s.from.y)<=80)).toBe(true);expect(lightningBeamPath({x:0,y:0},{x:0,y:0},0)).toEqual([]);expect(lightningBeamPath({x:0,y:0},{x:Infinity,y:0},0)).toEqual([]);
});
