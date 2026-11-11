import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {musicTrackAt,MUSIC_TRACKS,type MusicTrackId} from '../../src/game/audio/musicTracks';
import {musicBossActive,AudioPresentation} from '../../src/game/audio/AudioPresentation';
import {AudioController} from '../../src/game/audio/AudioController';
import type {AudioBackend,AudioVoice} from '../../src/game/audio/AudioBackend';
import type {AssetId,AudioBus} from '../../src/game/audio/catalog';
import {World} from '../../src/game/systems/World';
import {DEFAULT_SETTINGS} from '../../src/game/services/storage';
import {musicRuntimeIntegration,wardenApprovedHash} from '../helpers/approvedWardenIntegration';
class Backend implements AudioBackend{
  supported=true;running=true;now=0;available=true;track:MusicTrackId|null=null;
  active=new Map<AudioVoice,{asset:AssetId;loop:boolean}>();
  async unlock(){return true;}
  bus(_bus:AudioBus,_value:number){void _bus;void _value;}
  music(track:MusicTrackId|null){this.track=this.available?track:null;return !!this.track;}
  start(asset:AssetId,_bus:AudioBus,_gain:number,_rate:number,loop:boolean,ended:()=>void){
    const voice={gain:()=>{},stop:()=>{this.active.delete(voice);ended();}};this.active.set(voice,{asset,loop});return voice;
  }
  stopAll(){this.track=null;for(const voice of this.active.keys())voice.stop();}
  destroy(){this.stopAll();}
  diagnostics(){return{nodes:0,sources:this.active.size,loops:[...this.active.values()].filter(v=>v.loop).length,decodedBytes:0,rms:0};}
}
async function setup(){const backend=new Backend(),audio=new AudioController(backend,()=>.5);audio.settings(DEFAULT_SETTINGS);audio.gesture();await Promise.resolve();await Promise.resolve();return{backend,audio};}
it('selects exact300/600/900s boundaries and gives boss music priority',()=>{
  for(const[seconds,track]of [[0,'normal'],[299.999,'normal'],[300,'dusk'],[599.999,'dusk'],[600,'dying'],[899.999,'dying'],[900,'burning'],[2400,'burning']]as const)expect(musicTrackAt(seconds)).toBe(track);
  for(const seconds of [0,300,600,900,1200])expect(musicTrackAt(seconds,true)).toBe('boss');
});
it('routes streaming through music settings, keeps SFX independent and falls back without doubling beds',async()=>{
  const{backend:b,audio:a}=await setup();a.update('playing','grove',false,false,'dusk');expect(b.track).toBe('dusk');expect(b.active.size).toBe(0);
  a.update('playing','grove',true,false,'dusk');expect([...b.active.values()].map(v=>v.asset)).toEqual(['frostAir']);
  a.settings({...DEFAULT_SETTINGS,musicVolume:0});a.update('playing','grove',true,false,'dusk');expect(b.track).toBeNull();expect(a.play('player.blink')).toBe(true);
  a.settings(DEFAULT_SETTINGS);b.available=false;a.update('playing','grove');expect([...b.active.values()].filter(v=>v.loop).map(v=>v.asset).sort()).toEqual(['grove','underscore']);
  b.available=true;a.update('playing','grove',false,false,'dying');expect(b.track).toBe('dying');expect([...b.active.values()].filter(v=>v.loop)).toEqual([]);
  a.update('paused','grove');expect(b.track).toBeNull();expect(b.active.size).toBe(0);a.update('playing','grove');a.settings({...DEFAULT_SETTINGS,muted:true});expect(b.track).toBeNull();a.destroy();expect(b.active.size).toBe(0);
});
it('keeps stage music for all mini-bosses and their practices, reserving the boss track for the final encounter',async()=>{
 const{backend:b,audio:a}=await setup(),w=new World(42,{spawnRate:0}),p=new AudioPresentation(a);p.observe(w);expect(b.track).toBe('normal');
 for(const[time,track]of [[300,'dusk'],[600,'dying'],[900,'burning']]as const){w.elapsed=time;p.observe(w);expect(b.track).toBe(track);}
 for(const kind of ['charger','sorcerer','eclipse','guardian'] as const){const e=w.spawn(kind,{x:60,y:0})!;if(kind==='guardian')w.guardianSystem.awaken(w,e);expect(musicBossActive(w)).toBe(false);p.observe(w);expect(b.track).toBe('burning');}
 for(const practice of ['briar-beast','rune-warden','astral-revenant','rootbound-guardian'] as const){w.practiceBoss=practice;expect(musicBossActive(w)).toBe(false);p.observe(w);expect(b.track).toBe('burning');}
 w.finalEncounter.phase='phase1';expect(musicBossActive(w)).toBe(true);p.observe(w);expect(b.track).toBe('boss');w.finalEncounter.phase='defeated';w.elapsed+=1;p.observe(w);expect(b.track).toBe('boss');w.elapsed+=2;p.observe(w);expect(b.track).toBe('burning');p.observe(new World(42,{spawnRate:0}));expect(b.track).toBe('normal');a.destroy();
});
it('ships exactly the five accepted second takes unchanged, with bounded playback gains',()=>{
  const manifest=JSON.parse(readFileSync('art/generated/music-runtime-v1/manifest.json','utf8')) as{approval:{accepted:boolean;selectedVariant:number};entries:{id:MusicTrackId;variant:number;source:string;file:string;sha256:string;gain:number}[]};
  expect(manifest.approval).toMatchObject({accepted:true,selectedVariant:2});expect(manifest.entries).toHaveLength(5);
  for(const e of manifest.entries){const bytes=readFileSync(e.file);expect(bytes.equals(readFileSync(e.source))).toBe(true);expect(createHash('sha256').update(bytes).digest('hex')).toBe(e.sha256);expect(e.source).toMatch(/-2\.mp3$/);expect(MUSIC_TRACKS[e.id].variant).toBe(2);expect(MUSIC_TRACKS[e.id].gain).toBe(e.gain);expect(e.gain).toBeGreaterThan(0);expect(e.gain).toBeLessThan(2);}
});
it('limits runtime changes to audio and selected MP3 assets over the363-file baseline',()=>{
  expect(musicRuntimeIntegration.baselineFiles).toBe(363);expect(musicRuntimeIntegration.changed).toHaveLength(6);expect(musicRuntimeIntegration.added).toHaveLength(7);expect(musicRuntimeIntegration.unchanged).toBe(357);
  for(const[file,digest]of Object.entries(musicRuntimeIntegration.currentSHA256))expect(createHash('sha256').update(readFileSync(file)).digest('hex'),file).toBe(wardenApprovedHash(file,digest));
});
