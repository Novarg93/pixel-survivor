import {expect,it,vi} from 'vitest';
import {World} from '../../src/game/systems/World';
import {wardenPose,WARDEN,MELEE_B_PLAYBACK} from '../../src/game/art/ashWardenPack';
import {MELEE_A_CLIPS,MELEE_COMBO,meleeComboView} from '../../src/game/art/meleeComboPack';
import {flameStrikeView} from '../../src/game/art/flameStrikePack';
import {freezeForUltimate} from '../../src/game/systems/UltimateFreeze';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const SPEED=1.15;
function setup(){const w=new World(62,{spawnRate:0});w.practice=true;w.elapsed=1200;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);for(let i=0;i<47;i++)w.step(.05);w.finalEncounter.nextCombo=w.finalEncounter.nextMeteor=Infinity;return w;}
function start(w:World,x:number,y:number){const f=w.finalEncounter,e=f.boss!;f.attack={...f.attack,kind:'approach',age:0,duration:0};f.nextMelee=0;w.player.x=e.x+x*45;w.player.y=e.y+y*45;w.step(.05);expect(f.attack.kind).toBe('basicMelee');return f;}
it('alternates actual permitted side attacks B/A and keeps South overhead/North back out of the counter',()=>{
  const w=setup(),rows=[];for(const [x,y]of [[1,0],[-1,0],[0,1],[1,0],[0,-1],[-1,0]]){const f=start(w,x!,y!);rows.push(f.attack.meleeVariant);}
  expect(rows).toEqual(['b','a','overhead','b','b','a']);expect(start(setup(),1,0).attack.meleeVariant).toBe('b');
});
it('does not consume an alternation on a cancelled unsafe attack, and latches the choice while the player moves',()=>{
  const w=setup();w.player.speed=0;const f=w.finalEncounter,e=f.boss!;f.nextMelee=0;w.player.x=e.x+45;w.player.y=e.y;w.step(.05);expect(f.attack.kind).toBe('approach');w.player.speed=135;start(w,1,0);expect(f.attack.meleeVariant).toBe('b');w.player.x=e.x-80;w.step(.05);expect(f.attack.direction).toEqual({x:1,y:0});expect(f.attack.meleeVariant).toBe('b');
});
it('uses exact A poses and phase3 masks with a shared mirrored West, while B and North use their accepted clips',()=>{
  const f=setup().finalEncounter;f.attack={...f.attack,kind:'basicMelee',age:.5/SPEED,direction:{x:1,y:0},meleeVariant:'a'};let pose=wardenPose(f);expect(pose.clip).toBe('east-melee-a');expect(pose.index).toBe(5);expect(pose.frame.layers[0]!.texture).toBe(MELEE_COMBO.texture);expect(pose.frame.overlay!.texture).toBe(MELEE_COMBO.texture);
  f.attack.direction={x:-1,y:0};pose=wardenPose(f);expect(pose.clip).toBe('west-melee-a');expect(pose.frame.flipX).toBe(true);expect(pose.frame.layers).toEqual(MELEE_A_CLIPS['east-melee-a']!.frames[5]!.layers);
  f.attack.meleeVariant='b';f.attack.age=.65/SPEED;expect(wardenPose(f).clip).toBe('west-melee');f.attack.direction={x:0,y:-1};expect(wardenPose(f).clip).toBe('north-melee');expect(wardenPose(f).frame).toBe(WARDEN.clips['north-melee']!.frames[7]);
});
it('uses accelerated South overhead with contact at650/1.15ms and no Flame Strike or side slash',()=>{
  const w=setup(),f=start(w,0,1);for(const [age,index]of [[0,0],[.649,5],[.65,6],[.8,8],[1.1,11]]){f.attack.age=age!/SPEED;const pose=wardenPose(f);expect(pose.clip).toBe('south-cleave');expect(pose.index).toBe(index);expect(flameStrikeView(f)).toBeNull();expect(meleeComboView(f)!.slash).toBeNull();}
});
it.each([[1,0],[0,1]])('retains one32damage hit with15percent faster timing: direction%s,%s',(x,y)=>{
  const w=setup(),f=start(w,x,y),hurt=vi.spyOn(w,'damagePlayer');f.attack.age=.6/SPEED;w.step(.05/SPEED);expect(hurt).toHaveBeenCalledTimes(1);expect(hurt).toHaveBeenCalledWith(32);w.step(.05/SPEED);expect(hurt).toHaveBeenCalledTimes(1);expect(f.attack.duration).toBeCloseTo(1.2/SPEED);expect(f.events.filter(e=>e.instance===f.attack.id&&e.name==='hitFrame')).toHaveLength(1);
});
it('aligns the mirrored RD peak with the hit, expires once, and holds body/slash on freeze and pause',()=>{
  const w=setup(),f=start(w,-1,0);f.attack.age=.65/SPEED;const v=meleeComboView(f)!;expect(v.slash).toMatchObject({index:8,flipX:true});expect(v.slash!.x).toBe(f.boss!.x-50);const pose=wardenPose(f);freezeForUltimate(f.boss!,w.elapsed,w.elapsed+2);for(let i=0;i<4;i++)w.step(.05);expect(wardenPose(f)).toEqual(pose);expect(meleeComboView(f)).toEqual(v);w.pause();w.step(.05);expect(meleeComboView(f)).toEqual(v);f.attack.age=.95/SPEED;expect(meleeComboView(f)!.slash).toBeNull();f.phase='dying';expect(meleeComboView(f)).toBeNull();
});
it('packages all source hashes with bounded memory and unchanged A canvas/pivot',()=>{
  expect(MELEE_COMBO.rgbaBytes).toBeLessThanOrEqual(2*1048576);expect(MELEE_COMBO.bodyA.pivot).toEqual([96,154]);expect(MELEE_COMBO.bodyA.durationsMs.reduce((a,b)=>a+b)).toBe(1200);expect(MELEE_COMBO.slash.frames.at(-1)).toBeNull();for(const [file,h]of Object.entries(MELEE_COMBO.sources))expect(createHash('sha256').update(readFileSync(file)).digest('hex'),file).toBe(h);
});
it('renders slash only for side B and removes all basic melee floor lighting including South',()=>{
  const f=setup().finalEncounter;f.attack.kind='basicMelee';
  for(const x of [1,-1])for(const variant of ['a','b']as const){f.attack.direction={x,y:0};f.attack.meleeVariant=variant;for(const age of [.2,.4,.65,.78,.95]){f.attack.age=age/SPEED;const v=meleeComboView(f)!;expect(v.glowAlpha).toBe(0);if(variant==='a')expect(v.slash).toBeNull();if(age===.65)expect(!!v.slash).toBe(variant==='b');}}
  f.attack.direction={x:0,y:1};f.attack.meleeVariant='overhead';for(const age of [0,.2,.4,.649,.65,.7,.9,1.199]){f.attack.age=age;expect(meleeComboView(f)!.glowAlpha).toBe(0);}expect(MELEE_COMBO.slash.arcLengthMultiplier).toBe(1.15);expect(MELEE_COMBO.slash.scale).toBe(1.65);
});
it('retains the accepted B selective retime beneath the additional global15percent acceleration',()=>{
  const f=setup().finalEncounter;f.attack.kind='basicMelee';f.attack.meleeVariant='b';
  for(const [face,x,y]of [['east',1,0],['west',-1,0],['north',0,-1]]as const){
    const source=WARDEN.clips[face+'-melee']!,fast=MELEE_B_PLAYBACK[face+'-melee']!;expect(fast.frames).toBe(source.frames);expect(fast.durationsMs.slice(0,7)).toEqual(source.durationsMs.slice(0,7));expect(fast.durationsMs.slice(7)).toEqual(source.durationsMs.slice(7).map(ms=>ms/2));expect(fast.durationsMs.reduce((a,b)=>a+b)).toBe(925);
    f.attack.direction={x,y};let before=0;for(let i=0;i<7;i++){f.attack.age=(before+source.durationsMs[i]!/2)/1000/SPEED;expect(wardenPose(f).index).toBe(i);before+=source.durationsMs[i]!;}
    for(const [age,index]of [[.65,7],[.7251,8],[.7751,9],[.8251,10],[.8751,11],[1.199,11]]){f.attack.age=age!/SPEED;expect(wardenPose(f).index).toBe(index);}
  }
  f.attack.direction={x:1,y:0};f.attack.meleeVariant='a';expect(MELEE_A_CLIPS['east-melee-a']!.durationsMs.reduce((a,b)=>a+b)).toBeCloseTo(1200/1.3);f.attack.age=.8/SPEED;expect(wardenPose(f).index).toBe(9);
});
