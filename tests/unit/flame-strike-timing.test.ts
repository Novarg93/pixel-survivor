import {expect,it,vi} from 'vitest';
import {CLEAVE_PLAYBACK,WARDEN,wardenIndex,wardenPose} from '../../src/game/art/ashWardenPack';
import {flameStrikeView} from '../../src/game/art/flameStrikePack';
import {World} from '../../src/game/systems/World';
import {FINAL_BOSS as C} from '../../src/game/config/finalBoss';
import {freezeForUltimate} from '../../src/game/systems/UltimateFreeze';
function setup(){const w=new World(47,{spawnRate:0});w.practice=true;w.elapsed=1200;w.finalEncounter.begin(w);for(const a of Object.values(w.abilities))a.level=0;for(let i=0;i<47;i++)w.step(.05);const f=w.finalEncounter;f.nextCombo=f.nextMelee=f.nextMeteor=Infinity;f.attack={...f.attack,kind:'swordWindup',age:0,duration:C.swordWindup,direction:{x:1,y:0},contacted:false};return w;}
it('keeps source timing/pixels and the faster600ms windup, with75ms only for frames6–11',()=>{
  expect(WARDEN.clips['south-cleave']!.durationsMs).toEqual(Array(12).fill(150));expect(CLEAVE_PLAYBACK.durationsMs).toEqual([...Array(6).fill(150),...Array(6).fill(75)]);expect(CLEAVE_PLAYBACK.frames).toBe(WARDEN.clips['south-cleave']!.frames);
  const f=setup().finalEncounter;for(let i=0;i<6;i++)for(const offset of [.001,.074,.149]){f.attack.age=(i*.15+offset)/1.5;expect(wardenPose(f).index).toBe(i);}
  expect(CLEAVE_PLAYBACK.durationsMs.reduce((a,b)=>a+b)).toBe(1350);
});
it('plays each release/recovery pose twice as fast without skipping body or emission frames',()=>{
  const f=setup().finalEncounter;
  for(let i=0;i<6;i++){
    const elapsed=.6+i*.075+.001;f.attack.kind=elapsed<.75?'swordActive':'recovery';f.attack.age=elapsed-(f.attack.kind==='swordActive'?.6:.75);const pose=wardenPose(f);
    expect(pose.index).toBe(6+i);expect(pose.frame).toBe(WARDEN.clips['south-cleave']!.frames[6+i]);expect(pose.frame.overlay).toBeTruthy();expect(wardenIndex(WARDEN.clips['south-cleave']!,.9+i*.15+.001)).toBe(pose.index);
  }
  f.attack.kind='recovery';f.attack.age=.749;expect(wardenPose(f).index).toBe(11);
});
it('retains actual hit timing, single64damage contact and the C peak schedule',()=>{
  const w=setup(),f=w.finalEncounter,e=f.boss!,hurt=vi.spyOn(w,'damagePlayer');w.player.x=e.x+140;w.player.y=e.y;f.attack.age=C.swordWindup-.05;
  w.step(.05);expect(f.attack.kind).toBe('swordActive');expect(f.attack.age).toBe(0);expect(wardenPose(f).index).toBe(6);expect(hurt).not.toHaveBeenCalled();expect(flameStrikeView(f)!.segments[0]!.frameIndex).toBe(5);
  w.step(.05);expect(hurt).toHaveBeenCalledWith(64);w.player.invulnerableUntil=0;w.step(.05);expect(hurt).toHaveBeenCalledTimes(1);expect(wardenPose(f).index).toBe(7);w.step(.05);expect(f.attack.kind).toBe('recovery');expect(wardenPose(f).index).toBe(8);expect(f.attack.duration).toBe(.75);
});
it('holds the accelerated body and emission during freeze/pause and resumes the same phase',()=>{
  const w=setup(),f=w.finalEncounter;f.phase='phase3';f.nextVolley=Infinity;f.attack.kind='recovery';f.attack.duration=.75;f.attack.age=.1;const pose=wardenPose(f),fire=flameStrikeView(f);freezeForUltimate(f.boss!,w.elapsed,w.elapsed+.5);
  for(let i=0;i<4;i++)w.step(.05);expect(wardenPose(f)).toEqual(pose);expect(flameStrikeView(f)).toEqual(fire);w.pause();w.step(.05);expect(wardenPose(f)).toEqual(pose);w.resume();delete f.boss!.ultimateFreeze;w.step(.05);expect(wardenPose(f).index).toBe(10);
});
