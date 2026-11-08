import {expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {World} from '../../src/game/systems/World';
import {fireball} from '../../src/game/abilities/fireball';
import {FIREBALL_MANIFEST as pack,FIREBALL_VFX,fireballFlightFrame,fireballClipFrame,fireballDuration} from '../../src/game/art/fireballPack';
import {fireballImpactViews} from '../../src/game/art/FireballArt';
import {enemyVisual,selectAsset,visualDimensions,ASSET_REGISTRY} from '../../src/game/art/assetRegistry';
import {drawMageMagic} from '../../src/game/art/MageMagic';
import atlas from '../../public/assets/hd/mage-fireball-v1/atlas.json';
function setup(rank=1,evolved=false){const w=new World(42,{spawnRate:0});w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.abilities.fireball.level=rank;w.abilities.fireball.readyAt=Infinity;w.upgrades.damage=evolved?3:0;const e=w.spawn('tank',{x:160,y:0})!;e.speed=0;e.hp=e.maxHp=1e5;return{w,e};}
function tick(w:World,t:number){for(let i=0;i<t-1e-8;i+=.01)w.step(Math.min(.01,t-i));}
it('imports nine untouched source files and48 untrimmed frames with one common contact pivot',()=>{
  expect(Object.keys(pack.sources)).toHaveLength(9);for(const [file,hash]of Object.entries(pack.sources))expect(createHash('sha256').update(readFileSync(file)).digest('hex'),file).toBe(hash);
  expect(Object.keys(atlas.frames)).toHaveLength(48);expect(pack.pivot).toEqual({x:65,y:42});expect(pack.canvas).toEqual({width:112,height:84});
  const bytes=readFileSync('public/assets/hd/mage-fireball-v1/atlas.png'),chunks:Buffer[]=[];
  for(let p=8;p<bytes.length;){const n=bytes.readUInt32BE(p);if(bytes.toString('ascii',p+4,p+8)==='IDAT')chunks.push(bytes.subarray(p+8,p+8+n));p+=n+12;}
  const raw=inflateSync(Buffer.concat(chunks)),stride=pack.width*4+1,frames=atlas.frames as Record<string,{frame:{x:number;y:number;w:number;h:number}}>;
  for(const [id,clip]of Object.entries(pack.clips))for(const audit of clip.frames){
    const f=frames[`fireball-${id}-${audit.index}`]!.frame,out=Buffer.alloc(112*84*4);expect([f.w,f.h]).toEqual([112,84]);
    for(let y=0;y<84;y++)raw.copy(out,y*448,(f.y+y)*stride+1+f.x*4,(f.y+y)*stride+1+f.x*4+448);
    expect(createHash('sha256').update(out).digest('hex')).toBe(audit.pixelSHA256);
    for(let y=f.y-2;y<f.y+86;y++)for(const x of [f.x-2,f.x-1,f.x+112,f.x+113])if(raw[y*stride+1+x*4+3])throw Error('Padding bleed');
  }
});
it('plays forming→looping idle and the complete nonlooping collision, with a fixed size at all ranks',()=>{
  for(let i=0;i<24;i++)expect(fireballFlightFrame((i+.1)/24*.2)).toBe(`fireball-forming-${i}`);
  expect(fireballFlightFrame(.2)).toBe('fireball-idle-0');expect(fireballFlightFrame(.2+.996+.001)).toBe('fireball-idle-0');
  for(let i=0;i<12;i++)expect(fireballClipFrame('explosion',i*.071+.001)).toBe(`fireball-explosion-${i}`);
  expect(fireballDuration('explosion')).toBeCloseTo(.852);expect(FIREBALL_VFX.scale).toBe(.5);
  expect(visualDimensions(selectAsset('fireball'))).toEqual({width:56,height:42});expect(ASSET_REGISTRY.fireball.origin.x).toBeCloseTo(65/112);
  expect(enemyVisual('guardian',false,0,1).texture).toBe('hd-guardian');
});
it.each([[1,false],[3,false],[5,false],[5,true]] as const)('retains rank%s damage/velocity/pierce and emits one cosmetic impact per collision (evolved=%s)',(rank,evolved)=>{
  const {w,e}=setup(rank,evolved);expect(fireball(w)).toBe(true);const shots=w.projectiles.map(p=>({...p}));expect(shots).toHaveLength(evolved?2:1);
  for(const p of shots){expect(Math.hypot(p.vx,p.vy)).toBeCloseTo(270);expect(p.pierce).toBe(evolved?1:0);}
  const hp=e.hp;tick(w,.6);expect(e.hp).toBeLessThan(hp);const impacts=w.effects.filter(f=>f.kind==='fireball-impact');expect(impacts).toHaveLength(shots.length);expect(impacts.every(f=>f.id<0&&f.source==='fireball')).toBe(true);
  const state=JSON.stringify(w);expect(fireballImpactViews(w,1)).toHaveLength(shots.length);expect(JSON.stringify(w)).toBe(state);
  w.pause();const views=fireballImpactViews(w,1);w.step(.05);expect(fireballImpactViews(w,1)).toEqual(views);w.resume();tick(w,1);expect(fireballImpactViews(w,1)).toEqual([]);
});
it('hits each pierced target once, never produces impacts on misses, and clears on reset/death',()=>{
  const {w}=setup(5,true);const b=w.spawn('tank',{x:220,y:0})!;b.speed=0;b.hp=b.maxHp=1e5;fireball(w);tick(w,.85);expect(w.effects.filter(f=>f.kind==='fireball-impact')).toHaveLength(4);
  w.clearTemporaryState();expect(fireballImpactViews(w,1)).toEqual([]);w.shoot({x:0,y:400,vx:270,vy:0,damage:1,hostile:false,source:'fireball'});tick(w,3);expect(fireballImpactViews(w,1)).toEqual([]);
  w.effect('fireball-impact',w.player,4,0xffffff,.852);w.damagePlayer(1e9);expect(fireballImpactViews(w,1)).toEqual([]);
});
it('removes old rank-dependent trails/halos for real Fireball shots',()=>{
  const {w}=setup(5,true);fireball(w);const g={fillStyle:vi.fn().mockReturnThis(),fillRect:vi.fn().mockReturnThis(),lineStyle:vi.fn().mockReturnThis(),beginPath:vi.fn().mockReturnThis()};drawMageMagic(g as unknown as Parameters<typeof drawMageMagic>[0],w,1);expect(g.fillRect).not.toHaveBeenCalled();expect(g.beginPath).not.toHaveBeenCalled();
});
