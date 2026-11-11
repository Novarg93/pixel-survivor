import {it,expect} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {MAGE_UPLOADED_SAMPLES} from '../../src/game/audio/mageUploadedSamples';
import {mageSampleForEvent,mageSampleIds,mageSampleKey,mageSampleUrl,mageSampleGain,type MageSampleId} from '../../src/game/audio/mageSamples';
import {visualCleanupIntegration,minibossAssetsIntegration,mageUploadedIntegration,wardenSoundsIntegration,wardenApprovedHash,arcaneShieldIntegration,frostNovaIntegration,fireUltimateIntegration,frostUltimateIntegration} from '../helpers/approvedWardenIntegration';
const root='art/generated/mage-uploaded-sounds-v1';
interface Entry{id: keyof typeof MAGE_UPLOADED_SAMPLES;folder:string;event:string;source:string;file:string;sha256:string;gain:number;analysis:{seconds:number;sampleRate:number;channels:number;peak:number;rms:number;invalidSamples:number}}
const manifest=JSON.parse(readFileSync(`${root}/manifest.json`,'utf8'))as{originalBytesPreserved:boolean;entries:Entry[]};
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
it('connects all five user files byte-for-byte and assigns thunder to the ultimate release',()=>{
  expect(manifest.originalBytesPreserved).toBe(true);expect(manifest.entries).toHaveLength(5);expect(mageSampleIds).toHaveLength(11);
  for(const e of manifest.entries){const original=readFileSync(e.source),runtime=readFileSync(e.file);expect(runtime.equals(original)).toBe(true);expect(sha(runtime)).toBe(e.sha256);expect(MAGE_UPLOADED_SAMPLES[e.id].sha256).toBe(e.sha256);expect(mageSampleForEvent(e.event)).toBe(e.id);expect(mageSampleUrl(e.id)).toContain(e.file.replace('public/',''));}
  expect(manifest.entries.find(e=>e.folder==='thunder')).toMatchObject({id:'mage-ultimate-release',event:'ultimate.lightning',analysis:{seconds:2}});
  expect(manifest.entries.filter(e=>e.folder!=='thunder').every(e=>e.analysis.seconds===1)).toBe(true);
});
it('uses fresh source-hash cache keys and bounded gain, retaining all four cues with no supplied replacement',()=>{
  for(const e of manifest.entries){expect(mageSampleKey(e.id)).toContain('mage-uploaded-v1');expect(mageSampleKey(e.id)).toContain(e.sha256.slice(0,12));expect(mageSampleGain(e.id)).toBe(e.gain);expect(e.analysis.invalidSamples).toBe(0);expect(e.analysis.rms).toBeGreaterThan(.001);expect(e.analysis.channels).toBeGreaterThan(0);expect(e.analysis.peak*e.gain).toBeLessThanOrEqual(.751);}
  const retained: MageSampleId[]=['mage-fireball-impact','mage-ultimate-charge','mage-ultimate-sky','mage-ultimate-overload'];
  for(const id of retained){expect(mageSampleKey(id)).toBe(`pixel-audio:mage-sfx-v1:${id}`);expect(mageSampleUrl(id)).toContain(`assets/audio/mage-sfx-v1/${id}.wav`);expect(mageSampleGain(id)).toBe(1);}
});
it('preserves music, gameplay and all other runtime files outside the exact4changed/6added scope',()=>{
  const baseline=JSON.parse(readFileSync(`${root}/runtime-baseline.json`,'utf8'))as Record<string,string>;
  const walk=(d:string):string[]=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
  expect(Object.keys(baseline)).toHaveLength(370);expect(mageUploadedIntegration.changed).toEqual(['src/game/audio/PhaserAudioBackend.ts','src/game/audio/README.md','src/game/audio/catalog.ts','src/game/audio/mageSamples.ts']);expect(mageUploadedIntegration.added).toHaveLength(6);expect(mageUploadedIntegration.unchanged).toBe(366);
  expect([...walk('src'),...walk('public')].sort()).toEqual([...Object.keys(baseline),...mageUploadedIntegration.added,...wardenSoundsIntegration.added,...arcaneShieldIntegration.added,...frostNovaIntegration.added,...fireUltimateIntegration.added,...frostUltimateIntegration.added,...minibossAssetsIntegration.added,...visualCleanupIntegration.added].sort());
  for(const file of [...Object.keys(baseline),...mageUploadedIntegration.added])expect(sha(readFileSync(file)),file).toBe(wardenApprovedHash(file,mageUploadedIntegration.currentSHA256[file]??baseline[file]!));
});
it('replaces Arcane Shield with the quiet user WAV and leaves every other runtime file unchanged',()=>{
  const root='art/generated/arcane-shield-sound-v1';
  const m=JSON.parse(readFileSync(`${root}/manifest.json`,'utf8'))as{source:string;file:string;sha256:string;gain:number;seconds:number};
  expect(readFileSync(m.file).equals(readFileSync(m.source))).toBe(true);expect(sha(readFileSync(m.file))).toBe(m.sha256);
  expect(m.seconds).toBe(1);expect(mageSampleForEvent('arcaneShield.trigger')).toBe('mage-shield');
  expect(mageSampleKey('mage-shield')).toContain(m.sha256.slice(0,12));expect(mageSampleUrl('mage-shield')).toContain('mage-sfx-uploaded-v1/arcaneshield.wav');
  expect(mageSampleGain('mage-shield')).toBe(.55);expect(MAGE_UPLOADED_SAMPLES['mage-shield'].sha256).toBe(m.sha256);
  const baseline=JSON.parse(readFileSync(`${root}/runtime-baseline.json`,'utf8'))as Record<string,string>;
  expect(Object.keys(baseline)).toHaveLength(383);expect(arcaneShieldIntegration.changed).toEqual(['src/game/audio/README.md','src/game/audio/mageSamples.ts','src/game/audio/mageUploadedSamples.ts']);expect(arcaneShieldIntegration.added).toEqual([m.file]);
  for(const[f,digest]of Object.entries(baseline))expect(sha(readFileSync(f)),f).toBe(wardenApprovedHash(f,arcaneShieldIntegration.currentSHA256[f]??digest));
});
it('connects the supplied Frost Nova WAV and preserves every other runtime file',()=>{
  const root='art/generated/frost-nova-sound-v1';
  const m=JSON.parse(readFileSync(`${root}/manifest.json`,'utf8'))as{source:string;file:string;sha256:string;gain:number;seconds:number;analysis:{channels:number;sampleRate:number;bits:number;clippedFraction:number;playbackPeak:number}};
  expect(m.source).toBe('art/main-hero-mage-v2/sounds/frost_nova/frost_nova.wav');
  expect(readFileSync(m.file).equals(readFileSync(m.source))).toBe(true);expect(sha(readFileSync(m.file))).toBe(m.sha256);
  expect(m.seconds).toBe(1);expect(m.analysis).toMatchObject({channels:2,sampleRate:48000,bits:16,clippedFraction:0});expect(m.analysis.playbackPeak).toBeLessThanOrEqual(.751);
  expect(mageSampleForEvent('frostNova.cast')).toBe('mage-frost-nova');expect(mageSampleUrl('mage-frost-nova')).toContain('mage-sfx-uploaded-v1/frost-nova.wav');
  expect(mageSampleKey('mage-frost-nova')).toContain(m.sha256.slice(0,12));expect(mageSampleGain('mage-frost-nova')).toBe(m.gain);expect(m.gain).toBeLessThanOrEqual(2);
  expect(MAGE_UPLOADED_SAMPLES['mage-frost-nova'].sha256).toBe(m.sha256);expect(mageSampleGain('mage-shield')).toBe(.55);
  const baseline=JSON.parse(readFileSync(`${root}/runtime-baseline.json`,'utf8'))as Record<string,string>;
  const walk=(d:string):string[]=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
  expect(frostNovaIntegration).toMatchObject({baselineFiles:384,unchanged:381,added:[m.file],changed:['src/game/audio/README.md','src/game/audio/mageSamples.ts','src/game/audio/mageUploadedSamples.ts']});
  expect([...walk('src'),...walk('public')].sort()).toEqual([...Object.keys(baseline),m.file,...fireUltimateIntegration.added,...frostUltimateIntegration.added,...minibossAssetsIntegration.added,...visualCleanupIntegration.added].sort());
  for(const[f,digest]of Object.entries(baseline))expect(sha(readFileSync(f)),f).toBe(wardenApprovedHash(f,frostNovaIntegration.currentSHA256[f]??digest));
});
