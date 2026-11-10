import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {rgbaPng} from '../helpers/rgbaPng';
import {World} from '../../src/game/systems/World';
import {arcaneShield} from '../../src/game/abilities/arcaneShield';
import {MageAbilityPresentation} from '../../src/game/art/MageAbilityArt';
import {MageShieldPresentation} from '../../src/game/art/MageShieldPresentation';
import {MAGE_SHIELD_NOVA as C,MAGE_SHIELD_NOVA_TEXTURE,mageShieldNovaDuration,mageShieldNovaFrame,mageNovaDisplaySize} from '../../src/game/art/mageShieldNovaPack';
import atlas from '../../public/assets/hd/mage-shield-nova-pixellab-v1/atlas.json';
import retained from '../../src/game/art/mageAbilityRuntimeManifest.json';
import ultimateAtlas from '../../public/assets/hd/mage-frost-ultimate-runtime-v1/atlas.json';
import oldAtlas from '../../public/assets/hd/mage-ability-vfx-v1/atlas.json';
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
function setup(){const w=new World(42,{spawnRate:0});w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.abilities.shield.level=3;return w;}
it('retains all48 Ultimate cels and frame metadata exactly while removing unused shared atlas memory',()=>{
 const original=rgbaPng(retained.source.image),packed=rgbaPng('public/assets/hd/mage-frost-ultimate-runtime-v1/atlas.png');
 expect(retained.frameCount).toBe(48);expect(Object.keys(ultimateAtlas.frames)).toHaveLength(48);expect(hash(readFileSync(retained.source.image))).toBe(retained.source.imageSHA256);expect(hash(readFileSync(retained.source.data))).toBe(retained.source.dataSHA256);
 for(const f of retained.frames){
  const key=f.name as keyof typeof ultimateAtlas.frames,oldKey=f.name as keyof typeof oldAtlas.frames,a=oldAtlas.frames[oldKey],b=ultimateAtlas.frames[key],source=Buffer.alloc(a.frame.w*a.frame.h*4),target=Buffer.alloc(a.frame.w*a.frame.h*4);
  expect({...b,frame:a.frame}).toEqual(a);
  for(let y=0;y<a.frame.h;y++){original.pixels.copy(source,y*a.frame.w*4,((a.frame.y+y)*original.width+a.frame.x)*4,((a.frame.y+y)*original.width+a.frame.x+a.frame.w)*4);packed.pixels.copy(target,y*b.frame.w*4,((b.frame.y+y)*packed.width+b.frame.x)*4,((b.frame.y+y)*packed.width+b.frame.x+b.frame.w)*4);}
  expect(target.equals(source),f.name).toBe(true);expect(hash(target)).toBe(f.pixelSHA256);
 }
 expect(retained.rgbaBytes+C.rgbaBytes).toBeLessThan(original.width*original.height*4);
});
it('packs all34 approved native cels losslessly, including transparent endpoints and padding',()=>{
 const sheet=rgbaPng('public/assets/hd/mage-shield-nova-pixellab-v1/atlas.png');expect(C.frameCount).toBe(34);expect(Object.keys(atlas.frames)).toHaveLength(34);expect(C.rgbaBytes).toBe(2509056);
 for(const c of Object.values(C.clips))for(const f of c.frames){
  const raw=rgbaPng(f.source),cell=atlas.frames[f.name as keyof typeof atlas.frames].frame,pixels=Buffer.alloc(128*128*4);
  expect(hash(readFileSync(f.source))).toBe(C.sources[f.source as keyof typeof C.sources]);
  for(let y=0;y<128;y++)sheet.pixels.copy(pixels,y*512,((cell.y+y)*sheet.width+cell.x)*4,((cell.y+y)*sheet.width+cell.x+128)*4);
  expect(pixels.equals(raw.pixels),f.source).toBe(true);expect(hash(pixels)).toBe(f.pixelSHA256);
  for(let y=-2;y<130;y++)for(let x=-2;x<130;x++)if(x<0||y<0||x>=128||y>=128)expect(sheet.pixels[((cell.y+y)*sheet.width+cell.x+x)*4+3]).toBe(0);
 }
});
it('uses the accepted8frame loop and two one-shot clips with exact native timing',()=>{
 expect(mageShieldNovaDuration('shield-loop')).toBe(.72);expect(mageShieldNovaDuration('shield-fade')).toBe(.54);expect(mageShieldNovaDuration('frost-nova')).toBe(1.2);
 expect(C.clips['shield-loop'].indices).toEqual([1,2,3,4,5,6,7,8]);
 expect(mageShieldNovaFrame('shield-loop',.72)).toBe('mage-shield-loop-0');
 expect(mageShieldNovaFrame('shield-fade',0,true)).toBe('mage-shield-fade-8');expect(mageShieldNovaFrame('shield-fade',.48,true)).toBe('mage-shield-fade-0');
 expect(mageShieldNovaFrame('frost-nova',100)).toBe('mage-frost-nova-16');
});
it('appears, sustains and follows the player without changing Absorb, RNG or simulation',()=>{
 const w=setup(),p=new MageShieldPresentation();expect(p.views(w,1)).toEqual([]);arcaneShield(w);
 expect(p.views(w,1)[0]!.frame).toBe('mage-shield-fade-8');w.elapsed=.5;expect(p.views(w,1)[0]!.frame).toBe('mage-shield-fade-0');
 w.elapsed=.54;w.player.x=83;w.player.y=-900;const before=JSON.stringify(w),v=p.views(w,.7)[0]!;
 expect(v).toMatchObject({texture:MAGE_SHIELD_NOVA_TEXTURE,frame:'mage-shield-loop-0',x:83,y:-900,size:64,originX:.5,originY:108/128,alpha:.7,depth:10.03});expect(JSON.stringify(w)).toBe(before);
 w.pause();for(let i=0;i<20;i++)w.step(.1);expect(p.views(w,.7)).toEqual([v]);expect(w.absorb).toBe(25);
});
it('refreshes without stacking or restarting a visible shell, then fades on actual depletion',()=>{
 const w=setup(),p=new MageShieldPresentation();arcaneShield(w);p.views(w,1);w.elapsed=1;p.views(w,1);arcaneShield(w);expect(p.views(w,1)[0]!.frame).toMatch(/^mage-shield-loop-/);
 w.damagePlayer(30);expect(w.player.hp).toBe(95);expect(w.absorb).toBe(0);expect(p.views(w,1)[0]!.frame).toBe('mage-shield-fade-0');
 w.elapsed=1.25;expect(p.views(w,1)[0]!.frame).toBe('mage-shield-fade-4');w.elapsed=1.54;expect(p.views(w,1)).toEqual([]);
});
it('expires by simulation deadline and clears on death, menu and new run',()=>{
 const w=setup(),p=new MageShieldPresentation();arcaneShield(w);p.views(w,1);w.elapsed=8.2;expect(p.views(w,1)[0]!.frame).toBe('mage-shield-fade-3');w.elapsed=8.54;expect(p.views(w,1)).toEqual([]);
 arcaneShield(w);p.views(w,1);w.status='over';expect(p.views(w,1)).toEqual([]);w.status='menu';expect(p.views(w,1)).toEqual([]);
 expect(p.views(setup(),1)).toEqual([]);p.clear();expect(p.views(setup(),1)).toEqual([]);
});
it('keeps both Absorb sources working while Fire owns the silhouette; reduced flash and zero intensity stay cosmetic',()=>{
 const w=setup(),p=new MageShieldPresentation();arcaneShield(w);w.mobility.refreshAbsorb(20,30);p.views(w,1);w.elapsed=1;
 expect(p.views(w,1,true)[0]!.alpha).toBe(.65);expect(p.views(w,0)).toEqual([]);
 w.elapsed=601;arcaneShield(w);w.experience.level=40;w.ultimate.choose(w,'fire');w.ultimate.activate(w);const before=w.absorb;
 expect(p.views(w,1)).toEqual([]);expect(w.absorb).toBe(before);w.shield.refreshAbsorb(25,650);w.elapsed=w.ultimate.activeUntil+.4;
 expect(p.views(w,1)[0]!.frame).toMatch(/^mage-shield-loop-/);
 const warrior=new World(43,{character:'warrior',spawnRate:0});warrior.shield.refreshAbsorb(30,10);expect(p.views(warrior,1)).toEqual([]);
});
it('plays ordinary Nova once at the target, scales with true AoE and preserves extended root',()=>{
 const w=setup(),p=new MageAbilityPresentation();w.effect('frost',{x:50,y:-100},73,0xd9f3f7,2);
 for(let i=0;i<17;i++){w.elapsed=i*.07+.001;const before=JSON.stringify(w),v=p.views(w,1)[0]!;expect(v).toMatchObject({texture:MAGE_SHIELD_NOVA_TEXTURE,frame:`mage-frost-nova-${i}`,x:50,y:-100,size:mageNovaDisplaySize(73),alpha:1});expect(v.depth).toBeLessThan(0);expect(JSON.stringify(w)).toBe(before);}
 expect(mageNovaDisplaySize(146)).toBe(mageNovaDisplaySize(73)*2);w.elapsed=1.2;expect(p.views(w,1)).toEqual([]);expect(w.effects[0]!.expires).toBe(2);
});
it('keeps the actor shell within the shared144image budget even with saturated effects',()=>{
 const w=setup(),p=new MageAbilityPresentation();arcaneShield(w);w.elapsed=.6;
 for(let i=0;i<200;i++)w.effects.push({id:1000+i,kind:'frost',started:0,expires:2,duration:2,x:i,y:0,radius:73,color:0});
 const views=p.views(w,1);expect(views).toHaveLength(144);expect(views[0]!.frame).toMatch(/^mage-shield-loop-/);w.status='over';expect(p.views(w,1)).toEqual([]);p.clear();
});
