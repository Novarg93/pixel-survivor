import {readFileSync,writeFileSync,readdirSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import process from 'node:process';
import console from 'node:console';
const output='art/generated/arcane-shield-sound-v1',folder='art/main-hero-mage-v2/sounds/arcaneshield',file='public/assets/audio/mage-sfx-uploaded-v1/arcaneshield.wav';
const sha=b=>createHash('sha256').update(b).digest('hex');
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
if(!process.argv.includes('--verify')){
  mkdirSync(output,{recursive:true});
  if(!existsSync(`${output}/runtime-baseline.json`))writeFileSync(`${output}/runtime-baseline.json`,JSON.stringify(Object.fromEntries([...walk('src'),...walk('public')].sort().map(p=>[p,sha(readFileSync(p))])),null,2)+'\n');
  const names=readdirSync(folder).filter(n=>n.toLowerCase().endsWith('.wav'));if(names.length!==1)throw new Error('Expected one Arcane Shield WAV');
  const source=`${folder}/${names[0]}`,bytes=readFileSync(source);let format,pcm;
  for(let p=12;p+8<=bytes.length;){const id=bytes.toString('ascii',p,p+4),size=bytes.readUInt32LE(p+4);if(id==='fmt ')format={encoding:bytes.readUInt16LE(p+8),channels:bytes.readUInt16LE(p+10),sampleRate:bytes.readUInt32LE(p+12),bits:bytes.readUInt16LE(p+22)};if(id==='data')pcm=bytes.subarray(p+8,p+8+size);p+=8+size+(size%2);}
  if(format?.encoding!==1||format.bits!==16||!pcm?.length)throw new Error('Expected finite16-bit PCM WAV');
  let peak=0,sum=0;for(let p=0;p<pcm.length;p+=2){const x=pcm.readInt16LE(p)/32768;peak=Math.max(peak,Math.abs(x));sum+=x*x;}
  const rms=Math.sqrt(sum/(pcm.length/2)),seconds=pcm.length/(format.sampleRate*format.channels*2);if(rms<.0001||seconds>5)throw new Error('Invalid shield audio');
  // Preserve the supplied soft texture: never boost it, and cap playback at55%.
  const gain=Number(Math.min(.06/rms,.35/peak,.55).toFixed(6));
  copyFileSync(source,file);
  const module='src/game/audio/mageUploadedSamples.ts',text=readFileSync(module,'utf8');
  const data=JSON.parse(text.slice(text.indexOf('=')+1,text.lastIndexOf('as const')).trim());
  data['mage-shield']={file:file.replace('public/',''),sha256:sha(bytes),gain,seconds};
  writeFileSync(module,`// User-supplied Mage sounds; originals preserved in art/main-hero-mage-v2/sounds.\nexport const MAGE_UPLOADED_SAMPLES = ${JSON.stringify(data,null,2)} as const;\n`);
  writeFileSync(`${output}/manifest.json`,JSON.stringify({source,file,id:'mage-shield',event:'arcaneShield.trigger',bytes:bytes.length,sha256:sha(bytes),gain,seconds,analysis:{...format,peak,rms,mutedPeak:peak*gain,mutedRms:rms*gain},originalBytesPreserved:true},null,2)+'\n');
}else{
  const baseline=JSON.parse(readFileSync(`${output}/runtime-baseline.json`,'utf8')),manifest=JSON.parse(readFileSync(`${output}/manifest.json`,'utf8'));
  const files=[...walk('src'),...walk('public')].sort(),changed=Object.keys(baseline).filter(p=>sha(readFileSync(p))!==baseline[p]).sort(),added=files.filter(p=>!(p in baseline));
  const expected=['src/game/audio/README.md','src/game/audio/mageSamples.ts','src/game/audio/mageUploadedSamples.ts'];
  if(JSON.stringify(changed)!==JSON.stringify(expected)||JSON.stringify(added)!==JSON.stringify([file]))throw new Error(JSON.stringify({changed,added}));
  if(sha(readFileSync(manifest.source))!==manifest.sha256||sha(readFileSync(file))!==manifest.sha256)throw new Error('Shield source changed');
  const report={baselineFiles:Object.keys(baseline).length,changed,added,unchanged:Object.keys(baseline).length-changed.length,currentSHA256:Object.fromEntries([...changed,...added].map(p=>[p,sha(readFileSync(p))]))};
  writeFileSync(`${output}/integration-verification.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({baseline:report.baselineFiles,changed,added,unchanged:report.unchanged}));
}
