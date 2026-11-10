import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Buffer} from 'node:buffer';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import process from 'node:process';
import console from 'node:console';

// Downloads existing completed generations only. This script cannot generate audio.
const directory='art/generated/ash-warden-sfx-v1';
const request=JSON.parse(await readFile(`${directory}/request.json`,'utf8'));
const generations=existsSync('.tmp/ash-warden-sfx-download.json')
  ?JSON.parse(await readFile('.tmp/ash-warden-sfx-download.json','utf8'))
  :JSON.parse(await readFile(`${directory}/generations.json`,'utf8')).map(g=>({id:g.generationId,status:g.status,model_id:g.model,duration_secs:g.reportedSeconds,price:g.reportedPrice}));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
await mkdir(`${directory}/source`,{recursive:true});
const entries=[];
for(const g of generations){
  if(g.status!=='completed')throw new Error(`Generation incomplete: ${g.id}`);
  const receipt=request.run.results.find(r=>Object.hasOwn(r.credit_costs??{},g.id));
  const spec=request.specs.find(s=>s.nodeId===receipt?.node_id);
  if(!spec)throw new Error(`Unknown generation: ${g.id}`);
  const variant=request.run.results.filter(r=>r.node_id===spec.nodeId).findIndex(r=>Object.hasOwn(r.credit_costs??{},g.id))+1;
  const file=`source/ash-warden-${spec.id}-a-take-${variant}.mp3`;
  let bytes;
  if(existsSync(`${directory}/${file}`))bytes=await readFile(`${directory}/${file}`);
  else{
    if(!g.content_url)throw new Error(`Missing original file and download URL: ${g.id}`);
    const response=await globalThis.fetch(g.content_url,{signal:globalThis.AbortSignal.timeout(30000)});
    if(!response.ok)throw new Error(`Download ${g.id}: HTTP ${response.status}`);
    if(!response.headers.get('content-type')?.startsWith('audio/mpeg'))throw new Error('Unexpected audio format');
    bytes=Buffer.from(await response.arrayBuffer());
    if(bytes.length<100)throw new Error(`Empty file: ${g.id}`);
    await writeFile(`${directory}/${file}`,bytes,{flag:'wx'});
  }
  entries.push({attackId:spec.id,label:spec.label,variant,generationId:g.id,nodeId:spec.nodeId,status:g.status,model:g.model_id,requestedSeconds:spec.seconds,reportedSeconds:g.duration_secs,reportedPrice:g.price,runCredits:receipt.credit_costs[g.id],file,bytes:bytes.length,sha256:sha(bytes)});
}
if(entries.length!==16||request.specs.some(s=>entries.filter(e=>e.attackId===s.id).length!==4))throw new Error('Expected four attacks with four takes each');
await writeFile(`${directory}/generations.json`,JSON.stringify(entries,null,2)+'\n');

