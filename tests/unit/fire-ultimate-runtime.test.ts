import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {World} from '../../src/game/systems/World';
import {FIRE_ULTIMATE_SAMPLES} from '../../src/game/audio/fireUltimateSamples';
import {audioSampleForEvent} from '../../src/game/audio/samples';
import {fireUltimateIntegration,wardenApprovedHash} from '../helpers/approvedWardenIntegration';
const setup=()=>{const w=new World(3,{spawnRate:0});w.elapsed=601;w.experience.level=40;w.ultimate.choose(w,'fire');w.ultimate.activate(w);return w;};
it('grows only at2/4/6/8s and emits exactly one pulse per growth, never at expiry or on repeat updates',()=>{
 const w=setup(),f=w.ultimate.fire;expect(w.sounds).toEqual(['ultimate-fire']);w.sounds=[];
 for(const [age,step]of [[1.999,0],[2,1],[2,1],[3.999,1],[4,2],[6,3],[8,4],[9.999,4],[10,4]] as const){w.elapsed=601+age;w.ultimate.update(w);expect(f.radius(w.elapsed)).toBeCloseTo(164*(1+step*.1));}
 expect(w.sounds).toEqual(Array(4).fill('ultimate-fire'));
 w.ultimate.clear();expect(f.radius(w.elapsed)).toBe(164);
});
it('heals on each world second using effective maxHP, respects pause, never resurrects, and caps bosses',()=>{
 const w=setup();w.player.maxHp=200;w.player.hp=1;
 for(let i=1;i<=5;i++){w.elapsed=601+i;w.ultimate.update(w);expect(w.player.hp).toBe(Math.min(200,1+40*i));}
 w.pause();w.player.hp=1;w.ultimate.update(w);expect(w.player.hp).toBe(1);w.resume();w.elapsed=607;w.ultimate.update(w);expect(w.player.hp).toBe(41);w.player.hp=0;w.elapsed=608;w.ultimate.update(w);expect(w.player.hp).toBe(0);
});
it('retains source static bytes and extracts the ignition transient with click-free edges',()=>{
 const dir='art/main-hero-mage-v2/sounds/fire-ult/';
 for(const [id,m]of Object.entries(FIRE_ULTIMATE_SAMPLES)){const b=readFileSync('public/'+m.file);expect(createHash('sha256').update(b).digest('hex')).toBe(m.sha256);if(id.endsWith('static'))expect(b.equals(readFileSync(dir+'static.wav'))).toBe(true);else{expect(b.readUInt32LE(40)/192000).toBeCloseTo(1.8);expect(b.readInt16LE(44)).toBe(0);expect(b.readInt16LE(b.length-2)).toBe(0);}}
 expect(audioSampleForEvent('ultimate.fire')).toBe('fire-ultimate-pulse');
});
it('limits the accepted integration to9 changed and8 added runtime files and protects every other file',()=>{
 const baseline=JSON.parse(readFileSync('art/generated/fire-ultimate-runtime-v1/runtime-baseline.json','utf8')) as Record<string,string>;
 expect(fireUltimateIntegration).toMatchObject({baselineFiles:385,unchanged:376});expect(fireUltimateIntegration.changed).toHaveLength(9);expect(fireUltimateIntegration.added).toHaveLength(8);
 for(const file of [...Object.keys(baseline),...fireUltimateIntegration.added])expect(createHash('sha256').update(readFileSync(file)).digest('hex'),file).toBe(wardenApprovedHash(file,fireUltimateIntegration.currentSHA256[file]??baseline[file]));
});
