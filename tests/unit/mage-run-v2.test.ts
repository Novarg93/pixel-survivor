import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {rgbaPng} from '../helpers/rgbaPng';
import {MAGE_RUN_V2,mageRunSelection,mageRunDuration,mageRunMappedAge} from '../../src/game/art/mageRunPackV2';
import {MAGE_IDLE} from '../../src/game/art/mageIdlePack';
import {MageRunningAnimation} from '../../src/game/art/MageRunningAnimation';
import {MAGE_DIRECTIONS} from '../../src/game/art/MageHeroAnimation';

it('packs all59 approved running poses losslessly and protects original sheets and demo selections',()=>{
 const atlas=rgbaPng('public/assets/hd/mage-run-v2/atlas.png');
 const frames=JSON.parse(readFileSync('public/assets/hd/mage-run-v2/atlas.json','utf8')).frames as Record<string,{frame:{x:number;y:number;w:number;h:number}}>;
 expect(Object.keys(frames)).toHaveLength(59);expect(MAGE_RUN_V2.displaySize).toBe(MAGE_IDLE.displaySize);expect(MAGE_RUN_V2.rgbaBytes).toBeLessThan(3*1024*1024);
 for(const [file,hash]of Object.entries(MAGE_RUN_V2.sources))expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe(hash);
 for(const body of Object.values(MAGE_RUN_V2.clips))for(const motion of ['run-start','run','run-stop'] as const){
  const c=body[motion],source=rgbaPng(c.sourcePng);
  for(const f of c.frames){const r=frames[f.frame]!.frame,i=f.sourceFrame-1,rows:Buffer[]=[];
   for(let y=0;y<96;y++){const a=((r.y+y)*atlas.width+r.x)*4,b=((Math.floor(i/4)*96+y)*source.width+i%4*96)*4,row=atlas.pixels.subarray(a,a+384);expect(row.equals(source.pixels.subarray(b,b+384))).toBe(true);rows.push(row);}
   expect(createHash('sha256').update(Buffer.concat(rows)).digest('hex')).toBe(f.pixelSha256);expect(f.bounds.partial).toBe(0);
   expect(Number.isFinite(f.hand.x)&&Number.isFinite(f.hand.y)).toBe(true);
  }
 }
 expect(MAGE_RUN_V2.clips.south.run.frames.map(f=>f.sourceFrame)).toEqual([4,5,6,7,8,9,10,11]);
 expect(MAGE_RUN_V2.clips.north.run.frames.map(f=>f.sourceFrame)).toEqual([4,5,6,7,8,9]);
 expect(MAGE_RUN_V2.clips['north-east'].run.frames.map(f=>f.sourceFrame)).toEqual([5,6,7,8,9,10]);
});
it('maps all8 directions to three source views with only W/SW and NW mirrored',()=>{
 for(const [direction,body,flipX]of [['south','south',false],['south-east','south',false],['east','south',false],['south-west','south',true],['west','south',true],['north','north',false],['north-east','north-east',false],['north-west','north-east',true]] as const)for(const motion of ['run-start','run','run-stop'] as const){
  const c=MAGE_RUN_V2.clips[body][motion],v=mageRunSelection(direction,motion,.1),pivot=MAGE_RUN_V2.clips[body].pivot;
  expect(v).toMatchObject({body,flipX,texture:'mage-run-v2'});expect(v.pivot).toEqual({x:flipX?96-pivot.x:pivot.x,y:pivot.y});
  expect(v.frame).toBe(c.frames[Math.min(1,c.frames.length-1)]!.frame);
  expect(mageRunSelection(direction,motion,c.periodMs/1000).index).toBe(motion==='run'?0:c.frames.length-1);
 }
});
it.each(MAGE_DIRECTIONS)('starts once, loops and stops/resumes %s without changing the physical player',direction=>{
 const a=new MageRunningAnimation();expect(a.current()).toBeUndefined();expect(a.view(.01,1.35,direction,true)?.motion).toBe('run-start');
 for(let i=0;i<160;i++)a.view(.01,1.35,direction,true);expect(a.current()?.motion).toBe('run');
 const old=a.current()!;expect(a.view(0,0,direction,true)).toEqual(old);a.view(.01,0,direction,false);expect(a.current()?.motion).toBe('run-stop');
 expect(a.view(0,0,direction,false)).toEqual(a.current());expect(a.view(.01,1.35,direction,true)?.motion).toBe('run');
 a.view(.01,0,direction,false);for(let i=0;i<110;i++)a.view(.01,0,direction,false);expect(a.current()).toBeUndefined();
 expect(a.view(.01,1.35,direction,true)?.motion).toBe('run-start');a.clear();expect(a.current()).toBeUndefined();
});
it('scales the repeated stride by distance, preserves phase on turns and settles short taps quickly',()=>{
 const a=new MageRunningAnimation();for(let i=0;i<140;i++)a.view(.01,1.35,'east',true);
 const p=a.current()!,slow=a.view(.1,6.75,'east',true)!;expect(slow.age-p.age).toBeCloseTo(.05);
 const north=a.view(0,0,'north',true)!;expect(north.age).toBeCloseTo(mageRunMappedAge('east','north','run',slow.age));
 const turned=a.view(0,0,'north-east',true)!;expect(turned.motion).toBe('run');expect(mageRunDuration('north-east','run')).toBe(.54);
 a.clear();a.view(.01,1.35,'south',true);const end=a.view(.01,0,'south',false)!;
 expect(mageRunDuration('south','run-stop')-end.age).toBeLessThanOrEqual(.2);a.view(.2,0,'south',false);expect(a.current()).toBeUndefined();
});
