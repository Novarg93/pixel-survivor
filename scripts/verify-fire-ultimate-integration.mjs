import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import console from 'node:console';
const root='art/generated/fire-ultimate-runtime-v1',sha=b=>createHash('sha256').update(b).digest('hex');
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
const baseline=JSON.parse(readFileSync(`${root}/runtime-baseline.json`,'utf8')),files=[...walk('src'),...walk('public')].sort();
const changed=Object.keys(baseline).filter(p=>sha(readFileSync(p))!==baseline[p]).sort(),added=files.filter(p=>!(p in baseline));
const allowedChanged=['src/game/art/FireUltimateArt.ts','src/game/art/GameArt.ts','src/game/audio/AudioController.ts','src/game/audio/PhaserAudioBackend.ts','src/game/audio/README.md','src/game/audio/samples.ts','src/game/config/ultimates.ts','src/game/ultimates/FireUltimate.ts','src/game/ultimates/UltimateSystem.ts'].sort();
const allowedAdded=['src/game/art/fireUltimatePack.ts','src/game/audio/fireUltimateSamples.ts',...['static','pulse'].map(n=>`public/assets/audio/fire-ultimate-v1/${n}.wav`),...['fire-mantle','fire-perimeter'].flatMap(n=>['png','json'].map(e=>`public/assets/hd/fire-ultimate-v1/${n}.${e}`))].sort();
if(JSON.stringify(changed)!==JSON.stringify(allowedChanged)||JSON.stringify(added)!==JSON.stringify(allowedAdded))throw Error(JSON.stringify({changed,added}));
for(const entry of JSON.parse(readFileSync(`${root}/audio-manifest.json`,'utf8'))){if(sha(readFileSync(entry.source))!==entry.sourceSHA256||sha(readFileSync(entry.file))!==entry.sha256)throw Error('Audio provenance mismatch');}
for(const name of ['fire-mantle','fire-perimeter'])for(const ext of ['png','json'])if(sha(readFileSync(`art/ultimate-review-v1/assets/${name}.${ext}`))!==sha(readFileSync(`public/assets/hd/fire-ultimate-v1/${name}.${ext}`)))throw Error('Accepted art changed');
const report={baselineFiles:Object.keys(baseline).length,changed,added,unchanged:Object.keys(baseline).length-changed.length,currentSHA256:Object.fromEntries([...changed,...added].map(p=>[p,sha(readFileSync(p))]))};
writeFileSync(`${root}/integration-verification.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({baseline:report.baselineFiles,changed:changed.length,added:added.length,unchanged:report.unchanged}));
