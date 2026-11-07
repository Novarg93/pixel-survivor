import {expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {FLAME_STRIKE,flameStrikeView,flameDuration,flameIndex} from '../../src/game/art/flameStrikePack';
import {World} from '../../src/game/systems/World';
import {FINAL_BOSS as C} from '../../src/game/config/finalBoss';
import {swordContains} from '../../src/game/systems/FinalEncounter';
import {freezeForUltimate} from '../../src/game/systems/UltimateFreeze';
function setup(){const w=new World(31,{spawnRate:0});w.practice=true;w.elapsed=1200;w.finalEncounter.begin(w);for(const a of Object.values(w.abilities))a.level=0;for(let i=0;i<47;i++)w.step(.05);const f=w.finalEncounter;f.nextCombo=f.nextMelee=f.nextMeteor=Infinity;f.attack={...f.attack,kind:'swordWindup',age:C.swordWindup-.02,duration:C.swordWindup,direction:{x:1,y:0},contacted:false};return w;}
it('ships the selected C sources in one bounded atlas with fixed ground pivot and a truly empty last frame',()=>{
  expect(FLAME_STRIKE.selectedVariant).toBe('c');expect(FLAME_STRIKE.pivot).toEqual([96,144]);expect(FLAME_STRIKE.sourceCanvas).toEqual([192,192]);expect(FLAME_STRIKE.rgbaBytes).toBeLessThanOrEqual(1048576);expect(FLAME_STRIKE.frames).toHaveLength(12);expect(FLAME_STRIKE.frames.at(-1)).toBeNull();expect(FLAME_STRIKE.sourceDurationsMs).toEqual(Array(12).fill(150));expect(flameDuration).toBe(.6);expect(flameIndex(-.01)).toBe(-1);expect(flameIndex(.6)).toBe(-1);
  for(const [file,hash]of Object.entries(FLAME_STRIKE.sources))expect(createHash('sha256').update(readFileSync(file)).digest('hex'),file).toBe(hash);
  const atlas=JSON.parse(readFileSync('public/assets/hd/ash-warden-flame-strike-v1/atlas.json','utf8'));for(const frame of FLAME_STRIKE.frames.filter(Boolean))expect(atlas.frames[frame!].sourceSize).toEqual({w:192,h:192});
});
it('spreads upright segments on the locked straight aim and puts every peak inside the existing hit window',()=>{
  const f=setup().finalEncounter,e=f.boss!;
  for(const [x,y]of [[1,0],[-1,0],[0,1],[0,-1],[Math.SQRT1_2,Math.SQRT1_2]]){
    f.attack={...f.attack,kind:'swordActive',age:0,direction:{x,y}};const v=flameStrikeView(f)!;expect(v.segments).toHaveLength(10);expect(v.glowLength).toBe(280);expect(v.glowWidth).toBe(56);
    for(const s of v.segments){expect((s.x-e.x)*y-(s.y-e.y)*x).toBeCloseTo(0);expect(s.frameIndex).toBeGreaterThanOrEqual(0);const peakAt=FLAME_STRIKE.durationsMs.slice(0,5).reduce((a,b)=>a+b,0)/1000-FLAME_STRIKE.leadMs/1000+s.delay;expect(peakAt).toBeGreaterThanOrEqual(0);expect(peakAt).toBeLessThan(C.swordActive);}
    f.attack.age=.09;expect(flameStrikeView(f)!.segments.at(-1)!.frameIndex).toBe(5);
  }
});
it.each([0,32])('preserves original narrow damage, single contact and150ms active duration: side=%s',side=>{
  const w=setup(),f=w.finalEncounter,e=f.boss!,hurt=vi.spyOn(w,'damagePlayer');w.player.x=e.x+140;w.player.y=e.y+side;expect(swordContains(w.player,e,{x:1,y:0})).toBe(side===0);
  w.step(.02);expect(f.attack.kind).toBe('swordActive');expect(f.attack.duration).toBe(.15);expect(hurt).not.toHaveBeenCalled();
  for(let i=0;i<5;i++){w.player.invulnerableUntil=0;flameStrikeView(f);w.step(.05);}
  expect(hurt).toHaveBeenCalledTimes(side===0?1:0);if(side===0)expect(hurt).toHaveBeenCalledWith(64);
  expect(swordContains({x:e.x+140,y:e.y+22.01},e,{x:1,y:0},280,0)).toBe(false);
});
it('holds ignition and spread with the personal attack clock during freeze/pause, and clears on interruption',()=>{
  const w=setup(),f=w.finalEncounter;f.attack.age=C.swordWindup-.06;const pose=flameStrikeView(f);freezeForUltimate(f.boss!,w.elapsed,w.elapsed+2);for(let i=0;i<8;i++)w.step(.05);expect(flameStrikeView(f)).toEqual(pose);w.pause();w.step(.05);expect(flameStrikeView(f)).toEqual(pose);
  f.pending='phase3';expect(flameStrikeView(f)).toBeNull();f.pending=null;f.phase='dying';expect(flameStrikeView(f)).toBeNull();f.phase='phase1';f.attack.kind='approach';expect(flameStrikeView(f)).toBeNull();f.attack.kind='recovery';f.attack.age=.65;expect(flameStrikeView(f)!.segments).toHaveLength(0);
});
