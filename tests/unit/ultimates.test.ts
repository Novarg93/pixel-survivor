import { expect, it } from 'vitest';
import { World } from '../../src/game/systems/World';
import { chainStorm } from '../../src/game/ultimates/chainStorm';
import { ULTIMATE as C, type UltimateId } from '../../src/game/config/ultimates';
import { MageCastingController } from '../../src/game/art/MageCastingController';
function setup(id:UltimateId='lightning'){
  const w=new World(12345,{spawnRate:0});w.elapsed=601;w.experience.level=40;w.encounterDirector.nextAt=1e9;
  for(const a of Object.values(w.abilities))a.level=0;
  w.ultimate.choose(w,id);return w;
}
it('guarantees the three choices only on the eligible queued level; keeps XP curve/ranks and consumes exactly one pending choice',()=>{
  const w=new World();w.elapsed=599;w.experience.level=39;w.gainXp(2000);expect(w.choices.every(c=>!c.id.startsWith('ultimate-'))).toBe(true);
  w.selectUpgrade(w.choices[0].id);w.elapsed=601;w.gainXp(2000);expect(w.choices.map(c=>c.id)).toEqual(['ultimate-lightning','ultimate-frost','ultimate-fire']);
  const pending=w.experience.pending,rank=w.abilities.fireball.level;expect(w.selectUpgrade('ultimate-frost')).toBe(true);expect(w.experience.pending).toBe(pending-1);expect(w.abilities.fireball.level).toBe(rank);
  w.gainXp(6000);expect(w.choices.some(c=>c.id.startsWith('ultimate-'))).toBe(false);
  const before=new World();before.elapsed=601;before.experience.level=38;before.gainXp(2000);expect(before.choices.some(c=>c.id.startsWith('ultimate-'))).toBe(false);
});
it('charges only once per confirmed Blink, caps ten, rejects no-target/paused/upgrade activation and resets on death',()=>{
  const empty=setup();expect(empty.ultimate.charge).toBe(10);expect(empty.ultimate.activate(empty)).toBe(false);expect(empty.ultimate.charge).toBe(10);
  const w=setup('fire');expect(w.ultimate.charge).toBe(10);expect(w.ultimate.activate(w)).toBe(true);expect(w.ultimate.charge).toBe(0);expect(w.ultimate.activate(w)).toBe(false);
  for(let i=0;i<12;i++){w.mobility.readyAt=w.elapsed;expect(w.mobility.activate(w)).toBe(true);expect(w.mobility.activate(w)).toBe(false);w.ultimate.onBlink(w);expect(w.ultimate.charge).toBe(Math.min(10,i+1));}
  expect(w.ultimate.charge).toBe(10);w.elapsed=w.ultimate.activeUntil;w.ultimate.update(w);
  w.spawn('tank',{x:w.player.x+40,y:w.player.y});w.pause();expect(w.ultimate.activate(w)).toBe(false);w.status='upgrade';expect(w.ultimate.activate(w)).toBe(false);w.status='playing';expect(w.ultimate.activate(w)).toBe(true);expect(w.ultimate.charge).toBe(0);
  w.player.invulnerableUntil=w.mobility.protectedUntil=0;w.damagePlayer(1e9);expect(w.ultimate.selected).toBeNull();expect(w.ultimate.nodes).toHaveLength(0);
});

it.each(['lightning','frost','fire'] as const)('gives %s its first full charge once; later uses must be earned by Blink',id=>{
  const w=setup(id);w.spawn('tank',{x:50,y:0});expect(w.ultimate.charge).toBe(10);
  expect(w.ultimate.choose(w,id)).toBe(false);expect(w.ultimate.activate(w)).toBe(true);expect(w.ultimate.charge).toBe(0);
  for(let i=0;i<240;i++){w.elapsed+=.05;w.ultimate.update(w);}expect(w.ultimate.charge).toBe(0);expect(w.ultimate.activate(w)).toBe(false);
  w.mobility.readyAt=w.elapsed;w.mobility.activate(w);expect(w.ultimate.charge).toBe(1);expect(w.ultimate.choose(w,id)).toBe(false);expect(w.ultimate.charge).toBe(1);
});

