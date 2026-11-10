import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import process from 'node:process';
import {Buffer} from 'node:buffer';
import console from 'node:console';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const directory='art/generated/mage-sfx-elevenlabs-v1',runtime='public/assets/audio/mage-sfx-v1';
const request=JSON.parse(await readFile(`${directory}/request.json`,'utf8'));
const generations=JSON.parse(await readFile(`${directory}/generations.json`,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const browser=await chromium.launch({channel:'chromium',headless:true});
const page=await browser.newPage();
const candidates=[];
const rms=a=>Math.sqrt(a.reduce((n,x)=>n+x*x,0)/a.length);
try{
  for(const g of generations){
    const bytes=await readFile(`${directory}/${g.file}`);
    if(hash(bytes)!==g.sha256)throw new Error('Source hash mismatch');
    const decoded=await page.evaluate(async base64=>{
      const context=new globalThis.OfflineAudioContext(1,1,44100);
      const bytes=Uint8Array.from(globalThis.atob(base64),c=>c.charCodeAt(0));
      const audio=await context.decodeAudioData(bytes.buffer),mono=new Float32Array(audio.length);
      for(let c=0;c<audio.numberOfChannels;c++){const channel=audio.getChannelData(c);for(let i=0;i<mono.length;i++)mono[i]+=channel[i]/audio.numberOfChannels;}
      return {sampleRate:audio.sampleRate,channels:audio.numberOfChannels,pcm:Array.from(mono)};
    },bytes.toString('base64'));
    const pcm=decoded.pcm,peak=Math.max(...pcm.map(Math.abs));
    if(!pcm.every(Number.isFinite)||peak<.01)throw new Error('Silent or invalid source '+g.file);
    const onset=Math.max(0,pcm.findIndex(x=>Math.abs(x)>peak*.04)/44100-.004);
    const level=rms(pcm),tail=rms(pcm.slice(-2205));
    const score=level/peak-onset*.5-tail/peak*.1;
    candidates.push({...g,sampleRate:decoded.sampleRate,channels:decoded.channels,sourceSeconds:pcm.length/44100,peak,rms:level,onset,score,pcm});
  }
}finally{await browser.close();}
await mkdir(runtime,{recursive:true});
const entries=[];
for(const spec of request.specs){
  const variants=candidates.filter(g=>g.id===spec.id).sort((a,b)=>b.score-a.score||a.variant-b.variant),pick=variants[0];
  const cap={'mage-ultimate-charge':.34,'mage-ultimate-sky':.16,'mage-ultimate-overload':.115}[spec.id];
  let start=Math.round(pick.onset*44100);
  if(spec.id==='mage-ultimate-charge')start=Math.max(start,pick.pcm.length-Math.round(cap*44100));
  if(spec.id==='mage-ultimate-sky'||spec.id==='mage-ultimate-overload'){
    const maxIndex=pick.pcm.findIndex(x=>Math.abs(x)===pick.peak);
    start=Math.max(0,maxIndex-Math.round(.01*44100));
  }
  const length=Math.min(pick.pcm.length-start,Math.round((cap??spec.seconds)*44100));
  const pcm=pick.pcm.slice(start,start+length);
  for(let i=0;i<pcm.length;i++)pcm[i]*=Math.min(1,i/(44100*.004),(pcm.length-1-i)/(44100*.025));
  const target=spec.id==='mage-ultimate-release'?.22:spec.id==='mage-meteor'?.19:spec.id.includes('charge')||spec.id.includes('overload')?.12:.15;
  const scale=Math.min(target/rms(pcm),.75/Math.max(...pcm.map(Math.abs)));
  for(let i=0;i<pcm.length;i++)pcm[i]*=scale;
  const wav=Buffer.alloc(44+pcm.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(44100,24);wav.writeUInt32LE(88200,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(pcm.length*2,40);pcm.forEach((x,i)=>wav.writeInt16LE(Math.round(x*32767),44+i*2));
  const file=`${spec.id}.wav`;await writeFile(`${runtime}/${file}`,wav);
  const {pcm:discard,...source}=pick;void discard;
  entries.push({id:spec.id,event:spec.event,file,seconds:pcm.length/44100,sampleRate:44100,channels:1,bytes:wav.length,sha256:hash(wav),peak:Math.max(...pcm.map(Math.abs)),rms:rms(pcm),source:{generationId:source.generationId??Object.keys(request.run.results.filter(r=>r.node_id===spec.nodeId)[source.variant-1].credit_costs)[0],file:source.file,sha256:source.sha256,variant:source.variant},processing:{trimStartSeconds:start/44100,scale,fadeInSeconds:.004,fadeOutSeconds:.025},variants:variants.map(({pcm,...v})=>{void pcm;return v;})});
}
const manifest={version:1,flowId:request.flowId,model:request.model,sourceCount:generations.length,sourceBytes:generations.reduce((n,g)=>n+g.bytes,0),reportedGenerationCredits:generations.reduce((n,g)=>n+g.price.credits,0),estimate:request.estimate,selection:'Deterministic signal-quality selection: crest factor, onset delay, tail; no claim of human listening. All four originals retained.',entries};
await writeFile(`${directory}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
const names={'fireball.cast':'Fireball — запуск','fireball.impact':'Fireball — попадание','lightning.cast':'Цепная молния','armageddon.impact':'Метеорит — удар','arcaneShield.trigger':'Тайный щит','frostNova.cast':'Фрост нова','player.blink':'Blink','ultimate.charge':'Гнев Небес — заряд','ultimate.sky':'Гнев Небес — небесный удар','ultimate.overload':'Гнев Небес — перегрузка','ultimate.lightning':'Гнев Небес — разряд'};
const rows=entries.map(e=>`<article><h2>${names[e.event]}</h2><p>${Math.round(e.seconds*1000)} мс · WAV 44,1 кГц · mono</p><audio controls preload="none" src="../../../${runtime}/${e.file}"></audio><a download href="../../../${runtime}/${e.file}">Скачать WAV</a><details><summary>4 исходных варианта ElevenLabs</summary>${e.variants.sort((a,b)=>a.variant-b.variant).map(v=>`<p>Вариант ${v.variant}${v.variant===e.source.variant?' · используется в игре':''}</p><audio controls preload="none" src="${v.file}"></audio>`).join('')}</details></article>`).join('');
await writeFile(`${directory}/viewer.html`,`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Pixel Survivor · звуки мага</title><style>body{margin:0;background:#101b24;color:#e2ecf2;font:16px system-ui}main{max-width:1100px;margin:auto;padding:28px}h1{color:#adc7ff}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}article{background:#1b2d3b;border:1px solid #3c586d;border-radius:12px;padding:18px}h2{font-size:18px}p{color:#b2c4d2;font-size:14px}audio{width:100%;display:block;margin:12px 0}a{color:#a9c8ff}summary{cursor:pointer;margin-top:18px}</style><main><h1>Звуки мага · Pixel Survivor</h1><p>Все 7 способностей · 11 игровых звуков · 44 исходных варианта. Воспроизведение только по нажатию.</p><div class="grid">${rows}</div></main><script>document.addEventListener('play',e=>{if(e.target instanceof HTMLAudioElement)document.querySelectorAll('audio').forEach(a=>{if(a!==e.target)a.pause()})},true)</script></html>`);
console.log(JSON.stringify({sources:candidates.length,selected:entries.length,runtimeBytes:entries.reduce((n,e)=>n+e.bytes,0),reportedCredits:manifest.reportedGenerationCredits,entries:entries.map(e=>({id:e.id,variant:e.source.variant,seconds:e.seconds,rms:e.rms}))}));
