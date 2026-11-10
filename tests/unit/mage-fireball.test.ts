import {expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {rgbaPng} from '../helpers/rgbaPng';
import {World} from '../../src/game/systems/World';
import {fireball} from '../../src/game/abilities/fireball';
import {FIREBALL_MANIFEST as pack,FIREBALL_VFX,fireballFlightFrame,fireballClipFrame,fireballDuration} from '../../src/game/art/fireballPack';
import {fireballImpactViews} from '../../src/game/art/FireballArt';
import {enemyVisual,selectAsset,visualDimensions,ASSET_REGISTRY} from '../../src/game/art/assetRegistry';
import {drawMageMagic} from '../../src/game/art/MageMagic';
import atlas from '../../public/assets/hd/mage-fireball-pixellab-v1/atlas.json';
import legacy from '../../src/game/art/fireballManifest.json';
function setup(rank=1,evolved=false){const w=new World(42,{spawnRate:0});w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.abilities.fireball.level=rank;w.abilities.fireball.readyAt=Infinity;w.upgrades.damage=evolved?3:0;const e=w.spawn('tank',{x:160,y:0})!;e.speed=0;e.hp=e.maxHp=1e5;return{w,e};}
function tick(w:World,t:number){for(let i=0;i<t-1e-8;i+=.01)w.step(Math.min(.01,t-i));}
it('preserves archived sources and all nineteen approved PixelLab cels with fixed contact and transparent padding',()=>{
  expect(Object.keys(legacy.sources)).toHaveLength(9);
  for(const [file,hash]of Object.entries({...legacy.sources,...pack.sources}))expect(createHash('sha256').update(readFileSync(file)).digest('hex'),file).toBe(hash);
  expect(Object.keys(atlas.frames)).toHaveLength(19);expect(pack.pivot).toEqual({x:77,y:61});expect(pack.canvas).toEqual({width:128,height:128});
  const {width,height,pixels}=rgbaPng('public/assets/hd/mage-fireball-pixellab-v1/atlas.png'),frames=atlas.frames as Record<string,{frame:{x:number;y:number;w:number;h:number}}>;
  expect([width,height]).toEqual([pack.width,pack.height]);expect(pack.rgbaBytes).toBeLessThan(2*1024*1024);
  for(const [id,clip]of Object.entries(pack.clips))for(const audit of clip.frames){
    const f=frames[`fireball-${id}-${audit.index}`]!.frame,out=Buffer.alloc(128*128*4);expect([f.w,f.h]).toEqual([128,128]);
    for(let y=0;y<128;y++)pixels.copy(out,y*512,((f.y+y)*width+f.x)*4,((f.y+y)*width+f.x+128)*4);
    expect(createHash('sha256').update(out).digest('hex')).toBe(audit.pixelSHA256);
    expect(out.equals(rgbaPng(audit.source).pixels)).toBe(true);
    for(let y=f.y-2;y<f.y+130;y++)for(let x=f.x-2;x<f.x+130;x++)if(x<f.x||x>=f.x+128||y<f.y||y>=f.y+128)if(pixels[(y*width+x)*4+3])throw Error('Padding bleed');
  }
  expect(pack.clips.explosion.frames.at(-1)!.visible).toBe(0);
  expect(new Set(pack.clips.idle.frames.map(f=>f.pixelSHA256)).size).toBeGreaterThan(3);
});
it('plays forming→looping idle and the complete nonlooping collision, with a fixed size at all ranks',()=>{
  for(let i=0;i<2;i++)expect(fireballFlightFrame((i+.1)*.1)).toBe(`fireball-forming-${i}`);
  for(let i=0;i<8;i++)for(const loop of [0,1,20])expect(fireballFlightFrame(.2+loop*.64+i*.08+.001)).toBe(`fireball-idle-${i}`);
  expect(fireballFlightFrame(.2)).toBe('fireball-idle-0');expect(fireballFlightFrame(.84)).toBe('fireball-idle-0');
  for(let i=0;i<9;i++)expect(fireballClipFrame('explosion',i*.07+.001)).toBe(`fireball-explosion-${i}`);
  expect(fireballClipFrame('explosion',10)).toBe('fireball-explosion-8');
  expect(fireballDuration('explosion')).toBeCloseTo(.63);expect(FIREBALL_VFX.scale).toBe(.5);
  expect(visualDimensions(selectAsset('fireball'))).toEqual({width:64,height:64});expect(ASSET_REGISTRY.fireball.origin.x).toBeCloseTo(77/128);
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
  const {w}=setup(5,true);const b=w.spawn('tank',{x:220,y:0})!;b.speed=0;b.hp=b.maxHp=1e5;fireball(w);tick(w,.8);expect(w.effects.filter(f=>f.kind==='fireball-impact')).toHaveLength(4);
  w.clearTemporaryState();expect(fireballImpactViews(w,1)).toEqual([]);w.shoot({x:0,y:400,vx:270,vy:0,damage:1,hostile:false,source:'fireball'});tick(w,3);expect(fireballImpactViews(w,1)).toEqual([]);
  w.effect('fireball-impact',w.player,4,0xffffff,.3);w.damagePlayer(1e9);expect(fireballImpactViews(w,1)).toEqual([]);
});
it('removes old rank-dependent trails/halos for real Fireball shots',()=>{
  const {w}=setup(5,true);fireball(w);const g={fillStyle:vi.fn().mockReturnThis(),fillRect:vi.fn().mockReturnThis(),lineStyle:vi.fn().mockReturnThis(),beginPath:vi.fn().mockReturnThis()};drawMageMagic(g as unknown as Parameters<typeof drawMageMagic>[0],w,1);expect(g.fillRect).not.toHaveBeenCalled();expect(g.beginPath).not.toHaveBeenCalled();
});
it.each([-6000,0,6000])('keeps every explosion frame below enemies at world Y %s',y=>{
  const {w,e}=setup();w.player.y=y;e.y=y-35;
  w.effect('fireball-impact',{x:e.x,y},4,0xffffff,fireballDuration('explosion'));
  for(let i=0;i<9;i++){
    w.elapsed=i*.07+.001;const before=JSON.stringify(w),view=fireballImpactViews(w,.7)[0]!;
    expect(view.frame).toBe(`fireball-explosion-${i}`);expect(view.depth).toBeLessThan(e.y/10000-.02);
    expect(view.alpha).toBe(.7);expect(JSON.stringify(w)).toBe(before);
  }
});
