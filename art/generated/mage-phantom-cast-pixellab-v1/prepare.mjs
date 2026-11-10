import {readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync,statSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,relative} from 'node:path';
const root='art/generated/mage-phantom-cast-pixellab-v1';
if(existsSync(root+'/actual-expenses.json'))throw Error('Pilot is already initialized; do not overwrite its generation ledger or protection baseline.');
for(const dir of ['reference','reference/run-north','reference/cast-north','reference/cast-south','raw','processed','layers','comparisons','screenshots','validation'])mkdirSync(root+'/'+dir,{recursive:true});
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const baseline={};
function walk(dir){for(const name of readdirSync(dir)){const p=dir+'/'+name;if(statSync(p).isDirectory())walk(p);else baseline[p]=hash(p);}}
for(const dir of ['src','public/assets'])walk(dir);
for(const file of ['package.json','package-lock.json','vite.config.ts','tsconfig.json','playwright.config.ts','AGENTS.md','PLAN.md'])if(existsSync(file))baseline[file]=hash(file);
writeFileSync(root+'/validation/protected-before.json',JSON.stringify(baseline,null,2)+'\n');
const hero=JSON.parse(readFileSync('src/game/art/mageHeroManifest.json','utf8'));
const copy=(source,target)=>{copyFileSync(source,root+'/'+target);return {file:target,source,sha256:hash(source)};};
const sources={
  model:copy('art/main-hero-mage/abilities/hero-model/static.png','reference/mage-approved-model.png'),
  south:copy('art/generated/mage-hero-v2/first-frames/south.png','reference/mage-south.png'),
  north:copy('art/generated/mage-hero-v2/first-frames/north.png','reference/mage-north.png'),
  east:copy('art/generated/mage-hero-v2/first-frames/east.png','reference/mage-east.png'),
  directions:copy('art/main-hero-mage/abilities/hero-model/8-directions.png','reference/directions.png'),
  idle:hero.clips['idle-south'].sourceFiles.map((p,i)=>copy(p,'reference/idle-south-'+String(i).padStart(2,'0')+'.png')),
  run:hero.clips['run-north'].sourceFiles.map((p,i)=>copy(p,'reference/run-north/'+String(i).padStart(2,'0')+'.png')),
  castNorth:hero.clips['fireball-north'].sourceFiles.map((p,i)=>copy(p,'reference/cast-north/'+String(i).padStart(2,'0')+'.png')),
  castSouth:hero.clips['fireball-south'].sourceFiles.map((p,i)=>copy(p,'reference/cast-south/'+String(i).padStart(2,'0')+'.png')),
};
const waists=JSON.parse(readFileSync('src/game/art/mageHeroWaists.json','utf8'));
const selectedFrames=[...hero.clips['run-north'].frames,...hero.clips['fireball-north'].frames];
writeFileSync(root+'/reference/source-manifest.json',JSON.stringify({sources,sourceCanvas:hero.sourceCanvas,runtimeCanvas:hero.canvas,displaySizeWorld:hero.displaySize,pivotRuntime:hero.pivot,pivotNative:{x:hero.pivot.x*256/hero.canvas,y:hero.pivot.y*256/hero.canvas},nativeWorldScale:hero.displaySize/hero.sourceCanvas,runFrameDurationsMs:hero.clips['run-north'].frames.map(()=>60),upperLowerSystem:'Existing moving cast uses independently timed Run lower body and direction-of-movement cast upper body, aligned by authored waist landmarks; the accepted production system stays untouched.',waists:Object.fromEntries(selectedFrames.map(k=>[k,waists.frames[k]])),scene:'Shard Grove / Роща осколков'},null,2)+'\n');
writeFileSync(root+'/generation-manifest.json',JSON.stringify({name:'Arcane Phantom Cast / PixelLab Production Pilot V1',scenario:'North Run, South upper-body Fireball cast',runtimeIntegration:false,branch:'main',reference:sources.south,methodDecision:'Animate the exact approved Mage reference with PixMiniMax, then artist-mask the generated upper body in Aseprite. Full-body source retains costume identity; raw outputs are preserved, but phantom exports never contain generated legs.',toolsInvestigated:['animate_image_pixminimax','animate_image','animate_with_skeleton_v3','edit_image_pixen','edit_image','get_pro_flash_capabilities','get_image','Aseprite batch Lua'],pricing:{source:'https://www.pixellab.ai/pixellab-api',checked:'2026-11-09',pixminimax256x256x8:{subscriptionGenerations:1,estimatedCreditUsd:.0231},skeletonV3EightFrames:{subscriptionGenerations:3,estimatedCreditUsd:.0513},budgetCreditUsd:2,perRequestGuardUsd:.1,actualCreditUsd:null,actualSubscriptionGenerations:null},requests:[]},null,2)+'\n');
console.log(JSON.stringify({directory:resolve(root),protectedFiles:Object.keys(baseline).length,referenceCount:2+sources.run.length+sources.castNorth.length+sources.castSouth.length,worldSize:hero.displaySize,pivotNative:{x:hero.pivot.x*256/hero.canvas,y:hero.pivot.y*256/hero.canvas},relative:relative(process.cwd(),root)}));