it('uses exact 10-minute/level40 boundaries and never charges from Blink before the choice',()=>{
  const w=new World();w.elapsed=599.99;w.experience.level=40;expect(w.ultimate.eligible(w)).toBe(false);
  w.elapsed=600;w.experience.level=39;expect(w.ultimate.eligible(w)).toBe(false);w.experience.level=40;expect(w.ultimate.eligible(w)).toBe(true);
  w.mobility.activate(w);expect(w.ultimate.charge).toBe(0);w.ultimate.choose(w,'fire');expect(w.ultimate.charge).toBe(10);expect(w.ultimate.sequence).toBe(0);
});
it('builds parallel siblings with nearest neighbours, no cycles, gap or out-of-bound propagation',()=>{
  const w=setup();w.facing={x:1,y:0};const coords=[[30,0],[60,30],[60,-30],[90,0],[950,0],[1300,0]];
  coords.forEach(([x,y])=>w.spawn('tank',{x,y}));const nodes=chainStorm(w.player,w.facing,w.enemies,640,360);
  expect(nodes[0].at).toEqual({x:30,y:0});expect(nodes.filter(n=>n.parent===nodes[0].id)).toHaveLength(3);expect(new Set(nodes.map(n=>n.id)).size).toBe(nodes.length);expect(nodes).toHaveLength(4);
  expect(nodes.every(n=>Math.hypot(n.at.x-n.from.x,n.at.y-n.from.y)<=180)).toBe(true);
  expect(chainStorm(w.player,{x:-1,y:0},w.enemies,640,360)[0].id).toBe(nodes[0].id);
});
it('one atomic release survives dead graph nodes, applies multipliers once, respects boss caps, emits ash only on ultimate kills and resumes held movement',()=>{
  const w=setup();w.stats.damage=2;w.artifacts.grant(w,'damage');w.player.invulnerableUntil=1e9;w.facing={x:1,y:0};
  const first=w.spawn('tank',{x:30,y:0})!,second=w.spawn('tank',{x:70,y:0})!,boss=w.spawn('charger',{x:100,y:0})!;boss.boss!.until=1e9;
  second.hp=second.maxHp=1e6;const hp=second.hp,bhp=boss.hp;w.ultimate.charge=10;expect(w.ultimate.activate(w)).toBe(true);w.damageEnemy(first,1e9);
  for(let i=0;i<10;i++)w.step(.05,{x:1,y:0});expect(w.player.x).toBe(0);expect(second.hp).toBe(hp);
  w.step(.05,{x:1,y:0});expect(hp-second.hp).toBeCloseTo(C.lightning.damage*2*1.08);expect(bhp-boss.hp).toBeLessThanOrEqual(boss.maxHp*.12+1e-6);
  const after=second.hp;w.step(.05,{x:1,y:0});expect(second.hp).toBe(after);expect(w.player.x).toBeGreaterThan(0);expect(w.ultimate.ashes.some(a=>a.id===first.id)).toBe(false);expect(w.snapshot().ultimateDamage?.lightning).toBeGreaterThan(0);
});
it('Frost sweeps forward once, roots regulars, uses existing control resistance for bosses and Guardians',()=>{
  const w=setup('frost');w.facing={x:1,y:0};const a=w.spawn('tank',{x:80,y:0})!,behind=w.spawn('tank',{x:-80,y:0})!,side=w.spawn('tank',{x:80,y:180})!,boss=w.spawn('charger',{x:100,y:0})!,guardian=w.spawn('guardian',{x:100,y:30})!;
  for(const e of w.enemies)e.hp=e.maxHp=1e6;w.ultimate.charge=10;w.ultimate.activate(w);w.elapsed+=.3;w.ultimate.update(w);
  expect(a.freezeUntil).toBeGreaterThan(w.elapsed);expect(behind.hp).toBe(1e6);expect(side.hp).toBe(1e6);expect(boss.freezeUntil??0).toBe(0);expect(guardian.freezeUntil??0).toBe(0);expect(boss.novaSlowUntil).toBeGreaterThan(w.elapsed);
  const hp=a.hp;w.elapsed+=.1;w.ultimate.update(w);expect(a.hp).toBe(hp);
});
it('Fire has a shared per-target gate, finite trails including real Blink paths, ten game seconds and no invulnerability',()=>{
  const w=setup('fire'),e=w.spawn('tank',{x:40,y:0})!;e.hp=e.maxHp=1e6;w.ultimate.charge=10;w.ultimate.activate(w);const end=w.ultimate.activeUntil;
  w.ultimate.update(w);const hp=e.hp;w.elapsed+=.1;w.ultimate.update(w);expect(e.hp).toBe(hp);expect(w.player.invulnerableUntil).toBe(0);
  for(let i=0;i<30;i++){w.mobility.readyAt=w.elapsed;w.mobility.activate(w,{x:1,y:0});w.elapsed+=.01;w.ultimate.update(w);}
  expect(w.ultimate.trails.length).toBeLessThanOrEqual(12);expect(w.ultimate.trails.at(-1)?.to.x).toBe(w.player.x);
  w.pause();const frozen=w.ultimate.activeUntil;w.step(5);expect(w.ultimate.activeUntil).toBe(frozen);w.resume();w.elapsed=end;w.ultimate.update(w);expect(w.ultimate.trails).toHaveLength(0);expect(w.ultimate.snapshot(w.elapsed).remaining).toBe(0);
});

