import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {MAGE_CAST_V2,mageCastSelectionV2} from '../../src/game/art/mageCastPackV2';
import {MAGE_IDLE} from '../../src/game/art/mageIdlePack';
import {MageHeroAnimation,MAGE_DIRECTIONS} from '../../src/game/art/MageHeroAnimation';
import {MageCastingController} from '../../src/game/art/MageCastingController';
import {World} from '../../src/game/systems/World';
import {ULTIMATE} from '../../src/game/config/ultimates';
import {rgbaPng} from '../helpers/rgbaPng';

it('packs all 91 user frames and 14 source files losslessly with the unchanged Idle size/pivots',()=>{
 const atlas=rgbaPng('public/assets/hd/mage-cast-v2/atlas.png'),data=JSON.parse(readFileSync('public/assets/hd/mage-cast-v2/atlas.json','utf8')) as {frames:Record<string,{frame:{x:number;y:number;w:number;h:number}}>};
 expect(Object.keys(data.frames)).toHaveLength(91);expect(Object.keys(MAGE_CAST_V2.sources)).toHaveLength(14);expect(MAGE_CAST_V2.rgbaBytes).toBeLessThan(4*1024*1024);expect(Math.max(atlas.width,atlas.height)).toBeLessThanOrEqual(2048);expect(MAGE_CAST_V2.displaySize).toBe(MAGE_IDLE.displaySize);
 for(const [file,sha]of Object.entries(MAGE_CAST_V2.sources))expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe(sha);
 for(const [id,clip]of Object.entries(MAGE_CAST_V2.clips)){
  const source=rgbaPng(clip.sourcePng);expect(clip.frames).toHaveLength(13);expect(clip.periodMs).toBe(1690);expect(clip.firstPoseMatchesIdle).toBe(true);expect(clip.pivot).toEqual(MAGE_IDLE.clips[id.startsWith('north')?'north':'front'].pivot);
  for(const [i,f]of clip.frames.entries()){
   const rect=data.frames[f.frame]!.frame,packed:Buffer[]=[];expect([rect.w,rect.h]).toEqual([96,96]);expect(f.durationMs).toBe(130);expect(f.bounds.partial).toBe(0);
   for(let y=0;y<96;y++){const k=((Math.floor(i/4)*96+y)*source.width+i%4*96)*4,a=((rect.y+y)*atlas.width+rect.x)*4,row=atlas.pixels.subarray(a,a+384);expect(row.equals(source.pixels.subarray(k,k+384))).toBe(true);packed.push(row);}
   const rgba=Buffer.concat(packed);expect(createHash('sha256').update(rgba).digest('hex')).toBe(f.pixelSha256);
   // The computed muzzle must be on the visible hand, including the NW sweep.
   let nearSkin=false;for(let y=Math.floor(f.hand.y)-2;y<=Math.floor(f.hand.y)+2;y++)for(let x=Math.floor(f.hand.x)-2;x<=Math.floor(f.hand.x)+2;x++){const k=(y*96+x)*4,[r,g,b,a]=rgba.subarray(k,k+4);if(a&&r!>150&&r!>g!+25&&g!>b!+12)nearSkin=true;}expect(nearSkin).toBe(true);
  }
 }
 expect(MAGE_CAST_V2.clips['north-west'].frames[5]!.hand.x).toBeLessThan(40);expect(MAGE_CAST_V2.clips['north-west'].frames[5]!.hand.y).toBeLessThan(25);
});
it('maps each north direction to its own supplied clip and mirrors only west and southwest',()=>{
 for(const [direction,family,flipX]of [['north','north',false],['north-east','north-east',false],['north-west','north-west',false],['south','south',false],['south-east','south',false],['south-west','south',true],['east','east',false],['west','east',true]] as const)for(const variant of [1,2] as const)for(let i=0;i<13;i++){
  const v=mageCastSelectionV2({direction,age:0,progress:(i+.1)/13,castVariant:variant}),id=family.startsWith('north')?family:`${family}-v${variant}`;
  expect(v.id).toBe(id);expect(v.index).toBe(i);expect(v.flipX).toBe(flipX);const clip=MAGE_CAST_V2.clips[v.id];expect(v.hand.x).toBe(flipX?96-clip.frames[i]!.hand.x:clip.frames[i]!.hand.x);expect(v.origin.x*96).toBe(flipX?96-clip.pivot.x:clip.pivot.x);
 }
});
it('alternates variants per southern/eastern family, freezes a gesture and resets on a new run',()=>{
 const w=new World(11,{spawnRate:0}),a=new MageHeroAnimation(),c=new MageCastingController();a.view(w,c.view(0),false,0);
 const cast=(x:number,y:number)=>{w.elapsed+=2;c.request({ability:'fireball',rank:1,origin:{...w.player},target:{x,y}},w.elapsed);return a.view(w,c.view(w.elapsed),false,0);};
 expect(cast(0,100).castVariant).toBe(1);expect(cast(0,-100).castVariant).toBe(1);expect(cast(0,100).castVariant).toBe(2);expect(cast(100,0).castVariant).toBe(1);const second=cast(-100,0);expect(second.castVariant).toBe(2);
 const view=c.view(w.elapsed);view.directional!.target={x:0,y:-100};expect(a.view(w,view,false,0)).toMatchObject({direction:'west',castVariant:2});
 const fresh=new World(12);c.clear();a.view(fresh,c.view(0),false,0);c.request({ability:'fireball',rank:1,target:{x:100,y:0}},0);expect(a.view(fresh,c.view(0),false,0).castVariant).toBe(1);
});
it('keeps the lightning ultimate arm extended throughout its actual beam interval',()=>{
 const c=ULTIMATE.lightning,end=c.preparation+c.reveal+c.hold+c.fade;
 for(const direction of MAGE_DIRECTIONS)for(const variant of [1,2] as const)for(const age of [c.preparation+.001,(c.preparation+end)/2,end-.001]){
  const v=mageCastSelectionV2({direction,age,castAbility:'ultimate-lightning',castVariant:variant,castDuration:.975}),clip=MAGE_CAST_V2.clips[v.id];expect(v.index).toBeGreaterThanOrEqual(clip.releaseFrame);expect(v.index).toBeLessThanOrEqual(clip.holdEndFrame);
 }
 for(const direction of MAGE_DIRECTIONS)expect(mageCastSelectionV2({direction,age:.974,castAbility:'ultimate-lightning',castVariant:2,castDuration:.975}).index).toBe(12);
});
it('keeps the same variant when a long AOE resumes after the immediate shot channel',()=>{
 const w=new World(7),a=new MageHeroAnimation(),c=new MageCastingController();c.request({ability:'meteor',rank:1,target:{x:100,y:0}},0);const first=a.view(w,c.view(0),false,0);c.request({ability:'fireball',rank:1,target:{x:100,y:0}},.1);w.elapsed=.1;a.view(w,c.view(.1),false,0);c.advance(.45);w.elapsed=.45;expect(a.view(w,c.view(.45),false,0)).toMatchObject({castAbility:'meteor',castVariant:first.castVariant});
});
