import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import console from 'node:console';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const output='art/generated/miniboss-assets-audio-v1';mkdirSync(output,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const sources={
 'mini-rune-cast':'art/rune-warden/sound/cast.wav',
 'mini-teleport':'art/rune-warden/sound/teleport.wav',
 'mini-astral-cast':'art/astral-revenant/sounds/cast.wav',
 'mini-briar-charge':'art/thorn-beast/sounds/charge/charge.wav',
 'mini-briar-melee':'art/thorn-beast/sounds/melee-attack/melee-attack.wav',
 'mini-totem-cast':'art/totem/sounds/totem.wav',
};
mkdirSync('public/assets/audio/miniboss-v1',{recursive:true});const entries=[],samples={};
for(const [id,source]of Object.entries(sources)){
 const bytes=readFileSync(source);let pcm,channels,rate,bits;
 for(let p=12;p+8<=bytes.length;){const name=bytes.toString('ascii',p,p+4),size=bytes.readUInt32LE(p+4);if(name==='fmt '){if(bytes.readUInt16LE(p+8)!==1)throw Error('Expected PCM');channels=bytes.readUInt16LE(p+10);rate=bytes.readUInt32LE(p+12);bits=bytes.readUInt16LE(p+22);}if(name==='data')pcm=bytes.subarray(p+8,p+8+size);p+=size+8+size%2;}
 if(bits!==16||!pcm?.length)throw Error('Expected16bit WAV');let peak=0,sum=0;
 for(let p=0;p<pcm.length;p+=2){const v=pcm.readInt16LE(p)/32768;peak=Math.max(peak,Math.abs(v));sum+=v*v;}
 const rms=Math.sqrt(sum/(pcm.length/2)),gain=Number(Math.min(.15/rms,.75/peak,2).toFixed(6)),file=`assets/audio/miniboss-v1/${id}.wav`;
 copyFileSync(source,'public/'+file);samples[id]={file,sha256:sha(bytes),gain};entries.push({id,source,file:'public/'+file,sha256:sha(bytes),gain,seconds:pcm.length/(rate*channels*2),peak,rms,channels,sampleRate:rate,bits});
}
writeFileSync('src/game/audio/minibossSamples.ts',`// User WAVs copied byte-for-byte; shared teleport for both caster mini-bosses.\nexport const MINIBOSS_SAMPLES = ${JSON.stringify(samples,null,2)} as const;\n`);
writeFileSync(`${output}/audio-manifest.json`,JSON.stringify(entries,null,2));
const root='art/rune-warden-cast-review-v2',width=1536,height=1152,pixels=new Uint8Array(width*height*4),frames={};
for(const [clip,count]of [['cast',13],['flight',9]])for(let i=0;i<count;i++){
 const image=readPNG(`${root}/source/${clip}-${i}.png`),size=clip==='cast'?192:128;
 for(const facing of clip==='cast'?['left','right']:['left']){
  const x=(clip==='cast'&&facing==='right'?768:0)+(i%4)*size,y=(clip==='flight'?768:0)+Math.floor(i/4)*size;
  for(let py=0;py<image.height;py++)for(let px=0;px<image.width;px++){
   const dx=facing==='right'?image.width-1-px:px,k=((y+py+(clip==='flight'?16:0))*width+x+dx)*4;
   pixels.set(image.pixels.subarray((py*image.width+px)*4,(py*image.width+px)*4+4),k);
  }
  const name=clip==='cast'?`rune-cast-${facing}-${i}`:`rune-flight-${i}`;
  frames[name]={frame:{x,y,w:size,h:size},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:size,h:size},sourceSize:{w:size,h:size}};
 }
}
const dir='public/assets/hd/rune-warden-v2';mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/atlas.png`,png(pixels,width,height));writeFileSync(`${dir}/atlas.json`,JSON.stringify({frames,meta:{image:'atlas.png',size:{w:width,h:height},scale:'1'}},null,2));
writeFileSync(`${output}/art-manifest.json`,JSON.stringify({source:root,runtimeImage:dir+'/atlas.png',runtimeData:dir+'/atlas.json',sha256:sha(readFileSync(dir+'/atlas.png')),frameCount:Object.keys(frames).length,width,height,operations:'Exact pixels:cast left, lossless mirror right, flight centered with16px top padding. No resizing.'},null,2));
console.log(JSON.stringify({samples:entries.length,frames:Object.keys(frames).length,decodedAudioBytes:entries.reduce((s,e)=>s+e.seconds*e.sampleRate*e.channels*4,0)}));
