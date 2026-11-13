import {it,expect} from 'vitest';
import {execFileSync} from 'node:child_process';
import process from 'node:process';
import {World} from '../../src/game/systems/World';
import {piercingThrow,tickWarrior,cleave} from '../../src/game/abilities/warrior';
import {WarriorHeroAnimation} from '../../src/game/art/WarriorHeroAnimation';
import {MAGE_DIRECTIONS} from '../../src/game/art/MageHeroAnimation';
import {WARRIOR_SKILLS,warriorSkillSelection,type WarriorSkill} from '../../src/game/art/warriorSkillsPack';
import {BALANCE} from '../../src/game/config/gameBalance';

function fixture(){
 const w=new World(17,{character:'warrior',spawnRate:0});w.encounterDirector.nextAt=Infinity;w.practice=true;
 for(const a of Object.values(w.abilities))a.level=0;
 for(const x of [45,90,135]){const e=w.spawn('tank',{x,y:0})!;e.speed=e.damage=0;e.hp=e.maxHp=10000;}
 return w;
}
it('verifies exact accepted RGBA, all production atlas frames and the explicit limited runtime scope',()=>{
 expect(execFileSync(process.execPath,['scripts/verify-warrior-cleave-v3.mjs'],{encoding:'utf8',windowsHide:true})).toContain('"unchanged":442');
 expect(execFileSync(process.execPath,['scripts/verify-warrior-skills-v1.mjs'],{encoding:'utf8',windowsHide:true})).toContain('"rgbaDifferences": 0');
});
it('plays all 156 accepted poses in 48 skill/direction routes with the chosen northern mirror',()=>{
 for(const d of MAGE_DIRECTIONS)for(const skill of Object.keys(WARRIOR_SKILLS.skills) as WarriorSkill[]){
  const first=warriorSkillSelection(d,skill,0),c=WARRIOR_SKILLS.clips[first.id as keyof typeof WARRIOR_SKILLS.clips];
  expect(first.id).toBe((d.startsWith('north')?'north-':'front-')+skill);
  expect(first.flipX).toBe(['west','south-west','north-west'].includes(d));
  for(let i=0;i<c.frames.length;i++)expect(warriorSkillSelection(d,skill,i*first.duration/c.frames.length).frame).toBe(c.frames[i]);
  expect(warriorSkillSelection(d,skill,100).index).toBe(c.frames.length-1);
 }
});
it('releases a physical spear after the authored windup, hits each target once and respects the shared pool cap',()=>{
 const w=fixture();w.abilities.blades.level=3;expect(piercingThrow(w)).toBe(true);expect(w.projectiles).toHaveLength(0);
 const a=new WarriorHeroAnimation();expect(a.view(w,false)).toMatchObject({motion:'throw',id:'front-throw',index:0});
 w.pause();w.step(.05);expect(w.elapsed).toBe(0);expect(w.projectiles).toHaveLength(0);w.resume();
 w.abilities.blades.level=0;
 for(let i=0;i<27;i++)w.step(.05);
 expect(w.enemies.map(e=>e.hp)).toEqual([9934,9934,9934]);
 expect(w.snapshot().damageByAbility.find(a=>a.id==='blades')!.damage).toBe(198);
 for(let i=0;i<BALANCE.projectileCap;i++)w.shoot({x:0,y:0,vx:0,vy:0,damage:0,hostile:false});
 expect(w.projectiles).toHaveLength(BALANCE.projectileCap);expect(piercingThrow(w)).toBe(false);
});
it('Charge and scene cleanup cancel an unreleased spear, and defeat cannot emit one later',()=>{
 const w=fixture();w.abilities.blades.level=1;piercingThrow(w);
 expect(w.mobility.activate(w,{x:0,y:-1})).toBe(true);expect(w.warrior.pendingSpear).toBeUndefined();
 w.elapsed=.4;tickWarrior(w);expect(w.projectiles).toHaveLength(0);
 piercingThrow(w);w.clearTemporaryState();expect(w.warrior.pendingSpear).toBeUndefined();
});
it('serializes special body gestures fairly while Cleave damage continues, even under fast cooldowns',()=>{
 const w=fixture(),art=new WarriorHeroAnimation(),seen=new Set<string>();
 for(const a of w.abilityDefinitions)w.abilities[a.id].level=5;w.stats.cooldown=.2;
 for(let i=0;i<480;i++){w.step(1/60);const before=JSON.stringify(w);seen.add(art.view(w,false).motion);expect(JSON.stringify(w)).toBe(before);}
 for(const motion of ['whirlwind','stomp','block','throw'])expect(seen.has(motion),motion).toBe(true);
 for(const id of ['cleave','whirlwind','slam','blades'])expect(w.snapshot().damageByAbility.find(a=>a.id===id)!.damage).toBeGreaterThan(0);
});
it('preserves the three accepted ordinary swings and inserts the accepted skill Cleave as a fourth full gesture',()=>{
 const w=fixture(),art=new WarriorHeroAnimation();w.abilities.cleave.level=1;
 const ids=[];for(let i=0;i<4;i++){cleave(w);const v=art.view(w,false);ids.push(v.id);w.elapsed+=v.duration+.01;tickWarrior(w);art.view(w,false);}
 expect(ids).toEqual(['front-c1','front-c3','front-heavy','front-cleave']);
});
