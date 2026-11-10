import {it,expect} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ASH_WARDEN_SAMPLES} from '../../src/game/audio/ashWardenSamples';
import {audioSampleIds,audioSampleKey,audioSampleForEvent,audioSampleRange,audioSampleGain,type AudioSampleId,type SampleRange} from '../../src/game/audio/samples';
import {mageSampleIds,mageSampleKey,mageSampleGain} from '../../src/game/audio/mageSamples';
import {AudioController} from '../../src/game/audio/AudioController';
import {AudioPresentation} from '../../src/game/audio/AudioPresentation';
import type {AudioBackend,AudioVoice} from '../../src/game/audio/AudioBackend';
import type {AudioBus,AssetId} from '../../src/game/audio/catalog';
import {World} from '../../src/game/systems/World';
import {freezeForUltimate} from '../../src/game/systems/UltimateFreeze';
import {DEFAULT_SETTINGS} from '../../src/game/services/storage';
import {arcaneShieldIntegration,frostNovaIntegration,wardenApprovedHash} from '../helpers/approvedWardenIntegration';
const root='art/generated/ash-warden-uploaded-sounds-v1';
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
class Backend implements AudioBackend{
  supported=true;running=true;now=0;
  calls:{sample?:AudioSampleId;range?:SampleRange}[]=[];active=new Set<AudioVoice>();
  async unlock(){return true;}bus(){}music(){return true;}
  start(_asset:AssetId,_bus:AudioBus,_gain:number,_rate:number,_loop:boolean,ended:()=>void,sample?:AudioSampleId,range?:SampleRange){
    const voice={gain:()=>{},stop:()=>{this.active.delete(voice);ended();}};this.active.add(voice);this.calls.push({sample,range});return voice;
  }
  stopAll(){for(const v of [...this.active])v.stop();}destroy(){this.stopAll();}
  diagnostics(){return{nodes:0,sources:this.active.size,loops:0,decodedBytes:0,rms:0};}
}
async function setup(){
  const w=new World(47,{spawnRate:0});w.practice=true;w.elapsed=1200;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;
  w.finalEncounter.begin(w);for(let i=0;i<47;i++)w.step(.05);
  const f=w.finalEncounter;f.nextCombo=f.nextMelee=f.nextMeteor=Infinity;w.sounds=[];
  const b=new Backend(),c=new AudioController(b,()=>.5),p=new AudioPresentation(c);c.settings(DEFAULT_SETTINGS);c.gesture();await Promise.resolve();await Promise.resolve();p.observe(w);b.calls=[];
  const observe=()=>{b.now=w.elapsed;b.stopAll();p.observe(w);};
  const step=(seconds=.05)=>{w.step(seconds);observe();};return{w,f,b,c,p,step,observe};
}
it('ships all five original boss WAVs byte-for-byte and preserves every Mage key/gain',()=>{
  const manifest=JSON.parse(readFileSync(`${root}/manifest.json`,'utf8'))as{entries:{id:keyof typeof ASH_WARDEN_SAMPLES;source:string;file:string;sha256:string;analysis:{seconds:number;invalidSamples:number}}[]};
  expect(manifest.entries).toHaveLength(5);expect(audioSampleIds).toHaveLength(16);expect(new Set(audioSampleIds).size).toBe(16);
  for(const e of manifest.entries){expect(readFileSync(e.file).equals(readFileSync(e.source))).toBe(true);expect(sha(readFileSync(e.file))).toBe(e.sha256);expect(audioSampleKey(e.id)).toContain(e.sha256.slice(0,12));expect(e.analysis).toMatchObject({seconds:1,invalidSamples:0});}
  for(const id of mageSampleIds){expect(audioSampleKey(id)).toBe(mageSampleKey(id));expect(audioSampleGain(id)).toBe(mageSampleGain(id));}
  expect(audioSampleForEvent('armageddon.impact')).toBe('mage-meteor');expect(audioSampleForEvent('ultimate.lightning')).toBe('mage-ultimate-release');
});
it.each([[1,0],[-1,0]])('uses swing for both horizontal variants and thrust, with one lead and one real contact (%s,%s)',async(x,y)=>{
  const {w,f,b,step,observe}=await setup(),e=f.boss!;
  for(const variant of ['b','a'] as const){
    b.calls=[];f.attack={...f.attack,kind:'approach',age:0};f.nextMelee=0;w.player.x=e.x+x*45;w.player.y=e.y+y*45;step();
    expect(f.attack.meleeVariant).toBe(variant);
    for(let i=0;i<24;i++)step();
    const swings=b.calls.filter(c=>c.sample==='warden-swing');expect(swings).toHaveLength(2);
    expect(swings[0]!.range).toEqual({offset:0,duration:.3});expect(swings[1]!.range).toEqual({offset:.3,duration:undefined});
    expect(b.calls.some(c=>c.sample==='warden-slam')).toBe(false);observe();expect(b.calls.filter(c=>c.sample==='warden-swing')).toHaveLength(2);
  }
});
it.each([[0,1],[0,-1],[1,1],[-1,-1]])('uses slam for vertical/diagonal South and North without a side swing (%s,%s)',async(x,y)=>{
  const {w,f,b,step}=await setup(),e=f.boss!;f.nextMelee=0;w.player.x=e.x+x*30;w.player.y=e.y+y*30;
  for(let i=0;i<25;i++)step();
  expect(b.calls.filter(c=>c.sample==='warden-slam')).toHaveLength(1);expect(b.calls.some(c=>c.sample==='warden-swing')).toBe(false);
});
it('holds Meteor contact through boss freeze and never repeats a fall cue or replays a cancelled meteor',async()=>{
  const {w,f,b,step,observe}=await setup();f.meteors=[{id:501,group:501,owner:'boss',x:w.player.x+150,y:w.player.y,age:1.05,warning:1.3,landed:false}];
  step();expect(b.calls.filter(c=>c.sample==='warden-meteor')).toEqual([{sample:'warden-meteor',range:{offset:0,duration:.2}}]);
  freezeForUltimate(f.boss!,w.elapsed,w.elapsed+.5);for(let i=0;i<4;i++)step();expect(f.meteors[0]!.age).toBeCloseTo(1.1);expect(b.calls.filter(c=>c.sample==='warden-meteor')).toHaveLength(1);
  delete f.boss!.ultimateFreeze;for(let i=0;i<4;i++)step();expect(b.calls.filter(c=>c.sample==='warden-meteor')).toHaveLength(2);expect(b.calls.at(-1)?.range?.offset).toBe(.2);
  f.meteors=[];observe();observe();expect(b.calls.filter(c=>c.sample==='warden-meteor')).toHaveLength(2);
});
it('preserves SFX controls and avoids doubled Charge braking or Flame Strike fan playback',async()=>{
  const{w,b,c,observe}=await setup();w.sound('final-charge');w.sound('final-stop');observe();expect(b.calls.filter(v=>v.sample==='warden-charge')).toHaveLength(1);expect(c.diagnostics().requested['final.stop']).toBeUndefined();
  b.now+=2;b.stopAll();w.sound('final-cleave');w.sound('final-cleave');new AudioPresentation(c).observe(w);expect(b.calls.filter(v=>v.sample==='warden-flamestrike')).toHaveLength(1);
  c.settings({...DEFAULT_SETTINGS,sfxVolume:0});b.now+=2;expect(c.play('final.slam')).toBe(false);c.settings(DEFAULT_SETTINGS);c.update('paused','grove');expect(c.play('final.slam')).toBe(false);c.destroy();expect(b.active.size).toBe(0);
  expect(audioSampleRange('final.impact')).toEqual({offset:.2,duration:undefined});
});
it('limits runtime changes to the explicit user-authorized sound integration',()=>{
  const baseline=JSON.parse(readFileSync(`${root}/runtime-baseline.json`,'utf8'))as Record<string,string>;
  const proof=JSON.parse(readFileSync(`${root}/integration-verification.json`,'utf8'))as{changed:string[];added:string[];currentSHA256:Record<string,string>};
  const walk=(d:string):string[]=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
  expect(proof.changed).toHaveLength(8);expect(proof.added).toHaveLength(7);
  expect([...walk('src'),...walk('public')].sort()).toEqual([...Object.keys(baseline),...proof.added,...arcaneShieldIntegration.added,...frostNovaIntegration.added].sort());
  for(const f of [...Object.keys(baseline),...proof.added])expect(sha(readFileSync(f)),f).toBe(wardenApprovedHash(f,proof.currentSHA256[f]??baseline[f]!));
});
