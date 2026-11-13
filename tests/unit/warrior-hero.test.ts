import {describe,it,expect} from 'vitest';
import {World} from '../../src/game/systems/World';
import {cleave,tickCleave} from '../../src/game/abilities/warrior';
import {WarriorHeroAnimation} from '../../src/game/art/WarriorHeroAnimation';
import {WARRIOR_HERO,warriorHeroSelection,WARRIOR_ATTACKS} from '../../src/game/art/warriorHeroPack';
import {MAGE_DIRECTIONS} from '../../src/game/art/MageHeroAnimation';
import {playerHealthLayout} from '../../src/game/art/PlayerHealthBar';

describe('accepted Warrior runtime',()=>{
 it('places HP above the accepted Idle/Run head bounds without mutating gameplay',()=>{
  const w=new World(1,{character:'warrior',spawnRate:0}),before=JSON.stringify(w),bar=playerHealthLayout(w);
  expect(bar.y+bar.height).toBeLessThan(w.player.y-38.5);
  expect(JSON.stringify(w)).toBe(before);
 });
 it('routes all projections and preserves every normalized playback frame',()=>{
  for(const d of MAGE_DIRECTIONS)for(const motion of ['idle','run','attack'] as const)for(const variant of WARRIOR_ATTACKS){
   const v=warriorHeroSelection(d,motion,0,variant),clip=WARRIOR_HERO.clips[v.id as keyof typeof WARRIOR_HERO.clips];
   expect(v.id.startsWith(d.startsWith('north')?'north-':'front-')).toBe(true);
   expect(v.flipX).toBe(['north-west','west','south-west'].includes(d));
   expect(clip.frames.length).toBe(motion==='attack'&&variant==='heavy'?17:13);
   for(let i=0;i<clip.frames.length;i++)expect(warriorHeroSelection(d,motion,i*clip.frameMs/1000,variant).frame).toBe(clip.frames[i]);
   expect(warriorHeroSelection(d,motion,clip.periodMs/1000,variant).index).toBe(motion==='attack'?clip.frames.length-1:0);
   expect(clip.frameMs).toBe(motion==='idle'?120:motion==='attack'?60:75);
  }
 });
 it('uses real successful Cleave, cycles C1/C3/heavy and never mutates simulation',()=>{
  const w=new World(42,{character:'warrior',spawnRate:0}),a=new WarriorHeroAnimation();
  const e=w.spawn('tank',{x:40,y:-40})!;e.hp=e.maxHp=10000;e.speed=0;
  for(const variant of WARRIOR_ATTACKS){
   expect(cleave(w)).toBe(true);const before=JSON.stringify(w),v=a.view(w,false);
   expect(v.motion).toBe('attack');expect(v.direction).toBe('north-east');expect(v.variant).toBe(variant);
   expect(JSON.stringify(w)).toBe(before);
   w.elapsed=w.warrior.cleave!.hitAt;tickCleave(w);w.elapsed+=v.duration;a.view(w,false);tickCleave(w);
  }
  expect(e.hp).toBe(10000-3*34);
 });
 it('keeps one simulation swing without a delayed render queue under rapid casts',()=>{
  const w=new World(1,{character:'warrior',spawnRate:0}),a=new WarriorHeroAnimation();
  w.spawn('tank',{x:40,y:0})!.hp=1e5;cleave(w);expect(a.view(w,false).variant).toBe('c1');
  for(let i=1;i<=5;i++){w.elapsed=i*.12;expect(cleave(w)).toBe(false);const v=a.view(w,false);expect(v.variant).toBe('c1');expect(v.pending).toBe(false);}
  w.elapsed=.779;expect(a.view(w,false).index).toBe(12);
  w.elapsed=.780;tickCleave(w);cleave(w);const v=a.view(w,false);expect(v.index).toBe(0);expect(v.variant).toBe('c3');expect(v.pending).toBe(false);
 });
 it('loops moving directions, freezes while paused and resets on a fresh run',()=>{
  const w=new World(42,{character:'warrior',spawnRate:0}),a=new WarriorHeroAnimation();
  w.facing={x:-1,y:-1};w.elapsed=.9;expect(a.view(w,true).direction).toBe('north-west');
  w.pause();const before=a.view(w,true);expect(a.view(w,true)).toEqual(before);
  expect(a.view(new World(43,{character:'warrior',spawnRate:0}),false)).toMatchObject({motion:'idle',direction:'south',index:0,pending:false});
 });
 it('does not play an attack when no target was hit and clears gestures at defeat',()=>{
  const w=new World(1,{character:'warrior',spawnRate:0}),a=new WarriorHeroAnimation();
  expect(cleave(w)).toBe(false);expect(a.view(w,false).motion).toBe('idle');
  w.effect('cleave',w.player,82,0,.25,{x:40,y:0});a.view(w,false);w.status='over';
  expect(a.view(w,true).motion).toBe('idle');expect(a.view(w,true).pending).toBe(false);
 });
});
