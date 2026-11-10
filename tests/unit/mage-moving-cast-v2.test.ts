import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {rgbaPng} from '../helpers/rgbaPng';
import {MAGE_MOVING_CAST_V2,mageMovingCastLayersV2} from '../../src/game/art/mageMovingCastV2';
import {MAGE_DIRECTIONS,MageHeroAnimation} from '../../src/game/art/MageHeroAnimation';
import {MAGE_CAST_V2} from '../../src/game/art/mageCastPackV2';
import {MageCastingController} from '../../src/game/art/MageCastingController';
import {World} from '../../src/game/systems/World';
import {MAGE_RUN_V2,mageRunBody} from '../../src/game/art/mageRunPackV2';

interface Frame{frame:{x:number;y:number;w:number;h:number};spriteSourceSize:{x:number;y:number;w:number;h:number}}
it('makes upper-body cutouts without repainting pixels, losing hands or retaining planted boots',()=>{
 const upper=rgbaPng('public/assets/hd/mage-moving-cast-v2/upper.png'),source=rgbaPng('public/assets/hd/mage-cast-v2/atlas.png');
 const frames=JSON.parse(readFileSync('public/assets/hd/mage-moving-cast-v2/upper.json','utf8')).frames as Record<string,Frame>,originals=JSON.parse(readFileSync('public/assets/hd/mage-cast-v2/atlas.json','utf8')).frames as Record<string,Frame>;
 expect(Object.keys(frames)).toHaveLength(91);expect(MAGE_MOVING_CAST_V2.rgbaBytes).toBeLessThan(2*1024*1024);expect(MAGE_MOVING_CAST_V2.handBottom).toBeLessThan(MAGE_MOVING_CAST_V2.seam);
 for(const [file,hash]of Object.entries(MAGE_MOVING_CAST_V2.sources))expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe(hash);
 for(const [name,f]of Object.entries(frames)){
  const rgba=Buffer.alloc(96*96*4),a=f.frame,c=f.spriteSourceSize,r=originals[name]!.frame;
  for(let y=0;y<a.h;y++)upper.pixels.copy(rgba,((c.y+y)*96+c.x)*4,((a.y+y)*upper.width+a.x)*4,((a.y+y)*upper.width+a.x+a.w)*4);
  let recoloured=0,missingUpper=0,boots=0;
  for(let y=0;y<96;y++)for(let x=0;x<96;x++){
   const k=(y*96+x)*4,p=((r.y+y)*source.width+r.x+x)*4;
   if(rgba[k+3]&&!rgba.subarray(k,k+4).equals(source.pixels.subarray(p,p+4)))recoloured++;
   if(y<=MAGE_MOVING_CAST_V2.seam&&!rgba.subarray(k,k+4).equals(source.pixels.subarray(p,p+4)))missingUpper++;
   if(y>=76&&rgba[k+3])boots++;
  }
  expect({recoloured,missingUpper,boots}).toEqual({recoloured:0,missingUpper:0,boots:0});
 }
});
it('keeps upper/lower cloth joints aligned for every cast, stride phase and mirror',()=>{
 for(const direction of MAGE_DIRECTIONS)for(const castVariant of [1,2] as const)for(let frame=0;frame<13;frame++)for(let step=0;step<MAGE_RUN_V2.clips[mageRunBody(direction)].run.frames.length;step++){
  const l=mageMovingCastLayersV2({motion:'fireball',direction,age:0,progress:(frame+.1)/13,casting:true,castVariant,walk:{direction:'north',age:step*.09}})!;
  expect(l.upper.texture).toBe('mage-moving-cast-v2');expect(l.lower.texture).toBe('mage-run-v2');expect(l.lower.index).toBe(step);
  expect(l.lower.body).toBe(mageRunBody(direction));expect(l.lower.flipX).toBe(['west','south-west','north-west'].includes(direction));
  expect(l.lowerWaist.x-l.lower.pivot.x).toBe(l.upperWaist.x-l.upper.pivot.x+l.offset.x);expect(l.lowerWaist.y-l.lower.pivot.y).toBe(l.upperWaist.y-l.upper.pivot.y+l.offset.y);
  expect(l.lowerCrop.y).toBe(MAGE_MOVING_CAST_V2.seam);expect(l.lowerCrop.y+l.lowerCrop.height).toBe(96);
 }
});
function rig(){const w=new World(27,{spawnRate:0}),a=new MageHeroAnimation(),c=new MageCastingController();for(const s of Object.values(w.abilities))s.level=0;a.view(w,c.view(0),false,0);c.request({ability:'meteor',rank:1,target:{x:0,y:-100},duration:10},0);return{w,a,c};}
it('changes the leg rate immediately with player speed while leaving cast time unchanged',()=>{
 const {w,a,c}=rig();let time=0,stride=0;
 for(const speed of [135,270,67.5,202.5]){
  w.player.speed=speed;for(let i=0;i<13;i++){w.step(.01,{x:1,y:0});a.view(w,c.view(w.elapsed),true,0);}
  const p=a.view(w,c.view(w.elapsed),true,0),l=mageMovingCastLayersV2(p)!;
  expect(p.age-time).toBeCloseTo(.13);expect(p.walk!.age-stride).toBeCloseTo(.13*speed/135);expect(l.gaitAge).toBe(p.walk!.age);time=p.age;stride=p.walk!.age;
 }
});
it('uses actual haste and analog movement, freezes both layers on pause and stops legs immediately',()=>{
 const {w,a,c}=rig();w.loot.grant(w,'haste');w.step(.05,{x:.4,y:0,analog:true});const p=a.view(w,c.view(w.elapsed),true,0);expect(p.walk!.age).toBeCloseTo(.05*1.5*.4);
 const first=mageMovingCastLayersV2(p);w.pause();w.step(.1,{x:0,y:1});expect(mageMovingCastLayersV2(a.view(w,c.view(w.elapsed),true,0))).toEqual(first);
 w.resume();w.step(.01);expect(mageMovingCastLayersV2(a.view(w,c.view(w.elapsed),false,0))).toBeUndefined();
});
it('keeps the cast frame independent while animated lower frames advance',()=>{
 const base={motion:'fireball' as const,direction:'west' as const,age:.1,progress:.4,casting:true,castVariant:2 as const};
 const first=mageMovingCastLayersV2({...base,walk:{direction:'east',age:0}})!,next=mageMovingCastLayersV2({...base,walk:{direction:'east',age:.26}})!;
 expect(first.upper).toEqual(next.upper);expect(first.lower.frame).not.toBe(next.lower.frame);expect(MAGE_CAST_V2.clips[first.upper.id]).toBeDefined();
});
