import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='art/generated/ash-warden-cast-sequence-v1/',json=p=>JSON.parse(readFileSync(p,'utf8'));
const previous=json('art/generated/ash-warden-melee-b-refinement-v2/protected-baseline.json'),files={...json(root+'protected-assets.json')};
// Flame Strike source code remains protected; Charge/Melee gameplay changes are intentional.
for(const[p,h]of Object.entries(previous))if(p.includes('flameStrike')||p.includes('FlameStrike'))files[p]=h;
for(const p of ['src/game/art/ashWardenManifest.json','src/game/art/flameStrikeManifest.json','src/game/art/meleeComboManifest.json'])Object.assign(files,json(p).sources??{});
const changed=[];for(const[p,h]of Object.entries(files))if(createHash('sha256').update(readFileSync(p)).digest('hex')!==h)changed.push(p);
if(changed.length)throw Error('Changed protected assets: '+changed.join(', '));
const config=readFileSync('src/game/config/finalBoss.ts','utf8'),value=k=>Number(config.match(new RegExp(k+':([\\d.]+)'))[1]),interval=value('meteorStagger'),warning=value('meteorWarning');
const schedule=n=>({count:n,releaseMs:Array.from({length:n},(_,i)=>Math.round(i*interval*1000)),impactMs:Array.from({length:n},(_,i)=>Math.round((warning+i*interval)*1000))});
const screenshots=readdirSync(root,{recursive:true}).filter(p=>p.endsWith('.png')).map(file=>{const png=readFileSync(root+file),width=png.readUInt32BE(16),height=png.readUInt32BE(20),name=file.split(/[\\/]/).at(-1);if(name.startsWith('1280-')&&(width!==1280||height!==720)||name.startsWith('844-')&&(width!==844||height!==390))throw Error('Wrong screenshot viewport: '+file);return{file:file.replaceAll('\\','/'),width,height};});
writeFileSync(root+'metadata.json',JSON.stringify({southBasicGroundLight:false,charge:{castMs:value('chargeWindup')*1000,targetTracking:'Through final cast tick; locked only at travel transition',earlyTargetLock:false,groundStrip:false,groundLine:false,endpointCircle:false,speedMultiplier:1.3},meteor:{intervalMs:interval*1000,warningMs:warning*1000,shielded:schedule(11),phase3:schedule(9),damagePerGroup:54,damageGroups:{shielded:[6,5],phase3:[5,4]},maxReserved:12,queuedRepresentation:'Negative age; no art/sound before release; all future strikes included in danger planner'},screenshots,generatedAssets:false},null,2)+'\n');
writeFileSync(root+'asset-validation.json',JSON.stringify({uniqueFiles:Object.keys(files).length,changed,screenshots:screenshots.length},null,2)+'\n');
