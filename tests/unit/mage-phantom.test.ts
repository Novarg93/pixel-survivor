import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {World} from '../../src/game/systems/World';
import {MageCastingController,CAST_DURATION} from '../../src/game/art/MageCastingController';
import {MageHeroAnimation,MAGE_DIRECTIONS} from '../../src/game/art/MageHeroAnimation';
import {mageMovingLayers} from '../../src/game/art/mageHeroLayers';
import {mageNeedsPhantom} from '../../src/game/art/mageCastSector';
import {MAGE_PHANTOM,magePhantomFrame,magePhantomTurn,isMagePhantomSpell} from '../../src/game/art/magePhantomPack';
import {mageCastSelectionV2} from '../../src/game/art/mageCastPackV2';
const vectors=[[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]] as const;
const audit=JSON.parse(readFileSync('art/generated/mage-phantom-cast-production-v1/source-audit.json','utf8')) as {sources:Record<string,string>;frames:{name:string;source:string;pixelHash:string}[]};
const atlas=JSON.parse(readFileSync('public/assets/hd/mage-phantom-v1/atlas.json','utf8')) as {frames:Record<string,{frame:{x:number;y:number;w:number;h:number};spriteSourceSize:{x:number;y:number;w:number;h:number};sourceSize:{w:number;h:number}}>};

