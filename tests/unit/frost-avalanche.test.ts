import { expect,it,vi } from 'vitest';
import { World } from '../../src/game/systems/World';
import { ULTIMATE } from '../../src/game/config/ultimates';
import { FROST_AVALANCHE as A, frostAvalanchePixels } from '../../src/game/art/frostAvalancheTexture';
const C=ULTIMATE.frost;
function setup(){
  const w=new World(1406,{spawnRate:0});w.elapsed=900;w.experience.level=40;w.encounterDirector.nextAt=1e9;
  for(const a of Object.values(w.abilities))a.level=0;
  w.ultimate.choose(w,'frost');w.ultimate.activate(w);return w;
}
function progress(w:World,p:number){w.elapsed=w.ultimate.frost.activeAt+C.waveDelay+C.waveDuration*p;w.ultimate.update(w);}

it('freezes first, then sweeps damage from the stationary center to the rune boundary exactly once',()=>{
  const w=setup(),f=w.ultimate.frost;
  const enemies=[0,.45,.95,1.3].map(p=>{const e=w.spawn('tank',{x:f.origin.x+f.radius*p,y:0})!;e.hp=e.maxHp=1e6;return e;});
  const hit=vi.spyOn(w,'damageEnemy');
  w.elapsed=f.activeAt+.01;w.ultimate.update(w);expect(hit).not.toHaveBeenCalled();expect(enemies[2].ultimateFreeze?.until).toBe(f.thawsAt);
  progress(w,.05);expect(enemies.map(e=>e.hp)).toEqual([1e6-C.damage,1e6,1e6,1e6]);
  w.player.x=800;progress(w,.55);expect(enemies[1].hp).toBe(1e6-C.damage);expect(enemies[2].hp).toBe(1e6);
  progress(w,1);progress(w,2);expect(enemies[2].hp).toBe(1e6-C.damage);expect(enemies[3].hp).toBe(1e6);
  expect(hit).toHaveBeenCalledTimes(3);expect(w.snapshot().ultimateDamage?.frost).toBe(C.damage*3);
});
it('clears small mobs at the maximum regular HP scaling, records real kills and leaves XP',()=>{
  const w=setup();w.elapsed=1100;
  const targets=(['grunt','runner','caster','rusher','splitter'] as const).map((kind,i)=>w.spawn(kind,{x:30+i*10,y:0})!);
  progress(w,1);expect(targets.every(e=>e.hp===0)).toBe(true);expect(w.kills).toBe(5);expect(w.orbs.length).toBeGreaterThanOrEqual(5);expect(w.snapshot().ultimateDamage?.frost).toBeGreaterThan(0);
  progress(w,2);expect(w.kills).toBe(5);
});
it('applies damage bonuses once and caps bosses and Guardian at8% even with artifact and recovery bonuses',()=>{
  const w=setup();w.stats.damage=100;w.artifacts.grant(w,'damage');
  const regular=w.spawn('tank',{x:50,y:0},true)!,boss=w.spawn('charger',{x:-50,y:0})!,guardian=w.spawn('guardian',{x:0,y:50})!;
  regular.modifier='frenzy';
  for(const e of [regular,boss,guardian])e.hp=e.maxHp=1e6;
  boss.maxHp=1000;boss.hp=1000;boss.boss!.phase='recover';guardian.maxHp=1000;guardian.hp=1000;
  progress(w,.5);expect(regular.maxHp-regular.hp).toBeCloseTo(C.damage*100*1.08);expect(boss.hp).toBe(920);expect(guardian.hp).toBe(920);
  progress(w,1);expect(boss.hp).toBe(920);expect(guardian.hp).toBe(920);
});
it('sweeps skipped frames, ignores late entrants behind the front and freezes them without repeating the wave',()=>{
  const w=setup(),f=w.ultimate.frost;progress(w,.6);
  const behind=w.spawn('tank',{x:20,y:0})!,ahead=w.spawn('tank',{x:f.radius*.9,y:0})!;
  behind.hp=ahead.hp=1e6;progress(w,1.05);expect(behind.hp).toBe(1e6);expect(behind.ultimateFreeze?.until).toBe(f.thawsAt);expect(ahead.hp).toBe(1e6-C.damage);
  const late=w.spawn('tank',{x:25,y:0})!;progress(w,2);expect(late.hp).toBe(late.maxHp);expect(late.ultimateFreeze?.until).toBe(f.thawsAt);
});
it('pauses the wave with game time, clears on death and hits again on the next cast',()=>{
  const w=setup(),e=w.spawn('tank',{x:30,y:0})!;e.hp=e.maxHp=1e6;progress(w,.5);const hp=e.hp;
  w.pause();const view=w.ultimate.frost.view(w.elapsed);w.step(20);expect(w.ultimate.frost.view(w.elapsed)).toEqual(view);w.ultimate.update(w);expect(e.hp).toBe(hp);
  w.resume();w.elapsed=w.ultimate.frost.endsAt;w.ultimate.update(w);w.ultimate.charge=10;expect(w.ultimate.activate(w)).toBe(true);progress(w,.5);expect(e.hp).toBe(hp-C.damage);
  w.damagePlayer(1e9);expect(w.ultimate.frost.view(w.elapsed).avalancheVisible).toBe(false);expect(w.ultimate.frost.radius).toBe(0);
});
it('authors a deterministic hollow snow crest with multiple ice shades, transparent center and bounded texture',()=>{
  const pixels=frostAvalanchePixels();expect(pixels).toEqual(frostAvalanchePixels());expect(pixels.length).toBe(A.size*A.size*4);
  let opaque=0;const colors=new Set<string>();
  for(let y=0;y<A.size;y++)for(let x=0;x<A.size;x++){
    const i=(y*A.size+x)*4,r=Math.hypot(x-A.size/2,y-A.size/2);
    if(r<128||r>A.radius)expect(pixels[i+3]).toBe(0);
    if(pixels[i+3]){opaque++;colors.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]}`);}
  }
  expect(opaque).toBeGreaterThan(20000);expect(opaque).toBeLessThan(45000);expect(colors.size).toBeGreaterThanOrEqual(5);
});
