import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {World} from '../../src/game/systems/World';
import {chainLightning} from '../../src/game/abilities/chainLightning';
import {regularLightningViews} from '../../src/game/art/RegularLightningArt';
import {REGULAR_LIGHTNING_MANIFEST as pack,REGULAR_LIGHTNING_VFX as C,regularLightningFrame} from '../../src/game/art/regularLightningPack';
import atlas from '../../public/assets/hd/regular-lightning-v1/atlas.json';
function setup(rank=1){const w=new World(42,{spawnRate:0});w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.abilities.lightning.level=rank;w.abilities.lightning.readyAt=Infinity;return w;}
it('preserves both original files and32 native262×72 frames; GIF owns timing and PNG owns RGBA',()=>{
  expect(Object.keys(pack.sources)).toHaveLength(2);for(const [file,hash]of Object.entries(pack.sources))expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe(hash);
  expect(pack.canvas).toEqual({width:262,height:72});expect(pack.frames).toHaveLength(32);expect(pack.durationMs).toBe(1600);expect(Object.keys(atlas.frames)).toHaveLength(32);
  for(const f of pack.frames){expect(f.durationMs).toBe(50);expect(f.alphaDifferences).toBe(0);expect(atlas.frames[`regular-lightning-${f.index}` as keyof typeof atlas.frames].frame).toMatchObject({w:262,h:72});}
  for(let i=0;i<32;i++)expect(regularLightningFrame((i+.1)/32)).toBe(`regular-lightning-${i}`);expect(regularLightningFrame(1)).toBe('regular-lightning-31');
});
it.each([{x:30,y:0},{x:0,y:-100},{x:-220,y:0},{x:130,y:95}])('fits source endpoints exactly to each chain segment at %j without changing thickness',target=>{
  const w=setup();w.effect('lightning',{x:0,y:0},1,0xffffff,.22,target);const before=JSON.stringify(w),[v]=regularLightningViews(w,1);expect(JSON.stringify(w)).toBe(before);expect(v!.height).toBe(36);
  const length=(C.endX-C.startX)*v!.width/pack.canvas.width;expect(Math.cos(v!.rotation)*length).toBeCloseTo(target.x);expect(Math.sin(v!.rotation)*length).toBeCloseTo(target.y);expect(v!.frame).toBe('regular-lightning-0');
});
it.each([1,5])('renders all actual rank%s links with unchanged target order, damage and duration',rank=>{
  const w=setup(rank);for(let i=0;i<8;i++){const e=w.spawn('tank',{x:40+i*65,y:0})!;e.hp=e.maxHp=1e4;e.speed=0;}
  const ids=w.enemies.map(e=>e.id);expect(chainLightning(w)).toBe(true);const effects=w.effects.filter(e=>e.kind==='lightning');expect(effects).toHaveLength(2+rank);
  expect(regularLightningViews(w,1)).toHaveLength(2+rank);for(const e of effects)expect(e.duration).toBe(.22);for(let i=0;i<2+rank;i++)expect(w.enemies.find(e=>e.id===ids[i])!.hp).toBe(1e4-(22+rank*9));
  const before=regularLightningViews(w,1);w.pause();w.step(.05);expect(regularLightningViews(w,1)).toEqual(before);w.resume();for(let i=0;i<6;i++)w.step(.05);expect(regularLightningViews(w,1)).toEqual([]);
});
it('keeps secondary evolution links and never draws ordinary bolts for the ultimate alone',()=>{
  const w=setup(5);w.upgrades['evolve-lightning']=1;for(let i=0;i<9;i++){const e=w.spawn('tank',{x:40+i*65,y:0})!;e.hp=1e4;e.speed=0;}chainLightning(w);
  expect(w.effects.filter(e=>e.kind==='lightning'&&e.duration===.18)).toHaveLength(2);expect(regularLightningViews(w,1)).toHaveLength(9);
  const u=setup(0);u.elapsed=601;u.experience.level=40;u.ultimate.choose(u,'lightning');u.spawn('tank',{x:50,y:0});expect(u.ultimate.activate(u)).toBe(true);u.step(.05);expect(u.ultimate.casting).toBe(true);expect(regularLightningViews(u,1)).toEqual([]);
  w.status='over';expect(regularLightningViews(w,1)).toEqual([]);expect(regularLightningViews(setup(),1)).toEqual([]);
});
