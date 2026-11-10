import {readFile,writeFile,readdir,mkdir,copyFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import process from 'node:process';
import console from 'node:console';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const sourceRoot='art/main-hero-mage-v2/sounds',output='art/generated/mage-uploaded-sounds-v1',assets='public/assets/audio/mage-sfx-uploaded-v1';
const sha=b=>createHash('sha256').update(b).digest('hex');
const walk=async d=>{const out=[];for(const e of await readdir(d,{withFileTypes:true})){const f=`${d}/${e.name}`;if(e.isDirectory())out.push(...await walk(f));else out.push(f);}return out;};
await mkdir(output,{recursive:true});
if(!existsSync(`${output}/runtime-baseline.json`)){
  const baseline={};for(const file of [...await walk('src'),...await walk('public')].sort())baseline[file]=sha(await readFile(file));
  await writeFile(`${output}/runtime-baseline.json`,JSON.stringify(baseline,null,2)+'\n');
}
const definitions=[
  {folder:'blink',id:'mage-blink',event:'player.blink'},
  {folder:'chain-lightning',id:'mage-lightning',event:'lightning.cast'},
  {folder:'fireball',id:'mage-fireball-cast',event:'fireball.cast'},
  {folder:'meteor',id:'mage-meteor',event:'armageddon.impact'},
  {folder:'thunder',id:'mage-ultimate-release',event:'ultimate.lightning'},
];
const browser=await chromium.launch({channel:'chromium',headless:true}),page=await browser.newPage(),entries=[];
try{
  for(const def of definitions){
    const candidates=(await readdir(`${sourceRoot}/${def.folder}`)).filter(f=>f.toLowerCase().endsWith('.wav'));
    if(candidates.length!==1)throw new Error(`Expected one WAV in ${def.folder}`);
    const source=`${sourceRoot}/${def.folder}/${candidates[0]}`,bytes=await readFile(source);
    const analysis=await page.evaluate(async base64=>{
      const ctx=new globalThis.OfflineAudioContext(2,1,48000),raw=Uint8Array.from(globalThis.atob(base64),c=>c.charCodeAt(0)),b=await ctx.decodeAudioData(raw.buffer);
      let peak=0,square=0,invalid=0,clipped=0;
      for(let c=0;c<b.numberOfChannels;c++)for(const x of b.getChannelData(c)){if(!Number.isFinite(x))invalid++;peak=Math.max(peak,Math.abs(x));square+=x*x;if(Math.abs(x)>=.999)clipped++;}
      const samples=b.length*b.numberOfChannels;return{seconds:b.duration,sampleRate:b.sampleRate,channels:b.numberOfChannels,frames:b.length,peak,rms:Math.sqrt(square/samples),invalidSamples:invalid,clippedFraction:clipped/samples};
    },bytes.toString('base64'));
    if(analysis.invalidSamples||analysis.rms<.001||analysis.seconds>5)throw new Error(`Invalid/big SFX: ${source}`);
    entries.push({...def,source,file:`${assets}/${def.folder}.wav`,bytes:bytes.length,sha256:sha(bytes),analysis,gain:Number(Math.min((def.folder==='thunder'?.2:def.folder==='meteor'?.18:.15)/analysis.rms,.75/analysis.peak,2).toFixed(6))});
  }
}finally{await browser.close();}
await mkdir(assets,{recursive:true});for(const e of entries)await copyFile(e.source,e.file);
const data=Object.fromEntries(entries.map(e=>[e.id,{file:e.file.replace('public/',''),sha256:e.sha256,gain:e.gain,seconds:e.analysis.seconds}]));
await writeFile('src/game/audio/mageUploadedSamples.ts',`// User-supplied Mage sounds; originals preserved in art/main-hero-mage-v2/sounds.\nexport const MAGE_UPLOADED_SAMPLES = ${JSON.stringify(data,null,2)} as const;\n`);
await writeFile(`${output}/manifest.json`,JSON.stringify({version:1,source:'user supplied',thunder:'lightning ultimate release',originalBytesPreserved:true,entries},null,2)+'\n');
console.log(JSON.stringify({files:entries.length,bytes:entries.reduce((n,e)=>n+e.bytes,0),entries:entries.map(e=>({id:e.id,seconds:e.analysis.seconds,rms:e.analysis.rms,peak:e.analysis.peak,gain:e.gain}))}));
