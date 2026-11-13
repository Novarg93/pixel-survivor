import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {historicalRuntimeHash} from './berserk-sprint-scope.mjs';
import {beforeWarriorUltimatesFiles} from './warrior-ultimates-scope.mjs';
import assert from 'node:assert/strict';
import {Buffer} from 'node:buffer';
import process from 'node:process';
import {readPNG} from '../art/generated/warrior-concept-pack-v1/source/png.mjs';

const root='art/generated/warrior-skills-runtime-v1',m=JSON.parse(readFileSync('src/game/art/warriorSkillsManifest.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const allowed=[
 'src/game/abilities/definitions.ts','src/game/abilities/tickAbilities.ts','src/game/abilities/warrior.ts',
 'src/game/art/GameArt.ts','src/game/art/WarriorHeroAnimation.ts','src/game/art/WarriorMagic.ts','src/game/art/assetRegistry.ts','src/game/art/warriorHeroPack.ts',
 'src/game/systems/MobilitySystem.ts','src/game/systems/UpgradeSystem.ts','src/game/systems/World.ts',
 'src/ui/upgradeCards.ts','src/ui/upgradeEmblems.ts',
];
const additions=[...Array.from({length:7},(_,i)=>[`public/assets/hd/warrior-skills-v1/${i}.json`,`public/assets/hd/warrior-skills-v1/${i}.png`]).flat(),
 'src/game/art/WarriorSkillArt.ts','src/game/art/warriorSkillsManifest.json','src/game/art/warriorSkillsPack.ts','src/game/config/warriorAbilities.ts'].sort();
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
const baseline=JSON.parse(readFileSync(`${root}/runtime-baseline.json`,'utf8'));
const later=JSON.parse(readFileSync('art/generated/warrior-cleave-sync-v3/integration-verification.json','utf8'));
const latest=JSON.parse(readFileSync('art/generated/warrior-buffs-v4/integration-verification.json','utf8'));
const proof=JSON.parse(readFileSync(`${root}/integration-verification.json`,'utf8'));
assert.deepEqual(proof.changed,allowed);assert.deepEqual(proof.added,additions);
assert.deepEqual(beforeWarriorUltimatesFiles([...walk('src'),...walk('public')]).sort(),[...Object.keys(baseline),...additions,...later.added,...latest.added].sort());
for(const p of [...Object.keys(baseline),...additions])assert.equal(historicalRuntimeHash(p),latest.currentSHA256[p]??later.currentSHA256[p]??proof.currentSHA256[p]??baseline[p],p);
if(process.argv.includes('--record'))throw Error('Historical skill proof is immutable; record the current v4 proof instead');
const pages=new Map();
for(const page of m.pages){
 const path=`public/assets/hd/warrior-skills-v1/${page.index}.png`;assert.equal(sha(readFileSync(path)),page.sha256);
 pages.set(page.index,{raw:readPNG(path),atlas:JSON.parse(readFileSync(path.replace('.png','.json'),'utf8'))});
}
for(const[name,f]of Object.entries(m.locations)){
 const path=`${m.source}/${f.source}`,source=readPNG(path);assert.equal(sha(readFileSync(path)),f.sha256);
 const {raw,atlas}=pages.get(f.page),rect=atlas.frames[name].frame,rgba=new Uint8Array(192*192*4);
 for(let row=0;row<192;row++)rgba.set(raw.pixels.subarray(((rect.y+row)*raw.width+rect.x)*4,((rect.y+row)*raw.width+rect.x+192)*4),row*192*4);
 assert.equal(sha(Buffer.from(rgba)),sha(Buffer.from(source.pixels)),name);assert.equal(sha(Buffer.from(rgba)),f.pixelSHA256,name);
}
assert.equal(Object.keys(m.clips).length,12);assert.equal(Object.values(m.clips).reduce((n,c)=>n+c.frames.length,0),156);
assert.equal(m.routes.north.flip,false);assert.equal(m.routes['north-east'].flip,false);assert.equal(m.routes['north-west'].flip,true);
globalThis.console.log(JSON.stringify({bodyFrames:156,clips:12,pages:pages.size,rgbaDifferences:0,scope:proof},null,2));
