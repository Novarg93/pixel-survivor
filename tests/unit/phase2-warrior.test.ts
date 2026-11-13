import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { eligibleUpgrades, applyUpgrade } from '../../src/game/systems/UpgradeSystem';
import { cleave, groundSlam, whirlwind, piercingThrow, ironSkin, tickWarrior } from '../../src/game/abilities/warrior';
it('starts tougher with only its own eligible skills, and restarts fresh', () => {const w=new World(1,{character:'warrior'});expect(w.player.hp).toBe(150);expect(w.abilities.cleave.level).toBe(1);expect(w.abilities.fireball.level).toBe(0);expect(eligibleUpgrades(w).some(u=>u.id==='unlock-frost')).toBe(false);expect(applyUpgrade(w,'unlock-slam')).toBe(true);expect(w.snapshot().abilities).toHaveLength(5);expect(new World(1,{character:'warrior'}).abilities.slam.level).toBe(0);});
it('all five warrior abilities have distinct real effects', () => {const w=new World(1,{character:'warrior'});for(const a of w.abilityDefinitions)w.abilities[a.id].level=3;const e=w.spawn('tank',{x:55,y:0})!;e.hp=1000;cleave(w);expect(e.hp).toBe(1000);w.elapsed=w.warrior.cleave!.hitAt;tickWarrior(w);expect(e.hp).toBe(950);whirlwind(w);tickWarrior(w);expect(e.hp).toBeLessThan(950);expect(groundSlam(w)).toBe(true);expect(w.impacts[0].source).toBe('slam');expect(piercingThrow(w)).toBe(true);expect(w.warrior.pendingSpear).toMatchObject({pierce:4,damage:66});w.elapsed=w.warrior.pendingSpear!.releaseAt;tickWarrior(w);expect(w.projectiles[0]).toMatchObject({source:'blades',hostile:false,pierce:4,damage:66});ironSkin(w);w.damagePlayer(100);expect(w.player.hp).toBe(150);expect(w.absorb).toBeCloseTo(4);});
it('survives a seeded two-minute collection pilot with melee spacing, real upgrades and Charge',()=>{
 const w=new World(31,{character:'warrior'});
 for(let i=0;i<7200&&w.status!=='over';i++){
  while(w.status==='upgrade'){
   const priorities=w.player.hp<80?['health','rank-cleave','unlock-whirlwind','damage']:['rank-cleave','unlock-whirlwind','damage','health','cooldown'];
   const choice=priorities.map(id=>w.choices.find(c=>c.id===id)).find(Boolean)??w.choices.find(c=>c.id.startsWith('unlock-'))??w.choices[0];
   w.selectUpgrade(choice!.id);
  }
  const enemies=[...w.enemies].sort((a,b)=>Math.hypot(a.x-w.player.x,a.y-w.player.y)-Math.hypot(b.x-w.player.x,b.y-w.player.y));
  const enemy=enemies[0],orb=[...w.orbs].sort((a,b)=>Math.hypot(a.x-w.player.x,a.y-w.player.y)-Math.hypot(b.x-w.player.x,b.y-w.player.y))[0];
  const dx=(enemy?.x??w.player.x)-w.player.x,dy=(enemy?.y??w.player.y)-w.player.y,distance=Math.hypot(dx,dy);
  // The old touch-kill pilot ran into contact and cancelled its own windups.
  // Circle inside sword reach; collect nearby drops without body-contact damage.
  const input=enemy&&distance<48?{x:-dx,y:-dy}:enemy&&distance<74?{x:-dy,y:dx}:orb?{x:orb.x-w.player.x,y:orb.y-w.player.y}:enemy?{x:dx,y:dy}:{x:1,y:0};
  const danger=enemies.filter(e=>Math.hypot(e.x-w.player.x,e.y-w.player.y)<48);
  if(danger.length>=2||enemy&&distance<30){
   const away=danger.reduce((p,e)=>({x:p.x+w.player.x-e.x,y:p.y+w.player.y-e.y}),{x:0,y:0});
   w.mobility.activate(w,away.x||away.y?away:input);
  }
  w.step(1/60,input);
 }
 expect(w.status,JSON.stringify({elapsed:w.elapsed,kills:w.kills,hp:w.player.hp})).not.toBe('over');
 expect(w.elapsed).toBeCloseTo(120,0);expect(w.kills).toBeGreaterThan(30);
 expect(w.snapshot().damageByAbility.find(a=>a.id==='cleave')!.damage).toBeGreaterThan(0);
});
