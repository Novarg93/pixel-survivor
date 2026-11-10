import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath,URL} from 'node:url';
import process from 'node:process';
import {readPNG,png} from '../../../../generated/ash-warden-walk-rd-v2/png-io.mjs';
const root=fileURLToPath(new URL('.',import.meta.url)),source=JSON.parse(readFileSync(root+'source-manifest.json','utf8'));
const sha=f=>createHash('sha256').update(readFileSync(f)).digest('hex');
for(const [file,hash]of Object.entries(source.sources))if(sha(file)!==hash)throw Error('Source changed: '+file);
const id=process.argv[2];
if(!['walk','run'].includes(id))throw Error('Use build-review.mjs walk|run');
const receipt=JSON.parse(readFileSync(root+id+'-receipt.json','utf8')),text=receipt.content.filter(c=>c.type==='text').map(c=>c.text).join('\n'),job=text.match(/job_id:\s*([a-f0-9-]+)/)[1];
const result=JSON.parse(readFileSync(root+id+'-result.json','utf8'));if(result.structuredContent?.status!=='completed'||result.structuredContent.frames!==17)throw Error('Expected completed16+input result');
mkdirSync(root+id+'/raw',{recursive:true});
for(let start=0;start<17;start+=4)await Promise.all(Array.from({length:Math.min(4,17-start)},async(_,k)=>{
  const i=start+k,path=root+id+'/raw/frame-'+String(i).padStart(2,'0')+'.png';if(existsSync(path))return;
  const url=result.structuredContent.download_urls[i],r=await globalThis.fetch(url,{signal:globalThis.AbortSignal.timeout(45000)});if(!r.ok)throw Error('Download '+i+' HTTP '+r.status);writeFileSync(path,new Uint8Array(await r.arrayBuffer()));
}));
const original=readPNG(root+'first-frame-north.png'),raw=Array.from({length:17},(_,i)=>readPNG(root+id+'/raw/frame-'+String(i).padStart(2,'0')+'.png'));
if(raw.some(f=>f.width!==256||f.height!==256))throw Error('Unexpected generated canvas');
let firstFrameDifferences=0;for(let k=0;k<original.pixels.length;k++)if(original.pixels[k]!==raw[0].pixels[k])firstFrameDifferences++;
if(firstFrameDifferences)throw Error('Service input frame changed');
const audit=raw.map((f,i)=>{let count=0,minX=256,minY=256,maxX=-1,maxY=-1,partial=0,edge=0;const colors=new Set();for(let y=0;y<256;y++)for(let x=0;x<256;x++){const k=(y*256+x)*4,a=f.pixels[k+3];if(!a)continue;count++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);if(a!==255)partial++;if(x===0||x===255||y===0||y===255)edge++;colors.add(Array.from(f.pixels.subarray(k,k+4)).join(','));}return{index:i,sha256:sha(root+id+'/raw/frame-'+String(i).padStart(2,'0')+'.png'),opaquePixels:count,bounds:{minX,minY,maxX,maxY},partialAlpha:partial,edgePixels:edge,colors:colors.size};});
if(audit.some(f=>!f.opaquePixels||f.opaquePixels===256*256))throw Error('Empty/opaque background frame');
// The API returns the input followed by16 generated pictures. The deliverable
// uses exactly those16 untouched generated frames; raw keeps all17 for review.
const frames=raw.slice(1),sheet=new Uint8Array(1024*1024*4),strip=new Uint8Array(4096*256*4);
for(const [i,f]of frames.entries())for(let y=0;y<256;y++){
  const row=f.pixels.subarray(y*256*4,(y+1)*256*4);sheet.set(row,((Math.floor(i/4)*256+y)*1024+i%4*256)*4);strip.set(row,(y*4096+i*256)*4);
}
writeFileSync(root+id+'/'+id+'-north.png',png(sheet,1024,1024));writeFileSync(root+id+'/'+id+'-north-strip.png',png(strip,4096,256));
const durationMs=id==='walk'?80:60,layout={image:id+'-north.png',frameCount:16,width:256,height:256,columns:4,rows:4,durationMs,sourceFrameIndices:[1,16],sourceInputKeptSeparately:'../first-frame-north.png',frames:frames.map((_,i)=>({index:i,sourceIndex:i+1,frame:{x:i%4*256,y:Math.floor(i/4)*256,w:256,h:256},duration:durationMs}))};
writeFileSync(root+id+'/'+id+'-north.json',JSON.stringify(layout,null,2)+'\n');
const summary={job,sourceFilesUnchanged:Object.keys(source.sources).length,inputFrameUnchanged:true,generatedFrames:16,rawFrames:17,firstFrameDifferences,frames:audit};writeFileSync(root+id+'/pixel-audit.json',JSON.stringify(summary,null,2)+'\n');globalThis.console.log(JSON.stringify(summary,null,2));
