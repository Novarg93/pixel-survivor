import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {World} from '../../src/game/systems/World';
import {MageAbilityPresentation} from '../../src/game/art/MageAbilityArt';
import {drawMageMagic} from '../../src/game/art/MageMagic';
import {mageAbilityFrame,MAGE_ABILITY_MANIFEST as pack,MAGE_VFX_LIMIT} from '../../src/game/art/mageAbilityPack';
import {MAGE_SHIELD_NOVA_TEXTURE,mageNovaDisplaySize} from '../../src/game/art/mageShieldNovaPack';
import atlas from '../../public/assets/hd/mage-ability-vfx-v1/atlas.json';
import type Phaser from 'phaser';

function quiet(){const w=new World(42,{character:'mage',spawnRate:0});w.encounterDirector.nextAt=1e6;for(const a of Object.values(w.abilities))a.level=0;return w;}

it('loads Meteor and both native Frost clips into one bounded atlas without bleed',()=>{
  expect(Object.keys(atlas.frames)).toHaveLength(96);expect(pack.rgbaBytes).toBeLessThan(24*1024*1024);
  expect(pack.clips['meteor-ground-impact'].input).toContain('meteor-v2/make_animation_of_im...-599290415');expect(pack.clips['meteor-ground-impact'].sourceEdgePixels).toBe(16);
  expect(pack.clips['meteor-explosion-impact'].input).toContain('meteor-v2/make_animation_of_im...-686437158');expect(pack.clips['meteor-explosion-impact'].sourceEdgePixels).toBe(360);
  expect(Object.keys(atlas.frames).some(f=>f.startsWith('meteor-impact-')||f.startsWith('meteor-collision-'))).toBe(false);
  const b=readFileSync('public/assets/hd/mage-ability-vfx-v1/atlas.png'),chunks:Buffer[]=[];
  for(let p=8;p<b.length;){const n=b.readUInt32BE(p);if(b.toString('ascii',p+4,p+8)==='IDAT')chunks.push(b.subarray(p+8,p+8+n));p+=n+12;}
  // Project PNG encoder emits unfiltered RGBA rows.
  const raw=inflateSync(Buffer.concat(chunks)),width=pack.width,stride=width*4+1;
  for(const [name,{frame:f}] of Object.entries(atlas.frames)){
    expect(f.x+f.w).toBeLessThanOrEqual(width);expect(f.y+f.h).toBeLessThanOrEqual(pack.height);
    let visible=0,empty=0;
    for(let y=0;y<f.h;y++){expect(raw[(f.y+y)*stride]).toBe(0);for(let x=0;x<f.w;x++){
      const alpha=raw[(f.y+y)*stride+1+(f.x+x)*4+3];if(alpha)visible++;else empty++;
      if(x===0||y===0||x===f.w-1||y===f.h-1)expect(alpha).toBe(0);
    }}
    if(name==='frost-nova-23'||name==='frost-nova-ultimate-47')expect(visible).toBe(0);else expect(visible).toBeGreaterThan(0);expect(empty).toBeGreaterThan(0);
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
it('plays the stationary authored Nova once at native timing without changing its root',()=>{
  const w=quiet(),p=new MageAbilityPresentation();w.effect('frost',{x:90,y:30},73,0xd9f3f7,1.2);
  expect(p.views(w,1)[0]!.frame).toBe('mage-frost-nova-0');w.elapsed=.03;expect(p.views(w,1)[0]!.frame).toBe('mage-frost-nova-0');
  w.elapsed=.25;const before=JSON.stringify(w),view=p.views(w,1)[0]!;
  expect(view.texture).toBe(MAGE_SHIELD_NOVA_TEXTURE);expect(view.frame).toBe('mage-frost-nova-3');expect(view.size).toBe(mageNovaDisplaySize(73));expect(view.alpha).toBe(1);expect([view.x,view.y]).toEqual([90,30]);expect(JSON.stringify(w)).toBe(before);
  w.status='paused';expect(p.views(w,1)).toEqual([view]);
  for(let i=0;i<17;i++){w.elapsed=i*.07+.001;expect(p.views(w,.6)[0]).toMatchObject({frame:`mage-frost-nova-${i}`,alpha:.6,x:90,y:30,size:mageNovaDisplaySize(73)});}
  w.elapsed=1.2;expect(p.views(w,1)).toEqual([]);expect(p.tracked).toBe(0);expect(w.effects[0]!.expires).toBe(1.2);
});
it('finishes the Nova animation before extended root expires, and uses true AoE for size',()=>{
  const w=quiet(),p=new MageAbilityPresentation();w.effect('frost',w.player,100,0xd9f3f7,2);
  w.elapsed=.75;expect(p.views(w,1)[0]!.frame).toBe('mage-frost-nova-10');expect(p.views(w,1)[0]!.size).toBe(mageNovaDisplaySize(100));
  expect(p.views(w,0)).toEqual([]);w.elapsed=1.2;expect(p.views(w,1)).toEqual([]);expect(w.effects[0]!.expires).toBe(2);
});
// Meteor V3 motion, light, contact and lifecycle are covered in mage-meteor-v3.test.ts.
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
