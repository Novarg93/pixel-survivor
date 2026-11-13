import {it,expect,vi} from 'vitest';
import type Phaser from 'phaser';
import {World} from '../../src/game/systems/World';
import {cleave,tickCleave} from '../../src/game/abilities/warrior';
import {cleaveTiming} from '../../src/game/config/warriorCleave';
import {WarriorHeroAnimation} from '../../src/game/art/WarriorHeroAnimation';
import {warriorHeroSelection} from '../../src/game/art/warriorHeroPack';
import {drawWarriorMagic} from '../../src/game/art/WarriorMagic';

function fixture(x=40,y=0){const w=new World(1,{character:'warrior',spawnRate:0}),enemy=w.spawn('tank',{x,y})!;enemy.speed=enemy.damage=0;enemy.hp=enemy.maxHp=1000;return {w,enemy,art:new WarriorHeroAnimation()};}
it('begins the body before damage and applies one hit on its contact frame; pause freezes both clocks',()=>{
 const {w,enemy,art}=fixture();expect(cleave(w)).toBe(true);const swing=w.warrior.cleave!;
 expect(enemy.hp).toBe(1000);expect(art.view(w,false)).toMatchObject({motion:'attack',index:0,pending:false,slash:undefined});
 w.elapsed=swing.hitAt-.00001;tickCleave(w);expect(enemy.hp).toBe(1000);expect(art.view(w,false).slash).toBeUndefined();
 w.pause();w.step(.05);tickCleave(w);expect(enemy.hp).toBe(1000);w.resume();
 w.elapsed=swing.hitAt;tickCleave(w);expect(enemy.hp).toBe(966);expect(art.view(w,false).slash?.phase).toBeCloseTo(0);
 tickCleave(w);expect(enemy.hp).toBe(966);
 w.elapsed=swing.started+swing.duration;tickCleave(w);expect(art.view(w,false).motion).toBe('idle');
 // A surviving hit Effect can never launch a second, delayed swing.
 w.effect('cleave',w.player,82,0,.25,{x:40,y:0});expect(art.view(w,false).motion).toBe('idle');
});
it('shares all four variant contact frames across eight aims and high CDR without waiting in a render queue',()=>{
 for(let direction=0;direction<8;direction++)for(let variant=0;variant<4;variant++)for(const cooldown of [.85,.2975]){
  const angle=direction*Math.PI/4,{w,enemy,art}=fixture(Math.cos(angle)*40,Math.sin(angle)*40);w.stats.cooldown=cooldown/.85;w.warrior.cleaveSequence=variant;
  expect(cleave(w)).toBe(true);const swing=w.warrior.cleave!,timing=cleaveTiming(variant+1,angle,cooldown);
  expect(swing.duration).toBeCloseTo(timing.duration);expect(swing.duration).toBeLessThanOrEqual(cooldown+.000001);expect(cleave(w)).toBe(false);
  w.elapsed=swing.hitAt-1e-5;tickCleave(w);expect(enemy.hp).toBe(1000);
  w.elapsed=swing.hitAt;tickCleave(w);expect(enemy.hp).toBe(966);expect(art.view(w,false)).toMatchObject({motion:'attack',variant:swing.variant,pending:false});
  expect(art.view(w,false).index).toBeGreaterThan(0);
 }
});
it('Charge cancels an unfinished real swing and cannot replay it or deliver its old hit',()=>{
 const {w,enemy,art}=fixture();cleave(w);art.view(w,false);w.elapsed=.1;
 expect(w.mobility.activate(w,{x:-1,y:-1})).toBe(true);expect(w.warrior.cleave).toBeUndefined();
 expect(art.view(w,true)).toMatchObject({motion:'charge',id:'north-charge',direction:'north-west',flipX:true,pending:false,slash:undefined});
 w.elapsed=.27;expect(art.view(w,true).index).toBe(12);w.pause();expect(art.view(w,true).motion).toBe('charge');w.resume();
 w.elapsed=.5;tickCleave(w);expect(enemy.hp).toBe(1000);expect(art.view(w,false).motion).toBe('idle');
});
it('resolves the moving sword cone against current targets at contact, without hitting distant or dead targets',()=>{
 const {w,enemy}=fixture();cleave(w);const incoming=w.spawn('tank',{x:60,y:0})!;incoming.hp=1000;
 enemy.x=300;w.player.x=15;w.elapsed=w.warrior.cleave!.hitAt;tickCleave(w);
 expect(enemy.hp).toBe(1000);expect(incoming.hp).toBe(966);
});
it('keeps lethal HP/score/XP unchanged before contact and clears pending melee on teardown',()=>{
 const {w,enemy,art}=fixture();enemy.hp=1;cleave(w);expect(w.kills).toBe(0);expect(w.orbs).toHaveLength(0);
 w.elapsed=w.warrior.cleave!.hitAt;tickCleave(w);expect(w.kills).toBe(1);expect(w.orbs.length).toBeGreaterThan(0);expect(art.view(w,false).motion).toBe('attack');
 w.clearTemporaryState();expect(w.warrior.cleave).toBeUndefined();expect(art.view(w,false).motion).toBe('idle');
});
it('never draws the old event-clock slash when explicit body feedback is absent',()=>{
 const w=new World(1,{character:'warrior',spawnRate:0}),fn=vi.fn(),g=new Proxy({},{get:()=>fn})as Phaser.GameObjects.Graphics;fn.mockReturnValue(g);
 w.effect('cleave',w.player,82,0,.25,{x:40,y:0});drawWarriorMagic(g,w,.7,[],null);expect(fn).not.toHaveBeenCalled();
 drawWarriorMagic(g,w,.7,[],{phase:.4,angle:0,radius:82});expect(fn).toHaveBeenCalled();
});
it('retains accepted charge poses at the real 180ms dash duration in all directions',()=>{
 for(const d of ['south','east','west','north','north-east','north-west']as const){
  expect(warriorHeroSelection(d,'charge',0).duration).toBe(.18);
  const group=d.startsWith('north')?'north':'front',count=group==='north'?13:9;
  for(let i=0;i<count;i++)expect(warriorHeroSelection(d,'charge',i*.18/count).frame).toBe(group+'-charge/'+i);
 }
});
