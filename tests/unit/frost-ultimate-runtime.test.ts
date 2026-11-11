import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {World} from '../../src/game/systems/World';
import {frostUltimateNovaView,frostUltimateRuneView} from '../../src/game/art/frostUltimatePack';
import {audioSampleForEvent} from '../../src/game/audio/samples';
import {frostUltimateIntegration,wardenApprovedHash} from '../helpers/approvedWardenIntegration';
function setup(){const w=new World(42,{spawnRate:0});w.elapsed=601;w.experience.level=40;w.ultimate.choose(w,'frost');w.ultimate.activate(w);return w;}
it('reveals a fixed-origin rune with the appearance wave, retains it during freeze and clears on end/death',()=>{
 const w=setup(),f=w.ultimate.frost;expect(frostUltimateRuneView(w,1)).toBeNull();w.elapsed=f.started+.45;expect(frostUltimateRuneView(w,1)!.reveal).toBeCloseTo(f.radius*8/220);expect(frostUltimateNovaView(w,1)).not.toBeNull();
 w.elapsed=f.started+.95;const before=JSON.stringify(w),partial=frostUltimateRuneView(w,1)!;expect(partial.reveal).toBeGreaterThan(f.radius*.5);expect(partial.reveal).toBeLessThan(f.radius);expect(JSON.stringify(w)).toBe(before);
 w.player.x=500;w.elapsed=f.started+1.5;expect(frostUltimateNovaView(w,1)).toBeNull();expect(frostUltimateRuneView(w,1)).toMatchObject({x:0,y:0,reveal:f.radius});w.pause();const view=frostUltimateRuneView(w,1);w.step(1);expect(frostUltimateRuneView(w,1)).toEqual(view);
 w.elapsed=f.endsAt;expect(frostUltimateRuneView(w,1)).toBeNull();w.elapsed=f.started+1;w.status='over';expect(frostUltimateRuneView(w,1)).toBeNull();
});
it('ships only the recorded effect after1.12s, with the source preserved and bounded playback gain',()=>{
 const m=JSON.parse(readFileSync('art/generated/frost-ultimate-runtime-v1/audio-manifest.json','utf8')) as{file:string;source:string;sha256:string;sourceSHA256:string;seconds:number;trim:number[];peak:number;gain:number};
 const hash=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');expect(hash(m.file)).toBe(m.sha256);expect(hash(m.source)).toBe(m.sourceSHA256);expect(m.trim).toEqual([1.12,2.88]);expect(m.seconds).toBe(1.76);expect(m.peak*m.gain).toBeLessThan(.75);expect(audioSampleForEvent('ultimate.frostImpact')).toBe('frost-ultimate');
 const b=readFileSync(m.file);expect(b.readInt16LE(44)).toBe(0);expect(b.readInt16LE(b.length-2)).toBe(0);
});
it('preserves all389 unrelated runtime files including fire gameplay/audio and frost combat',()=>{
 const baseline=JSON.parse(readFileSync('art/generated/frost-ultimate-runtime-v1/runtime-baseline.json','utf8')) as Record<string,string>;expect(frostUltimateIntegration).toMatchObject({baselineFiles:393,unchanged:389});expect(frostUltimateIntegration.changed).toHaveLength(4);expect(frostUltimateIntegration.added).toHaveLength(7);
 for(const file of [...Object.keys(baseline),...frostUltimateIntegration.added])expect(createHash('sha256').update(readFileSync(file)).digest('hex'),file).toBe(wardenApprovedHash(file,frostUltimateIntegration.currentSHA256[file]??baseline[file]));
});
