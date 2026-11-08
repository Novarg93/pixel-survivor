import {expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {World} from '../../src/game/systems/World';
import {GuardianAnimation} from '../../src/game/art/GuardianAnimation';
import {GUARDIAN_MANIFEST as pack,guardianFrame,guardianWindupFrame,guardianDuration} from '../../src/game/art/guardianPack';
import {freezeForUltimate} from '../../src/game/systems/UltimateFreeze';
import {drawEnrageDanger} from '../../src/game/art/EncounterArt';
import {astralRevenantViews} from '../../src/game/art/AstralRevenantArt';
import atlas from '../../public/assets/hd/guardian.json';
function setup(){const w=new World(42,{spawnRate:0});w.elapsed=20;w.encounterDirector.nextAt=Infinity;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;const e=w.spawn('guardian',{x:120,y:0})!,art=new GuardianAnimation();art.prepare(w);return{w,e,art};}
function tick(w:World,art:GuardianAnimation,seconds:number){for(let t=0;t<seconds-1e-8;t+=.025){art.prepare(w);w.step(Math.min(.025,seconds-t));for(const e of w.guardians)art.frame(e,w);art.finish(w);}}
it('keeps all four originals and26 native PNG frames, with GIF timing and transparent padding',()=>{
  expect(Object.keys(pack.sources)).toHaveLength(4);
  for(const [file,hash]of Object.entries(pack.sources))expect(createHash('sha256').update(readFileSync(file)).digest('hex'),file).toBe(hash);
  expect(pack.pivot).toEqual([64,64]);expect(pack.rgbaBytes).toBe(1056*528*4);expect(Object.keys(atlas.frames)).toHaveLength(26);
  const bytes=readFileSync('public/assets/hd/guardian.png'),chunks:Buffer[]=[];
  for(let p=8;p<bytes.length;){const n=bytes.readUInt32BE(p);if(bytes.toString('ascii',p+4,p+8)==='IDAT')chunks.push(bytes.subarray(p+8,p+8+n));p+=n+12;}
  const raw=inflateSync(Buffer.concat(chunks)),stride=pack.width*4+1,frames=atlas.frames as Record<string,{frame:{x:number;y:number;w:number;h:number}}>;
  for(let y=0;y<pack.height;y++)expect(raw[y*stride]).toBe(0);
  for(const [id,clip]of Object.entries(pack.clips)){
    expect(clip.frameCount).toBe(13);expect(clip.durationsMs).toEqual(Array(13).fill(130));expect(clip.unusedCells).toEqual([0,0,0]);
    for(const [i,audit]of clip.frames.entries()){
      expect(audit.alphaDifferences).toBe(0);expect(audit.border).toBe(0);expect(audit.visible).toBeGreaterThan(4000);
      const f=frames[`guardian-${id}-${i}`]!.frame,out=Buffer.alloc(128*128*4);expect([f.w,f.h]).toEqual([128,128]);
      for(let y=0;y<128;y++)raw.copy(out,y*512,(f.y+y)*stride+1+f.x*4,(f.y+y)*stride+1+f.x*4+512);
      expect(createHash('sha256').update(out).digest('hex')).toBe(audit.pixelSHA256);
      for(let y=f.y-2;y<f.y+130;y++)for(const x of [f.x-2,f.x-1,f.x+128,f.x+129])if(raw[y*stride+1+x*4+3])throw Error('Atlas padding bleed');
    }
  }
});
it('loops all13 idle frames and splits the complete cast exactly at projectile release',()=>{
  for(let i=0;i<13;i++)expect(guardianFrame('idle',i*.13+.001)).toBe(`guardian-idle-${i}`);
  expect(guardianFrame('idle',1.69)).toBe('guardian-idle-0');expect(guardianWindupFrame(-1)).toBe('guardian-cast-0');expect(guardianWindupFrame(1)).toBe('guardian-cast-5');
  for(let i=0;i<6;i++)expect(guardianWindupFrame((i+.1)/6)).toBe(`guardian-cast-${i}`);
  for(let i=6;i<13;i++)expect(guardianFrame('release',(i-6)*.13+.001)).toBe(`guardian-cast-${i}`);
  expect(guardianFrame('release',10)).toBe('guardian-cast-12');expect(guardianDuration('release')).toBeCloseTo(.91);
});
it('runs real awakening→warning→release→idle, without hits restarting casts or world writes',()=>{
  const {w,e,art}=setup();expect(art.frame(e,w)).toBe('guardian-idle-0');tick(w,art,.5);expect(art.frame(e,w)).toBe('guardian-cast-0');
  tick(w,art,.3);const frame=art.frame(e,w);expect(frame).toMatch(/^guardian-cast-/);w.damageEnemy(e,1);const before=JSON.stringify(w);expect(art.frame(e,w)).toBe(frame);expect(JSON.stringify(w)).toBe(before);
  tick(w,art,.3);expect(art.frame(e,w)).toBe('guardian-cast-6');expect(w.projectiles[0]?.appearance).toBe('astral-volley');
  tick(w,art,.92);expect(art.frame(e,w)).toMatch(/^guardian-idle-/);expect(e).toMatchObject({x:120,y:0});
});
it('pauses idle/release owner clocks during freeze and resumes without jumping or emitting phantom releases',()=>{
  const {w,e,art}=setup();tick(w,art,1.2);const before=art.frame(e,w);freezeForUltimate(e,w.elapsed,w.elapsed+.5);tick(w,art,.5);expect(art.frame(e,w)).toBe(before);tick(w,art,.14);expect(art.frame(e,w)).not.toBe(before);
  w.pause();const frozen=art.frame(e,w);tick(w,art,.4);expect(art.frame(e,w)).toBe(frozen);w.resume();
  e.finalRole='guardian';const support={id:e.id,clock:0,next:2,warning:false};w.finalEncounter.supports.set(e.id,support);art.clear();art.prepare(w);
  e.shootingAt=w.elapsed;support.next=10;expect(art.frame(e,w)).toBe('guardian-cast-6');
  tick(w,art,.14);const release=art.frame(e,w);freezeForUltimate(e,w.elapsed,w.elapsed+.5);tick(w,art,.5);expect(art.frame(e,w)).toBe(release);
});
it('shares Astral projectile art/impact while retaining homing, hit damage, owner cleanup and pooling',()=>{
  const {w,e,art}=setup();tick(w,art,1.1);const p=w.projectiles[0]!;expect(p.appearance).toBe('astral-volley');expect(p.homing?.variant).toBe('slow');
  const graphics={fillStyle:vi.fn().mockReturnThis(),fillRect:vi.fn().mockReturnThis()};drawEnrageDanger(graphics as unknown as Parameters<typeof drawEnrageDanger>[0],w);expect(graphics.fillRect).not.toHaveBeenCalled();
  w.player.invulnerableUntil=0;p.x=w.player.x;p.y=w.player.y;const hp=w.player.hp;tick(w,art,.025);expect(w.player.hp).toBe(hp-p.damage);expect(w.projectiles).toHaveLength(0);
  expect(astralRevenantViews(w,1).some(v=>v.frame==='volley-impact-5')).toBe(true);expect(w.effects.some(f=>f.kind==='astral-impact'&&f.ownerId===e.id)).toBe(true);
  w.clearOwnedEffects(e.id);expect(w.effects.some(f=>f.ownerId===e.id)).toBe(false);
  w.shoot({x:200,y:0,vx:1,vy:0,damage:1,hostile:true});expect(w.projectiles[0]!.appearance).toBeUndefined();expect(w.projectiles[0]!.homing).toBeUndefined();
});
