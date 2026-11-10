import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../ash-warden-walk-rd-v2/png-io.mjs';
import {encodeGif} from '../ash-warden-directions-v1/gif.mjs';
const root='art/generated/ash-warden-melee-combo-v1/',base='art/generated/ash-warden-melee-swing-experiment-01/A/frames/',sources={},hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(let i=0;i<12;i++){
 const name=String(i).padStart(2,'0')+'.png',path=base+name,image=readPNG(path);if(image.width!==192||image.height!==192)throw Error('Refusing body fitting');sources[path]=hash(path);fs.copyFileSync(path,root+'a/frames/'+name);
 const glow=new Uint8Array(image.pixels.length);for(let k=0;k<glow.length;k+=4){const[r,g,b,a]=image.pixels.subarray(k,k+4);if(a&&r>110&&r>g*1.45&&r>b*1.8&&g>25)glow.set([Math.max(220,Math.min(255,r+30)),Math.min(210,g+42),Math.min(90,b+12),255],k);}fs.writeFileSync(root+'a/overlays/'+name,png(glow));
}
const meta=JSON.parse(fs.readFileSync(root+'slash/metadata.json','utf8')),bayer=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]],east=[],west=[],analysis=[];
for(const f of meta.frames){
 if(f.width!==96||f.height!==96)throw Error('Unexpected slash canvas');const image=readPNG(root+'slash/frames/'+String(f.index).padStart(2,'0')+'.png'),p=new Uint8Array(image.pixels),q=new Uint8Array(p.length),envelope=[0,.25,.5,.75,1,1,1,1,1,1,.8,.65,.5,.25,.1,0][f.index];let occupied=0;
 for(let y=0;y<96;y++)for(let x=0;x<96;x++){const k=(y*96+x)*4,[r,g,b,a]=p.subarray(k,k+4),angle=Math.abs(Math.atan2(y+.5-48,x+.5-48)),feather=Math.min(1,Math.max(0,(Math.PI/3-angle)/(Math.PI/12))),hot=r>95&&r>b*1.3&&(r>g*1.12||g>170);if(!a||!hot||bayer[y%4][x%4]>=16*feather*envelope)p.fill(0,k,k+4);else occupied++;q.set(p.subarray(k,k+4),(y*96+95-x)*4);}
 const name=String(f.index).padStart(2,'0')+'.png';fs.writeFileSync(root+'slash/prepared/'+name,png(p,96,96));fs.writeFileSync(root+'slash/west/'+name,png(q,96,96));east.push({pixels:p});west.push({pixels:q});analysis.push({index:f.index,occupied,envelope});
}
const durations=Array(meta.frameCount).fill(20),peak=analysis.reduce((a,b)=>a.occupied>b.occupied?a:b).index;
fs.writeFileSync(root+'slash/east-preview.gif',encodeGif(east,durations,96).bytes);fs.writeFileSync(root+'slash/west-preview.gif',encodeGif(west,durations,96).bytes);
fs.writeFileSync(root+'prepared-metadata.json',JSON.stringify({bodyA:{source:base,canvas:[192,192],pivot:[96,154],worldScale:.6548310811,durationsMs:[110,110,130,150,150,80,80,90,80,80,70,70],sourceHashes:sources,framesPreserved:12},slash:{rawSource:'slash/raw/output.gif',rawHash:meta.rawHash,canvas:[96,96],pivot:[48,48],durationsMs:durations,sourceDurationsMs:meta.frames.map(f=>f.durationMs),peakFrame:peak,leadMs:peak*20,worldScale:1.65,preparation:'Retain warm RD pixels in a forward120degree sector, feather angular ends with pixel dither, fade one-shot envelope; raw preserved',analysis,westMirror:'x=95-x, all frames, no extra generation'}},null,2));globalThis.console.log(JSON.stringify({bodyAFrames:12,slashFrames:meta.frameCount,slashPeak:peak,leadMs:peak*20,occupied:analysis.map(f=>f.occupied)}));
