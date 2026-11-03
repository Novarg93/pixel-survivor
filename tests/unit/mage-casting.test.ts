import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { MageCastingController, type MageSpell, type CastSignal } from '../../src/game/art/MageCastingController';
import { castingArmFrame, castingBodyFrame, castingDirection, mageCastingLayout } from '../../src/game/art/mageCastingPack';
import { castingHands } from '../../src/game/art/mageCastingPoses';
import { World } from '../../src/game/systems/World';
import { tickAbilities } from '../../src/game/abilities/tickAbilities';
const signal = (ability: MageSpell, extra: Partial<CastSignal> = {}): CastSignal => ({ ability, rank: 5, target: { x: 80, y: 0 }, ...extra });

it('keeps an active stroke progressing when casts repeat and stores at most one future stroke', () => {
  const c = new MageCastingController(); c.request(signal('fireball'), 0);
  for (const at of [.04,.08,.12,.16,.2]) { c.request(signal('fireball'), at); expect(c.view(at).active!.started).toBe(0); expect(c.view(at).pending).toBe(1); }
  expect(c.view(.2).frame).toBeGreaterThan(0); c.advance(.29); expect(c.view(.29).active!.started).toBe(.29); expect(c.view(.29).pending).toBe(0);
});
it('coalesces simultaneous casts by importance and gives defensive absorption a short priority stroke', () => {
  const c = new MageCastingController();
  for (const ability of ['meteor','frost','lightning','fireball'] as const) c.request(signal(ability), 0);
  expect(c.view(0).active!.ability).toBe('meteor'); expect(c.view(0).pending).toBe(1);
  c.request(signal('shield', { impact: true }), .12); expect(c.view(.12).active!.ability).toBe('shield'); expect(c.view(.12).active!.impact).toBe(true);
});
it('does not replay stale queued casts after a major gesture', () => {
  const c = new MageCastingController(); c.request(signal('meteor'), 0); c.request(signal('fireball'), 0);
  c.advance(1.31); expect(c.view(1.31).active).toBeUndefined(); expect(c.view(1.31).pending).toBe(0);
});
it('advances Armageddon hands on real impact pulses without restarting the summoning stroke', () => {
  const c = new MageCastingController(); c.request(signal('meteor'), 0);
  const phases = [];
  for (const at of [.85,1,1.15]) { c.request(signal('meteor', { impact: true }), at); const view=c.view(at); expect(view.active!.started).toBe(0); phases.push(view.frame); }
  expect(phases).toEqual([4,3,4]); expect(c.view(1.15).active!.beats).toBe(3); expect(c.started).toBe(1);
});
it('enforces death > hurt > Blink > casts and clears blocked pending gestures', () => {
  const c = new MageCastingController(); c.request(signal('meteor'), 0); c.interrupt('hurt', .05); c.interrupt('blink', .1);
  expect(c.view(.1).mode).toBe('hurt'); expect(c.view(.1).active).toBeUndefined();
  c.request(signal('frost'), .12); expect(c.view(.12).pending).toBe(0); c.advance(.31); expect(c.view(.31).mode).toBe('idle');
  c.interrupt('blink', .32); expect(c.view(.32).mode).toBe('blink'); c.interrupt('death', .35); c.interrupt('blink', 1);
  expect(c.view(1).mode).toBe('death'); c.clear(); expect(c.view(1).mode).toBe('idle');
});
it('keeps legs on their independent walk clock while the six hand phases run on cast time', () => {
  const c = new MageCastingController(); c.request(signal('frost'), 3);
  const bodies=new Set<string>(), hands=new Set<string>();
  for(let i=0;i<25;i++){const t=3+i/60;c.advance(t);bodies.add(castingBodyFrame('side',true,t));hands.add(castingArmFrame('frost',5,'right',c.view(t).frame));}
  expect(bodies.size).toBeGreaterThan(3);expect(hands.size).toBeGreaterThan(4);
});
it('survives ten minutes of overlapping high CDR requests without a growing queue or a frozen pose', () => {
  const c=new MageCastingController(), frames=new Set<number>();
  for(let i=0;i<36000;i++){const t=i/60;c.advance(t);if(i%42===0)c.request(signal('fireball'),t);if(i%50===0)c.request(signal('frost'),t);if(i%76===0)c.request(signal('lightning'),t);if(i%118===0)c.request(signal('meteor'),t);if(i%168===0)c.request(signal('shield'),t);const v=c.view(t);expect(v.pending).toBeLessThanOrEqual(1);expect(v.accents.length).toBeLessThanOrEqual(2);if(v.active)frames.add(v.frame);}
  expect(frames.size).toBe(6);expect(c.started).toBeGreaterThan(300);expect(c.coalesced+c.interrupted+c.dropped).toBeGreaterThan(100);expect(c.maxPending).toBe(1);
});
it('observes all five actual abilities before audio consumes the same events, without changing World or RNG', () => {
  const prepare=()=>{const w=new World(31,{spawnRate:0});w.spawn('tank',{x:65,y:-25})!.hp=1e6;for(const d of w.abilityDefinitions)w.abilities[d.id].level=5;tickAbilities(w);return w;};
  const w=prepare(), other=prepare(), c=new MageCastingController(), before=JSON.stringify(w);c.observe(w);
  expect(c.view(w.elapsed).requested).toEqual({fireball:1,frost:1,lightning:1,meteor:1,shield:1}); expect(JSON.stringify(w)).toBe(before);expect(w.rng.next()).toBe(other.rng.next());expect(w.feedbackEvents.filter(e=>e.type==='ability')).toHaveLength(5);
});
it('uses the actual distant Nova center and fireball flight direction instead of the player position', () => {
  const w=new World(7,{spawnRate:0});for(const a of Object.values(w.abilities))a.level=0;w.abilities.frost.level=1;w.spawn('tank',{x:150,y:-60})!.hp=1e6;tickAbilities(w);
  const c=new MageCastingController();c.observe(w);const frost=w.effects.find(e=>e.kind==='frost')!;expect(c.view(w.elapsed).active!.target).toEqual({x:frost.x,y:frost.y});expect(frost.x).toBeGreaterThan(100);
  w.feedbackEvents.length=0;w.abilities.frost.level=0;w.abilities.fireball.level=1;w.elapsed=1;tickAbilities(w);const d=new MageCastingController();d.observe(w);const p=w.projectiles[0], aim=d.view(w.elapsed).active!.target;
  expect(Math.atan2(aim.y-w.player.y,aim.x-w.player.x)).toBeCloseTo(Math.atan2(p.vy,p.vx));
});
it('freezes the arm phase on pause and repositions no gameplay state when Blink or damage interrupts', () => {
  const w=new World(9,{spawnRate:0}),c=new MageCastingController();c.observe(w);w.feedback({type:'ability',ability:'frost'});c.observe(w);w.feedbackEvents.length=0;w.elapsed=.13;c.observe(w);w.pause();const before=c.view(w.elapsed);w.step(.1,{x:1,y:0});c.observe(w);expect(c.view(w.elapsed)).toEqual(before);
  w.resume();w.mobility.activate(w,{x:1,y:0});c.observe(w);expect(c.view(w.elapsed).mode).toBe('blink');expect(c.view(w.elapsed).active).toBeUndefined();
  w.mobility.protectedUntil=0;w.damagePlayer(20);c.observe(w);expect(c.view(w.elapsed).mode).toBe('hurt');w.player.invulnerableUntil=0;w.damagePlayer(99999);c.observe(w);expect(c.view(w.elapsed).mode).toBe('death');
  c.observe(new World(10));expect(c.view(0).mode).toBe('idle');expect(c.view(0).pending).toBe(0);
});
it('reacts to real shield absorption without introducing invulnerability or fake health damage', () => {
  const w=new World(),c=new MageCastingController();w.abilities.shield.level=1;w.shield.refreshAbsorb(15,10);c.observe(w);w.damagePlayer(10);const before=JSON.stringify(w);c.observe(w);expect(c.view(0).active).toMatchObject({ability:'shield',impact:true});expect(w.player.hp).toBe(100);expect(w.shield.absorbValue(0)).toBe(5);expect(JSON.stringify(w)).toBe(before);
});
it('retains exact distant cast targets even when the bounded FX pool has no free slot', () => {
  const w=new World(71,{spawnRate:0});for(const a of Object.values(w.abilities))a.level=0;w.abilities.frost.level=1;w.spawn('tank',{x:150,y:-60})!.hp=1e6;
  for(let i=0;i<96;i++)w.effect('hit',w.player,1,0xffffff,10);
  tickAbilities(w);expect(w.effects.some(e=>e.kind==='frost')).toBe(false);
  const event=w.feedbackEvents.find(e=>e.type==='ability'&&e.ability==='frost');expect(event).toMatchObject({target:{x:150,y:-60}});
  const c=new MageCastingController(),before=JSON.stringify(w);c.observe(w);expect(c.view(w.elapsed).active!.target).toEqual({x:150,y:-60});expect(JSON.stringify(w)).toBe(before);
});
it('keeps the authored layout, directional palms and existing 24x30 pivot contract consistent', () => {
  const layout=mageCastingLayout(),manifest=JSON.parse(readFileSync('public/assets/hd/mage-casting.json','utf8')) as {frames:Record<string,{frame:{x:number;y:number;w:number;h:number}}>;meta:{origin:{x:number;y:number};worldSize:{width:number;height:number}}};
  expect(layout.frames).toHaveLength(222);expect(Object.keys(manifest.frames)).toHaveLength(222);expect(manifest.meta.origin).toEqual({x:.5,y:.75});expect(manifest.meta.worldSize).toEqual({width:24,height:30});
  for(const frame of layout.frames)expect(manifest.frames[frame.name].frame).toEqual(frame.frame);
  expect(castingDirection(-1,0)).toBe('left');expect(castingDirection(0,-1)).toBe('up');expect(castingHands('lightning',5,'right',2)).not.toEqual(castingHands('lightning',1,'right',2));
});
