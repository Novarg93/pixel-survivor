import {it,expect} from 'vitest';
import {World} from '../../src/game/systems/World';
import {steerGuardianOrb} from '../../src/game/systems/GuardianOrbs';
import {distance,direction} from '../../src/game/utils/math';
function setup(character:'mage'|'warrior'='mage'){const w=new World(12345,{spawnRate:0,character});w.elapsed=720;w.encounterDirector.nextAt=1e6;for(const a of Object.values(w.abilities))a.level=0;const e=w.spawn('guardian',{x:-120,y:0})!;e.discovered=true;w.damageEnemy(e,1);return{w,e};}
function advance(w:World,seconds:number){for(let i=0;i<Math.ceil(seconds/.05);i++)w.step(.05);}
it('launches slow then fast10s later; cadence is fixed and caps2 per owner/48 globally',()=>{
  const {w,e}=setup();w.player.invulnerableUntil=1e6;const shots:{at:number;variant:string}[]=[],shoot=w.shoot.bind(w);w.shoot=p=>{const n=w.projectiles.length;shoot(p);if(p.homing&&w.projectiles.length>n)shots.push({at:w.elapsed,variant:p.homing.variant});};
  for(let i=0;i<900;i++){w.step(.05);expect(w.projectiles.filter(p=>p.ownerId===e.id&&p.homing).length).toBeLessThanOrEqual(2);expect(w.projectiles.filter(p=>p.hostile).length).toBeLessThanOrEqual(48);}
  expect(shots.slice(0,3).map(s=>s.variant)).toEqual(['slow','fast','slow']);expect(shots[1].at-shots[0].at).toBeCloseTo(10,1);expect(w.impacts).toHaveLength(0);expect(e.x).toBe(-120);
});
it('clamps steering angular velocity rather than snapping to the player',()=>{
  const {w}=setup();advance(w,1.1);const p=w.projectiles.find(p=>p.homing)!;p.x=-60;p.y=0;p.vx=p.homing!.speed;p.vy=0;w.player.x=-60;w.player.y=100;
  steerGuardianOrb(w,p,.1);expect(Math.atan2(p.vy,p.vx)).toBeCloseTo(.07);expect(Math.hypot(p.vx,p.vy)).toBeCloseTo(p.homing!.speed);
});
it('damages a stationary player once per impact and removes that projectile',()=>{
  const {w}=setup();advance(w,3);expect(w.player.hp).toBeLessThan(100);const hp=w.player.hp;advance(w,.5);expect(w.player.hp).toBe(hp);expect(w.projectiles).toHaveLength(0);
});
it('allows ordinary tangential movement to evade both speeds without test invulnerability',()=>{
  const {w,e}=setup();for(let i=0;i<500;i++){const dx=w.player.x-e.x,dy=w.player.y-e.y;w.step(.05,direction(-dy,dx));}expect(w.player.hp).toBe(100);expect(w.guardians).toHaveLength(1);
});
it.each(['mage','warrior'] as const)('allows legal%s mobility to evade an incoming orb',hero=>{
  const {w,e}=setup(hero);for(let i=0;i<100;i++){w.step(.05);if(w.projectiles.some(p=>p.homing&&distance(p,w.player)<45))break;}
  expect(w.mobility.activate(w,{x:0,y:1})).toBe(true);for(let i=0;i<240;i++){const dx=w.player.x-e.x,dy=w.player.y-e.y;w.step(.05,direction(-dy,dx));}expect(w.player.hp).toBe(w.player.maxHp);expect(w.player.invulnerableUntil).toBe(0);
});
it.each(['kill','leave','death','dispose'] as const)('cleans owner orbs on%s without duplicate rewards',reason=>{
  const {w,e}=setup();advance(w,1.1);expect(w.projectiles.some(p=>p.ownerId===e.id&&p.homing)).toBe(true);
  if(reason==='kill')w.damageEnemy(e,1e9);else if(reason==='leave'){w.player.x=2000;w.step(.05);}else if(reason==='death')w.damagePlayer(1e9);else w.clearTemporaryState();
  expect(w.projectiles.filter(p=>p.ownerId===e.id)).toHaveLength(0);expect(w.artifacts.snapshot()).toHaveLength(reason==='kill'?1:0);
});
it.each(['lifetime','travel','range'] as const)('expires by%s; pooled straight shots forget homing',reason=>{
  const {w,e}=setup();advance(w,1.1);const p=w.projectiles[0];if(reason==='travel')p.homing!.travelled=1801;else if(reason==='lifetime')p.expires=w.elapsed;else p.x=e.x+p.homing!.maxDistance+10;w.step(.05);expect(w.projectiles).toHaveLength(0);
  w.shoot({x:200,y:0,vx:1,vy:0,damage:1,hostile:true});expect(w.projectiles[0].homing).toBeUndefined();expect(new World().projectiles).toHaveLength(0);
});
it('hard-caps homing projectiles per owner even through the shared shoot entry point',()=>{
  const {w,e}=setup();for(let i=0;i<4;i++)w.shoot({x:-180,y:0,vx:80,vy:0,damage:20,hostile:true,ownerId:e.id,homing:{variant:'slow',speed:80,turnRate:.7,travelled:0,maxDistance:260}});expect(w.projectiles).toHaveLength(2);
});
it('pauses warnings, homing position and expiry; switching at10:00 cancels legacy hazards',()=>{
  const {w,e}=setup();advance(w,1.1);w.pause();const before=JSON.stringify(w.projectiles);advance(w,10);expect(JSON.stringify(w.projectiles)).toBe(before);w.resume();
  const s=w.guardianSystem.encounters.get(e.id)!;s.phase='beam';w.impacts.push({id:w.id(),x:0,y:0,radius:30,damage:22,hostile:true,ownerId:e.id,landAt:1000});w.step(.05);expect(s.phase).toBe('orb-warning');expect(w.impacts).toHaveLength(0);
});
