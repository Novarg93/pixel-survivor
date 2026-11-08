import {expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {World} from '../../src/game/systems/World';
import {BossAnimation} from '../../src/game/art/BossAnimation';
import {bossVisual,enemyVisual,visualDimensions} from '../../src/game/art/assetRegistry';
import {ASTRAL_REVENANT_MANIFEST as pack,astralBodyFrame,astralFrameIndex,astralFlameFrame,astralImpactFrame,astralProjectileFrame} from '../../src/game/art/astralRevenantPack';
import {astralRevenantViews,necroticGroundViews} from '../../src/game/art/AstralRevenantArt';
import {runeWardenViews} from '../../src/game/art/RuneWardenArt';
import {ASTRAL_VFX as C,ASTRAL_VOLLEY} from '../../src/game/config/astralRevenant';
import {updateBoss} from '../../src/game/systems/BossSystem';
import {updateMagicTeleport,fireBossVolley,bossVolleyAngles} from '../../src/game/systems/BossMagic';
import {freezeForUltimate} from '../../src/game/systems/UltimateFreeze';
import {drawEnrageDanger} from '../../src/game/art/EncounterArt';
import atlas from '../../public/assets/hd/astral-revenant-v1/atlas.json';
function quiet(time=20){const w=new World(42,{spawnRate:0});w.elapsed=time;w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;return w;}
function tick(w:World,seconds:number){for(let t=0;t<seconds-1e-8;t+=.025)w.step(Math.min(.025,seconds-t));}
it.each([20,630,915,1500])('omits projectile direction arrows in both stages at%ss without changing simulation state',time=>{
  const w=quiet(time),e=w.spawn('eclipse',{x:100,y:-40})!;e.boss!.phase='windup';
  const g={lineStyle:vi.fn().mockReturnThis(),lineBetween:vi.fn().mockReturnThis()};
  for(const stage of [1,2]){
    e.boss!.stage=stage;const before=JSON.stringify(w);drawEnrageDanger(g as unknown as Parameters<typeof drawEnrageDanger>[0],w);
    expect(g.lineStyle).not.toHaveBeenCalled();expect(g.lineBetween).not.toHaveBeenCalled();expect(JSON.stringify(w)).toBe(before);
  }
});
it('audits all17 inputs, native PixelLab B and the original empty despawn tail',()=>{
  expect(Object.keys(pack.sources)).toHaveLength(17);
  for(const [file,hash]of Object.entries(pack.sources))expect(createHash('sha256').update(readFileSync(file)).digest('hex'),file).toBe(hash);
  expect(pack.clips.walk.frameCount).toBe(16);expect(pack.clips.cast.frameCount).toBe(16);expect(pack.clips['volley-flight'].frameCount).toBe(12);expect(pack.clips['volley-impact'].frameCount).toBe(8);
  expect(pack.clips['volley-impact'].unusedCells).toEqual([0,576,0,0]);
  expect(pack.clips['flame-spawn'].gifFrameCount).toBe(13);
  expect(pack.clips['flame-spawn'].frameCount).toBe(16);expect(pack.clips['flame-idle'].frameCount).toBe(16);
  expect(pack.clips['flame-spawn'].frames.slice(13).map(f=>f.timingSource)).toEqual(Array(3).fill('png-tail'));
  expect(pack.clips['flame-spawn'].unusedCells).toEqual([0,0,0]);
  expect(pack.clips['flame-appear']).toMatchObject({frameCount:9,gifFrameCount:9,sourceCanvas:128,columns:3,unusedCells:[]});
  expect(pack.clips['flame-appear'].durationsMs).toEqual(Array(9).fill(100));
  expect(pack.clips['flame-appear'].frames.every(f=>f.colorDifferences===0)).toBe(true);
  for(const clip of Object.values(pack.clips)){expect(clip.alphaSource).toBe('png');expect(clip.frames.every(f=>f.alphaDifferences===0)).toBe(true);}
});
it('packs126 untrimmed padded frames and mirrors all32 body poses pixel for pixel, with no vertical projection',()=>{
  expect(Object.keys(atlas.frames)).toHaveLength(126);expect(pack.rgbaBytes).toBe(1056*2112*4);expect(pack.bodyPivot).toEqual([64,64]);
  const bytes=readFileSync('public/assets/hd/astral-revenant-v1/atlas.png'),chunks:Buffer[]=[];
  for(let p=8;p<bytes.length;){const n=bytes.readUInt32BE(p);if(bytes.toString('ascii',p+4,p+8)==='IDAT')chunks.push(bytes.subarray(p+8,p+8+n));p+=n+12;}
  const raw=inflateSync(Buffer.concat(chunks)),stride=pack.width*4+1,frames=atlas.frames as Record<string,{frame:{x:number;y:number;w:number;h:number}}>;
  for(let y=0;y<pack.height;y++)expect(raw[y*stride]).toBe(0);
  const pixels=(name:string)=>{const f=frames[name]!.frame,out=Buffer.alloc(128*128*4);for(let y=0;y<128;y++)raw.copy(out,y*512,(f.y+y)*stride+1+f.x*4,(f.y+y)*stride+1+f.x*4+512);return out;};
  for(const [name,{frame:f}]of Object.entries(frames)){
    expect(name).not.toMatch(/-(up|down|north|south)-/);expect([f.w,f.h]).toEqual([128,128]);expect(f.x+130).toBeLessThanOrEqual(pack.width);expect(f.y+130).toBeLessThanOrEqual(pack.height);
    for(let y=f.y-2;y<f.y+130;y++)for(const x of [f.x-2,f.x-1,f.x+128,f.x+129])if(raw[y*stride+1+x*4+3])throw Error('Atlas bleed');
    if(!name.includes('-left-'))continue;const left=pixels(name),right=pixels(name.replace('-left-','-right-')),mirror=Buffer.alloc(left.length);
    for(let y=0;y<128;y++)for(let x=0;x<128;x++)left.copy(mirror,(y*128+x)*4,(y*128+127-x)*4,(y*128+128-x)*4);expect(right.equals(mirror),name).toBe(true);
  }
});
it('plays the chosen B appearance, our idle and the original forward despawn without changing actor size',()=>{
  for(const facing of ['left','right']as const)for(let i=0;i<16;i++){
    expect(astralBodyFrame(facing,'walk',i*.15+.001)).toBe(`eclipse-1-${facing}-walk-${i}`);
    expect(astralBodyFrame(facing,'windup',i/16,1-i/16)).toBe(`eclipse-1-${facing}-cast-${i}`);
  }
  expect(astralBodyFrame('left','attack',0)).toBe('eclipse-1-left-cast-15');expect(astralFrameIndex('walk',2.4,true)).toBe(0);
  expect(visualDimensions(enemyVisual('eclipse',false,0,1)).width).toBeCloseTo(66.24);expect(enemyVisual('eclipse',false,0,1).texture).toBe('astral-revenant-v1');
  expect(astralProjectileFrame(0)).toBe('volley-static');expect(astralProjectileFrame(.041)).toBe('volley-flight-0');expect(astralImpactFrame(0)).toBe('volley-impact-5');expect(astralImpactFrame(1)).toBe('volley-impact-7');
  for(let i=0;i<9;i++)expect(astralFlameFrame('spawn',(i+.1)/9,1)).toBe(`flame-appear-${i}`);
  for(let i=0;i<16;i++){
    expect(astralFlameFrame('vanish',(i+.1)/16,1)).toBe(`flame-spawn-${i}`);
    expect(astralFlameFrame('idle',i*.15+.001,3)).toBe(`flame-idle-${i}`);
  }
  expect(astralFlameFrame('spawn',0,.6)).toBe('flame-appear-0');expect(astralFlameFrame('spawn',.6,.6)).toBe('flame-appear-8');
  expect(astralFlameFrame('vanish',.6,.6)).toBe('flame-spawn-15');
});
it.each([20,630,1500])('doubles ring speed while retaining count, angles, damage and TTL at%ss',time=>{
  const w=quiet(time),e=w.spawn('eclipse',{x:180,y:0})!,b=e.boss!;b.magic=undefined;b.phase='windup';b.until=w.elapsed;b.aim={x:0,y:0};
  const angles=b.enrageIndex?bossVolleyAngles(e):Array.from({length:12},(_,i)=>i).filter(i=>i!==0&&i!==6).map(i=>Math.atan2(-e.y,-e.x)-Math.PI/12+i*Math.PI/6);
  updateBoss(w,e,.01);expect(w.projectiles).toHaveLength(angles.length);
  for(const [i,p]of w.projectiles.entries()){const speed=(b.enrageIndex?95:85)*ASTRAL_VOLLEY.speedScale*(b.enrageIndex?(b.late?.projectile??1):1);expect(p.vx).toBeCloseTo(Math.cos(angles[i]!)*speed);expect(p.vy).toBeCloseTo(Math.sin(angles[i]!)*speed);expect(p.damage).toBe(e.damage);expect(p.expires-w.elapsed).toBe(2.5);expect(p.appearance).toBe('astral-volley');}
});
it('queues four flame segments with only a soft ground warning before the selected B appearance',()=>{
  const w=quiet(),e=w.spawn('eclipse',{x:180,y:0})!;e.hp=e.maxHp*.5;e.boss!.until=w.elapsed;updateBoss(w,e,.01);
  expect(w.impacts).toHaveLength(0);expect(w.zones).toHaveLength(4);expect(w.zones.every(z=>z.necrotic&&z.ownerId===e.id)).toBe(true);
  const before=JSON.stringify(w);expect(astralRevenantViews(w,1)).toEqual([]);expect(necroticGroundViews(w,1)).toHaveLength(4);expect(JSON.stringify(w)).toBe(before);
  const n=w.zones[0]!.necrotic!;w.elapsed=n.spawnAt;expect(necroticGroundViews(w,1)).toEqual([]);expect(astralRevenantViews(w,1).map(v=>v.frame)).toEqual(Array(4).fill('flame-appear-0'));
  w.elapsed=n.activeAt;expect(necroticGroundViews(w,1)).toEqual([]);expect(astralRevenantViews(w,1).map(v=>v.frame)).toEqual(Array(4).fill('flame-idle-0'));expect(astralRevenantViews(w,1).every(v=>v.size===62)).toBe(true);
  w.elapsed=n.fadeAt;expect(necroticGroundViews(w,1)).toEqual([]);expect(astralRevenantViews(w,1).map(v=>v.frame)).toEqual(Array(4).fill('flame-spawn-0'));
  w.elapsed=w.zones[0]!.expires;expect(astralRevenantViews(w,1)).toEqual([]);expect(necroticGroundViews(w,1)).toEqual([]);
});
it('casts a real second phase volley, holds its preparation on hits/freeze, and never mutates World from art',()=>{
  const w=quiet(630),e=w.spawn('eclipse',{x:180,y:0})!,a=new BossAnimation(),shots=vi.spyOn(w,'shoot');w.player.invulnerableUntil=Infinity;e.boss!.magic=undefined;e.hp=e.maxHp*.5;e.boss!.until=w.elapsed;a.prepare(w);
  tick(w,.025);a.view(e,w);tick(w,.3);const p=a.view(e,w);w.damageEnemy(e,1);expect(a.view(e,w).started).toBe(p.started);
  tick(w,e.boss!.until-w.elapsed+.001);const follow=a.view(e,w);expect(follow.pose).toBe('windup');expect(follow.started).toBe(w.elapsed);expect(e.shootingAt).toBeGreaterThan(w.elapsed);expect(w.projectiles).toHaveLength(3);
  tick(w,.15);const pose={...a.view(e,w)},frame=astralBodyFrame(pose.facing,pose.pose,w.elapsed-pose.started,e.shootingAt-w.elapsed);
  freezeForUltimate(e,w.elapsed,w.elapsed+.5);tick(w,.5);const held=a.view(e,w);expect(astralBodyFrame(held.facing,held.pose,w.elapsed-held.started,e.shootingAt-w.elapsed)).toBe(frame);
  const before=JSON.stringify(w);bossVisual('eclipse',held.facing,held.pose,w.elapsed-held.started,e.shootingAt-w.elapsed);expect(JSON.stringify(w)).toBe(before);
  tick(w,e.shootingAt-w.elapsed+.001);expect(e.shootingAt).toBe(0);expect(a.view(e,w).pose).toBe('attack');expect(shots).toHaveBeenCalledTimes(6);
});
it('reuses Rune teleport markers/glow at both real anchors with safe arrival and unchanged AI clocks',()=>{
  const w=quiet(630),e=w.spawn('eclipse',{x:100,y:0})!;e.boss!.magic!.nextAt=w.elapsed;updateMagicTeleport(w,e);
  const m=e.boss!.magic!,from={...m.from!},target={...m.target!},views=runeWardenViews(w,1);
  expect(views.filter(v=>v.frame==='blink-rune').map(v=>[v.x,v.y])).toEqual([[from.x,from.y],[target.x,target.y]]);
  w.elapsed=e.boss!.until+.001;const id=w.id();updateMagicTeleport(w,e);expect({x:e.x,y:e.y}).toEqual(target);expect(w.id()).toBe(id+1);expect(m.phase).toBe('prepare');
  expect(runeWardenViews(w,1).filter(v=>/^blink-\d+$/.test(v.frame))).toHaveLength(2);expect(e.boss!.contactSafeUntil).toBeGreaterThan(e.boss!.until);expect(w.impacts).toHaveLength(0);
});
it('dissipates real expired/colliding missiles with cosmetic IDs, clears owned VFX and resets recycled appearance',()=>{
  const w=quiet(),e=w.spawn('eclipse',{x:180,y:0})!;e.boss!.until=1e6;w.player.invulnerableUntil=Infinity;
  w.shoot({x:1,y:0,vx:1,vy:0,damage:1,hostile:true,ownerId:e.id,appearance:'astral-volley'});const id=w.id();w.step(.025);
  expect(w.projectiles).toHaveLength(0);expect(w.effects.filter(e=>e.kind==='astral-impact')).toHaveLength(1);expect(w.id()).toBe(id+1);expect(astralRevenantViews(w,1)[0]!.frame).toBe('volley-impact-5');
  w.shoot({x:500,y:500,vx:1,vy:0,damage:1,hostile:true,ownerId:e.id,appearance:'astral-volley'});tick(w,2.51);expect(w.projectiles).toHaveLength(0);expect(w.effects.some(v=>v.kind==='astral-impact')).toBe(true);
  fireBossVolley(w,e);w.effect('rune-blink',e,33,0xffffff,.36,w.player,undefined,undefined,e.id);w.damageEnemy(e,1e9);
  expect(w.effects.some(v=>v.ownerId===e.id)).toBe(false);expect(w.projectiles).toHaveLength(0);expect(w.score).toBe(1500);
  w.shoot({x:100,y:100,vx:1,vy:0,hostile:true,damage:1});expect(w.projectiles[0]!.appearance).toBeUndefined();
});
it('bounds effect images and obeys pause/end state while an owner freeze holds warnings but not flying missiles',()=>{
  const w=quiet(),e=w.spawn('eclipse',{x:180,y:0})!;e.hp=e.maxHp*.5;e.boss!.until=w.elapsed;updateBoss(w,e,.01);
  const land=w.zones[0]!.necrotic!.spawnAt;freezeForUltimate(e,w.elapsed,w.elapsed+1);w.shoot({x:500,y:500,vx:10,vy:0,damage:1,hostile:true,ownerId:e.id,appearance:'astral-volley'});tick(w,.5);
  expect(w.zones[0]!.necrotic!.spawnAt).toBeCloseTo(land+.5);expect(w.projectiles[0]!.x).toBeCloseTo(505);
  w.pause();const before=JSON.stringify(w),views=astralRevenantViews(w,1);tick(w,1);expect(JSON.stringify(w)).toBe(before);expect(astralRevenantViews(w,1)).toEqual(views);
  const template=w.zones[0]!;w.elapsed=template.necrotic!.activeAt;
  w.zones=Array.from({length:300},(_,id)=>({...template,id}));expect(astralRevenantViews(w,1)).toHaveLength(C.limit);expect(necroticGroundViews(w,1)).toEqual([]);
  w.elapsed=template.necrotic!.born;expect(necroticGroundViews(w,1)).toHaveLength(24);
  w.status='over';expect(astralRevenantViews(w,1)).toEqual([]);
});
it('never recreates owned effects after a fatal periodic flame tick',()=>{
  const w=quiet(),e=w.spawn('eclipse',{x:180,y:0})!;w.player.hp=1;e.boss!.until=1e6;
  w.necroticFlames.queue(w,e,w.elapsed);w.elapsed=w.zones[0]!.necrotic!.activeAt;w.step(.025);
  expect(w.outcome).toBe('defeat');expect(w.zones).toEqual([]);expect(w.effects.some(v=>v.ownerId!==undefined)).toBe(false);expect(astralRevenantViews(w,1)).toEqual([]);expect(necroticGroundViews(w,1)).toEqual([]);
});
