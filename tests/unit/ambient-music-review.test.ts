import {it,expect} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {visualCleanupIntegration,minibossAssetsIntegration,wardenApprovedHash,musicRuntimeIntegration,mageUploadedIntegration,wardenSoundsIntegration,arcaneShieldIntegration,frostNovaIntegration,fireUltimateIntegration,frostUltimateIntegration} from '../helpers/approvedWardenIntegration';
const root='art/generated/music-ambient-review-v1';
interface Take {generationId:string;file:string;sha256:string;variant:number;bytes:number;analysis:{seconds:number;channels:number;sampleRate:number;rms:number;peak:number;invalidSamples:number;envelope:number[]}}
interface Track {id:string;phase:string;stage:string;seconds:number;takes:Take[]}
const manifest=JSON.parse(readFileSync(`${root}/manifest.json`,'utf8')) as{runtimeIntegration:boolean;totalTakes:number;totalBytes:number;tracks:Track[]};
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
it('retains five stage-specific instrumental themes and all20 traceable original music takes',()=>{
  expect(manifest.runtimeIntegration).toBe(true);expect(manifest.totalTakes).toBe(20);expect(manifest.tracks.map(t=>t.phase)).toEqual(['normal','dusk','dying','burning','boss']);
  const request=JSON.parse(readFileSync(`${root}/request.json`,'utf8')) as{run:{results:{credit_costs:Record<string,number>}[]}};
  const ids=new Set(request.run.results.flatMap(r=>Object.keys(r.credit_costs)));expect(ids.size).toBe(20);let bytes=0;
  for(const track of manifest.tracks){expect(track.seconds).toBe(60);expect(track.takes.map(t=>t.variant)).toEqual([1,2,3,4]);for(const take of track.takes){
    const original=readFileSync(`${root}/${take.file}`);expect(sha(original),take.file).toBe(take.sha256);expect(original.length).toBe(take.bytes);expect(ids.has(take.generationId)).toBe(true);bytes+=original.length;
  }}
  expect(bytes).toBe(manifest.totalBytes);expect(readdirSync(`${root}/source`)).toHaveLength(20);
});
it('decodes every original into finite non-silent minute-long audio and records a real envelope',()=>{
  for(const take of manifest.tracks.flatMap(t=>t.takes)){
    const a=take.analysis;expect(a.seconds).toBeGreaterThan(55);expect(a.seconds).toBeLessThan(65);expect([1,2]).toContain(a.channels);expect(a.sampleRate).toBe(44100);expect(a.invalidSamples).toBe(0);expect(a.rms).toBeGreaterThan(.001);expect(a.peak).toBeGreaterThan(.01);expect(a.envelope).toHaveLength(120);expect(a.envelope.every(v=>Number.isFinite(v)&&v>=0)).toBe(true);
  }
  const playlist=readFileSync(`${root}/five-themes.m3u`,'utf8');expect(playlist.startsWith('#EXTM3U')).toBe(true);for(const track of manifest.tracks)expect(playlist).toContain(track.takes[1]!.file);
});
it('preserves the review proof and allows only the later explicit music integration',()=>{
  const baseline=JSON.parse(readFileSync(`${root}/runtime-baseline.json`,'utf8')) as Record<string,string>;
  const walk=(dir:string):string[]=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]);
  expect(Object.keys(baseline)).toHaveLength(363);expect([...walk('src'),...walk('public')].sort()).toEqual([...Object.keys(baseline),...musicRuntimeIntegration.added,...mageUploadedIntegration.added,...wardenSoundsIntegration.added,...arcaneShieldIntegration.added,...frostNovaIntegration.added,...fireUltimateIntegration.added,...frostUltimateIntegration.added,...minibossAssetsIntegration.added,...visualCleanupIntegration.added].sort());for(const[file,digest]of Object.entries(baseline))expect(sha(readFileSync(file)),file).toBe(wardenApprovedHash(file,digest));
  expect(JSON.parse(readFileSync(`${root}/runtime-verification.json`,'utf8'))).toEqual({protectedFiles:363,changed:[],inventoryUnchanged:true,runtimeIntegration:false});
});
