import {wardenApprovedHash} from '../helpers/approvedWardenIntegration';
import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {rgbaPng} from '../helpers/rgbaPng';
import atlas from '../../public/assets/hd/mage-meteor-pixellab-v1/atlas.json';
import {MAGE_METEOR as C,MAGE_METEOR_OFFSET as offset,MAGE_METEOR_TEXTURE,mageMeteorDuration,mageMeteorFrame,meteorLightSize} from '../../src/game/art/mageMeteorPack';
import {MageAbilityPresentation} from '../../src/game/art/MageAbilityArt';
import {World} from '../../src/game/systems/World';
import {meteor} from '../../src/game/abilities/meteor';
import {ARMAGEDDON} from '../../src/game/config/mageAbilities';
import tuning from '../../src/game/config/mageAbilityTuning.json';
function quiet(){const w=new World(42,{spawnRate:0});w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;return w;}
const hash=(p:Uint8Array)=>createHash('sha256').update(p).digest('hex');

it('audits approved PixelLab pixels, unchanged boss/archive art, padding and black light compositing',()=>{
 const protectedFiles=JSON.parse(readFileSync('art/generated/mage-meteor-v3/source/protected.json','utf8')) as Record<string,string>;
 for(const [file,digest]of Object.entries(protectedFiles))expect(hash(readFileSync(file)),file).toBe(wardenApprovedHash(file,digest));
 for(const [file,digest]of Object.entries(C.sources))expect(hash(readFileSync(file)),file).toBe(digest);
 expect(Object.keys(atlas.frames)).toHaveLength(27);expect(C.rgbaBytes).toBeLessThan(3*1024*1024);
 const {width,height,pixels}=rgbaPng('public/assets/hd/mage-meteor-pixellab-v1/atlas.png');expect([width,height]).toEqual([C.width,C.height]);
 const frames=atlas.frames as Record<string,{frame:{x:number;y:number;w:number;h:number}}>;
 for(const clip of Object.values(C.clips))for(const audit of clip.frames){
  const f=frames[audit.name]!.frame,out=Buffer.alloc(128*128*4);expect([f.w,f.h]).toEqual([128,128]);
  for(let y=0;y<128;y++)pixels.copy(out,y*512,((f.y+y)*width+f.x)*4,((f.y+y)*width+f.x+128)*4);
  expect(hash(out),audit.name).toBe(audit.pixelSHA256);expect(out.equals(rgbaPng(audit.source).pixels)).toBe(true);
  for(let y=f.y-2;y<f.y+130;y++)for(let x=f.x-2;x<f.x+130;x++)if(x<f.x||x>=f.x+128||y<f.y||y>=f.y+128)if(pixels[(y*width+x)*4+3])throw Error('Padding bleed');
 }
 expect(C.lightBlend).toBe('SCREEN');expect(C.lightOpacity).toBe(.4);expect(C.clips.impact.frames[8]!.visible).toBe(0);
 expect(C.clips.illumination.frames[8]!.visible).toBe(128*128);
});
it('plays every native AI frame once or as the approved eight-frame flight loop',()=>{
 for(const id of ['flight','illumination','impact','ground'] as const){let age=0;for(const [i,ms]of C.clips[id].durationsMs.entries()){expect(mageMeteorFrame(id,age+.001)).toBe(`mage-meteor-${id}-${i}`);age+=ms/1000;}expect(mageMeteorFrame(id,10)).toBe(`mage-meteor-${id}-${C.clips[id].frameCount-1}`);}
 expect(mageMeteorDuration('impact')).toBeCloseTo(.63);expect(mageMeteorFrame('flight',.64,true)).toBe('mage-meteor-flight-0');
 expect(new Set(C.clips.flight.frames.map(f=>f.pixelSHA256)).size).toBeGreaterThan(3);expect(C.clips.flight.pivot).toEqual({x:47,y:68});
});
it('aligns the model tail, fixed contact pivot and flight to its measured model angle without delaying damage',()=>{
 const w=quiet(),p=new MageAbilityPresentation(),e=w.spawn('tank',{x:120,y:40})!;e.speed=0;e.hp=e.maxHp=1000;w.abilities.meteor.level=1;meteor(w);w.abilities.meteor.readyAt=Infinity;
 const hit=w.impacts[0]!,find=()=>p.views(w,1).find(v=>v.frame.startsWith('mage-meteor-flight-'))!;
 expect(C.angleDegrees).toBe(tuning.meteorFallAngleDegrees);expect(Math.atan2(offset.x,-offset.y)*180/Math.PI).toBeCloseTo(C.angleDegrees);expect(Math.hypot(offset.x,offset.y)).toBeCloseTo(192.4);
 expect(hit.landAt-hit.launchAt!).toBeCloseTo(.85/(1.5*1.3*2));const a=find();w.elapsed=hit.landAt*.75;const b=find();expect(Math.atan2(a.x-b.x,b.y-a.y)*180/Math.PI).toBeCloseTo(C.angleDegrees);
 expect(b.originY).toBe(68/128);expect(b.depth).toBe(14.2);expect(b.texture).toBe(MAGE_METEOR_TEXTURE);expect(b.size).toBe(C.flightSize);
 w.elapsed=hit.landAt-.001;expect(e.hp).toBe(1000);w.step(.001);expect(e.hp).toBe(920);const views=p.views(w,1);expect(views.some(v=>v.frame==='mage-meteor-impact-0')).toBe(true);expect(views.some(v=>v.frame.startsWith('mage-meteor-flight-'))).toBe(false);
 expect(w.effects.find(e=>e.source==='meteor')!.expires-w.elapsed).toBeCloseTo(.5);expect(ARMAGEDDON.delay).toBeCloseTo(.85/(1.5*1.3*2));
});
it('locks light to the target and real AoE while the body/impact size stays fixed across rank and Area',()=>{
 for(const [rank,area]of [[1,1],[5,1],[5,2]] as const){const w=quiet(),p=new MageAbilityPresentation(),e=w.spawn('tank',{x:120,y:0})!;e.speed=0;e.hp=e.maxHp=1e5;w.abilities.meteor.level=rank;w.stats.area=area;meteor(w);w.abilities.meteor.readyAt=Infinity;w.impacts=w.impacts.slice(0,1);const hit=w.impacts[0]!;
  w.elapsed=hit.landAt/2;w.player.x=35;const before=JSON.stringify(w),views=p.views(w,.7),glow=views.find(v=>v.frame.startsWith('mage-meteor-illumination-'))!;
  expect(JSON.stringify(w)).toBe(before);expect([glow.x,glow.y]).toEqual([hit.x,hit.y]);expect(glow.size).toBe(meteorLightSize((48+rank*7)*area));expect(views[0]!.size).toBe(128);expect(p.views(w,.7,true).find(v=>v.frame===glow.frame)!.alpha).toBeCloseTo(glow.alpha*.6);
  w.elapsed=hit.landAt-.001;w.step(.001);const landed=p.views(w,1);expect(landed.find(v=>v.frame==='mage-meteor-impact-0')!.size).toBe(128);
 }
});
it('owns the copied landing, fades its light once, survives pause and pool reuse, and keeps zone residue',()=>{
 const w=quiet(),p=new MageAbilityPresentation();w.effect('meteor',{x:120,y:40},55,0xffae65,.5,undefined,undefined,'meteor');const e=w.effects[0]!;
 const first=p.views(w,1);expect(first).toHaveLength(3);w.status='paused';w.step(.05);expect(p.views(w,1)).toEqual(first);
 w.effects=[];e.x=e.y=999;e.radius=1;e.source='fireball';w.elapsed=.12;const glow=p.views(w,1).find(v=>v.frame.startsWith('mage-meteor-illumination-'))!;expect([glow.x,glow.y,glow.size]).toEqual([120,40,meteorLightSize(55)]);
 w.elapsed=.72;expect(p.views(w,1).some(v=>v.frame.startsWith('mage-meteor-illumination-'))).toBe(false);
 w.elapsed=.63;expect(p.views(w,1).some(v=>v.frame.startsWith('mage-meteor-impact-'))).toBe(false);
 w.elapsed=.8;expect(p.views(w,1)).toEqual([]);expect(p.tracked).toBe(0);
 w.zones.push({id:w.id(),x:120,y:40,radius:44,damage:12,expires:3,nextTick:.5,source:'meteor'});expect(p.views(w,1)[0]).toMatchObject({frame:'mage-meteor-ground-0',size:128,alpha:.25});w.elapsed=3;expect(p.views(w,1)).toEqual([]);
});
it.each([-6000,0,6000])('keeps illumination and landing below actors at Y%s and cleans death/run state',y=>{
 const w=quiet(),p=new MageAbilityPresentation();w.player.y=y;const e=w.spawn('tank',{x:90,y:y-35})!;w.effect('meteor',{x:90,y},55,0xffae65,.5,undefined,undefined,'meteor');
 for(const age of [0,.1,.3,.55]){w.elapsed=age;const before=JSON.stringify(w),views=p.views(w,.7);expect(views.length).toBeGreaterThan(0);expect(views.every(v=>v.depth<e.y/10000-.02)).toBe(true);expect(JSON.stringify(w)).toBe(before);}
 w.impacts.push({id:w.id(),x:0,y,radius:55,damage:0,source:'meteor',hostile:false,launchAt:1,landAt:2});w.elapsed=.9;expect(p.views(w,1)).toEqual([]);w.elapsed=1;expect(p.views(w,0)).toEqual([]);expect(p.views(w,1)[0]!.depth).toBe(14.2);w.status='over';expect(p.views(w,1)).toEqual([]);expect(p.tracked).toBe(0);expect(p.views(quiet(),1)).toEqual([]);
});
