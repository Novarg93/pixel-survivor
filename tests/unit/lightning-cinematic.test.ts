import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { ULTIMATE } from '../../src/game/config/ultimates';
import { lightningCinematic } from '../../src/game/ultimates/lightningCinematic';
const C=ULTIMATE.lightning;
function setup(){
  const w=new World(824,{spawnRate:0});w.elapsed=601;w.experience.level=40;w.encounterDirector.nextAt=1e9;
  for(const a of Object.values(w.abilities))a.level=0;
  const e=w.spawn('tank',{x:60,y:0})!;e.hp=e.maxHp=1e6;e.speed=0;
  w.ultimate.choose(w,'lightning');w.ultimate.activate(w);return{w,e,start:w.elapsed};
}
it('orders invocation, sky, overload, release, recoil and recovery with no residual lighting',()=>{
  const sample=(age:number)=>lightningCinematic(age,0,age<C.preparation?-Infinity:C.preparation,true);
  expect([.1,.35,.43,.53,.63,.83,1].map(t=>sample(t).phase)).toEqual(['invocation','sky-strike','overload','release','recoil','recovery','idle']);
  expect(sample(.1).aura).toBe(false);expect(sample(.35).aura).toBe(true);expect(sample(.5).auraStrength).toBeGreaterThan(sample(.41).auraStrength);
  expect(sample(.52).aura).toBe(false);expect(sample(.58).flash).toBeCloseTo(.28);expect(sample(.58).dim).toBeLessThan(.24);
  expect(sample(.3).dim).toBeCloseTo(.24);expect(sample(1)).toMatchObject({dim:0,flash:0,aura:false});
  expect(sample(.2).web).toBe(0);expect(sample(.52+.075).web).toBeCloseTo(1);expect(sample(1).web).toBe(0);
  expect(lightningCinematic(.35,0,-Infinity,false)).toMatchObject({dim:0,flash:0,aura:false});
  expect(lightningCinematic(0,-Infinity,-Infinity,true)).toMatchObject({phase:'idle',dim:0,flash:0,aura:false});
  expect(lightningCinematic(.58,0,.52,true,1,true).flash).toBeCloseTo(.035);
  expect(lightningCinematic(.58,0,.52,true,0)).toMatchObject({dim:0,flash:0});
});
it('aims the charged hand and visual recoil at the initial fallback target',()=>{
  const {w}=setup();expect(w.ultimate.direction).toEqual({x:1,y:0});
});
it('protects only the finite World cast without touching HP, damage cooldown, Absorb or Shield; releases damage once',()=>{
  const {w,e,start}=setup(),hp=w.player.hp,enemyHp=e.hp;
  w.mobility.refreshAbsorb(30,w.elapsed+5);w.shield.refreshAbsorb(20,w.elapsed+5);
  for(const age of [0,.2,.34,.405,.519]){
    w.elapsed=start+age;w.ultimate.update(w);expect(w.damagePlayer(10)).toBe(false);expect(e.hp).toBe(enemyHp);
    expect(w.player.hp).toBe(hp);expect(w.absorb).toBe(50);expect(w.player.invulnerableUntil).toBe(0);
  }
  w.elapsed=start+C.preparation;w.ultimate.update(w);const after=e.hp;expect(enemyHp-after).toBe(enemyHp);expect(after).toBe(0);
  expect(w.ultimate.casting).toBe(false);expect(w.ultimate.protected(w.elapsed)).toBe(false);expect(w.damagePlayer(10)).toBe(true);expect(w.absorb).toBeLessThan(50);
  w.elapsed+=.05;w.ultimate.update(w);expect(e.hp).toBe(after);
});
it('freezes core/lighting on pause, resumes held analog movement, clears interruption/death and expires a skipped cast',()=>{
  const {w,start}=setup();w.step(.05,{x:1,y:0,analog:true});expect(w.player.x).toBe(0);
  w.pause();const frozen=w.elapsed;w.step(20,{x:1,y:0});expect(w.elapsed).toBe(frozen);w.ultimate.update(w);expect(w.ultimate.protected(w.elapsed)).toBe(true);
  w.resume();for(let i=0;i<12;i++)w.step(.05,{x:.8,y:0,analog:true});expect(w.elapsed).toBeGreaterThan(start+C.preparation);expect(w.player.x).toBeGreaterThan(0);
  w.player.invulnerableUntil=0;w.damagePlayer(1e9);expect(w.status).toBe('over');expect(w.ultimate.protected(w.elapsed)).toBe(false);
  const next=setup().w;next.clearTemporaryState();expect(next.ultimate.casting).toBe(false);expect(next.ultimate.protected(next.elapsed)).toBe(false);
  const skipped=setup().w;skipped.elapsed+=3;expect(skipped.ultimate.protected(skipped.elapsed)).toBe(false);skipped.ultimate.update(skipped);expect(skipped.ultimate.casting).toBe(false);
});
it('emits one phase cue each and never a sound for individual targets',()=>{
  const {w,start}=setup();for(let i=0;i<20;i++)w.spawn('tank',{x:70+i*2,y:0});
  for(let i=0;i<=30;i++){w.elapsed=start+i*.02;w.ultimate.update(w);}
  expect(w.sounds.filter(s=>s.startsWith('ultimate-'))).toEqual(['ultimate-charge','ultimate-sky','ultimate-overload','ultimate-lightning']);
});
