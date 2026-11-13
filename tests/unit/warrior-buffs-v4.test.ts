import {it,expect} from 'vitest';
import {World} from '../../src/game/systems/World';
import {ironSkin,piercingThrow,tickWarrior} from '../../src/game/abilities/warrior';
import {chooseUpgrades} from '../../src/game/systems/UpgradeSystem';
import {ULTIMATE} from '../../src/game/config/ultimates';
import {execFileSync} from 'node:child_process';
import process from 'node:process';

it('protects the explicit change scope and reuses the accepted Banner A object byte for byte',()=>{
 expect(execFileSync(process.execPath,['scripts/verify-warrior-buffs-v4.mjs'],{encoding:'utf8',windowsHide:true})).toContain('"bannerSourceUnchanged":true');
});

function quiet(){const w=new World(41,{character:'warrior',spawnRate:0});w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;return w;}
function banner(){const w=quiet();w.elapsed=300;w.experience.level=30;expect(w.ultimate.choose(w,'banner')).toBe(true);return w;}
it('widens only spear collision, snapshots area, preserves one hit per target and misses outside the new strip',()=>{
 const w=quiet();const side=w.spawn('tank',{x:60,y:22})!,outside=w.spawn('tank',{x:60,y:40})!;
 for(const e of w.enemies){e.hp=e.maxHp=1000;e.speed=e.damage=0;}
 w.shoot({x:0,y:0,vx:1000,vy:0,damage:42,pierce:6,source:'blades',hostile:false});
 w.step(.05);w.step(.05);expect(side.hp).toBe(958);expect(outside.hp).toBe(1000);w.step(.05);expect(side.hp).toBe(958);
 const other=quiet(),target=other.spawn('tank',{x:60,y:22})!;target.hp=1000;target.speed=0;
 other.shoot({x:0,y:0,vx:1000,vy:0,damage:42,source:'fireball',hostile:false});other.step(.05);other.step(.05);expect(target.hp).toBe(1000);
 const area=quiet();area.stats.area=2;area.abilities.blades.level=1;area.spawn('tank',{x:100,y:0});piercingThrow(area);expect(area.warrior.pendingSpear?.hitRadius).toBe(28);
 area.elapsed=area.warrior.pendingSpear!.releaseAt;tickWarrior(area);expect(area.projectiles[0]?.hitRadius).toBe(28);
});
it('Block Absorb is bounded, ranked, applied after armor/mitigation, refreshed without stacking and expires',()=>{
 const w=quiet();w.abilities.iron.level=1;ironSkin(w);expect(w.absorb).toBe(30);
 w.damagePlayer(100);expect(w.player.hp).toBeCloseTo(139);expect(w.absorb).toBe(0);
 ironSkin(w);ironSkin(w);expect(w.absorb).toBe(30);expect(w.snapshot().absorb).toBe(30);
 w.abilities.iron.level=5;w.player.maxHp=200;ironSkin(w);expect(w.absorb).toBe(80);
 w.elapsed=w.warrior.ironUntil;expect(w.absorb).toBe(0);w.clearTemporaryState();expect(w.blockShield.absorb).toBe(0);
});
it('Block intercepts fast swept hostile shots without consuming Absorb; friendly and off-radius shots remain',()=>{
 const w=quiet();w.abilities.iron.level=1;ironSkin(w);
 w.shoot({x:-120,y:0,vx:4800,vy:0,damage:100,hostile:true});w.shoot({x:-120,y:45,vx:4800,vy:0,damage:100,hostile:true});
 w.shoot({x:-120,y:0,vx:4800,vy:0,damage:1,hostile:false,source:'blades'});w.step(.05);
 expect(w.player.hp).toBe(150);expect(w.absorb).toBe(30);expect(w.projectiles).toHaveLength(2);expect(w.projectiles.some(p=>p.hostile&&p.y===0)).toBe(false);
 w.elapsed=w.warrior.ironUntil;w.shoot({x:-20,y:0,vx:800,vy:0,damage:100,hostile:true});w.step(.05);expect(w.player.hp).toBeCloseTo(68);
});
it('Warrior gets all three ultimates at the normal gate; Mage and Warrior reject each other ultimates',()=>{
 const w=quiet();w.elapsed=300;w.experience.level=30;const choices=chooseUpgrades(w);
 expect(choices).toHaveLength(3);expect(new Set(choices.map(c=>c.id)).size).toBe(3);expect(choices.filter(c=>c.id.startsWith('ultimate-')).map(c=>c.id)).toEqual(['ultimate-banner','ultimate-earthbreaker','ultimate-ruin']);
 expect(w.ultimate.choose(w,'fire')).toBe(false);expect(w.ultimate.choose(w,'banner')).toBe(true);expect(w.ultimate.charge).toBe(10);
 const mage=new World(1,{spawnRate:0});mage.elapsed=300;mage.experience.level=30;expect(mage.ultimate.choose(mage,'banner')).toBe(false);expect(chooseUpgrades(mage).map(c=>c.id)).toEqual(['ultimate-lightning','ultimate-frost','ultimate-fire']);
});
it('Banner heals 10% effective maxHP per game second for 15s only inside its anchored radius, without banked healing or overheal',()=>{
 const w=banner();w.player.hp=20;expect(w.ultimate.activate(w)).toBe(true);const at=w.ultimate.banner.started;
 w.elapsed=at+1;w.ultimate.update(w);expect(w.player.hp).toBe(35);w.ultimate.update(w);expect(w.player.hp).toBe(35);
 const anchor={...w.ultimate.banner.origin};w.player.x=anchor.x+ULTIMATE.banner.radius+1;w.player.y=anchor.y;w.elapsed++;w.ultimate.update(w);expect(w.player.hp).toBe(35);expect(w.ultimate.banner.origin).toEqual(anchor);
 w.player.x=0;w.elapsed++;w.ultimate.update(w);expect(w.player.hp).toBe(50);
 w.player.maxHp=200;w.elapsed++;w.ultimate.update(w);expect(w.player.hp).toBe(70);
 w.pause();w.step(5);w.ultimate.update(w);expect(w.player.hp).toBe(70);w.resume();
 w.elapsed=at+15;w.ultimate.update(w);expect(w.player.hp).toBe(200);w.player.hp=10;w.elapsed++;w.ultimate.update(w);expect(w.player.hp).toBe(10);
 expect(w.ultimate.snapshot(w.elapsed).remaining).toBe(0);w.clearTemporaryState();expect(w.ultimate.banner.started).toBe(-Infinity);
});
it('Banner spends one charge and refills only once for each actual successful Charge; death clears healing',()=>{
 const w=banner();w.ultimate.activate(w);expect(w.ultimate.charge).toBe(0);expect(w.ultimate.activate(w)).toBe(false);w.elapsed+=ULTIMATE.banner.bodyDuration;w.ultimate.update(w);
 for(let i=0;i<10;i++){w.mobility.clear();expect(w.mobility.activate(w,{x:1,y:0})).toBe(true);w.ultimate.onBlink(w);expect(w.ultimate.charge).toBe(i+1);}
 w.player.invulnerableUntil=w.mobility.protectedUntil=0;w.damagePlayer(1e9);expect(w.status).toBe('over');expect(w.ultimate.selected).toBeNull();w.elapsed++;w.ultimate.banner.update(w);expect(w.player.hp).toBe(0);
});