it('shares one 340ms one-shot and one atlas between Fireball and regular Lightning',()=>{
  expect(MAGE_PHANTOM.sharedAbilities).toEqual(['fireball','lightning']);expect(MAGE_PHANTOM.loop).toBe(false);
  expect(MAGE_PHANTOM.directions).toEqual(MAGE_DIRECTIONS);expect(MAGE_PHANTOM.durationMs).toBe(340);
  expect(CAST_DURATION.fireball).toBe(.34);expect(CAST_DURATION.lightning).toBe(.34);expect(CAST_DURATION.frost).toBe(.48);
  for(const spell of ['meteor','frost','shield','ultimate-lightning','ultimate-fire','ultimate-frost'] as const)expect(isMagePhantomSpell(spell)).toBe(false);
  expect(Object.keys(atlas.frames)).toHaveLength(112);expect(MAGE_PHANTOM.atlas.rgbaBytes).toBeLessThan(2*1024*1024);
});
it('selects real individually timed frames without making the cast loop',()=>{
  let time=0;for(const [index,duration]of MAGE_PHANTOM.durationsMs.entries()){
    expect(magePhantomFrame(time/1000)).toBe(index);expect(magePhantomFrame((time+duration-1)/1000)).toBe(index);time+=duration;
  }
  expect(magePhantomFrame(.34)).toBe(11);expect(magePhantomFrame(100)).toBe(11);
  expect(magePhantomTurn('north','south')).toBe('east');expect(magePhantomTurn('west','west')).toBe('west');
});
it.each(MAGE_DIRECTIONS)('uses the authored full-body target cast while moving %s without a legacy projection',direction=>{
  const move=vectors[MAGE_DIRECTIONS.indexOf(direction)]!;
  for(const ability of ['fireball','lightning'] as const)for(const [i,targetDirection]of MAGE_DIRECTIONS.entries()){
    const w=new World(64,{spawnRate:0}),animation=new MageHeroAnimation(),controller=new MageCastingController();
    for(const a of Object.values(w.abilities))a.level=0;
    animation.view(w,controller.view(0),false,0);
    for(let k=0;k<32;k++){w.step(.05,{x:move[0],y:move[1]});animation.view(w,controller.view(w.elapsed),true,0);}
    const aim=vectors[i]!;controller.request({ability,rank:1,origin:{...w.player},target:{x:w.player.x+aim[0]*100,y:w.player.y+aim[1]*100}},w.elapsed);
    const before=JSON.stringify(w),first=animation.view(w,controller.view(w.elapsed),true,0);
    expect(JSON.stringify(w)).toBe(before);expect(first.phantom).toBeUndefined();expect(first.direction).toBe(targetDirection);expect(mageMovingLayers(first)).toBeUndefined();
    expect(mageCastSelectionV2(first).texture).toBe('mage-cast-v2');
    expect(first.locomotion).toMatchObject({direction,motion:'run'});
    w.step(.05,{x:move[0],y:move[1]});const next=animation.view(w,controller.view(w.elapsed),true,0);
    expect(next.locomotion!.age).toBeGreaterThan(first.locomotion!.age);
    expect(next.phantom).toBeUndefined();expect(next.direction).toBe(targetDirection);expect(next.castVariant).toBe(first.castVariant);
    w.pause();w.step(.1);expect(animation.view(w,controller.view(w.elapsed),true,0)).toEqual(next);
    controller.interrupt('blink',w.elapsed);expect(animation.view(w,controller.view(w.elapsed),true,0).phantom).toBeUndefined();
  }
});
it('does not restart a shared stroke when the other directional spell arrives',()=>{
  const c=new MageCastingController();c.request({ability:'fireball',rank:1,origin:{x:0,y:0},target:{x:80,y:0}},0);
  c.request({ability:'lightning',rank:1,origin:{x:0,y:0},target:{x:-80,y:0}},.14);
  expect(c.view(.14).active).toMatchObject({ability:'fireball',started:0,target:{x:80,y:0}});expect(c.view(.14).pending).toBe(1);
  c.advance(.341);expect(c.view(.341).active).toMatchObject({ability:'lightning',started:.341,target:{x:-80,y:0}});
});
it('shows directional casts immediately over a long AOE without replaying stale queued shots',()=>{
  const w=new World(12,{spawnRate:0}),c=new MageCastingController(),a=new MageHeroAnimation();
  c.request({ability:'meteor',rank:1,target:{x:100,y:100}},0);
  c.request({ability:'fireball',rank:1,origin:{x:0,y:0},target:{x:-100,y:0}},.1);w.elapsed=.1;
  expect(c.view(.1).active?.ability).toBe('meteor');expect(a.view(w,c.view(.1),false,0)).toMatchObject({motion:'fireball',direction:'west',casting:true});
  c.request({ability:'lightning',rank:1,target:{x:100,y:0}},.2);expect(c.view(.2).directional?.started).toBe(.1);
  c.advance(.45);w.elapsed=.45;expect(a.view(w,c.view(.45),false,0).phantom).toBeUndefined();
  c.request({ability:'lightning',rank:1,target:{x:100,y:0}},.5);w.elapsed=.5;expect(a.view(w,c.view(.5),false,0)).toMatchObject({motion:'lightning',direction:'east',casting:true});
  c.request({ability:'ultimate-lightning',rank:5,target:{x:0,y:-100}},.6);expect(c.view(.6).directional).toBeUndefined();
});
it('matches the requested North case including both exact side boundaries',()=>{
  expect(MAGE_DIRECTIONS.filter(target=>mageNeedsPhantom('north',target))).toEqual(['south','south-east','east','west','south-west']);
  expect(MAGE_DIRECTIONS.filter(target=>!mageNeedsPhantom('north',target))).toEqual(['north-east','north','north-west']);
  for(const facing of MAGE_DIRECTIONS)expect(MAGE_DIRECTIONS.filter(target=>mageNeedsPhantom(facing,target))).toHaveLength(5);
});
it('uses native full-body casts for every stationary direction and switches sector without restarting a stroke',()=>{
  for(const direction of MAGE_DIRECTIONS){
    const w=new World(73),a=new MageHeroAnimation(),c=new MageCastingController(),v=vectors[MAGE_DIRECTIONS.indexOf(direction)]!;
    c.request({ability:'fireball',rank:1,origin:{x:0,y:0},target:{x:v[0]*100,y:v[1]*100}},0);
    const pose=a.view(w,c.view(0),false,0);expect(pose.phantom).toBeUndefined();expect(pose.direction).toBe(direction);expect(pose.locomotion).toBeUndefined();
  }
  const w=new World(74,{spawnRate:0}),a=new MageHeroAnimation(),c=new MageCastingController();for(const state of Object.values(w.abilities))state.level=0;
  a.view(w,c.view(0),false,0);for(let i=0;i<8;i++){w.step(.05,{x:0,y:-1});a.view(w,c.view(w.elapsed),true,0);}
  c.request({ability:'lightning',rank:1,origin:{...w.player},target:{x:w.player.x,y:w.player.y-100}},w.elapsed);
  expect(a.view(w,c.view(w.elapsed),true,0).phantom).toBeUndefined();
  w.step(.05,{x:1,y:0});const side=a.view(w,c.view(w.elapsed),true,0);expect(side.phantom).toBeUndefined();expect(side.direction).toBe('north');expect(side.age).toBeCloseTo(.05);
  w.step(.05,{x:0,y:-1});const front=a.view(w,c.view(w.elapsed),true,0);expect(front.phantom).toBeUndefined();expect(front.age).toBeCloseTo(.1);expect(front.locomotion?.motion).toBe('run');
});
it('keeps the stationary visual facing on its cast target without changing gameplay Blink direction',()=>{
  const w=new World(75,{spawnRate:0}),a=new MageHeroAnimation(),c=new MageCastingController();for(const state of Object.values(w.abilities))state.level=0;
  a.view(w,c.view(0),false,0);for(let i=0;i<8;i++){w.step(.05,{x:0,y:-1});a.view(w,c.view(w.elapsed),true,0);}
  for(let i=0;i<8;i++){w.step(.05);a.view(w,c.view(w.elapsed),false,0);}
  c.request({ability:'fireball',rank:1,origin:{...w.player},target:{x:w.player.x-100,y:w.player.y}},w.elapsed);
  expect(a.view(w,c.view(w.elapsed),false,0).direction).toBe('west');
  w.elapsed+=.35;c.advance(w.elapsed);expect(a.view(w,c.view(w.elapsed),false,0)).toMatchObject({motion:'idle',direction:'west'});expect(w.facing).toEqual({x:0,y:-1});
});
it('freezes the authored cast direction and variant while movement turns, and clears them on restart',()=>{
  const w=new World(1,{spawnRate:0}),a=new MageHeroAnimation(),c=new MageCastingController();for(const v of Object.values(w.abilities))v.level=0;
  a.view(w,c.view(0),false,0);w.step(.05,{x:0,y:-1});a.view(w,c.view(w.elapsed),true,0);
  c.request({ability:'lightning',rank:1,origin:{...w.player},target:{x:0,y:100}},w.elapsed);
  const first=a.view(w,c.view(w.elapsed),true,0);expect(first.direction).toBe('south');expect(first.phantom).toBeUndefined();
  w.step(.05,{x:1,y:0});const pose=a.view(w,c.view(w.elapsed),true,0);
  expect(pose.locomotion?.direction).toBe('east');expect(pose).toMatchObject({direction:'south',castVariant:first.castVariant});expect(pose.phantom).toBeUndefined();
  w.status='over';expect(a.view(w,c.view(w.elapsed),false,.1).phantom).toBeUndefined();
  expect(a.view(new World(2),new MageCastingController().view(0),false,0).phantom).toBeUndefined();
});
it('preserves all original sources and exact full-canvas pivots after lossless trim',()=>{
  for(const [file,sha]of Object.entries(audit.sources))expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe(sha);
  for(const frame of Object.values(atlas.frames)){
    expect(frame.sourceSize).toEqual({w:112,h:112});expect(frame.frame.w).toBe(frame.spriteSourceSize.w);expect(frame.frame.h).toBe(frame.spriteSourceSize.h);
    expect(frame.frame.x+frame.frame.w).toBeLessThanOrEqual(MAGE_PHANTOM.atlas.width);expect(frame.frame.y+frame.frame.h).toBeLessThanOrEqual(MAGE_PHANTOM.atlas.height);
  }
});
