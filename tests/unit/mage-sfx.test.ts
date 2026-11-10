import {wardenApprovedHash} from '../helpers/approvedWardenIntegration';
import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {MAGE_SAMPLES,mageSampleIds,mageSampleForEvent} from '../../src/game/audio/mageSamples';
import {SOUND_CATALOG} from '../../src/game/audio/catalog';
const directory='art/generated/mage-sfx-elevenlabs-v1';
interface Source {file:string;sha256:string;generationId:string;variant:number}
interface Entry {id:keyof typeof MAGE_SAMPLES;event:string;file:string;seconds:number;sha256:string;source:Source;variants:Source[]}
const manifest=JSON.parse(readFileSync(`${directory}/manifest.json`,'utf8')) as{sourceCount:number;entries:Entry[]};
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
it('retains all44 traceable original takes and assigns11 local samples only to Mage cues',()=>{
  expect(manifest.sourceCount).toBe(44);expect(manifest.entries).toHaveLength(11);expect(mageSampleIds).toHaveLength(11);
  const request=JSON.parse(readFileSync(`${directory}/request.json`,'utf8')) as{run:{results:{credit_costs:Record<string,number>}[]}};
  const ids=new Set(request.run.results.flatMap(r=>Object.keys(r.credit_costs)));
  for(const entry of manifest.entries){
    expect(mageSampleForEvent(entry.event)).toBe(entry.id);expect(entry.variants).toHaveLength(4);expect(ids.has(entry.source.generationId)).toBe(true);
    for(const source of entry.variants){expect(hash(readFileSync(`${directory}/${source.file}`))).toBe(source.sha256);expect(ids.has(source.generationId)).toBe(true);}
  }
  for(const event of ['final.impact','final.cast','ultimate.frost','ultimate.fire','player.dash','ui.start'])expect(mageSampleForEvent(event)).toBeUndefined();
  expect(Object.values(MAGE_SAMPLES).every(event=>SOUND_CATALOG[event].bus==='sfx')).toBe(true);
});
it('ships finite mono44.1kHz PCM with bounded peaks, quiet edges and phase-aligned ultimate durations',()=>{
  let bytes=0;
  for(const entry of manifest.entries){
    const wav=readFileSync(`public/assets/audio/mage-sfx-v1/${entry.file}`);bytes+=wav.length;expect(hash(wav)).toBe(entry.sha256);
    expect(wav.toString('ascii',0,4)).toBe('RIFF');expect(wav.readUInt16LE(20)).toBe(1);expect(wav.readUInt16LE(22)).toBe(1);expect(wav.readUInt32LE(24)).toBe(44100);expect(wav.readUInt16LE(34)).toBe(16);
    const frames=wav.readUInt32LE(40)/2;expect(frames/44100).toBeCloseTo(entry.seconds,6);expect(entry.seconds).toBeGreaterThan(.1);expect(entry.seconds).toBeLessThanOrEqual(1.2);
    let peak=0,square=0;for(let i=0;i<frames;i++){const x=wav.readInt16LE(44+i*2)/32767;peak=Math.max(peak,Math.abs(x));square+=x*x;}
    expect(peak).toBeLessThanOrEqual(.751);expect(Math.sqrt(square/frames)).toBeGreaterThan(.025);expect(wav.readInt16LE(44)).toBe(0);expect(wav.readInt16LE(wav.length-2)).toBe(0);
  }
  expect(bytes).toBeLessThan(600000);
  for(const[id,seconds]of [['mage-ultimate-charge',.34],['mage-ultimate-sky',.16],['mage-ultimate-overload',.115]]as const)expect(manifest.entries.find(e=>e.id===id)!.seconds).toBeCloseTo(seconds,4);
});
it('allows only the explicitly requested audio and practice changes over the accepted art baseline',()=>{
  const audit=JSON.parse(readFileSync(`${directory}/integration-verification.json`,'utf8')) as{baselineFiles:number;changed:string[];added:string[];currentSHA256:Record<string,string>;unchanged:number};
  expect(audit.baselineFiles).toBe(351);expect(audit.changed).toHaveLength(7);expect(audit.added).toHaveLength(12);expect(audit.unchanged).toBe(344);
  for(const[file,digest]of Object.entries(audit.currentSHA256))expect(hash(readFileSync(file)),file).toBe(wardenApprovedHash(file,digest));
});
