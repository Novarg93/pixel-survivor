import {expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import manifest from '../../src/game/art/ashWardenManifest.json';
import {WARDEN,wardenPose,wardenIndex} from '../../src/game/art/ashWardenPack';
import {World} from '../../src/game/systems/World';
import {FINAL_BOSS as C} from '../../src/game/config/finalBoss';
import {meleeContains,swordContains} from '../../src/game/systems/FinalEncounter';
import {findFinalEscape} from '../../src/game/systems/FinalDangerPlanner';
import {freezeForUltimate} from '../../src/game/systems/UltimateFreeze';
function tick(w:World,n:number){for(let t=0;t<n-1e-7;t+=.05)w.step(Math.min(.05,n-t));}
function setup(){const w=new World(42,{spawnRate:0});w.practice=true;w.experience.level=70;w.elapsed=1200;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);tick(w,C.intro);return w;}
it('packages unchanged accepted PNGs, complete atlas references and original canvas offsets within 16 MiB',()=>{
  expect(manifest.rgbaBytes).toBeLessThanOrEqual(16*1024*1024);
  for(const [file,hash]of Object.entries(manifest.sources))expect(createHash('sha256').update(readFileSync(file)).digest('hex'),file).toBe(hash);
  const atlases=Array.from({length:WARDEN.pages},(_,i)=>JSON.parse(readFileSync(`public/assets/hd/ash-warden-v1/${i}.json`,'utf8')));
  let bytes=0;for(const a of atlases){bytes+=a.meta.size.w*a.meta.size.h*4;for(const t of Object.values(a.frames) as {frame:{x:number;y:number;w:number;h:number};sourceSize:{w:number;h:number};spriteSourceSize:{x:number;y:number;w:number;h:number}}[]){expect(t.frame.x+t.frame.w).toBeLessThanOrEqual(a.meta.size.w);expect(t.frame.y+t.frame.h).toBeLessThanOrEqual(a.meta.size.h);expect(t.spriteSourceSize.x+t.frame.w).toBeLessThanOrEqual(t.sourceSize.w);expect(t.spriteSourceSize.y+t.frame.h).toBeLessThanOrEqual(t.sourceSize.h);}}
  expect(bytes).toBe(manifest.rgbaBytes);
  for(const c of Object.values(WARDEN.clips)){expect(c.frames).toHaveLength(c.durationsMs.length);for(const f of c.frames)for(const l of [...f.layers,...(f.overlay?[f.overlay]:[])])expect(atlases[WARDEN.locations[l.frame]!].frames[l.frame]).toBeDefined();}
});
it('retains variable frame durations and shared East/West layers and overlays',()=>{
  const clip=WARDEN.clips['south-melee']!;expect(clip.durationsMs.reduce((a,b)=>a+b)).toBe(1200);expect(wardenIndex(clip,.65)).toBe(7);expect(wardenIndex(clip,1.2)).toBe(11);
  for(const pose of ['idle','walk','melee']){const east=WARDEN.clips[`east-${pose}`]!,west=WARDEN.clips[`west-${pose}`]!;for(let i=0;i<east.frames.length;i++){expect(west.frames[i]!.layers).toEqual(east.frames[i]!.layers);expect(west.frames[i]!.overlay).toEqual(east.frames[i]!.overlay);expect(west.frames[i]!.flipX).toBe(true);}}
});
it('uses accepted South fallback without changing North combat direction',()=>{
  const f=setup().finalEncounter;f.attack={...f.attack,kind:'chargeTravel',direction:{x:0,y:-1}};const pose=wardenPose(f);expect(pose.clip).toBe('south-chargeTravel');expect(pose.combatDirection).toBe('north');expect(pose.presentationDirection).toBe('south');
  f.attack.kind='meteorCast';expect(wardenPose(f).clip).toBe('cast-north');
});
it('plays spawnReady once and does not permit invisible intro damage',()=>{
  const w=new World(7,{spawnRate:0});w.elapsed=1199.96;w.step(.05);const f=w.finalEncounter,e=f.boss!,hp=w.player.hp;expect(w.damageEnemy(e,1e9)).toBe(false);tick(w,2.2);expect(f.phase).toBe('intro');expect(w.player.hp).toBe(hp);tick(w,.1);expect(f.phase).toBe('phase1');expect(f.events.filter(e=>e.name==='spawnReady')).toHaveLength(1);
});
it('hits Basic Melee only at650ms, once, with independently latched aim',()=>{
  const w=setup(),f=w.finalEncounter,e=f.boss!;f.nextMelee=0;w.player.x=e.x+80;w.player.y=e.y;w.step(.05);expect(f.attack.kind).toBe('basicMelee');const id=f.attack.id;
  tick(w,.6);expect(w.player.hp).toBe(100);tick(w,.05);expect(w.player.hp).toBeLessThan(100);const hp=w.player.hp;tick(w,.5);expect(w.player.hp).toBe(hp);expect(f.events.filter(e=>e.instance===id&&e.name==='hitFrame')).toHaveLength(1);expect(f.attack.direction).toEqual({x:1,y:0});expect(meleeContains({x:e.x-80,y:e.y},e,{x:1,y:0})).toBe(false);
});
it('uses a narrow long Cleave strip and bounded speed adapted to three player builds',()=>{
  expect(swordContains({x:250,y:0},{x:0,y:0},{x:1,y:0})).toBe(true);expect(swordContains({x:120,y:60},{x:0,y:0},{x:1,y:0})).toBe(false);
  for(const speed of [135,210,400]){const w=setup(),f=w.finalEncounter,e=f.boss!;w.player.speed=speed;w.player.x=e.x+500;f.nextCombo=f.nextMeteor=Infinity;w.step(.05);expect(f.chaseSpeed).toBe(Math.min(C.chaseMax,Math.max(C.chaseMin,w.effectiveSpeed*C.chaseMultiplier)));expect(f.chaseSpeed).toBeLessThanOrEqual(C.chaseMax);}
});
it('locks a single Meteor target and preserves the full1300ms warning',()=>{
  const w=setup(),f=w.finalEncounter,e=f.boss!;w.player.x=e.x+450;f.nextMeteor=0;f.nextCombo=Infinity;w.step(.05);expect(f.attack.kind).toBe('meteorCast');expect(f.meteors).toHaveLength(1);const m=f.meteors[0]!,target={x:m.x,y:m.y};tick(w,1.25);expect(m.landed).toBe(false);w.player.y+=150;tick(w,.05);expect(m.landed).toBe(true);expect({x:m.x,y:m.y}).toEqual(target);
});
it.each([false,true])('staggered impacts never hit a future circle early and contact a group once: first overlaps=%s',overlap=>{
  const w=setup(),f=w.finalEncounter;f.phase='phase3';f.nextCombo=f.nextVolley=Infinity;w.player.x=0;w.player.y=0;
  f.meteors=[{id:100,group:10,owner:'arena',x:overlap?0:150,y:0,age:1.29,landed:false,warning:1.3},{id:101,group:10,owner:'arena',x:0,y:0,age:1.29,landed:false,warning:1.36}];
  const hurt=vi.spyOn(w,'damagePlayer');w.step(.05);expect(f.meteors[1]!.landed).toBe(false);expect(hurt).toHaveBeenCalledTimes(overlap?1:0);w.player.invulnerableUntil=0;w.step(.05);expect(hurt).toHaveBeenCalledTimes(1);expect(w.player.hp).toBe(46);tick(w,.7);expect(f.meteors).toHaveLength(0);
});
it('casts two shielded volleys, has immediate vulnerability and a three-second staged stagger',()=>{
  const w=setup(),f=w.finalEncounter;w.player.invulnerableUntil=1e9;w.damageEnemy(f.boss!,1e9);tick(w,C.transition);expect(f.supports.size).toBe(3);expect(w.combatTargets).not.toContain(f.boss);tick(w,3.4);expect(f.events.some(e=>e.name==='armageddonRelease')).toBe(true);expect(f.meteors.filter(m=>!m.landed)).toHaveLength(6);tick(w,1.6);expect(f.diagnostics.meteors).toBe(11);
  for(const g of [...w.guardians])w.damageEnemy(g,1e9);expect(f.shielded).toBe(false);expect(w.combatTargets).toContain(f.boss);expect(wardenPose(f).clip).toBe('shield-break');tick(w,1.1);expect(wardenPose(f).clip).toBe('stagger');tick(w,1.25);expect(wardenPose(f).clip).toBe('stagger-recover');tick(w,.65);expect(f.attack.kind).toBe('approach');
});
it('runs arena Armageddon during sword attacks, frozen AI and pause without catchup',()=>{
  const w=setup(),f=w.finalEncounter;f.phase='phase3';w.player.invulnerableUntil=1e9;f.nextVolley=0;f.nextCombo=Infinity;f.attack={...f.attack,kind:'swordWindup',duration:.9,age:0,direction:{x:1,y:0}};freezeForUltimate(f.boss!,w.elapsed,w.elapsed+20);const clock=f.bossClock;w.step(.05);expect(f.meteors.length).toBeGreaterThan(0);expect(f.attack.age).toBe(0);tick(w,1.6);expect(f.diagnostics.meteors).toBe(9);expect(f.bossClock).toBe(clock);w.pause();const before=JSON.stringify(f);tick(w,30);expect(JSON.stringify(f)).toBe(before);w.resume();tick(w,13.4);expect(f.diagnostics.meteors).toBeGreaterThan(9);
});
it('keeps a frozen Phase3 Walk pose and matching emission mask',()=>{
  const w=setup(),f=w.finalEncounter,e=f.boss!;f.phase='phase3';f.nextCombo=f.nextMeteor=Infinity;w.player.x=e.x+500;w.step(.05);const pose=wardenPose(f);expect(pose.clip).toBe('east-walk');expect(pose.frame.overlay).toBeTruthy();freezeForUltimate(e,w.elapsed,w.elapsed+5);tick(w,1);expect(wardenPose(f)).toEqual(pose);
});
it('reserves a walking route through overlapping danger timings, without Blink',()=>{
  const clamp=(p:{x:number;y:number})=>p;expect(findFinalEscape({x:0,y:0},135,[{kind:'circle',center:{x:0,y:0},radius:42,at:1.3,duration:.05},{kind:'strip',from:{x:0,y:0},to:{x:280,y:0},radius:22,at:.9,duration:.15}],clamp)).not.toBeNull();expect(findFinalEscape({x:0,y:0},0,[{kind:'circle',center:{x:0,y:0},radius:42,at:1.3,duration:.05}],clamp)).toBeNull();
});
it('latches victory immediately, retains Death A and sword events until completion, once',()=>{
  const w=setup(),f=w.finalEncounter,e=f.boss!;f.phase='phase3';e.hp=1;w.damageEnemy(e,100);expect(w.outcome).toBe('victory');expect(w.status).toBe('playing');expect(w.enemies).toContain(e);expect(w.damagePlayer(1e9)).toBe(false);expect(w.ultimate.activate(w)).toBe(false);expect(w.mobility.activate(w)).toBe(false);tick(w,.86);expect(f.events.some(e=>e.name==='swordRelease')).toBe(true);w.pause();const age=f.attack.age;tick(w,10);expect(f.attack.age).toBe(age);w.resume();tick(w,1.34);expect(w.status).toBe('over');expect(f.events.filter(e=>e.name==='deathAnimationComplete')).toHaveLength(1);expect(w.snapshot().killsByKind.ashGuard).toBe(1);expect(f.meteors).toHaveLength(0);
});