process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const browser=await chromium.launch({channel:'chromium',headless:true});
const page=await browser.newPage();
try{
  for(const entry of entries){
    const raw=await readFile(`${directory}/${entry.file}`);
    if(sha(raw)!==entry.sha256)throw new Error('Source hash mismatch');
    entry.analysis=await page.evaluate(async base64=>{
      const context=new globalThis.OfflineAudioContext(2,1,44100);
      const buffer=Uint8Array.from(globalThis.atob(base64),c=>c.charCodeAt(0));
      const decoded=await context.decodeAudioData(buffer.buffer);
      let peak=0,sum=0,invalid=0,overFullScale=0,atFullScale=0;
      for(let c=0;c<decoded.numberOfChannels;c++)for(const x of decoded.getChannelData(c)){
        if(!Number.isFinite(x))invalid++;
        peak=Math.max(peak,Math.abs(x));sum+=x*x;if(Math.abs(x)>1)overFullScale++;if(Math.abs(x)>=.9999)atFullScale++;
      }
      const samples=decoded.length*decoded.numberOfChannels;
      return{seconds:decoded.duration,analysisSampleRate:decoded.sampleRate,channels:decoded.numberOfChannels,peak,rms:Math.sqrt(sum/samples),invalidSamples:invalid,overFullScaleSamples:overFullScale,atFullScaleFraction:atFullScale/samples};
    },raw.toString('base64'));
    if(entry.analysis.invalidSamples||entry.analysis.rms<.00001||entry.analysis.seconds<.1||entry.analysis.seconds>5)throw new Error(`Invalid audio: ${entry.file}`);
  }
  const manifest={version:1,flowId:request.flowId,flowUrl:request.flowUrl,model:request.model,promptVariant:'A',runtimeIntegration:false,artisticStatus:'Awaiting Review',estimateCredits:request.estimate.credits,runReceiptCredits:entries.reduce((n,e)=>n+e.runCredits,0),generationPriceCredits:entries.reduce((n,e)=>n+(e.reportedPrice?.credits??0),0),totalBytes:entries.reduce((n,e)=>n+e.bytes,0),attacks:request.specs.map(s=>({...s,takes:entries.filter(e=>e.attackId===s.id).sort((a,b)=>a.variant-b.variant)}))};
  await writeFile(`${directory}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
  const template=await readFile('scripts/templates/ash-warden-sfx-review.html','utf8');
  await writeFile(`${directory}/viewer.html`,template.replace('__SFX_DATA__',JSON.stringify(manifest).replaceAll('<','\u003c')));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(resolve(`${directory}/viewer.html`)).href);
  await page.waitForFunction(()=>globalThis.document.querySelectorAll('audio').length===16);
  const metadata=await page.evaluate(async()=>Promise.all([...globalThis.document.querySelectorAll('audio')].map(audio=>new Promise((resolve,reject)=>{
    if(audio.readyState>=1)return resolve(audio.duration);
    audio.addEventListener('loadedmetadata',()=>resolve(audio.duration),{once:true});
    audio.addEventListener('error',()=>reject(new Error('Audio metadata failed')),{once:true});
    audio.load();
  }))));
  if(metadata.some(n=>!Number.isFinite(n)||n<=0))throw new Error('Invalid demo metadata');
  await page.getByRole('button',{name:'Все атаки подряд'}).click();
  await page.waitForFunction(()=>globalThis.document.querySelector('#play-status').dataset.state==='done',{timeout:15000});
  const played=await page.evaluate(()=>Number(globalThis.document.querySelector('#play-status').dataset.played));
  if(played!==4)throw new Error('Playlist did not play all four attacks');
  await page.getByLabel('Дубль для последовательного демо').selectOption('4');
  await page.getByRole('button',{name:'Все атаки подряд'}).click();
  await page.waitForFunction(()=>globalThis.document.querySelector('#play-status').dataset.state==='playing');
  await page.getByRole('button',{name:'Стоп'}).click();
  if(!await page.evaluate(()=>[...globalThis.document.querySelectorAll('audio')].every(a=>a.paused)))throw new Error('Stop failed');
  await page.screenshot({path:`${directory}/review-desktop.png`,fullPage:true});
  await page.setViewportSize({width:390,height:844});
  if(await page.evaluate(()=>globalThis.document.documentElement.scrollWidth>globalThis.innerWidth))throw new Error('Mobile overflow');
  await page.screenshot({path:`${directory}/review-mobile.png`,fullPage:true});
  if(errors.length)throw new Error(errors.join('\n'));
  const verification={audioFiles:entries.length,decoded:entries.length,metadataLoaded:metadata.length,playlistAttacksPlayed:played,stopPassed:true,mobileOverflow:false,browserErrors:errors,automatedSignalCheckOnly:true,artisticStatus:'Awaiting Review'};
  await writeFile(`${directory}/verification.json`,JSON.stringify(verification,null,2)+'\n');
  console.log(JSON.stringify({...verification,bytes:manifest.totalBytes,runReceiptCredits:manifest.runReceiptCredits,generationPriceCredits:manifest.generationPriceCredits,viewer:`${directory}/viewer.html`}));
}finally{await browser.close();}
