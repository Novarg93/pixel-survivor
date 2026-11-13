import {warriorSoundsIntegration} from '../helpers/approvedWardenIntegration';
import {warriorUltimatesIntegration} from '../helpers/approvedWardenIntegration';
import {warriorBuffsIntegration} from '../helpers/approvedWardenIntegration';
import {warriorCleaveIntegration} from '../helpers/approvedWardenIntegration';
import {warriorSkillsIntegration} from '../helpers/approvedWardenIntegration';
import {warriorCombatIntegration} from '../helpers/approvedWardenIntegration';
import {warriorHeroIntegration} from '../helpers/approvedWardenIntegration';
import {expect,it} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {World} from '../../src/game/systems/World';
import {MinibossAudio} from '../../src/game/audio/MinibossAudio';
import {audioSampleIds,audioSampleForEvent,audioSampleUrl,audioSampleGain} from '../../src/game/audio/samples';
import type {SoundEvent} from '../../src/game/audio/catalog';
import {freezeForUltimate} from '../../src/game/systems/UltimateFreeze';
import {acceptedRuneCast,acceptedRuneFlight,RUNE_FLIGHT_ANGLE} from '../../src/game/art/runeWardenAccepted';
import {minibossAssetsIntegration as proof,wardenApprovedHash,visualCleanupIntegration} from '../helpers/approvedWardenIntegration';
import {rgbaPng} from '../helpers/rgbaPng';
import atlas from '../../public/assets/hd/rune-warden-v2/atlas.json';

