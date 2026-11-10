import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {rgbaPng} from '../helpers/rgbaPng';
import {World} from '../../src/game/systems/World';
import {fireBossVolley,updateMagicTeleport} from '../../src/game/systems/BossMagic';
import {updateBoss} from '../../src/game/systems/BossSystem';
import {runeWardenViews} from '../../src/game/art/RuneWardenArt';
import {RUNE_VFX as C,RUNE_VFX_TEXTURE,runeVfxFrame,runeVfxDuration,runeBlinkSignalFrame} from '../../src/game/art/runeWardenVfxPack';
import {ARCANE_VOLLEY} from '../../src/game/config/runeWarden';
import {MAGIC_ATTACKS,BOSS_MAGIC} from '../../src/game/config/bossEnrage';
import {ASTRAL_VOLLEY} from '../../src/game/config/astralRevenant';
import atlas from '../../public/assets/hd/rune-warden-pixellab-v1/atlas.json';
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
function setup(time=20){const w=new World(42,{spawnRate:0});w.elapsed=time;w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;return w;}
it('packs all26 approved AI cels exactly, with native canvas and transparent padding',()=>{
 const image=rgbaPng('public/assets/hd/rune-warden-pixellab-v1/atlas.png');expect(C.frameCount).toBe(26);expect(C.rgbaBytes).toBe(1951488);expect(Object.keys(atlas.frames)).toHaveLength(26);
 for(const c of Object.values(C.clips))for(const f of c.frames){const raw=rgbaPng(f.source),r=atlas.frames[f.name as keyof typeof atlas.frames].frame,p=Buffer.alloc(128*128*4);expect(hash(readFileSync(f.source))).toBe(C.sources[f.source as keyof typeof C.sources]);for(let y=0;y<128;y++)image.pixels.copy(p,y*512,((r.y+y)*image.width+r.x)*4,((r.y+y)*image.width+r.x+128)*4);expect(p.equals(raw.pixels),f.name).toBe(true);expect(hash(p)).toBe(f.pixelSHA256);for(let y=-2;y<130;y++)for(let x=-2;x<130;x++)if(x<0||y<0||x>=128||y>=128)expect(image.pixels[((r.y+y)*image.width+r.x+x)*4+3]).toBe(0);}
});
it('plays the accepted8frame loops and9frame fade at fixed pivots without rejected cyan clips',()=>{
 expect(C.clips.flight.pivot).toEqual({x:95,y:61});expect(C.clips.impact.opacityFade).toBe(true);expect(C.clips.impact.frames).toHaveLength(1);
 expect(runeVfxDuration('flight')).toBe(.64);expect(runeVfxDuration('blink-idle')).toBe(.72);expect(runeVfxDuration('blink-fade')).toBe(.36);
 for(let i=0;i<8;i++)expect(runeVfxFrame('flight',i*.08+.001)).toBe(`rune-ai-flight-${i}`);expect(runeVfxFrame('flight',.64)).toBe('rune-ai-flight-0');
 for(const c of [C.clips['blink-idle'],C.clips['blink-fade']])for(const f of c.frames){const p=rgbaPng(f.source).pixels;for(let y=56;y<=72;y++)for(let x=54;x<=74;x++)expect(p[(y*128+x)*4+3]).toBe(0);}
 expect(runeBlinkSignalFrame(BOSS_MAGIC.teleportSignal)).toBe('rune-ai-blink-idle-0');
});
it.each([20,630,1500])('doubles the previous live Rune velocity at%ss, preserving cohort multipliers, shot count, damage and expiry',time=>{
 const w=setup(time),e=w.spawn('sorcerer',{x:220,y:0})!,b=e.boss!;b.magic=undefined;b.phase='windup';b.until=time;b.aim={x:0,y:0};updateBoss(w,e,.01);
 expect(ARCANE_VOLLEY.speedScale).toBe(4);const previous=(time<600?100:MAGIC_ATTACKS.sorcerer.speed)*(b.late?.projectile??1)*2;
 expect(w.projectiles.length).toBeGreaterThan(0);for(const p of w.projectiles){expect(Math.hypot(p.vx,p.vy)).toBeCloseTo(previous*2,8);expect(p.damage).toBe(e.damage);expect(p.expires-time).toBe(2.5);expect(p.ownerId).toBe(e.id);}
});
it('doubles the post-Blink volley and leaves the Astral volley multiplier unchanged',()=>{
 const w=setup(630),e=w.spawn('sorcerer',{x:100,y:0})!;e.boss!.magic!.nextAt=w.elapsed;updateMagicTeleport(w,e);w.elapsed=e.boss!.until;updateMagicTeleport(w,e);w.elapsed=e.boss!.until;updateMagicTeleport(w,e);
 expect(w.projectiles).toHaveLength(3);for(const p of w.projectiles)expect(Math.hypot(p.vx,p.vy)).toBeCloseTo(420,8);
 w.projectiles=[];const astral=w.spawn('eclipse',{x:200,y:0})!;fireBossVolley(w,astral);for(const p of w.projectiles)expect(Math.hypot(p.vx,p.vy)).toBeCloseTo(MAGIC_ATTACKS.eclipse.speed*ASTRAL_VOLLEY.speedScale,8);
});
it('keeps both Rune markers readable for the full signal, fixed to the true endpoints, below negative-Y actors',()=>{
 const w=setup(630);w.player.y=-6000;const e=w.spawn('sorcerer',{x:100,y:-6000})!;e.boss!.magic!.nextAt=w.elapsed;updateMagicTeleport(w,e);const m=e.boss!.magic!,from={...m.from!},to={...m.target!},started=w.elapsed;
 for(const age of [0,.04,.2,.44]){w.elapsed=started+age;const before=JSON.stringify(w),v=runeWardenViews(w,0);expect(v).toHaveLength(2);expect(v.map(v=>[v.x,v.y])).toEqual([[from.x,from.y+23],[to.x,to.y+23]]);for(const a of v){expect(a.texture).toBe(RUNE_VFX_TEXTURE);expect(a.frame).toMatch(/^rune-ai-blink-idle-/);expect(a.alpha).toBe(.45);expect(a.depth).toBeLessThan(e.y/10000);}expect(JSON.stringify(w)).toBe(before);}
 w.elapsed=e.boss!.until;updateMagicTeleport(w,e);expect({x:e.x,y:e.y}).toEqual(to);expect(runeWardenViews(w,1).filter(v=>v.frame==='rune-ai-blink-fade-0')).toHaveLength(2);
 w.pause();const paused=JSON.stringify(w),views=runeWardenViews(w,1);w.step(.5);expect(JSON.stringify(w)).toBe(paused);expect(runeWardenViews(w,1)).toEqual(views);
 w.elapsed+=.36;expect(runeWardenViews(w,1).some(v=>v.frame.startsWith('rune-ai-blink'))).toBe(false);
});
it('shares the user-approved Rune PixelLab Blink with Eclipse at its true foot anchors',()=>{
 const w=setup(630),e=w.spawn('eclipse',{x:100,y:0})!;e.boss!.magic!.nextAt=w.elapsed;updateMagicTeleport(w,e);const m=e.boss!.magic!,v=runeWardenViews(w,1);expect(v.map(v=>[v.frame,v.x,v.y])).toEqual([['rune-ai-blink-idle-0',m.from!.x,m.from!.y+23],['rune-ai-blink-idle-0',m.target!.x,m.target!.y+23]]);
 w.elapsed=e.boss!.until;updateMagicTeleport(w,e);expect(runeWardenViews(w,1).filter(v=>v.frame==='rune-ai-blink-fade-0')).toHaveLength(2);
});
it('retains swept collision at the new late-game speed and dissipates once without extra damage',()=>{
 const w=setup(1190),e=w.spawn('sorcerer',{x:-200,y:0})!;e.boss!.magic=undefined;e.boss!.until=Infinity;e.boss!.aim={x:0,y:0};fireBossVolley(w,e);const shot=w.projectiles[0]!,speed=Math.hypot(shot.vx,shot.vy);expect(speed).toBeGreaterThan(480);w.projectiles=[shot];shot.x=-speed*.025;shot.y=0;
 w.step(.05);expect(w.player.hp).toBe(100-e.damage);expect(w.projectiles).toEqual([]);const fx=w.effects.filter(e=>e.kind==='arcane-impact');expect(fx).toHaveLength(1);const first=runeWardenViews(w,1).find(v=>v.frame==='rune-ai-impact-0')!;expect(first.originX).toBe(95/128);expect(first.originY).toBe(61/128);
 w.step(.05);expect(w.effects.filter(e=>e.kind==='arcane-impact')).toHaveLength(1);expect(runeWardenViews(w,1).find(v=>v.frame==='rune-ai-impact-0')!.alpha).toBeLessThan(first.alpha);expect(w.player.hp).toBe(100-e.damage);
 w.status='over';expect(runeWardenViews(w,1)).toEqual([]);
});
