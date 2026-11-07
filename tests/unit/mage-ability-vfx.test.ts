import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {World} from '../../src/game/systems/World';
import {MageAbilityPresentation,NOVA_LIGHT_TEXTURE} from '../../src/game/art/MageAbilityArt';
import {drawMageMagic} from '../../src/game/art/MageMagic';
import {mageAbilityFrame,mageAbilityPlaybackDuration,mageAbilityPlaybackFrame,MAGE_ABILITY_MANIFEST as pack,MAGE_VFX_LIMIT,METEOR_DISPLAY_SIZE,METEOR_IMPACT_DISPLAY_SIZE,METEOR_IMPACT_ORIGIN_Y} from '../../src/game/art/mageAbilityPack';
import atlas from '../../public/assets/hd/mage-ability-vfx-v1/atlas.json';
import type Phaser from 'phaser';
import {ARMAGEDDON} from '../../src/game/config/mageAbilities';
import {meteor} from '../../src/game/abilities/meteor';

function quiet(){const w=new World(42,{character:'mage',spawnRate:0});w.encounterDirector.nextAt=1e6;for(const a of Object.values(w.abilities))a.level=0;return w;}

it('loads only the static stone and 23 transparent V2 landing frames without atlas bleed',()=>{
  expect(Object.keys(atlas.frames)).toHaveLength(24);expect(pack.rgbaBytes).toBe(528*792*4);
  expect(pack.clips['meteor-ground-impact'].input).toContain('meteor-v2/make_animation_of_im...-599290415');expect(pack.clips['meteor-ground-impact'].sourceEdgePixels).toBe(16);
  expect(pack.clips['meteor-explosion-impact'].input).toContain('meteor-v2/make_animation_of_im...-686437158');expect(pack.clips['meteor-explosion-impact'].sourceEdgePixels).toBe(360);
  expect(Object.keys(atlas.frames).some(f=>f.startsWith('meteor-impact-')||f.startsWith('meteor-collision-'))).toBe(false);
  const b=readFileSync('public/assets/hd/mage-ability-vfx-v1/atlas.png'),chunks:Buffer[]=[];
  for(let p=8;p<b.length;){const n=b.readUInt32BE(p);if(b.toString('ascii',p+4,p+8)==='IDAT')chunks.push(b.subarray(p+8,p+8+n));p+=n+12;}
  // Project PNG encoder emits unfiltered RGBA rows.
  const raw=inflateSync(Buffer.concat(chunks)),width=pack.width,stride=width*4+1;
  for(const {frame:f} of Object.values(atlas.frames)){
    expect(f.x+f.w).toBeLessThanOrEqual(width);expect(f.y+f.h).toBeLessThanOrEqual(pack.height);
    let visible=0,empty=0;
    for(let y=0;y<f.h;y++){expect(raw[(f.y+y)*stride]).toBe(0);for(let x=0;x<f.w;x++){
      const alpha=raw[(f.y+y)*stride+1+(f.x+x)*4+3];if(alpha)visible++;else empty++;
      if(x===0||y===0||x===f.w-1||y===f.h-1)expect(alpha).toBe(0);
    }}
    expect(visible).toBeGreaterThan(0);expect(empty).toBeGreaterThan(0);
  }
});
it('uses original sequence and timings, reaches the final frame and never loops',()=>{
  expect(pack.clips['meteor-ground-impact'].frameCount).toBe(12);expect(pack.clips['meteor-ground-impact'].durationsMs).toEqual(Array(12).fill(150));
  expect(pack.clips['meteor-fall'].frameCount).toBe(1);expect(pack.clips['meteor-fall'].originalDurationsMs).toBeNull();
  expect(pack.clips['meteor-explosion-impact'].frameCount).toBe(11);expect(pack.clips['meteor-explosion-impact'].durationsMs).toEqual(Array(11).fill(150));
  for(const clip of ['meteor-fall','meteor-ground-impact','meteor-explosion-impact'] as const){
    expect(pack.clips[clip].sheetVsGifAlphaDifferences).toBe(0);
    let age=0;for(const [i,ms] of pack.clips[clip].durationsMs.entries()){expect(mageAbilityFrame(clip,age+.001)).toBe(`${clip}-${i}`);age+=ms/1000;}
    expect(mageAbilityFrame(clip,100)).toBe(`${clip}-${pack.clips[clip].frameCount-1}`);
  }
});
it('Nova uses a stationary soft light at its true radius, half opacity and simulation time',()=>{
  const w=quiet(),p=new MageAbilityPresentation();w.effect('frost',{x:90,y:30},73,0xd9f3f7,1.2);
  expect(p.views(w,1)).toEqual([]);w.elapsed=.03;expect(p.views(w,1)[0]!.alpha).toBeCloseTo(.25);
  w.elapsed=.25;const before=JSON.stringify(w),view=p.views(w,1)[0]!;
  expect(view.texture).toBe(NOVA_LIGHT_TEXTURE);expect(view.frame).toBe('__BASE');expect(view.size).toBe(146);expect(view.alpha).toBe(.5);expect([view.x,view.y]).toEqual([90,30]);expect(JSON.stringify(w)).toBe(before);
  w.status='paused';expect(p.views(w,1)).toEqual([view]);
  w.elapsed=.555;expect(p.views(w,1)[0]!.texture).toBe(NOVA_LIGHT_TEXTURE);expect(p.views(w,1)[0]!.size).toBe(146);expect(p.views(w,1)[0]!.alpha).toBeLessThan(.5);
  w.elapsed=.6;expect(p.views(w,1)).toEqual([]);expect(p.tracked).toBe(0);expect(w.effects[0]!.expires).toBe(1.2);
});
it('fades the local light from half opacity to zero during the final quarter of the root effect',()=>{
  const w=quiet(),p=new MageAbilityPresentation();w.effect('frost',w.player,100,0xd9f3f7,2);
  w.elapsed=.75;expect(p.views(w,1)[0]!.texture).toBe(NOVA_LIGHT_TEXTURE);expect(p.views(w,1)[0]!.alpha).toBeCloseTo(.5);
  w.elapsed=.875;expect(p.views(w,1)[0]!.size).toBe(200);expect(p.views(w,1)[0]!.alpha).toBeCloseTo(.25);
  w.elapsed=1;expect(p.views(w,1)).toEqual([]);expect(w.effects[0]!.expires).toBe(2);
});
it('halves flight duration with damage aligned to the faster landing',()=>{
  const w=quiet(),p=new MageAbilityPresentation(),e=w.spawn('tank',{x:120,y:0})!;e.speed=0;e.hp=e.maxHp=1000;
  w.abilities.meteor.level=1;meteor(w);w.abilities.meteor.readyAt=1e6;
  expect(ARMAGEDDON.delay).toBeCloseTo(.85/(1.5*1.3*2));expect(w.impacts[0]!.landAt).toBeCloseTo(.85/(1.5*1.3*2));
  expect(pack.clips['meteor-fall'].durationsMs[0]).toBeCloseTo(ARMAGEDDON.delay*1000);
  w.elapsed=ARMAGEDDON.delay-.051;w.step(.05);expect(p.views(w,1)[0]!.frame).toBe('meteor-fall-0');expect(e.hp).toBe(1000);
  w.step(.01);expect(e.hp).toBe(920);const impact=w.effects.find(e=>e.kind==='meteor')!;expect(impact.source).toBe('meteor');
  expect(p.views(w,1).some(v=>v.frame==='meteor-ground-impact-0')).toBe(true);
  expect(p.views(w,1).some(v=>v.frame==='meteor-explosion-impact-0')).toBe(true);
  w.effects=[];for(let i=0;i<12;i++){w.elapsed=impact.started+i*.075+.001;expect(p.views(w,1)[0]!.frame).toBe(`meteor-ground-impact-${i}`);}
  w.elapsed=impact.started+.85;expect(p.views(w,1)[0]!.frame).toBe('meteor-ground-impact-11');expect(p.views(w,1)[0]!.alpha).toBeCloseTo(.25);
  w.elapsed=impact.started+.9;expect(p.views(w,1)).toEqual([]);
  w.effect('meteor',e,55,0xff829d,.5);w.effect('meteor',e,55,0xffa46c,.5);w.effect('meteor',e,55,0xffae65,.5,undefined,undefined,'slam');
  expect(p.views(w,1)).toEqual([]);
});
it('plays every new frame at twice source speed without carrying over old contact-pose timings',()=>{
  for(const clip of ['meteor-ground-impact','meteor-explosion-impact'] as const){
    let age=0;for(let i=0;i<pack.clips[clip].frameCount;i++){
      expect(mageAbilityPlaybackFrame(clip,age+.001)).toBe(`${clip}-${i}`);
      expect(mageAbilityPlaybackFrame(clip,age+.0749)).toBe(`${clip}-${i}`);age+=.075;
    }
  }
  expect(mageAbilityPlaybackDuration('meteor-ground-impact')).toBe(.9);
  expect(mageAbilityPlaybackDuration('meteor-explosion-impact')).toBe(.825);
});
it('plays ground and explosion once at the same fixed contact pivot, then fades both tails',()=>{
  const w=quiet(),p=new MageAbilityPresentation();w.effect('meteor',{x:120,y:40},55,0xffae65,.5,undefined,undefined,'meteor');
  const effect=w.effects[0]!;
  for(let i=0;i<11;i++){
    w.elapsed=i*.075+.001;const before=JSON.stringify(w),views=p.views(w,1),flash=views.find(v=>v.frame.startsWith('meteor-explosion-impact-'))!,ground=views.find(v=>v.frame.startsWith('meteor-ground-impact-'))!;
    expect(JSON.stringify(w)).toBe(before);
    expect(flash.frame).toBe(`meteor-explosion-impact-${i}`);expect(ground.frame).toBe(`meteor-ground-impact-${i}`);
    for(const v of views){expect([v.x,v.y]).toEqual([120,40]);expect(v.size).toBe(METEOR_IMPACT_DISPLAY_SIZE);expect(v.originY).toBe(86/132);}
    expect(ground.depth).toBeLessThan(0);expect(flash.depth).toBeGreaterThan(ground.depth);
  }
  w.elapsed=.775;w.effects=[];const flash=p.views(w,1).find(v=>v.frame==='meteor-explosion-impact-10')!;expect(flash.alpha).toBeCloseTo(1/3);
  w.status='paused';expect(p.views(w,1).find(v=>v.frame==='meteor-explosion-impact-10')).toEqual(flash);
  w.elapsed=.825;expect(p.views(w,1).some(v=>v.frame.startsWith('meteor-explosion-impact-'))).toBe(false);
  expect(p.views(w,1).some(v=>v.frame==='meteor-ground-impact-11')).toBe(true);
  w.elapsed=.9;expect(p.views(w,1)).toEqual([]);
  expect(effect.expires).toBe(.5);
});
it('preserves the accepted height and angle while doubling actual flight velocity',()=>{
  const w=quiet(),p=new MageAbilityPresentation(),target={x:120,y:40};
  w.impacts.push({...target,id:w.id(),radius:55,damage:0,launchAt:0,landAt:ARMAGEDDON.delay,source:'meteor',hostile:false});
  w.elapsed=0;const start=p.views(w,1)[0]!;expect(Math.hypot(start.x-target.x,start.y-target.y)).toBeCloseTo(148*1.3);
  const angle=46.55*Math.PI/180;
  expect((target.y-start.y)/(148*Math.cos(angle))).toBeCloseTo(1.3);
  expect((start.x-target.x)/(148*Math.sin(angle))).toBeCloseTo(1.3);
  w.elapsed=ARMAGEDDON.delay*.25;const a=p.views(w,1)[0]!;
  w.elapsed=ARMAGEDDON.delay*.75;const b=p.views(w,1)[0]!;
  expect(b.x).toBeLessThan(a.x);expect(b.y).toBeGreaterThan(a.y);
  expect(Math.atan2(a.x-b.x,b.y-a.y)*180/Math.PI).toBeCloseTo(46.55);
  const speed=Math.hypot(b.x-a.x,b.y-a.y)/(ARMAGEDDON.delay*.5);
  expect(speed/(192.4/(.85/(1.5*1.3)))).toBeCloseTo(2);
  expect(ARMAGEDDON.delay).toBeCloseTo(.85/(1.5*1.3*2));
  w.elapsed=ARMAGEDDON.delay*(1-1e-6);const end=p.views(w,1)[0]!;
  expect(Math.hypot(end.x-target.x,end.y-target.y)).toBeLessThan(.001);
});
it('keeps the accepted stone size and restores the fixed landing size independent of damage radius',()=>{
  const w=quiet(),p=new MageAbilityPresentation();w.elapsed=.2;w.stats.area=4;w.abilities.meteor.level=5;
  for(const radius of [55,83,332])w.impacts.push({id:w.id(),x:120,y:0,radius,damage:0,launchAt:0,landAt:.85,source:'meteor',hostile:false});
  const before=JSON.stringify(w);expect(p.views(w,1).map(v=>v.size)).toEqual(Array(3).fill(METEOR_DISPLAY_SIZE));expect(METEOR_DISPLAY_SIZE).toBe(20.625*1.5);expect(JSON.stringify(w)).toBe(before);
  w.impacts=[];for(const radius of [55,332])w.effect('meteor',w.player,radius,0xffae65,.5,undefined,undefined,'meteor');
  const views=p.views(w,1);
  expect(views.filter(v=>v.frame.startsWith('meteor-ground-impact-')).map(v=>v.size)).toEqual([METEOR_IMPACT_DISPLAY_SIZE,METEOR_IMPACT_DISPLAY_SIZE]);
  expect(views.filter(v=>v.frame.startsWith('meteor-explosion-impact-')).map(v=>v.size)).toEqual([METEOR_IMPACT_DISPLAY_SIZE,METEOR_IMPACT_DISPLAY_SIZE]);
  expect(METEOR_IMPACT_DISPLAY_SIZE).toBe(60.328125);
});
it('preserves true damage radii while all ranks and Area bonuses use the same V2 visual size',()=>{
  for(const [rank,area] of [[1,1],[5,1],[5,2]] as const){
    const w=quiet(),p=new MageAbilityPresentation(),e=w.spawn('tank',{x:120,y:0})!;e.speed=0;e.hp=e.maxHp=10000;
    w.abilities.meteor.level=rank;w.stats.area=area;meteor(w);w.abilities.meteor.readyAt=1e6;
    const hit=w.impacts[0]!,radius=(ARMAGEDDON.radiusBase+rank*ARMAGEDDON.radiusPerRank)*area;
    expect(hit.radius).toBe(radius);expect(p.views(w,1)[0]!.size).toBe(METEOR_DISPLAY_SIZE);
    w.elapsed=hit.landAt-.001;w.step(.001);const effect=w.effects.find(e=>e.source==='meteor')!;
    const before=JSON.stringify(w),views=p.views(w,1);
    const size=views.find(v=>v.frame==='meteor-explosion-impact-0')!.size;
    expect(size).toBe(METEOR_IMPACT_DISPLAY_SIZE);
    expect(views.find(v=>v.frame==='meteor-ground-impact-0')!.size).toBe(size);
    expect(views.filter(v=>v.frame!=='meteor-fall-0').every(v=>v.originY===METEOR_IMPACT_ORIGIN_Y)).toBe(true);
    expect(JSON.stringify(w)).toBe(before);
    // Burst owns the fixed contact point, not a pooled Effect or mutable player stats.
    w.effects=[];effect.radius=1;w.stats.area=4;w.elapsed=effect.started+.55;
    expect(p.views(w,1).find(v=>v.frame==='meteor-explosion-impact-7')!.size).toBe(size);
  }
});
it('uses only the new ground residue for evolved Meteor zones after both bursts finish',()=>{
  const w=quiet(),p=new MageAbilityPresentation();
  w.effect('meteor',{x:120,y:40},55,0xffae65,.5,undefined,undefined,'meteor');
  w.zones.push({id:w.id(),x:120,y:40,radius:44,damage:12,expires:3,nextTick:.5,source:'meteor'});
  expect(p.views(w,1)).toHaveLength(2);w.effects=[];w.elapsed=1;
  const before=JSON.stringify(w),views=p.views(w,1);expect(views).toHaveLength(1);
  expect(views[0]).toMatchObject({frame:'meteor-ground-impact-11',x:120,y:40,size:METEOR_IMPACT_DISPLAY_SIZE,originY:METEOR_IMPACT_ORIGIN_Y,alpha:.25});
  expect(JSON.stringify(w)).toBe(before);w.elapsed=3;expect(p.views(w,1)).toEqual([]);
});
it('removes the basic Nova/Meteor ring commands while retaining fireball explosion feedback',()=>{
  const w=quiet();w.effect('frost',w.player,73,0xd9f3f7,1.2);w.effect('meteor',w.player,55,0xffae65,.5,undefined,undefined,'meteor');
  w.impacts.push({id:w.id(),x:100,y:0,radius:55,damage:0,landAt:1,source:'meteor',hostile:false});
  const calls:string[]=[],g=new Proxy({}, {get:(_t,key)=> ()=>{calls.push(String(key));return g;}}) as Phaser.GameObjects.Graphics;
  drawMageMagic(g,w,1);expect(calls).toEqual([]);
  w.effect('meteor',w.player,55,0xffa46c,.5);drawMageMagic(g,w,1);expect(calls).toContain('strokePath');
});
it('clears the presentation source when the effect pool reuses a Meteor for another spell',()=>{
  const w=quiet();w.effect('meteor',w.player,55,0xffae65,.01,undefined,undefined,'meteor');
  const previous=w.effects[0]!;w.step(.05);w.effect('shield',w.player,30,0xffffff,.5);
  expect(w.effects[0]).toBe(previous);expect(w.effects[0]!.source).toBeUndefined();
});
it('bounds presentation objects and clears death, run changes and zero intensity',()=>{
  const w=quiet(),p=new MageAbilityPresentation();
  for(let i=0;i<200;i++)w.effects.push({id:i,x:0,y:0,kind:'meteor',source:'meteor',radius:73,started:0,duration:2,expires:2,color:0});
  expect(p.views(w,1).length).toBeLessThanOrEqual(MAGE_VFX_LIMIT);expect(p.tracked).toBe(96);expect(p.views(w,0)).toEqual([]);
  w.status='over';expect(p.views(w,1)).toEqual([]);expect(p.tracked).toBe(0);
  expect(p.views(quiet(),1)).toEqual([]);
});
