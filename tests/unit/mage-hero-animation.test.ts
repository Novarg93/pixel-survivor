import {expect,it} from 'vitest';
import {World} from '../../src/game/systems/World';
import {MageCastingController} from '../../src/game/art/MageCastingController';
import {MageHeroAnimation,mageDirection,mageCastMotion,MAGE_DIRECTIONS} from '../../src/game/art/MageHeroAnimation';

it('selects all eight native facings without mirroring, including diagonal boundaries',()=>{
  const vectors=[[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];
  expect(vectors.map(([x,y])=>mageDirection(x!,y!))).toEqual(MAGE_DIRECTIONS);
  expect(mageDirection(0,0,'west')).toBe('west');expect(mageDirection(1,.1)).toBe('east');
});
it('maps all five spells and three ultimates to the four user-authored gestures',()=>{
  expect(['fireball','lightning','meteor','shield','frost','ultimate-lightning','ultimate-frost','ultimate-fire'].map(a=>mageCastMotion(a as Parameters<typeof mageCastMotion>[0]))).toEqual(['fireball','lightning','meteor','defensive','defensive','lightning','defensive','defensive']);
});
it('runs through authored transitions, stops the cosmetic stride and freezes on pause',()=>{
  const w=new World(3,{spawnRate:0}),a=new MageHeroAnimation(),c=new MageCastingController();for(const ability of Object.values(w.abilities))ability.level=0;
  a.view(w,c.view(w.elapsed),false,0);
  w.step(.05,{x:1,y:-1});expect(a.view(w,c.view(w.elapsed),true,0)).toMatchObject({motion:'run-start',direction:'north-east'});
  for(let i=0;i<4;i++){w.step(.05,{x:1,y:-1});a.view(w,c.view(w.elapsed),true,0);}
  for(let i=0;i<10;i++){w.step(.05,{x:1,y:-1});a.view(w,c.view(w.elapsed),true,0);}
  const run=a.view(w,c.view(w.elapsed),true,0);expect(run.motion).toBe('run');expect(run.age).toBeGreaterThan(.4);
  w.pause();w.step(.05,{x:-1,y:0});expect(a.view(w,c.view(w.elapsed),true,0)).toEqual(run);
  w.resume();w.step(.05);expect(a.view(w,c.view(w.elapsed),false,0).motion).toBe('run-stop');
  for(let i=0;i<10;i++){w.step(.05);a.view(w,c.view(w.elapsed),false,0);}expect(a.view(w,c.view(w.elapsed),false,0).motion).toBe('idle');
});
it('plays a full-body cast toward its frozen target while movement and gameplay remain unchanged',()=>{
  const w=new World(4,{spawnRate:0}),a=new MageHeroAnimation(),c=new MageCastingController();
  c.request({ability:'ultimate-lightning',rank:5,origin:{x:0,y:0},target:{x:-80,y:-80}},0);
  const before=JSON.stringify(w),pose=a.view(w,c.view(0),false,0);
  expect(pose).toMatchObject({motion:'lightning',direction:'north-west',progress:0,casting:true});expect(JSON.stringify(w)).toBe(before);
  c.interrupt('hurt',0);expect(a.view(w,c.view(0),false,0).casting).toBe(false);
  w.status='over';expect(a.view(w,c.view(0),false,.4)).toMatchObject({motion:'death',age:.4});
  const fresh=new World(5);expect(a.view(fresh,new MageCastingController().view(0),false,0)).toMatchObject({motion:'idle',direction:'south',age:0});
});
it('holds the native pointing pose throughout the lightning ultimate beam before returning to neutral',()=>{
  const w=new World(5),a=new MageHeroAnimation(),c=new MageCastingController();
  c.request({ability:'ultimate-lightning',rank:5,origin:{x:0,y:0},target:{x:80,y:0}},0);
  w.elapsed=.52;expect(a.view(w,c.view(w.elapsed),false,0).progress).toBeCloseTo(.28);
  w.elapsed=.83;const hold=a.view(w,c.view(w.elapsed),false,0);expect(hold.progress).toBeGreaterThan(.5);expect(hold.progress).toBeLessThan(.54);
  w.elapsed=.974;expect(a.view(w,c.view(w.elapsed),false,0).progress).toBeGreaterThan(.99);
});
it.each(MAGE_DIRECTIONS)('keeps moving %s while facing its cast target, with independent clocks',direction=>{
  const vectors=[[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]],index=MAGE_DIRECTIONS.indexOf(direction),[x,y]=vectors[index]!;
  const w=new World(41,{spawnRate:0}),a=new MageHeroAnimation(),c=new MageCastingController();for(const ability of Object.values(w.abilities))ability.level=0;
  a.view(w,c.view(0),false,0);
  for(let i=0;i<32;i++){w.step(.05,{x:x!,y:y!});a.view(w,c.view(w.elapsed),true,0);}
  c.request({ability:'meteor',rank:1,origin:{...w.player},target:{x:w.player.x-x!*100,y:w.player.y-y!*100},duration:2},w.elapsed);
  const before=JSON.stringify(w),first=a.view(w,c.view(w.elapsed),true,0);
  expect(first.direction).toBe(MAGE_DIRECTIONS[(MAGE_DIRECTIONS.indexOf(direction)+4)%8]);expect(first.locomotion).toMatchObject({motion:'run',direction});expect(JSON.stringify(w)).toBe(before);
  w.step(.05,{x:x!,y:y!});const next=a.view(w,c.view(w.elapsed),true,0);
  expect(next.locomotion!.age).toBeGreaterThan(first.locomotion!.age);expect(next.progress).toBeGreaterThan(first.progress!);
  w.pause();w.step(.1);expect(a.view(w,c.view(w.elapsed),true,0)).toEqual(next);
});
it('uses a slower walking cycle for analog movement, freezes on pause and casts whole when settled',()=>{
  const w=new World(43,{spawnRate:0}),a=new MageHeroAnimation(),c=new MageCastingController();for(const ability of Object.values(w.abilities))ability.level=0;
  a.view(w,c.view(0),false,0);for(let i=0;i<20;i++){w.step(.05,{x:.3,y:0,analog:true});a.view(w,c.view(w.elapsed),true,0);}
  const run=a.view(w,c.view(w.elapsed),true,0);expect(run.motion).toBe('run-start');w.pause();expect(a.view(w,c.view(w.elapsed),true,0)).toEqual(run);
  w.resume();for(let i=0;i<24;i++){w.step(.05);a.view(w,c.view(w.elapsed),false,0);}
  c.request({ability:'fireball',rank:1,origin:{...w.player},target:{x:w.player.x-100,y:w.player.y}},w.elapsed);
  const standing=a.view(w,c.view(w.elapsed),false,0);expect(standing.direction).toBe('west');expect(standing.locomotion).toBeUndefined();
});
