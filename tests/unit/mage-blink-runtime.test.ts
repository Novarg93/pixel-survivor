import {expect,it,vi} from 'vitest';
import type Phaser from 'phaser';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {rgbaPng} from '../helpers/rgbaPng';
import {World} from '../../src/game/systems/World';
import {MageBlinkArt,mageBlinkViews} from '../../src/game/art/MageBlinkArt';
import {MAGE_BLINK,mageBlinkFrame} from '../../src/game/art/mageBlinkPack';
import {MageCastingController,isMageSpell} from '../../src/game/art/MageCastingController';
import {MageHeroAnimation,MAGE_DIRECTIONS} from '../../src/game/art/MageHeroAnimation';
import {mageCastSelectionV2} from '../../src/game/art/mageCastPackV2';
import {MAGE_IDLE} from '../../src/game/art/mageIdlePack';

const root='public/assets/hd/mage-blink-v1',hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
function quiet(){const w=new World(712,{spawnRate:0});for(const a of Object.values(w.abilities))a.level=0;return w;}
function pixels(sheet:ReturnType<typeof rgbaPng>,r:{x:number;y:number;w:number;h:number}){return Buffer.concat(Array.from({length:r.h},(_,y)=>sheet.pixels.subarray(((r.y+y)*sheet.width+r.x)*4,((r.y+y)*sheet.width+r.x+r.w)*4)));}
it('packs all 32 depth frames with exact source pixels, fixed pivots and a 2 MiB atlas',()=>{
 const sheet=rgbaPng(root+'/atlas.png'),atlas=JSON.parse(readFileSync(root+'/atlas.json','utf8')) as {frames:Record<string,{frame:{x:number;y:number;w:number;h:number};trimmed:boolean;pivot:{x:number;y:number}}>};
 expect([sheet.width,sheet.height]).toEqual([1024,512]);expect(Object.keys(atlas.frames)).toHaveLength(32);expect(MAGE_BLINK.rgbaBytes).toBe(2*1024*1024);expect(MAGE_BLINK.displaySize).toBe(MAGE_IDLE.displaySize/96*128);
 for(const [file,sha]of Object.entries(MAGE_BLINK.sources))expect(hash(readFileSync(file))).toBe(sha);
 for(const [id,clip]of Object.entries(MAGE_BLINK.clips))for(const [layer,frames]of Object.entries(clip)){
  const source=rgbaPng(`art/generated/mage-blink-v1/prepared/${id}-${layer}.png`);
   for(const f of frames){const r=atlas.frames[f.frame]!;expect(r.trimmed).toBe(false);expect(r.pivot).toEqual({x:.5,y:104/128});const p=pixels(sheet,r.frame);expect(hash(p)).toBe(f.pixelSha256);expect(p.equals(pixels(source,{x:f.index%4*128,y:Math.floor(f.index/4)*128,w:128,h:128})),f.frame).toBe(true);}
 }
 expect([-1,Number.NaN,Infinity,.32,.33].map(mageBlinkFrame)).toEqual([undefined,undefined,undefined,undefined,undefined]);expect([0,.04,.12,.28,.3199].map(mageBlinkFrame)).toEqual([0,1,3,7,7]);
});
it('keeps two endpoint pairs stationary, below hostile tells, and follows only the simulation clock',()=>{
 const w=quiet();expect(mageBlinkViews(w,1)).toEqual([]);w.mobility.activate(w,{x:1,y:-1});const initial=mageBlinkViews(w,.7);expect(initial).toHaveLength(4);
 expect(initial.filter(v=>v.endpoint==='departure').every(v=>v.x===w.mobility.from.x&&v.y===w.mobility.from.y)).toBe(true);expect(initial.filter(v=>v.endpoint==='arrival').every(v=>v.x===w.mobility.to.x&&v.y===w.mobility.to.y)).toBe(true);
 expect(initial.map(v=>v.depth)).toEqual([9.99,10.02,9.99,10.02]);expect(initial.every(v=>v.depth<20)).toBe(true);
 w.player.x+=40;w.player.y+=20;expect(mageBlinkViews(w,.7)).toEqual(initial);w.pause();w.step(.05,{x:1,y:0});expect(mageBlinkViews(w,.7)).toEqual(initial);
 w.resume();w.elapsed=w.mobility.started+.12;const before=JSON.stringify(w);expect(mageBlinkViews(w,1).every(v=>v.index===3)).toBe(true);expect(JSON.stringify(w)).toBe(before);
 w.elapsed=w.mobility.started+.28;expect(mageBlinkViews(w,1)).toEqual([]);w.status='over';w.elapsed=0;expect(mageBlinkViews(w,1)).toEqual([]);
});
it('honors zero intensity and reduced flash, and never renders Mage effects for Warrior',()=>{
 const w=quiet();w.mobility.activate(w,{x:0,y:1});expect(mageBlinkViews(w,0)).toEqual([]);expect(mageBlinkViews(w,Number.NaN)).toEqual([]);
 expect(mageBlinkViews(w,1,true).every(v=>v.alpha===.65&&v.tint===0xc3b3e5)).toBe(true);expect(mageBlinkViews(w,1).every(v=>v.alpha===1&&v.tint===0xffffff)).toBe(true);
 const warrior=new World(7,{character:'warrior'});warrior.mobility.activate(warrior,{x:1,y:0});expect(mageBlinkViews(warrior,1)).toEqual([]);w.status='menu';expect(mageBlinkViews(w,1)).toEqual([]);
});
it('reuses at most four Phaser images through repeated Blinks and destroys every image',()=>{
 const created:{visible:boolean;active:boolean;destroyed:boolean}[]=[],image=vi.fn(()=>{const s={visible:true,active:true,destroyed:false};created.push(s);const proxy:object=new Proxy({}, {get:(_,key)=>{if(key==='setVisible')return(value:boolean)=>{s.visible=value;return proxy;};if(key==='setActive')return(value:boolean)=>{s.active=value;return proxy;};if(key==='destroy')return()=>{s.destroyed=true;};return()=>proxy;}});return proxy;});
 const scene={add:{image}} as unknown as Phaser.Scene,art=new MageBlinkArt(scene),w=quiet();
 for(let i=0;i<20;i++){w.mobility.readyAt=0;w.mobility.activate(w,{x:1,y:0});art.render(w,1);w.elapsed+=.33;art.render(w,1);expect(created.every(s=>!s.visible&&!s.active)).toBe(true);}
 expect(image).toHaveBeenCalledTimes(4);expect(art.diagnostics().allocated).toBe(4);art.destroy();expect(created.every(s=>s.destroyed)).toBe(true);expect(art.diagnostics().allocated).toBe(0);
});
const vectors=[[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];
it.each(MAGE_DIRECTIONS)('plays all 13 authored Blink casting frames toward %s without moving or re-aiming the teleport',direction=>{
 const w=quiet(),c=new MageCastingController(),a=new MageHeroAnimation();c.observe(w);a.view(w,c.view(0),false,0);const [x,y]=vectors[MAGE_DIRECTIONS.indexOf(direction)]!;w.mobility.activate(w,{x:x!,y:y!});const before=JSON.stringify(w);c.observe(w);expect(JSON.stringify(w)).toBe(before);expect(c.view(0).active?.ability).toBe('blink');expect(c.view(0).directional).toBeUndefined();
 const seen=new Set<number>();for(let index=0;index<13;index++){w.elapsed=(index+.1)*.32/13;c.observe(w);const pose=a.view(w,c.view(w.elapsed),false,0);expect(pose).toMatchObject({casting:true,castAbility:'blink',direction});seen.add(mageCastSelectionV2(pose).index);}
 expect([...seen]).toEqual(Array.from({length:13},(_,i)=>i));expect(c.view(w.elapsed).requested.blink).toBe(1);
 w.facing={x:-x!,y:-y!};const pose=a.view(w,c.view(w.elapsed),true,0);expect(pose.direction).toBe(direction);expect(w.mobility.activate(w)).toBe(false);c.observe(w);expect(c.view(w.elapsed).requested.blink).toBe(1);
 w.elapsed=.32;c.observe(w);expect(a.view(w,c.view(w.elapsed),false,0).casting).toBe(false);expect(isMageSpell('blink')).toBe(false);
});
it('preempts ordinary casts and their directional projections, but respects hurt/death/ultimate priority',()=>{
 const w=quiet(),c=new MageCastingController();c.observe(w);c.request({ability:'fireball',rank:1,target:{x:80,y:0}},0);expect(c.view(0).directional).toBeDefined();w.mobility.activate(w,{x:0,y:-1});c.observe(w);expect(c.view(0).active?.ability).toBe('blink');expect(c.view(0).directional).toBeUndefined();c.request({ability:'lightning',rank:1,target:{x:-80,y:0}},.05);expect(c.view(.05).directional).toBeUndefined();expect(c.view(.05).active?.ability).toBe('blink');
 c.request({ability:'ultimate-fire',rank:5,target:{x:80,y:0}},.1);expect(c.view(.1).active?.ability).toBe('ultimate-fire');c.interrupt('hurt',.12);expect(c.view(.12).mode).toBe('hurt');c.interrupt('death',.13);expect(c.view(.13).mode).toBe('death');
 const fresh=quiet();c.observe(fresh);expect(c.view(0).mode).toBe('idle');expect(c.view(0).directional).toBeUndefined();
});
it('observes Blink even when activation precedes the first presentation frame',()=>{
 const w=quiet(),c=new MageCastingController(),a=new MageHeroAnimation();w.mobility.activate(w,{x:-1,y:-1});c.observe(w);expect(c.view(0).active?.ability).toBe('blink');expect(a.view(w,c.view(0),false,0).direction).toBe('north-west');
});
