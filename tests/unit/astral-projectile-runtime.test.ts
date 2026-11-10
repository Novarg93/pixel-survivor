import {it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {rgbaPng} from '../helpers/rgbaPng';
import {ASTRAL_PROJECTILE as P,ASTRAL_PROJECTILE_TEXTURE,astralAiFrame} from '../../src/game/art/astralProjectilePixellabPack';
import atlas from '../../public/assets/hd/astral-projectile-pixellab-v1/atlas.json';
import {World} from '../../src/game/systems/World';
import {astralRevenantViews} from '../../src/game/art/AstralRevenantArt';
import {runeWardenViews} from '../../src/game/art/RuneWardenArt';
import {fireBossVolley,updateMagicTeleport} from '../../src/game/systems/BossMagic';
import {ASSET_REGISTRY,selectAsset,visualDimensions} from '../../src/game/art/assetRegistry';
function setup(){const w=new World(42,{spawnRate:0});w.elapsed=630;w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;return w;}
it('packs all17 accepted native PixelLab frames exactly, including hidden RGB and padding',()=>{
 const png=rgbaPng('public/assets/hd/astral-projectile-pixellab-v1/atlas.png');expect(P.frameCount).toBe(17);expect(P.rgbaBytes).toBe(1393920);
 for(const c of Object.values(P.clips))for(const f of c.frames){const r=atlas.frames[f.name as keyof typeof atlas.frames].frame,p=Buffer.alloc(65536);for(let y=0;y<128;y++)png.pixels.copy(p,y*512,((r.y+y)*png.width+r.x)*4,((r.y+y)*png.width+r.x+128)*4);expect(p.equals(rgbaPng(f.source).pixels),f.source).toBe(true);expect(createHash('sha256').update(p).digest('hex')).toBe(f.pixelSHA256);for(let y=-2;y<130;y++)for(let x=-2;x<130;x++)if(x<0||y<0||x>=128||y>=128)expect(png.pixels[((r.y+y)*png.width+r.x+x)*4+3]).toBe(0);}
});
it('plays accepted flight and dissolve with stable56world frame and75,62pivot, retaining Guardian visuals',()=>{
 for(let i=0;i<8;i++)expect(astralAiFrame('flight',i*.08+.001)).toBe(`eclipse-ai-flight-${i}`);expect(astralAiFrame('flight',.64)).toBe('eclipse-ai-flight-0');
 for(let i=0;i<9;i++)expect(astralAiFrame('impact',i*.04+.001)).toBe(`eclipse-ai-impact-${i}`);expect(P.clips.impact.frames.at(-1)!.sourceIndex).toBe(8);
 expect(ASSET_REGISTRY.eclipseVolley.source.key).toBe(ASTRAL_PROJECTILE_TEXTURE);expect(visualDimensions(selectAsset('eclipseVolley')).width).toBe(56);expect(ASSET_REGISTRY.eclipseVolley.origin).toEqual({x:75/128,y:62/128});expect(ASSET_REGISTRY.astralVolley.source.key).toBe('astral-revenant-v1');expect(visualDimensions(selectAsset('astralVolley')).width).toBe(40);
});
it('keeps volley velocity, damage, count and lifetime while routing only Eclipse impacts to the new source',()=>{
 const w=setup(),e=w.spawn('eclipse',{x:100,y:0})!;e.boss!.magic=undefined;fireBossVolley(w,e);expect(w.projectiles).toHaveLength(3);for(const p of w.projectiles){expect(Math.hypot(p.vx,p.vy)).toBeCloseTo(190);expect(p.expires-w.elapsed).toBe(2.5);expect(p.damage).toBe(e.damage);}
 w.effect('astral-impact',e,16,0xffffff,.36,{x:1,y:0},undefined,undefined,e.id);const guardian=w.spawn('guardian',{x:200,y:0})!;w.effect('astral-impact',guardian,16,0xffffff,.36,{x:1,y:0},undefined,undefined,guardian.id);const before=JSON.stringify(w),v=astralRevenantViews(w,1);expect(v.map(x=>x.frame)).toEqual(['eclipse-ai-impact-0','volley-impact-5']);expect(v[0]!.texture).toBe(ASTRAL_PROJECTILE_TEXTURE);expect(v[0]!.originX).toBe(75/128);expect(v[1]!.size).toBe(40);expect(JSON.stringify(w)).toBe(before);
});
it('shares exact Rune Blink with Eclipse for the complete signal and fixed post-teleport endpoints',()=>{
 const w=setup(),e=w.spawn('eclipse',{x:100,y:-40})!;e.boss!.magic!.nextAt=w.elapsed;updateMagicTeleport(w,e);const m=e.boss!.magic!,from={...m.from!},to={...m.target!},start=w.elapsed;
 for(const age of [0,.2,.44]){w.elapsed=start+age;const v=runeWardenViews(w,1);expect(v.map(v=>[v.x,v.y])).toEqual([[from.x,from.y+23],[to.x,to.y+23]]);expect(v.every(v=>v.texture==='rune-warden-pixellab-v1'&&v.frame.startsWith('rune-ai-blink-idle-'))).toBe(true);}
 w.elapsed=e.boss!.until;updateMagicTeleport(w,e);expect({x:e.x,y:e.y}).toEqual(to);expect(runeWardenViews(w,1).filter(v=>v.frame==='rune-ai-blink-fade-0')).toHaveLength(2);w.pause();const views=runeWardenViews(w,1);w.step(1);expect(runeWardenViews(w,1)).toEqual(views);w.elapsed+=.36;expect(runeWardenViews(w,1)).toEqual([]);
});
