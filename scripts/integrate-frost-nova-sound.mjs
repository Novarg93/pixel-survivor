import {readFileSync,writeFileSync,readdirSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import process from 'node:process';
import console from 'node:console';
const output='art/generated/frost-nova-sound-v1',source='art/main-hero-mage-v2/sounds/frost_nova/frost_nova.wav',file='public/assets/audio/mage-sfx-uploaded-v1/frost-nova.wav';
const sha=b=>createHash('sha256').update(b).digest('hex');
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
const runtime=()=>[...walk('src'),...walk('public')].sort();
if(!process.argv.includes('--verify')){
  const bytes=readFileSync(source);let format,pcm;
  if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE')throw new Error('Expected a WAV source');
  for(let p=12;p+8<=bytes.length;){
    const id=bytes.toString('ascii',p,p+4),size=bytes.readUInt32LE(p+4);
    if(p+8+size>bytes.length)throw new Error('Truncated WAV chunk');
    if(id==='fmt '&&size>=16)format={encoding:bytes.readUInt16LE(p+8),channels:bytes.readUInt16LE(p+10),sampleRate:bytes.readUInt32LE(p+12),bits:bytes.readUInt16LE(p+22)};
    if(id==='data')pcm=bytes.subarray(p+8,p+8+size);p+=8+size+(size%2);
  }
  if(format?.encoding!==1||format.bits!==16||!format.channels||!format.sampleRate||!pcm?.length||pcm.length%2)throw new Error('Expected 16-bit PCM WAV');
  let peak=0,sum=0,clipped=0;
  for(let p=0;p<pcm.length;p+=2){const x=pcm.readInt16LE(p)/32768;peak=Math.max(peak,Math.abs(x));sum+=x*x;if(Math.abs(x)>=.999)clipped++;}
  const rms=Math.sqrt(sum/(pcm.length/2)),seconds=pcm.length/(format.sampleRate*format.channels*2);
  if(rms<.001||seconds>5)throw new Error('Silent or oversized Frost Nova');
  // Match the existing Mage upload policy; preserve the original WAV bytes.
  const gain=Number(Math.min(.15/rms,.75/peak,2).toFixed(6));
  mkdirSync(output,{recursive:true});
  if(!existsSync(`${output}/runtime-baseline.json`))writeFileSync(`${output}/runtime-baseline.json`,JSON.stringify(Object.fromEntries(runtime().map(p=>[p,sha(readFileSync(p))])),null,2)+'\n');
  mkdirSync('public/assets/audio/mage-sfx-uploaded-v1',{recursive:true});copyFileSync(source,file);
  const module='src/game/audio/mageUploadedSamples.ts',text=readFileSync(module,'utf8');
  const data=JSON.parse(text.slice(text.indexOf('=')+1,text.lastIndexOf('as const')).trim());
  data['mage-frost-nova']={file:file.replace('public/',''),sha256:sha(bytes),gain,seconds};
  writeFileSync(module,`// User-supplied Mage sounds; originals preserved in art/main-hero-mage-v2/sounds.\nexport const MAGE_UPLOADED_SAMPLES = ${JSON.stringify(data,null,2)} as const;\n`);
  writeFileSync(`${output}/manifest.json`,JSON.stringify({source,file,id:'mage-frost-nova',event:'frostNova.cast',bytes:bytes.length,sha256:sha(bytes),gain,seconds,analysis:{...format,peak,rms,clippedFraction:clipped/(pcm.length/2),playbackPeak:peak*gain,playbackRms:rms*gain},originalBytesPreserved:true},null,2)+'\n');
  console.log(JSON.stringify({source,file,seconds,gain,peak,rms}));
}else{
  const baseline=JSON.parse(readFileSync(`${output}/runtime-baseline.json`,'utf8')),manifest=JSON.parse(readFileSync(`${output}/manifest.json`,'utf8'));
  const files=runtime(),removed=Object.keys(baseline).filter(p=>!files.includes(p)),changed=Object.keys(baseline).filter(p=>existsSync(p)&&sha(readFileSync(p))!==baseline[p]).sort(),added=files.filter(p=>!(p in baseline));
  const expected=['src/game/audio/README.md','src/game/audio/mageSamples.ts','src/game/audio/mageUploadedSamples.ts'];
  if(removed.length||JSON.stringify(changed)!==JSON.stringify(expected)||JSON.stringify(added)!==JSON.stringify([file]))throw new Error(JSON.stringify({removed,changed,added}));
  if(sha(readFileSync(source))!==manifest.sha256||sha(readFileSync(file))!==manifest.sha256)throw new Error('Frost Nova source changed');
  const report={baselineFiles:Object.keys(baseline).length,changed,added,unchanged:Object.keys(baseline).length-changed.length,currentSHA256:Object.fromEntries([...changed,...added].map(p=>[p,sha(readFileSync(p))]))};
  writeFileSync(`${output}/integration-verification.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({baseline:report.baselineFiles,changed,added,unchanged:report.unchanged}));
}
