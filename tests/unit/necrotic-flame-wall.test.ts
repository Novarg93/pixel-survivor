import {expect,it,vi} from 'vitest';
import {World} from '../../src/game/systems/World';
import {inNecroticSegment,necroticPhase} from '../../src/game/systems/NecroticFlameWalls';
import {freezeForUltimate} from '../../src/game/systems/UltimateFreeze';
import {astralRevenantViews,necroticGroundViews} from '../../src/game/art/AstralRevenantArt';
import {NECROTIC_FLAME as C} from '../../src/game/config/astralRevenant';

function arena(){
  const w=new World(42,{spawnRate:0});w.elapsed=20;w.encounterDirector.nextAt=Infinity;
  for(const a of Object.values(w.abilities))a.level=0;
  const e=w.spawn('eclipse',{x:180,y:0})!;e.boss!.until=Infinity;
  w.necroticFlames.queue(w,e,w.elapsed+1);
  return {w,e,z:w.zones[1]!};
}
function tick(w:World,seconds:number){for(let t=0;t<seconds-1e-8;t+=.025)w.step(Math.min(.025,seconds-t));}

it('places four adjoining fixed ground footprints, shares the24-zone budget and snapshots the caster damage',()=>{
  const {w,e}=arena();expect(w.zones.map(z=>z.x)).toEqual([-51,-17,17,51]);expect(w.impacts).toEqual([]);
  expect(w.zones.every(z=>z.y===0&&z.necrotic?.halfWidth===17&&z.necrotic.halfDepth===10&&z.damage===e.damage*.35)).toBe(true);
  w.player.x=500;expect(w.zones.map(z=>z.x)).toEqual([-51,-17,17,51]);
  for(let i=0;i<18;i++)w.addZone({x:500,y:500},10,1,5,'fireball');
  w.impacts.push({id:w.id(),x:500,y:500,radius:1,damage:1,landAt:100,hostile:false});
  w.necroticFlames.queue(w,e,22);expect(w.impacts.length+w.zones.length).toBe(24);expect(w.zones.filter(z=>z.necrotic)).toHaveLength(5);
});
it('uses a shallow rectangle against the player radius, including adjacent segment seams and rounded corners',()=>{
  const {z}=arena();expect(inNecroticSegment(z,{x:z.x,y:z.y})).toBe(true);
  expect(inNecroticSegment(z,{x:z.x+17,y:z.y})).toBe(true);
  expect(inNecroticSegment(z,{x:z.x,y:z.y+18.99})).toBe(true);
  expect(inNecroticSegment(z,{x:z.x,y:z.y+19})).toBe(false);
  expect(inNecroticSegment(z,{x:z.x+24,y:z.y+17})).toBe(false);
  expect(inNecroticSegment(z,{x:z.x+23,y:z.y+16})).toBe(true);
});
it('damages once per second only in idle, with harmless warning, reverse spawn and forward vanish',()=>{
  const {w,z}=arena(),n=z.necrotic!,hit=vi.spyOn(w,'damagePlayer'),hp=w.player.hp;
  for(const t of [n.born,n.spawnAt-.001,n.spawnAt,n.activeAt-.001]){w.elapsed=t;w.necroticFlames.update(w);}
  expect(hit).not.toHaveBeenCalled();
  for(const t of [n.activeAt,n.activeAt+.5,n.activeAt+1,n.activeAt+1.99,n.activeAt+2]){w.elapsed=t;w.necroticFlames.update(w);}
  expect(hit).toHaveBeenCalledTimes(3);expect(w.player.hp).toBeCloseTo(hp-3*z.damage);
  w.elapsed=n.fadeAt;w.necroticFlames.update(w);w.elapsed=z.expires-.001;w.necroticFlames.update(w);expect(hit).toHaveBeenCalledTimes(3);
});
it('stops damage outside the footprint and prevents immediate extra ticks when crossing segments or reentering',()=>{
  const {w,z}=arena(),hit=vi.spyOn(w,'damagePlayer');w.elapsed=z.necrotic!.activeAt;w.necroticFlames.update(w);
  w.player.y=50;w.elapsed+=1.1;w.necroticFlames.update(w);expect(hit).toHaveBeenCalledTimes(1);
  w.player.y=0;w.necroticFlames.update(w);expect(hit).toHaveBeenCalledTimes(2);
  w.player.x=51;w.elapsed+=.1;w.necroticFlames.update(w);expect(hit).toHaveBeenCalledTimes(2);
  w.player.y=50;w.player.y=0;w.necroticFlames.update(w);expect(hit).toHaveBeenCalledTimes(2);
});
it('never stacks ticks or shield depletion at seams, even with overlapping walls from two owners',()=>{
  const {w,z}=arena(),other=w.spawn('eclipse',{x:-180,y:0})!;w.necroticFlames.queue(w,other,z.necrotic!.spawnAt);
  w.shield.refreshAbsorb(100,100);w.elapsed=z.necrotic!.activeAt;const hp=w.player.hp;
  w.necroticFlames.update(w);w.necroticFlames.update(w);expect(w.shield.absorbValue(w.elapsed)).toBeCloseTo(100-z.damage);expect(w.player.hp).toBe(hp);
  w.clearOwnedEffects(other.id);w.player.x=51;w.necroticFlames.update(w);expect(w.shield.absorbValue(w.elapsed)).toBeCloseTo(100-z.damage);
});
it.each(['invulnerability','mobility','ultimate']as const)('respects existing %s protection without a deferred damage burst',protection=>{
  const {w,z}=arena();w.elapsed=z.necrotic!.activeAt;const hp=w.player.hp,until=w.elapsed+.5;
  if(protection==='invulnerability')w.player.invulnerableUntil=until;
  else if(protection==='mobility')w.mobility.protectedUntil=until;
  else{w.ultimate.selected='lightning';w.ultimate.started=w.elapsed;}
  w.necroticFlames.update(w);expect(w.player.hp).toBe(hp);
  w.player.invulnerableUntil=0;w.mobility.protectedUntil=0;w.ultimate.clear();w.elapsed+=.6;w.necroticFlames.update(w);expect(w.player.hp).toBe(hp);
  w.elapsed+=.4;w.necroticFlames.update(w);expect(w.player.hp).toBeLessThan(hp);
});
it('has no catch-up burst after a large simulation jump and never applies hostile fire to enemies',()=>{
  const {w,e,z}=arena(),hit=vi.spyOn(w,'damagePlayer'),enemyHp=e.hp;
  e.x=0;e.y=0;e.boss!.contactSafeUntil=Infinity;w.elapsed=z.necrotic!.activeAt+2.5;w.step(.025);
  expect(hit).toHaveBeenCalledTimes(1);expect(e.hp).toBe(enemyHp);expect(w.player.hp).toBeCloseTo(w.player.maxHp-z.damage);
  w.elapsed=z.necrotic!.fadeAt;w.step(.025);expect(hit).toHaveBeenCalledTimes(1);
});
it.each(['warning','spawn','idle','vanish']as const)('holds the complete %s phase on owner freeze and resumes without catch-up',phase=>{
  const {w,e,z}=arena(),n=z.necrotic!;
  w.elapsed=(phase==='warning'?n.born:phase==='spawn'?n.spawnAt:phase==='idle'?n.activeAt:n.fadeAt)+.2;
  const relative=z.expires-w.elapsed,frame=astralRevenantViews(w,1),glow=necroticGroundViews(w,1),hp=w.player.hp;
  expect(necroticPhase(z,w.elapsed)).toBe(phase);freezeForUltimate(e,w.elapsed,w.elapsed+.5);tick(w,.4);
  expect(z.expires-w.elapsed).toBeCloseTo(relative);expect(astralRevenantViews(w,1)).toEqual(frame);expect(necroticGroundViews(w,1)).toEqual(glow);expect(w.player.hp).toBe(hp);
  tick(w,.125);expect(z.expires-w.elapsed).toBeCloseTo(relative-.025);
});
it('pauses all state, removes segments on owner death/despawn and clears damage clocks on reset',()=>{
  const {w,e,z}=arena();w.elapsed=z.necrotic!.activeAt;w.necroticFlames.update(w);w.pause();const before=JSON.stringify(w);tick(w,1);expect(JSON.stringify(w)).toBe(before);w.resume();
  w.damageEnemy(e,1e9);expect(w.zones).toEqual([]);
  const next=w.spawn('eclipse',{x:180,y:0})!;next.boss!.until=Infinity;w.necroticFlames.queue(w,next,w.elapsed-C.spawn);const hp=w.player.hp;w.player.invulnerableUntil=0;w.necroticFlames.update(w);expect(w.player.hp).toBeLessThan(hp);
  next.x=10000;w.step(.025);expect(w.zones).toEqual([]);expect(w.bosses).toEqual([]);
  w.clearTemporaryState();expect(necroticGroundViews(w,1)).toEqual([]);
});