const root='art/generated/miniboss-assets-audio-v1',sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
function setup(){const w=new World(42,{spawnRate:0});w.elapsed=630;w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;const audio=new MinibossAudio(),events:SoundEvent[]=[];return{w,audio,events,observe:()=>audio.observe(w,e=>events.push(e))};}
it('preserves all six user WAVs byte-for-byte and routes the shared teleport through one sample',()=>{
 const entries=JSON.parse(readFileSync(root+'/audio-manifest.json','utf8')) as {id:string;source:string;file:string;sha256:string;gain:number;peak:number;seconds:number}[];
 expect(entries).toHaveLength(6);expect(audioSampleIds).toHaveLength(36);expect(new Set(audioSampleIds).size).toBe(36);
 for(const entry of entries){expect(readFileSync(entry.file).equals(readFileSync(entry.source))).toBe(true);expect(sha(readFileSync(entry.file))).toBe(entry.sha256);expect(entry.gain*entry.peak).toBeLessThan(.750001);expect(entry.seconds).toBe(.8865);}
 expect(audioSampleForEvent('mini.teleport')).toBe('mini-teleport');
 for(const event of ['mini.runeCast','mini.astralCast','mini.briarCharge','mini.briarMelee','mini.totemCast','mini.teleport'] as const){const sample=audioSampleForEvent(event)!;expect(audioSampleUrl(sample)).toContain('assets/audio/miniboss-v1/');expect(audioSampleGain(sample)).toBeGreaterThan(0);}
});
it('packs the accepted cast13 in both directions and flight9 without changing or scaling any pixel',()=>{
 const image=rgbaPng('public/assets/hd/rune-warden-v2/atlas.png');expect(Object.keys(atlas.frames)).toHaveLength(35);
 for(const [clip,count]of [['cast',13],['flight',9]] as const)for(let i=0;i<count;i++){
  const source=rgbaPng(`art/rune-warden-cast-review-v2/source/${clip}-${i}.png`);
  for(const facing of clip==='cast'?['left','right']:['left']){
   const key=clip==='cast'?`rune-cast-${facing}-${i}`:`rune-flight-${i}`,r=(atlas.frames as Record<string,{frame:{x:number;y:number;w:number;h:number}}>)[key]!.frame;
   for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++){
    const dx=facing==='right'?source.width-1-x:x,k=((r.y+y+(clip==='flight'?16:0))*image.width+r.x+dx)*4,s=(y*source.width+x)*4;
    if(!image.pixels.subarray(k,k+4).equals(source.pixels.subarray(s,s+4)))throw Error(`${key}:${x},${y}`);
   }
  }
 }
 for(const facing of ['left','right'] as const){expect(acceptedRuneCast(facing,'windup',0,1)).toBe(`rune-cast-${facing}-0`);expect(acceptedRuneCast(facing,'windup',.99,.01)).toBe(`rune-cast-${facing}-8`);expect(acceptedRuneCast(facing,'attack',0,0)).toBe(`rune-cast-${facing}-9`);expect(acceptedRuneCast(facing,'attack',.31,0)).toBe(`rune-cast-${facing}-12`);}
 for(let i=0;i<18;i++)expect(acceptedRuneFlight(i*.1)).toBe(`rune-flight-${i%9}`);expect(RUNE_FLIGHT_ANGLE).toBeCloseTo(42*Math.PI/180);
});
it('casts once per real windup, shares teleport for both mages, and sounds the Astral second volley once',()=>{
 const {w,events,observe}=setup();
 for(const kind of ['sorcerer','eclipse'] as const){
  const e=w.spawn(kind,{x:180,y:0})!,b=e.boss!;observe();b.phase='windup';observe();observe();
  expect(events.at(-1)).toBe(kind==='sorcerer'?'mini.runeCast':'mini.astralCast');
  b.magic!.phase='signal';observe();const n=events.length;observe();expect(events).toHaveLength(n);
  b.magic!.teleports++;b.magic!.phase='prepare';observe();expect(events.slice(-2)).toEqual([kind==='sorcerer'?'mini.runeCast':'mini.astralCast','mini.teleport']);observe();expect(events).toHaveLength(n+2);
  if(kind==='eclipse'){b.phase='recover';b.magic!.phase=undefined;e.shootingAt=w.elapsed+.6;observe();for(let i=0;i<60;i++)observe();expect(events.at(-1)).toBe('mini.astralCast');expect(events.filter(e=>e==='mini.astralCast')).toHaveLength(3);}
 }
 expect(events.filter(e=>e==='mini.teleport')).toHaveLength(2);
});
it('synchronizes Beast charge and melee without frame spam or freeze catchup; cleans up dead owners',()=>{
 const {w,audio,events,observe}=setup(),e=w.spawn('charger',{x:20,y:0})!,b=e.boss!;observe();expect(events).toEqual(['mini.briarMelee']);
 for(let i=0;i<60;i++)observe();expect(events).toHaveLength(1);
 w.elapsed+=1.2;observe();expect(events).toHaveLength(2);b.phase='windup';observe();observe();expect(events.at(-1)).toBe('mini.briarCharge');
 b.phase='approach';freezeForUltimate(e,w.elapsed,w.elapsed+5);w.elapsed+=4;observe();expect(events).toHaveLength(3);
 w.elapsed+=1.01;observe();expect(events).toHaveLength(3);w.elapsed+=1.2;observe();expect(events.at(-1)).toBe('mini.briarMelee');
 w.enemies=[];observe();expect(audio.tracked).toBe(0);audio.clear();expect(audio.tracked).toBe(0);
});
it('plays Totem at actual release, handles final supports, pause, and does not mutate gameplay or RNG',()=>{
 const {w,audio,events,observe}=setup(),e=w.spawn('guardian',{x:180,y:0})!;w.guardianSystem.awaken(w,e);const s=w.guardianSystem.encounters.get(e.id)!;observe();expect(events).toEqual([]);
 s.orbIndex=1;const before=JSON.stringify(w);observe();observe();expect(events).toEqual(['mini.totemCast']);expect(JSON.stringify(w)).toBe(before);
 w.pause();s.orbIndex=2;observe();expect(events).toHaveLength(1);w.resume();observe();expect(events).toHaveLength(2);
 w.finalEncounter.supports.set(e.id,{id:e.id,clock:0,next:1,warning:true});observe();events.length=0;w.finalEncounter.supports.get(e.id)!.next=3;e.shootingAt=w.elapsed;observe();expect(events).toEqual(['mini.totemCast']);observe();expect(events).toHaveLength(1);
 w.status='over';observe();expect(events).toHaveLength(1);audio.clear();expect(audio.tracked).toBe(0);
});
it('does not invent a release when first observing an already advanced Totem cycle',()=>{
 const {w,events,observe}=setup(),e=w.spawn('guardian',{x:180,y:0})!;w.guardianSystem.awaken(w,e);const s=w.guardianSystem.encounters.get(e.id)!;
 s.orbIndex=1;observe();expect(events).toEqual([]);s.orbIndex=2;observe();expect(events).toEqual(['mini.totemCast']);
});
it('changes only the five presentation files and eleven explicitly accepted local assets/modules',()=>{
 const baseline=JSON.parse(readFileSync(root+'/runtime-baseline.json','utf8'))as Record<string,string>,walk=(d:string):string[]=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
 expect(proof).toMatchObject({baselineFiles:400,unchanged:395});expect(proof.changed).toHaveLength(5);expect(proof.added).toHaveLength(11);
 expect([...walk('src'),...walk('public')].sort()).toEqual([...Object.keys(baseline),...proof.added,...visualCleanupIntegration.added,...warriorHeroIntegration.added,...warriorCombatIntegration.added,...warriorSkillsIntegration.added,...warriorCleaveIntegration.added,...warriorBuffsIntegration.added,...warriorUltimatesIntegration.added,...warriorSoundsIntegration.added].sort());for(const p of [...Object.keys(baseline),...proof.added])expect(sha(readFileSync(p)),p).toBe(wardenApprovedHash(p,proof.currentSHA256[p]??baseline[p]));
});
