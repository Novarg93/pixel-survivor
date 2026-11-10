import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {MAGE_WALK,MAGE_WALK_TEXTURE,mageWalkSelection} from '../../src/game/art/mageWalkPack';
import {MAGE_IDLE} from '../../src/game/art/mageIdlePack';
import {MageHeroAnimation} from '../../src/game/art/MageHeroAnimation';
import {MageCastingController} from '../../src/game/art/MageCastingController';
import {World} from '../../src/game/systems/World';
import {rgbaPng} from '../helpers/rgbaPng';

it('preserves all 26 walking frames, original colors and source GIF/PNG files exactly',()=>{
 const atlas=rgbaPng('public/assets/hd/mage-walk-v2/atlas.png'),data=JSON.parse(readFileSync('public/assets/hd/mage-walk-v2/atlas.json','utf8')) as {frames:Record<string,{frame:{x:number;y:number;w:number;h:number}}>};
 expect(Object.keys(data.frames)).toHaveLength(26);expect(MAGE_WALK.rgbaBytes).toBe(atlas.width*atlas.height*4);expect(MAGE_WALK.rgbaBytes).toBeLessThan(2*1024*1024);
 for(const [file,sha]of Object.entries(MAGE_WALK.sources))expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe(sha);
 for(const clip of Object.values(MAGE_WALK.clips)){
  const source=rgbaPng(clip.sourcePng);expect(clip.frames).toHaveLength(13);expect(clip.periodMs).toBe(1690);expect(clip.firstPoseMatchesIdle).toBe(true);
  for(const [i,f]of clip.frames.entries()){
   const rect=data.frames[f.frame]!.frame,packed:Buffer[]=[];expect([rect.w,rect.h]).toEqual([96,96]);expect(f.bounds.partial).toBe(0);
   for(let y=0;y<96;y++){const k=((Math.floor(i/4)*96+y)*source.width+i%4*96)*4,a=((rect.y+y)*atlas.width+rect.x)*4,row=atlas.pixels.subarray(a,a+384);expect(row.equals(source.pixels.subarray(k,k+384))).toBe(true);packed.push(row);}
   expect(createHash('sha256').update(Buffer.concat(packed)).digest('hex')).toBe(f.pixelSha256);
  }
 }
});
it('uses south for S/SE/E, mirrors W/SW and uses north for N/NW with mirrored NE',()=>{
 for(const [direction,body,flipX]of [['south','south',false],['south-east','south',false],['east','south',false],['west','south',true],['south-west','south',true],['north','north',false],['north-west','north',false],['north-east','north',true]] as const){
  for(let i=0;i<13;i++){
   const v=mageWalkSelection(direction,i*.13),clip=MAGE_WALK.clips[body];expect(v).toMatchObject({body,flipX,texture:MAGE_WALK_TEXTURE,index:i});
   expect(v.origin.x*96).toBe(flipX?96-clip.pivot.x:clip.pivot.x);expect(v.origin.y*96).toBe(clip.pivot.y);expect(v.hand.x).toBe(flipX?96-clip.frames[i]!.hand.x:clip.frames[i]!.hand.x);
  }
 }
});
it('retains the authored cadence and exact Idle scale/pivots without registering individual walking bounds',()=>{
 expect(MAGE_WALK.displaySize).toBe(MAGE_IDLE.displaySize);expect(MAGE_WALK.clips.south.pivot).toEqual(MAGE_IDLE.clips.front.pivot);expect(MAGE_WALK.clips.north.pivot).toEqual(MAGE_IDLE.clips.north.pivot);
 for(const direction of ['south','north'] as const){expect(mageWalkSelection(direction,.129999).index).toBe(0);expect(mageWalkSelection(direction,.13).index).toBe(1);expect(mageWalkSelection(direction,1.689).index).toBe(12);expect(mageWalkSelection(direction,1.69).index).toBe(0);}
});
function rig(){const w=new World(31,{spawnRate:0}),a=new MageHeroAnimation(),c=new MageCastingController();for(const b of Object.values(w.abilities))b.level=0;a.view(w,c.view(0),false,0);return{w,a,c};}
it('retains the distance diagnostic with the new run transitions and resets on restart',()=>{
 const {w,a,c}=rig();w.step(.05,{x:1,y:0});const first=a.view(w,c.view(w.elapsed),true,0);expect(first.motion).toBe('run-start');expect(first.walk!.age).toBeCloseTo(.05);
 w.step(.05,{x:0,y:-1});const turned=a.view(w,c.view(w.elapsed),true,0);expect(turned).toMatchObject({motion:'run-start',direction:'north'});expect(turned.walk!.age).toBeCloseTo(.1);
 w.pause();w.step(.05,{x:-1,y:0});expect(a.view(w,c.view(w.elapsed),true,0)).toEqual(turned);
 w.resume();w.step(.01);expect(a.view(w,c.view(w.elapsed),false,0).motion).toBe('run-stop');
 w.step(.01,{x:1,y:0});expect(a.view(w,c.view(w.elapsed),true,0).walk!.age).toBeCloseTo(.01);
 const fresh=new World(32);expect(a.view(fresh,c.view(0),false,0)).toMatchObject({motion:'idle',age:0,direction:'south'});
});
it('scales cadence by actual analog distance while capping Blink-sized displacement',()=>{
 const full=rig(),slow=rig();for(let i=0;i<20;i++){full.w.step(.05,{x:1,y:0});full.a.view(full.w,full.c.view(full.w.elapsed),true,0);slow.w.step(.05,{x:.3,y:0,analog:true});slow.a.view(slow.w,slow.c.view(slow.w.elapsed),true,0);}
 const fast=full.a.view(full.w,full.c.view(full.w.elapsed),true,0),analog=slow.a.view(slow.w,slow.c.view(slow.w.elapsed),true,0);expect(analog.walk!.age).toBeCloseTo(fast.walk!.age*.3);
 full.w.elapsed+=.01;full.w.player.x+=1000;expect(full.a.view(full.w,full.c.view(full.w.elapsed),true,0).walk!.age-fast.walk!.age).toBeLessThanOrEqual(.01500001);
});
