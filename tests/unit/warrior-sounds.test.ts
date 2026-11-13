import {expect,it} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WARRIOR_SAMPLES,audioSampleIds,audioSampleForEvent,audioSampleGain,audioSampleKey} from '../../src/game/audio/samples';
import {World} from '../../src/game/systems/World';
import {AudioPresentation} from '../../src/game/audio/AudioPresentation';
import {AudioController} from '../../src/game/audio/AudioController';
import {DEFAULT_SETTINGS} from '../../src/game/services/storage';
import {warriorSoundsIntegration as proof,wardenApprovedHash} from '../helpers/approvedWardenIntegration';

const sha=(file:string)=>createHash('sha256').update(readFileSync(file)).digest('hex');
it('preserves all nine user recordings and pins the complete integration inventory and hashes',()=>{
 const manifest=JSON.parse(readFileSync('docs/verification/warrior-sounds-v1/manifest.json','utf8')) as {entries:{id:keyof typeof WARRIOR_SAMPLES;source:string;file:string;sha256:string;seconds:number;peak:number;rms:number}[]};
 expect(manifest.entries).toHaveLength(9);expect(new Set(audioSampleIds).size).toBe(36);
 for(const e of manifest.entries){expect(sha(e.source)).toBe(e.sha256);expect(sha(e.file)).toBe(e.sha256);expect(e.rms).toBeGreaterThan(0);expect(e.peak).toBeLessThanOrEqual(1);expect(e.seconds).toBeGreaterThan(0);expect(audioSampleGain(e.id)).toBeLessThanOrEqual(1);expect(audioSampleKey(e.id)).toContain(e.sha256.slice(0,12));}
 const baseline=JSON.parse(readFileSync('docs/verification/warrior-sounds-v1/runtime-baseline.json','utf8')) as Record<string,string>;
 const walk=(dir:string):string[]=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]);
 expect([...walk('src'),...walk('public')].sort()).toEqual([...Object.keys(baseline),...proof.added].sort());
 for(const file of [...Object.keys(baseline),...proof.added])expect(sha(file),file).toBe(wardenApprovedHash(file,proof.currentSHA256[file]??baseline[file]!));
 expect(proof.changed).toHaveLength(5);expect(proof.added).toHaveLength(9);
});
it('maps every Warrior action independently of Mage sounds',()=>{
 const events=['cleave.swing','whirlwind.active','groundSlam.cast','bladestorm.active','ironSkin.trigger','player.dash','ultimate.banner','ultimate.earthbreaker','ultimate.ruin'] as const;
 expect(new Set(events.map(audioSampleForEvent)).size).toBe(9);
 expect(events.map(audioSampleForEvent).sort()).toEqual(Object.keys(WARRIOR_SAMPLES).sort());
 expect(audioSampleForEvent('arcaneShield.trigger')).toBe('mage-shield');
});
it.each(['banner','earthbreaker','ruin'] as const)('%s emits exactly one dedicated cue on successful activation and never the Mage shield',async kind=>{
 const w=new World(47,{character:'warrior',spawnRate:0});w.elapsed=300;w.experience.level=30;
 const c=new AudioController({supported:true,running:true,now:0,unlock:async()=>true,bus:()=>{},music:()=>true,start:()=>({gain:()=>{},stop:()=>{}}),stopAll:()=>{},destroy:()=>{},diagnostics:()=>({nodes:0,sources:0,loops:0,decodedBytes:0,rms:0})});
 c.settings(DEFAULT_SETTINGS);c.gesture();await Promise.resolve();await Promise.resolve();const p=new AudioPresentation(c);p.observe(w);
 expect(w.ultimate.choose(w,kind)).toBe(true);expect(w.ultimate.activate(w)).toBe(true);expect(w.ultimate.activate(w)).toBe(false);
 p.observe(w);p.observe(w);expect(c.diagnostics().requested[`ultimate.${kind}`]).toBe(1);expect(c.diagnostics().requested['arcaneShield.trigger']).toBeUndefined();c.destroy();
});
