import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import console from 'node:console';
const dir='public/assets/audio/miniboss-ambience-v1';mkdirSync(dir,{recursive:true});const samples={},entries=[];
for(const[id,source]of [['beast-walking','art/armored-briar-beast/sounds/beast-walking.wav'],['rune-presence','art/rune-warden/sound/mage_idle.wav']]){
 const bytes=readFileSync(source);let data,channels,rate,bits;
 for(let p=12;p+8<=bytes.length;){const name=bytes.toString('ascii',p,p+4),n=bytes.readUInt32LE(p+4);if(name==='fmt '){if(bytes.readUInt16LE(p+8)!==1)throw Error('Expected PCM');channels=bytes.readUInt16LE(p+10);rate=bytes.readUInt32LE(p+12);bits=bytes.readUInt16LE(p+22);}if(name==='data')data=bytes.subarray(p+8,p+8+n);p+=n+8+n%2;}
 if(bits!==16||!data?.length)throw Error('Expected16bit WAV');let peak=0,sum=0;for(let p=0;p<data.length;p+=2){const v=data.readInt16LE(p)/32768;peak=Math.max(peak,Math.abs(v));sum+=v*v;}
 const rms=Math.sqrt(sum/(data.length/2)),gain=Number(Math.min(.12/rms,.6/peak,2).toFixed(6)),file=`assets/audio/miniboss-ambience-v1/${id}.wav`,sha256=createHash('sha256').update(bytes).digest('hex');copyFileSync(source,'public/'+file);
 samples[id]={file,sha256,gain};entries.push({id,source,file:'public/'+file,sha256,gain,peak,rms,seconds:data.length/(rate*channels*2),channels,sampleRate:rate});
}
writeFileSync('src/game/audio/minibossAmbienceSamples.ts',`// Quiet, local user loops; original WAV bytes are preserved.\nexport const MINIBOSS_AMBIENCE_SAMPLES = ${JSON.stringify(samples,null,2)} as const;\n`);
writeFileSync('art/generated/visual-cleanup-rune-idle-v1/ambience-manifest.json',JSON.stringify(entries,null,2));console.log(JSON.stringify(entries));
