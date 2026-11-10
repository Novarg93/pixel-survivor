import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import process from 'node:process';
import console from 'node:console';
import {existsSync} from 'node:fs';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const directory='art/generated/music-ambient-review-v1';
const request=JSON.parse(await readFile(`${directory}/request.json`,'utf8'));
const generations=JSON.parse(await readFile(`${directory}/generations.json`,'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const browser=await chromium.launch({channel:'chromium',headless:true}),page=await browser.newPage();
const takes=[];
try{
  for(const generation of generations){
    const bytes=await readFile(`${directory}/${generation.file}`);
    if(sha(bytes)!==generation.sha256)throw new Error(`Source hash mismatch: ${generation.file}`);
    const analysis=await page.evaluate(async base64=>{
      const context=new globalThis.OfflineAudioContext(2,1,44100);
      const raw=Uint8Array.from(globalThis.atob(base64),c=>c.charCodeAt(0));
      const audio=await context.decodeAudioData(raw.buffer),bins=120,envelope=new Array(bins).fill(0),counts=new Array(bins).fill(0);
      let square=0,peak=0,clipped=0,invalid=0,head=0,tail=0,edgeCount=0;
      const edge=Math.min(audio.length,Math.round(audio.sampleRate*.5));
      for(let c=0;c<audio.numberOfChannels;c++){
        const channel=audio.getChannelData(c);
        for(let i=0;i<channel.length;i++){
          const x=channel[i],p=Math.abs(x),b=Math.min(bins-1,Math.floor(i*bins/audio.length));
          if(!Number.isFinite(x))invalid++;
          square+=x*x;peak=Math.max(peak,p);if(p>=.999)clipped++;
          envelope[b]+=x*x;counts[b]++;if(i<edge){head+=x*x;edgeCount++;}if(i>=audio.length-edge)tail+=x*x;
        }
      }
      const samples=audio.length*audio.numberOfChannels;
      return{seconds:audio.duration,sampleRate:audio.sampleRate,channels:audio.numberOfChannels,frames:audio.length,peak,rms:Math.sqrt(square/samples),clippedFraction:clipped/samples,invalidSamples:invalid,headRms:Math.sqrt(head/edgeCount),tailRms:Math.sqrt(tail/edgeCount),envelope:envelope.map((sum,i)=>Math.sqrt(sum/counts[i]))};
    },bytes.toString('base64'));
    if(analysis.invalidSamples||analysis.rms<.001||analysis.seconds<55||analysis.seconds>65)throw new Error(`Invalid musical take: ${generation.file}`);
    takes.push({...generation,analysis});
  }
}finally{await browser.close();}
const tracks=request.specs.map(spec=>({...spec,takes:takes.filter(t=>t.trackId===spec.id).sort((a,b)=>a.variant-b.variant)}));
if(tracks.length!==5||tracks.some(t=>t.takes.length!==4))throw new Error('Expected five themes with four variants');
const walk=async d=>{const entries=await readdir(d,{withFileTypes:true}),files=[];for(const e of entries){const file=`${d}/${e.name}`;if(e.isDirectory())files.push(...await walk(file));else files.push(file);}return files;};
const baseline=JSON.parse(await readFile(`${directory}/runtime-baseline.json`,'utf8')),files=[...await walk('src'),...await walk('public')].sort();
const changed=[];for(const[file,digest]of Object.entries(baseline))if(sha(await readFile(file))!==digest)changed.push(file);
const integrationFile='art/generated/music-runtime-v1/integration-verification.json';
const integration=existsSync(integrationFile)?JSON.parse(await readFile(integrationFile,'utf8')):null;
const expectedFiles=[...Object.keys(baseline),...(integration?.added??[])].sort(),inventoryUnchanged=JSON.stringify(files)===JSON.stringify(expectedFiles);
if(!inventoryUnchanged||JSON.stringify(changed.sort())!==JSON.stringify(integration?.changed??[]))throw new Error('Unapproved runtime change during music review');
if(integration){for(const[file,digest]of Object.entries(integration.currentSHA256))if(sha(await readFile(file))!==digest)throw new Error('Approved integration hash mismatch');}
else await writeFile(`${directory}/runtime-verification.json`,JSON.stringify({protectedFiles:files.length,changed,inventoryUnchanged,runtimeIntegration:false},null,2)+'\n');
const approval=existsSync(`${directory}/approval.json`)?JSON.parse(await readFile(`${directory}/approval.json`,'utf8')):null;
const manifest={version:1,flowId:request.flowId,model:request.model,runtimeIntegration:!!integration,acceptedForIntegration:approval?.accepted??false,acceptedVariant:approval?.selectedVariant??null,requestedSecondsPerTake:60,totalTakes:takes.length,totalBytes:takes.reduce((n,t)=>n+t.bytes,0),estimate:request.estimate,reportedGenerationCredits:takes.reduce((n,t)=>n+(t.price?.credits??0),0),runCreditCosts:request.run.results.reduce((n,r)=>n+Object.values(r.credit_costs??{}).reduce((a,b)=>a+b,0),0),reviewNote:approval?.accepted?'User accepted variant2 for all five tracks; all original alternatives retained.':'Original unmodified MP3 sketches. Four neutral alternatives per phase; no musical preference or seamless-loop quality is asserted by automated signal checks.',tracks};
await writeFile(`${directory}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
const template=await readFile('scripts/templates/ambient-music-review.html','utf8');
await writeFile(`${directory}/viewer.html`,template.replace('__MUSIC_DATA__',JSON.stringify(manifest).replaceAll('<','\\u003c')));
const playlist=['#EXTM3U',...tracks.flatMap(track=>{const take=track.takes.find(t=>t.variant===manifest.acceptedVariant)??track.takes[0];return[`#EXTINF:${Math.round(take.analysis.seconds)},${track.stage} — ${track.title}`,take.file];})].join('\n')+'\n';
await writeFile(`${directory}/five-themes.m3u`,playlist);
console.log(JSON.stringify({tracks:tracks.length,takes:takes.length,bytes:manifest.totalBytes,seconds:takes.reduce((n,t)=>n+t.analysis.seconds,0),reportedCredits:manifest.reportedGenerationCredits,runCreditCosts:manifest.runCreditCosts,runtimeProtected:files.length}));