it('does not reach an out-of-area node through a bridge and never consumes RNG building the graph',()=>{
  const w=setup(),other=setup();w.facing={x:1,y:0};
  for(const x of [300,450,600,641,790])w.spawn('tank',{x,y:0});
  const nodes=chainStorm(w.player,w.facing,w.enemies,640,360);
  expect(nodes.map(n=>n.at.x)).toEqual([300,450,600]);expect(w.rng.next()).toBe(other.rng.next());
});
it('defers early level40 until a later level-up after ten minutes, preserves queued offers and Warrior eligibility',()=>{
  const w=new World();w.elapsed=599;w.experience.level=39;w.gainXp(2000);w.selectUpgrade(w.choices[0].id);
  w.elapsed=601;expect(w.status).toBe('playing');expect(w.choices).toHaveLength(0);
  w.gainXp(6000);expect(w.choices).toHaveLength(3);expect(w.choices.every(c=>c.id.startsWith('ultimate-'))).toBe(true);
  w.selectUpgrade('ultimate-lightning');expect(w.experience.pending).toBe(2);expect(w.status).toBe('upgrade');expect(w.choices.every(c=>!c.id.startsWith('ultimate-'))).toBe(true);
  const warrior=new World(1,{character:'warrior'});warrior.elapsed=1000;warrior.experience.level=60;expect(warrior.ultimate.eligible(warrior)).toBe(false);
});
it('ash is exclusive to ultimate kills and physics objects stay bounded through a 150 enemy atomic kill',()=>{
  const w=setup();w.experience.level=40;for(let i=0;i<150;i++)w.spawn('tank',{x:20+i%15*12,y:Math.floor(i/15)*10-50});
  const initial=w.enemies.map(e=>e.id);w.ultimate.charge=10;w.ultimate.activate(w);w.elapsed+=C.lightning.preparation;w.ultimate.update(w);
  expect(w.kills).toBe(150);expect(w.enemies).toHaveLength(0);expect(w.ultimate.ashes).toHaveLength(48);expect(w.projectiles).toHaveLength(0);expect(w.effects.length).toBeLessThanOrEqual(160);
  expect(w.ultimate.ashes.every(a=>initial.includes(a.id))).toBe(true);expect(w.orbs.length).toBeGreaterThan(0);
  w.player.invulnerableUntil=0;w.damagePlayer(1e9);expect(w.ultimate.ashes).toHaveLength(0);expect(w.ultimate.sequence).toBe(0);
});
it('the earning Blink cannot swallow ultimate hands, ultimate interrupts normal casts immediately and hurt resumes at the real age',()=>{
  const w=setup(),c=new MageCastingController();c.observe(w);c.request({ability:'meteor',rank:5,target:{x:80,y:0}},w.elapsed);
  w.mobility.activate(w,{x:1,y:0});c.observe(w);w.spawn('tank',{x:w.player.x+50,y:0});w.ultimate.charge=10;w.ultimate.activate(w);c.observe(w);
  expect(c.view(w.elapsed).active?.ability).toBe('ultimate-lightning');w.elapsed+=.62;c.observe(w);expect(c.view(w.elapsed).frame).toBe(4);
  w.player.hp-=10;c.observe(w);expect(c.view(w.elapsed).mode).toBe('hurt');w.elapsed+=.26;c.observe(w);expect(c.view(w.elapsed).active?.ability).toBe('ultimate-lightning');expect(c.view(w.elapsed).frame).toBe(5);
});
