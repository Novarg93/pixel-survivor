import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='art/generated/ash-warden-charge-a-update-v1/',json=p=>JSON.parse(readFileSync(p,'utf8'));
const previous=json('art/generated/ash-warden-melee-b-refinement-v2/protected-baseline.json');
// Gameplay in the historical baseline is deliberately changed in this task.
// Retain its art/Flame Strike checks without overwriting that old baseline.
const protectedFiles={...Object.fromEntries(Object.entries(previous).filter(([p])=>p.startsWith('art/')||p.startsWith('public/')||p.includes('flameStrike')||p.includes('FlameStrike'))),...json(root+'protected-assets.json')},sources={};
for(const p of ['src/game/art/ashWardenManifest.json','src/game/art/flameStrikeManifest.json','src/game/art/meleeComboManifest.json'])Object.assign(sources,json(p).sources??{});
const files={...protectedFiles,...sources},changed=[];
for(const [p,hash]of Object.entries(files))if(createHash('sha256').update(readFileSync(p)).digest('hex')!==hash)changed.push(p);
if(changed.length)throw Error('Changed protected art: '+changed.join(', '));
const screenshots=readdirSync(root+'screenshots').filter(p=>p.endsWith('.png')).map(p=>{const png=readFileSync(root+'screenshots/'+p),width=png.readUInt32BE(16),height=png.readUInt32BE(20);if(p.startsWith('1280-')&&(width!==1280||height!==720)||p.startsWith('844-')&&(width!==844||height!==390))throw Error('Wrong screenshot viewport: '+p);return{file:'screenshots/'+p,width,height};});
const combo=json('src/game/art/meleeComboManifest.json'),warden=json('src/game/art/ashWardenManifest.json'),config=readFileSync('src/game/config/finalBoss.ts','utf8'),aSpeed=Number(config.match(/meleeASpeedMultiplier:([\d.]+)/)[1]),chargeSpeed=Number(config.match(/CHARGE_SPEED_MULTIPLIER=([\d.]+)/)[1]);
const metadata={meleeA:{speedMultiplier:aSpeed,sourceFrameDurationsMs:combo.bodyA.durationsMs,runtimeFrameDurationsMs:combo.bodyA.durationsMs.map(ms=>ms/aSpeed),durationMs:1200/aSpeed,hitMs:650/aSpeed,damage:32,groundLight:false,slash:false},charge:{speedMultiplier:chargeSpeed,windupMs:650,trackingUntilMs:450,targetLockLeadMs:200,originalTravelMs:420,travelMs:420/chargeSpeed,maxDistance:300,brakeMs:300,damage:48,target:'Player position sampled until lock; cap300; arena margin28',oldStopShort90Removed:true,travelSourceDurationsMs:warden.clips['south-chargeTravel'].durationsMs,west:'Mirrored body/emission/start-stop VFX, signed x registration; event direction snapshots'},sourceAssetsModified:false,generatedAssets:false,screenshots};
writeFileSync(root+'metadata.json',JSON.stringify(metadata,null,2)+'\n');
writeFileSync(root+'asset-validation.json',JSON.stringify({protectedFiles:Object.keys(protectedFiles).length,sourceFiles:Object.keys(sources).length,uniqueFiles:Object.keys(files).length,changed,screenshots:screenshots.length},null,2)+'\n');
