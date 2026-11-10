import {readFile,writeFile,readdir,mkdir,copyFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Buffer} from 'node:buffer';
import {resolve} from 'node:path';
import process from 'node:process';
import console from 'node:console';
const root='art/final-boss/sound',output='art/generated/ash-warden-uploaded-sounds-v1',assets='public/assets/audio/ash-warden-uploaded-v1';
const sha=b=>createHash('sha256').update(b).digest('hex');
const walk=async d=>{const files=[];for(const e of await readdir(d,{withFileTypes:true})){const p=`${d}/${e.name}`;if(e.isDirectory())files.push(...await walk(p));else files.push(p);}return files;};
await mkdir(output,{recursive:true});
if(!existsSync(`${output}/runtime-baseline.json`)){
  const baseline={};for(const p of [...await walk('src'),...await walk('public')].sort())baseline[p]=sha(await readFile(p));
  await writeFile(`${output}/runtime-baseline.json`,JSON.stringify(baseline,null,2)+'\n');
}
const definitions=[{folder:'swing',event:'final.slash'},{folder:'slam',event:'final.slam'},{folder:'charge',event:'final.charge'},{folder:'flamestrike',event:'final.cleave'},{folder:'meteor',event:'final.impact'}];
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const browser=await chromium.launch({channel:'chromium',headless:true}),page=await browser.newPage(),entries=[];
try{
  for(const d of definitions){
    const names=(await readdir(`${root}/${d.folder}`)).filter(n=>n.toLowerCase().endsWith('.wav'));
    if(names.length!==1)throw new Error(`Expected one WAV in ${d.folder}`);
    const source=`${root}/${d.folder}/${names[0]}`,bytes=await readFile(source);
    const analysis=await page.evaluate(async base64=>{
      const ctx=new globalThis.OfflineAudioContext(2,1,48000),raw=Uint8Array.from(globalThis.atob(base64),c=>c.charCodeAt(0)),b=await ctx.decodeAudioData(raw.buffer);
      let peak=0,sum=0,invalid=0;for(let c=0;c<b.numberOfChannels;c++)for(const x of b.getChannelData(c)){if(!Number.isFinite(x))invalid++;peak=Math.max(peak,Math.abs(x));sum+=x*x;}
      return{seconds:b.duration,sampleRate:b.sampleRate,channels:b.numberOfChannels,peak,rms:Math.sqrt(sum/(b.length*b.numberOfChannels)),invalidSamples:invalid};
    },Buffer.from(bytes).toString('base64'));
    if(analysis.invalidSamples||analysis.rms<.001||analysis.seconds>5)throw new Error(`Invalid sound: ${source}`);
    entries.push({...d,id:`warden-${d.folder}`,source,file:`${assets}/${d.folder}.wav`,sha256:sha(bytes),bytes:bytes.length,analysis,gain:Number(Math.min((d.folder==='meteor'?.18:d.folder==='flamestrike'?.17:.15)/analysis.rms,.75/analysis.peak,2).toFixed(6))});
  }
}finally{await browser.close();}
await mkdir(assets,{recursive:true});for(const e of entries)await copyFile(e.source,e.file);
const data=Object.fromEntries(entries.map(e=>[e.id,{file:e.file.replace('public/',''),sha256:e.sha256,gain:e.gain,seconds:e.analysis.seconds}]));
await writeFile('src/game/audio/ashWardenSamples.ts',`// User-supplied Ash Warden WAVs, preserved byte-for-byte from art/final-boss/sound.\nexport const ASH_WARDEN_SAMPLES = ${JSON.stringify(data,null,2)} as const;\n`);
await writeFile(`${output}/manifest.json`,JSON.stringify({version:1,source:'user supplied',originalBytesPreserved:true,swing:'both horizontal variants and thrust',slam:'south / north',entries},null,2)+'\n');
console.log(JSON.stringify({files:entries.length,bytes:entries.reduce((n,e)=>n+e.bytes,0),entries:entries.map(e=>({id:e.id,gain:e.gain,seconds:e.analysis.seconds}))}));
