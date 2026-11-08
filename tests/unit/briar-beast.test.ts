import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {World} from '../../src/game/systems/World';
import {BossAnimation} from '../../src/game/art/BossAnimation';
import {freezeForUltimate} from '../../src/game/systems/UltimateFreeze';
import {bossVisual,enemyVisual,visualDimensions} from '../../src/game/art/assetRegistry';
import {briarBodyFrame,briarFrameIndex,BRIAR_BEAST_MANIFEST as pack} from '../../src/game/art/briarBeastPack';
import atlas from '../../public/assets/hd/briar-beast-v1/atlas.json';
import {earlyReplay} from '../helpers/earlyReplay';

function setup(){const w=new World(42,{spawnRate:0});w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;const e=w.spawn('charger',{x:170,y:0})!,art=new BossAnimation();art.prepare(w);return {w,e,art};}
function tick(w:World,seconds:number){for(let t=0;t<seconds-1e-8;t+=.025)w.step(Math.min(.025,seconds-t));}
it('restores real31.2 base speed after a historical replay without changing live spawn behavior',()=>{
  const w=new World(42),spawn=w.spawn;earlyReplay(w,180);expect(w.spawn).toBe(spawn);w.enemies=[];
  expect(w.spawn('charger',{x:200,y:0})!.speed).toBeCloseTo(24*1.3);
});
it('preserves all seven user sources and imports GIF timings with PNG colors/alpha',()=>{
  expect(Object.keys(pack.sources)).toHaveLength(7);
  for(const [file,hash]of Object.entries(pack.sources))expect(createHash('sha256').update(readFileSync(file)).digest('hex'),file).toBe(hash);
  for(const clip of Object.values(pack.clips)){
    expect(clip.frameCount).toBe(12);expect(clip.durationsMs).toEqual(Array(12).fill(150));
    expect(clip.frames.every(f=>f.alphaDifferences===0)).toBe(true);expect(clip.alphaSource).toBe('png');
  }
});
it('contains exactly74 padded128px frames and an exact right mirror for every left pose',()=>{
  expect(pack.rgbaBytes).toBe(1056*1320*4);expect(pack.bodyPivot).toEqual([64,64]);expect(Object.keys(atlas.frames)).toHaveLength(74);
  const bytes=readFileSync('public/assets/hd/briar-beast-v1/atlas.png'),chunks:Buffer[]=[];
  for(let p=8;p<bytes.length;){const n=bytes.readUInt32BE(p);if(bytes.toString('ascii',p+4,p+8)==='IDAT')chunks.push(bytes.subarray(p+8,p+8+n));p+=n+12;}
  const raw=inflateSync(Buffer.concat(chunks)),stride=pack.width*4+1,frames=atlas.frames as Record<string,{frame:{x:number;y:number;w:number;h:number}}>;
  for(let y=0;y<pack.height;y++)expect(raw[y*stride]).toBe(0);
  const pixels=(name:string)=>{const f=frames[name]!.frame,out=Buffer.alloc(128*128*4);for(let y=0;y<128;y++)raw.copy(out,y*512,(f.y+y)*stride+1+f.x*4,(f.y+y)*stride+1+f.x*4+512);return out;};
  for(const name of Object.keys(frames)){
    expect(name).toMatch(/^charger-1-(left|right)-(walk|attack|charge|idle)-\d+$/);
    const f=frames[name]!.frame;expect([f.w,f.h]).toEqual([128,128]);expect(f.x+130).toBeLessThanOrEqual(pack.width);expect(f.y+130).toBeLessThanOrEqual(pack.height);
    for(let y=f.y-2;y<f.y+130;y++)for(const x of [f.x-2,f.x-1,f.x+128,f.x+129])if(raw[y*stride+1+x*4+3])throw Error('Atlas bleed');
    if(!name.includes('-left-'))continue;
    const left=pixels(name),right=pixels(name.replace('-left-','-right-')),mirror=Buffer.alloc(left.length);
    for(let y=0;y<128;y++)for(let x=0;x<128;x++)left.copy(mirror,(y*128+x)*4,(y*128+127-x)*4,(y*128+128-x)*4);
    expect(right.equals(mirror),name).toBe(true);
  }
});
it('plays all provided frames, fitting each charge segment to the existing combat phases',()=>{
  for(const facing of ['left','right']as const){
    for(let i=0;i<12;i++){
      expect(briarBodyFrame(facing,'walk',i*.15+.001)).toBe(`charger-1-${facing}-walk-${i}`);
      expect(briarBodyFrame(facing,'slam',i*.05+.001)).toBe(`charger-1-${facing}-attack-${i}`);
    }
    for(const [pose,first,last]of [['windup',0,2],['attack',3,9],['recover',10,11]]as const){
      for(let i=first;i<=last;i++){const age=(i-first+.01)/(last-first+1);expect(briarBodyFrame(facing,pose,age,1-age)).toBe(`charger-1-${facing}-charge-${i}`);}
    }
    for(const pose of ['idle','hurt','death']as const)expect(briarBodyFrame(facing,pose,99)).toBe(`charger-1-${facing}-idle-0`);
  }
  expect(briarFrameIndex('walk',1.8,true)).toBe(0);expect(briarFrameIndex('attack',99)).toBe(11);
  expect(visualDimensions(enemyVisual('charger',false,0,1)).width).toBeCloseTo(57.6);expect(enemyVisual('charger',false,0,1).texture).toBe('briar-beast-v1');
});
it('reads the real windup/charge/recovery without restarting charge when hurt or mutating simulation',()=>{
  const {w,e,art}=setup();e.boss!.until=0;
  for(const [seconds,phase]of [[.025,'windup'],[.501,'charge'],[1.201,'recover']]as const){
    tick(w,seconds);expect(e.boss!.phase).toBe(phase);const before=JSON.stringify(w),p=art.view(e,w);
    expect(bossVisual('charger',p.facing,p.pose,w.elapsed-p.started,e.boss!.until-w.elapsed).frame).toContain('-charge-');expect(JSON.stringify(w)).toBe(before);
    tick(w,.1);const started=art.view(e,w).started;w.damageEnemy(e,1);expect(art.view(e,w).started).toBe(started);
  }
});
it.each(['windup','charge','melee']as const)('holds %s playback on pause and Ultimate freeze, then resumes at the same frame',mode=>{
  const {w,e,art}=setup();w.player.invulnerableUntil=Infinity;
  if(mode==='melee'){e.x=30;e.boss!.until=100;tick(w,.025);}else{e.boss!.until=0;tick(w,.025);art.view(e,w);if(mode==='charge')tick(w,.501);}
  art.view(e,w);tick(w,.1);const p={...art.view(e,w)},before=briarBodyFrame(p.facing,p.pose,w.elapsed-p.started,Math.max(0,e.boss!.until-w.elapsed));
  w.pause();tick(w,.5);expect(art.view(e,w)).toEqual(p);w.resume();
  freezeForUltimate(e,w.elapsed,w.elapsed+1);tick(w,1);
  const after=art.view(e,w);expect(briarBodyFrame(after.facing,after.pose,w.elapsed-after.started,Math.max(0,e.boss!.until-w.elapsed))).toBe(before);
  tick(w,.05);const resumed=art.view(e,w);expect(w.elapsed-resumed.started).toBeCloseTo(.15);
});
