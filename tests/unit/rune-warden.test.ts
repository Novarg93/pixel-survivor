import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {World} from '../../src/game/systems/World';
import {updateBoss} from '../../src/game/systems/BossSystem';
import {updateMagicTeleport,fireBossVolley} from '../../src/game/systems/BossMagic';
import {BossAnimation} from '../../src/game/art/BossAnimation';
import {drawEnrageDanger} from '../../src/game/art/EncounterArt';
import {runeWardenViews} from '../../src/game/art/RuneWardenArt';
import {runeBodyFrame,runeVolleyFrame,runeFrameIndex,runeJudgementFrame,runeFlashOpacity,RUNE_WARDEN_MANIFEST as pack} from '../../src/game/art/runeWardenPack';
import {RUNE_WARDEN_VFX as C,ARCANE_VOLLEY} from '../../src/game/config/runeWarden';
import {MAGIC_ATTACKS} from '../../src/game/config/bossEnrage';
import {enemyVisual,visualDimensions,selectAsset} from '../../src/game/art/assetRegistry';
import {freezeForUltimate} from '../../src/game/systems/UltimateFreeze';
import atlas from '../../public/assets/hd/rune-warden-v1/atlas.json';

function quiet(){const w=new World(42,{spawnRate:0});w.encounterDirector.nextAt=1e6;for(const a of Object.values(w.abilities))a.level=0;return w;}
function tick(w:World,seconds:number){for(let t=0;t<seconds-1e-8;t+=.025)w.step(Math.min(.025,seconds-t));}
it('imports original sheets without changing any user file and contains only horizontal body projections',()=>{
  for(const [file,hash]of Object.entries(pack.sources))expect(createHash('sha256').update(readFileSync(file)).digest('hex'),file).toBe(hash);
  expect(Object.keys(atlas.frames)).toHaveLength(101);expect(pack.rgbaBytes).toBe(1056*1716*4);
  for(const [id,c]of Object.entries(pack.clips)){
    expect(c.frames.map(f=>f.alphaDifferences)).toEqual(id==='judgement'?[...Array(13).fill(0),80,240,25072]:c.frames.map(()=>0));
    expect(c.alphaSource).toBe('png');expect(c.durationsMs.every(ms=>ms===150)).toBe(true);
  }
  expect(pack.clips.judgement.sheet).toContain('1338804019');expect(pack.sources).toHaveProperty('art/rune-warden/skills/runic-judgement/make_a_rune_it_l_wil...-1072504761-0.png');
  expect(pack.judgementPivot).toEqual([64,64]);expect(pack.judgementDiameter).toBe(94);expect(pack.judgementHitFrame).toBe(12);
  expect(Object.keys(atlas.frames).some(f=>/-(up|down|north|south)-/.test(f))).toBe(false);
  const bytes=readFileSync('public/assets/hd/rune-warden-v1/atlas.png'),chunks:Buffer[]=[];
  for(let p=8;p<bytes.length;){const n=bytes.readUInt32BE(p);if(bytes.toString('ascii',p+4,p+8)==='IDAT')chunks.push(bytes.subarray(p+8,p+8+n));p+=n+12;}
  const raw=inflateSync(Buffer.concat(chunks)),stride=pack.width*4+1;
  const pixels=(name:string)=>{const f=(atlas.frames as Record<string,{frame:{x:number;y:number;w:number;h:number}}>)[name]!.frame,out=Buffer.alloc(128*128*4);for(let y=0;y<128;y++)raw.copy(out,y*512,(f.y+y)*stride+1+f.x*4,(f.y+y)*stride+1+f.x*4+512);return out;};
  for(const clip of ['walk','cast'])for(let i=0;i<12;i++){
    const right=pixels(`sorcerer-1-right-${clip}-${i}`),left=pixels(`sorcerer-1-left-${clip}-${i}`),mirror=Buffer.alloc(right.length);
    for(let y=0;y<128;y++)for(let x=0;x<128;x++)right.copy(mirror,(y*128+x)*4,(y*128+127-x)*4,(y*128+128-x)*4);
    expect(left.equals(mirror)).toBe(true);
  }
  for(const {frame:f}of Object.values(atlas.frames)){
    expect(f.w).toBe(128);expect(f.h).toBe(128);expect(f.x+f.w+2).toBeLessThanOrEqual(pack.width);expect(f.y+f.h+2).toBeLessThanOrEqual(pack.height);
    for(let y=f.y-2;y<f.y+130;y++)for(const x of [f.x-2,f.x-1,f.x+128,f.x+129])if(raw[y*stride+1+x*4+3])throw Error('Atlas bleed');
  }
});
it('keeps the existing body footprint and uses all walk/cast frames without flight dissipation loops',()=>{
  expect(enemyVisual('sorcerer',false,0,1).texture).toBe('rune-warden-v1');expect(visualDimensions(enemyVisual('sorcerer',false,0,1)).width).toBeCloseTo(57.6);
  for(let i=0;i<12;i++){expect(runeBodyFrame('left','walk',i*.15+.001)).toBe(`sorcerer-1-left-walk-${i}`);expect(runeBodyFrame('right','windup',i/12,1-i/12)).toBe(`sorcerer-1-right-cast-${i}`);}
  expect(runeBodyFrame('right','attack',0)).toBe('sorcerer-1-right-cast-11');
  for(let i=0;i<300;i++)expect(runeVolleyFrame(i*.01)).not.toBe('volley-11');
  expect(runeFrameIndex('volley-impact',99)).toBe(10);
});
it('increases Arcane Volley and its matching impact from40 to52world units without moving the contact pivot',()=>{
  expect(visualDimensions(selectAsset('runeVolley'))).toEqual({width:40*1.3,height:40*1.3});
  const w=quiet();w.effect('arcane-impact',{x:10,y:20},16,0xffffff,C.impact,{x:100,y:0});
  expect(runeWardenViews(w,1)[0]).toMatchObject({size:52,x:10,y:20,originX:104/128,originY:.5});
});
it.each([20,630,1500])('doubles the real Rune volley speed at%ss, preserving late scaling, damage and lifetime',time=>{
  const w=quiet();w.elapsed=time;const e=w.spawn('sorcerer',{x:200,y:0})!,b=e.boss!;
  b.phase='windup';b.until=w.elapsed;b.aim={x:0,y:0};updateBoss(w,e,.01);
  const expected=(time<600?100:MAGIC_ATTACKS.sorcerer.speed)*(b.late?.projectile??1)*ARCANE_VOLLEY.speedScale;
  expect(w.projectiles.length).toBeGreaterThan(0);
  for(const p of w.projectiles){expect(Math.hypot(p.vx,p.vy)).toBeCloseTo(expected,8);expect(p.damage).toBe(e.damage);expect(p.expires-w.elapsed).toBe(2.5);expect(p.appearance).toBe('arcane-volley');}
});
it('also doubles the actual volley released after Blink preparation',()=>{
  const w=quiet();w.elapsed=630;const e=w.spawn('sorcerer',{x:100,y:0})!;e.boss!.magic!.nextAt=w.elapsed;
  updateMagicTeleport(w,e);w.elapsed=e.boss!.until+.001;updateMagicTeleport(w,e);expect(e.boss!.magic!.phase).toBe('prepare');
  w.elapsed=e.boss!.until+.001;updateMagicTeleport(w,e);expect(w.projectiles).toHaveLength(3);
  for(const p of w.projectiles)expect(Math.hypot(p.vx,p.vy)).toBeCloseTo(210,8);
});
it('keeps Eclipse volley speed unchanged',()=>{
  const w=quiet();w.elapsed=1500;const e=w.spawn('eclipse',{x:200,y:0})!;fireBossVolley(w,e);
  expect(w.projectiles.length).toBeGreaterThan(0);for(const p of w.projectiles)expect(Math.hypot(p.vx,p.vy)).toBeCloseTo(MAGIC_ATTACKS.eclipse.speed*(e.boss!.late?.projectile??1),8);
});
it('removes Rune volley direction ticks in both windups while retaining Eclipse warnings and all simulation state',()=>{
  const w=quiet();w.elapsed=630;const rune=w.spawn('sorcerer',{x:200,y:0})!,eclipse=w.spawn('eclipse',{x:-200,y:0})!;
  w.elapsed+=2;updateBoss(w,rune,.01);updateBoss(w,eclipse,.01);
  let lines=0;const graphics={lineStyle:()=>graphics,lineBetween:()=>{lines++;return graphics;}};
  const draw=()=>{lines=0;const before=JSON.stringify(w);drawEnrageDanger(graphics as unknown as Parameters<typeof drawEnrageDanger>[0],w);expect(JSON.stringify(w)).toBe(before);return lines;};
  w.enemies=[rune];expect(rune.boss!.phase).toBe('windup');expect(draw()).toBe(0);
  rune.boss!.magic!.phase='prepare';expect(draw()).toBe(0);
  w.enemies=[eclipse];expect(eclipse.boss!.phase).toBe('windup');expect(draw()).toBeGreaterThan(0);
});
it('shows the new circular rune, charges it before the real hit and fades the flash once without extra damage',()=>{
  const w=quiet(),e=w.spawn('sorcerer',{x:200,y:0})!;w.elapsed=2;updateBoss(w,e,.01);
  const positions=w.impacts.map(i=>[i.x,i.y]),landing=e.boss!.until;
  expect(w.impacts.every(i=>i.appearance==='runic-judgement')).toBe(true);expect(runeWardenViews(w,1).map(v=>[v.x,v.y])).toEqual(positions);
  w.elapsed=landing-.03;w.step(.02);expect(w.player.hp).toBe(100);expect(runeWardenViews(w,1).every(v=>v.frame==='judgement-11')).toBe(true);
  w.step(.02);expect(w.player.hp).toBe(78);expect(w.impacts).toHaveLength(0);
  expect(w.projectiles).toHaveLength(5);expect(w.projectiles.every(p=>p.appearance==='arcane-volley')).toBe(true);
  const explosion=w.effects.find(e=>e.kind==='runic-judgement')!;expect(explosion.ownerId).toBe(e.id);
  const bursts=runeWardenViews(w,1).filter(v=>v.frame==='judgement-12');expect(bursts).toHaveLength(3);
  expect(bursts.every(v=>v.originY===.5&&v.size===38*2*128/94)).toBe(true);
  e.boss!.until=1e6;w.projectiles=[];
  w.elapsed=explosion.started+C.judgement-.025;const last=runeWardenViews(w,1);expect(last.every(v=>v.frame==='judgement-15'&&v.alpha<.01)).toBe(true);
  w.elapsed=explosion.started+C.judgement;expect(runeWardenViews(w,1)).toEqual([]);expect(w.player.hp).toBe(78);
});
it('plays every V2 charge frame before contact and every burst frame from contact, without looping the white tail',()=>{
  expect(pack.clips.judgement.frameCount).toBe(16);
  for(let i=0;i<12;i++)expect(runeJudgementFrame('charge',(i+.1)/12)).toBe(`judgement-${i}`);
  for(let i=0;i<4;i++)expect(runeJudgementFrame('impact',(i+.1)/4)).toBe(`judgement-${12+i}`);
  expect(runeJudgementFrame('charge',1)).toBe('judgement-11');expect(runeJudgementFrame('impact',1)).toBe('judgement-15');
  const w=quiet(),e=w.spawn('sorcerer',{x:200,y:0})!;w.elapsed=2;updateBoss(w,e,.01);
  const land=e.boss!.until,positions=w.impacts.map(i=>[i.x,i.y]);
  w.elapsed=land-C.judgementCharge;expect(runeWardenViews(w,1).every(v=>v.frame==='judgement-0'&&v.depth<0)).toBe(true);
  w.elapsed=land-.001;expect(runeWardenViews(w,1).every(v=>v.frame==='judgement-11')).toBe(true);
  expect(runeWardenViews(w,1).map(v=>[v.x,v.y])).toEqual(positions);expect(w.player.hp).toBe(100);
});
it('feathers the opaque flash edges around one fixed pivot while preserving the core',()=>{
  expect(runeFlashOpacity(64,64)).toBe(1);expect(runeFlashOpacity(40,40)).toBe(1);
  for(const p of [[0,0],[127,127],[0,64],[64,0],[127,64],[64,127]])expect(runeFlashOpacity(p[0]!,p[1]!)).toBe(0);
  expect(runeFlashOpacity(12,64)).toBeGreaterThan(0);expect(runeFlashOpacity(12,64)).toBeLessThan(1);expect(runeFlashOpacity(12,64)).toBe(runeFlashOpacity(115,64));
});
it.each(['collision','expiry'] as const)('plays Arcane Volley impact exactly once on %s and preserves the direction',reason=>{
  const w=quiet(),e=w.spawn('sorcerer',{x:220,y:0})!;e.boss!.until=1e6;
  w.shoot({x:reason==='collision'?5:100,y:0,vx:-100,vy:0,hostile:true,damage:22,ownerId:e.id,appearance:'arcane-volley'});
  if(reason==='expiry')w.projectiles[0]!.expires=.01;
  w.step(.025);expect(w.projectiles).toHaveLength(0);expect(w.effects.filter(e=>e.kind==='arcane-impact')).toHaveLength(1);
  const v=runeWardenViews(w,1)[0]!;expect(v.frame).toBe('volley-impact-0');expect(v.rotation).toBe(Math.PI);
  tick(w,.1);expect(w.effects.filter(e=>e.kind==='arcane-impact')).toHaveLength(1);expect(runeWardenViews(w,1)[0]!.frame).toBe('volley-impact-2');
  tick(w,.5);expect(runeWardenViews(w,1)).toEqual([]);
  expect(w.player.hp).toBe(reason==='collision'?78:100);
});
it('Blink shows the two fixed marks before relocation, then flashes both anchors quickly',()=>{
  const w=quiet();w.elapsed=630;const e=w.spawn('sorcerer',{x:90,y:0})!;e.boss!.magic!.nextAt=w.elapsed;
  const beforeId=w.id();expect(updateMagicTeleport(w,e)).toBe(true);const m=e.boss!.magic!,from={...m.from!},target={...m.target!};
  expect(runeWardenViews(w,1).map(v=>[v.frame,v.x,v.y])).toEqual([['blink-rune',from.x,from.y],['blink-rune',target.x,target.y]]);
  w.elapsed=e.boss!.until;updateMagicTeleport(w,e);expect([e.x,e.y]).toEqual([target.x,target.y]);
  const blink=w.effects.find(e=>e.kind==='rune-blink')!;expect(blink.id).toBeLessThan(0);expect(blink.target).toEqual(target);expect([blink.x,blink.y]).toEqual([from.x,from.y]);
  const glow=runeWardenViews(w,1).filter(v=>v.frame==='blink-0');expect(glow.map(v=>[v.x,v.y])).toEqual([[from.x,from.y],[target.x,target.y]]);
  expect(w.id()).toBe(beforeId+3); // Only the two actual hostile impact IDs advance gameplay IDs.
  w.elapsed+=C.blink;expect(runeWardenViews(w,1).some(v=>v.frame.startsWith('blink'))).toBe(false);
});
it('keeps pause immutable and freezes pending Judgement while existing flying missiles continue',()=>{
  const w=quiet(),e=w.spawn('sorcerer',{x:200,y:0})!;w.elapsed=2;updateBoss(w,e,.01);freezeForUltimate(e,w.elapsed,w.elapsed+1);
  const land=w.impacts[0]!.landAt;w.shoot({x:100,y:100,vx:10,vy:0,damage:1,hostile:true,ownerId:e.id,appearance:'arcane-volley'});
  tick(w,.5);expect(w.impacts[0]!.landAt).toBeCloseTo(land+.5);expect(w.projectiles[0]!.x).toBeCloseTo(105);
  w.pause();const state=JSON.stringify(w),views=runeWardenViews(w,0);w.step(.5);expect(runeWardenViews(w,0)).toEqual(views);expect(JSON.stringify(w)).toBe(state);
});
it('does not restart the cast on damage and resets it between Blink signal and arrival preparation',()=>{
  const w=quiet(),e=w.spawn('sorcerer',{x:180,y:0})!,art=new BossAnimation();art.prepare(w);w.elapsed=2;updateBoss(w,e,.01);art.view(e,w);
  w.elapsed=2.3;w.damageEnemy(e,1);const p=art.view(e,w);expect(p.pose).toBe('windup');expect(p.started).toBe(2);
  e.boss!.magic={nextAt:0,teleports:0,phase:'signal'};w.elapsed+=.1;art.view(e,w);
  e.boss!.magic.phase='prepare';w.elapsed+=.1;expect(art.view(e,w).started).toBe(w.elapsed);
});
it('resumes the cast at its preserved progress after an Ultimate freeze instead of skipping animation frames',()=>{
  const w=quiet(),e=w.spawn('sorcerer',{x:200,y:0})!,art=new BossAnimation();art.prepare(w);w.elapsed=2;updateBoss(w,e,.01);art.view(e,w);
  w.elapsed=2.2;art.view(e,w);freezeForUltimate(e,w.elapsed,3.2);tick(w,1.2);
  const p=art.view(e,w);expect(p.pose).toBe('windup');expect(p.started).toBeCloseTo(3);
  expect(runeBodyFrame(p.facing,p.pose,w.elapsed-p.started,e.boss!.until-w.elapsed)).toBe(runeBodyFrame(p.facing,'windup',.4,.7));
});
it('cleans owner visuals without fake explosions, reuses projectiles without stale appearance, and keeps cosmetic IDs separate',()=>{
  const w=quiet(),e=w.spawn('sorcerer',{x:180,y:0})!;fireBossVolley(w,e);w.effect('rune-blink',e,30,0xffffff,C.blink,w.player,undefined,undefined,e.id);
  const id=w.id();w.effect('arcane-impact',e,16,0xffffff,C.impact,undefined,undefined,undefined,e.id);expect(w.id()).toBe(id+1);
  w.damageEnemy(e,1e6);expect(w.effects.some(v=>v.ownerId===e.id)).toBe(false);expect(w.projectiles).toHaveLength(0);expect(w.score).toBe(1000);
  w.shoot({x:100,y:100,vx:1,vy:0,damage:1,hostile:true});expect(w.projectiles[0]!.appearance).toBeUndefined();
  w.effect('rune-blink',w.player,30,0xffffff,C.blink,w.player,undefined,undefined,999);w.clearTemporaryState();expect(runeWardenViews(w,1)).toEqual([]);
});
it('bounds visual objects under the shared projectile/effect/impact budgets and never mutates gameplay',()=>{
  const w=quiet();for(let i=0;i<300;i++)w.effect('rune-blink',{x:i,y:0},30,0xffffff,C.blink,w.player,undefined,undefined,1);
  const before=JSON.stringify(w),views=runeWardenViews(w,1);expect(views.length).toBe(C.limit);expect(w.effects.length).toBeLessThanOrEqual(96);expect(JSON.stringify(w)).toBe(before);
  w.status='over';expect(runeWardenViews(w,1)).toEqual([]);
});
it('does not recreate owner effects after a Judgement hit has ended the run',()=>{
  const w=quiet(),e=w.spawn('sorcerer',{x:180,y:0})!;w.player.hp=1;e.boss!.until=1e6;
  w.impacts.push({id:w.id(),x:0,y:0,radius:38,damage:22,hostile:true,ownerId:e.id,landAt:.01,appearance:'runic-judgement'});
  w.step(.025);expect(w.status).toBe('over');expect(w.effects.some(e=>e.ownerId!==undefined)).toBe(false);expect(runeWardenViews(w,1)).toEqual([]);
});
