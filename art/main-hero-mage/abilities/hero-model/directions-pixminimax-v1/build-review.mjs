import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath,URL} from 'node:url';
import process from 'node:process';
import {readPNG,png} from '../../../../generated/ash-warden-walk-rd-v2/png-io.mjs';
const root=fileURLToPath(new URL('.',import.meta.url)),source=JSON.parse(readFileSync(root+'source-manifest.json','utf8')),hash=f=>createHash('sha256').update(readFileSync(f)).digest('hex');
for(const [f,h]of Object.entries(source.protectedFiles))if(hash(f)!==h)throw Error('Protected file changed '+f);
const requests=JSON.parse(readFileSync(root+'requests.json','utf8')),wanted=process.argv[2],summaries=[];
for(const q of requests.filter(q=>!wanted||q.id===wanted)){
  const path=root+q.id+'/',name=q.motion+'-'+q.direction;if(!existsSync(path+'result.json'))continue;
  const result=JSON.parse(readFileSync(path+'result.json','utf8')).structuredContent;if(result?.status!=='completed'||result.frames!==17)throw Error('Expected completed input+16 '+q.id);
  mkdirSync(path+'raw',{recursive:true});
  for(let start=0;start<17;start+=4)await Promise.all(Array.from({length:Math.min(4,17-start)},async(_,k)=>{const i=start+k,file=path+'raw/frame-'+String(i).padStart(2,'0')+'.png';if(existsSync(file))return;const r=await globalThis.fetch(result.download_urls[i],{signal:globalThis.AbortSignal.timeout(45000)});if(!r.ok)throw Error('HTTP '+r.status+' '+q.id+' '+i);writeFileSync(file,new Uint8Array(await r.arrayBuffer()));}));
  const input=readPNG(root+q.first_frame_file),raw=Array.from({length:17},(_,i)=>readPNG(path+'raw/frame-'+String(i).padStart(2,'0')+'.png'));
  if(raw.some(f=>f.width!==256||f.height!==256))throw Error('Canvas changed '+q.id);
  let inputDifferences=0;for(let k=0;k<input.pixels.length;k++)if(input.pixels[k]!==raw[0].pixels[k])inputDifferences++;if(inputDifferences)throw Error('Input changed '+q.id);
  const frames=raw.map((f,i)=>{let opaque=0,partial=0,edge=0,minX=256,minY=256,maxX=-1,maxY=-1;for(let y=0;y<256;y++)for(let x=0;x<256;x++){const a=f.pixels[(y*256+x)*4+3];if(!a)continue;opaque++;if(a!==255)partial++;if(!x||!y||x===255||y===255)edge++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}return{index:i,sha256:hash(path+'raw/frame-'+String(i).padStart(2,'0')+'.png'),opaque,partialAlpha:partial,edgePixels:edge,bounds:{minX,minY,maxX,maxY}};});
  if(frames.some(f=>!f.opaque||f.opaque===65536))throw Error('Empty/opaque frame '+q.id);
  const sheet=new Uint8Array(1024*1024*4),strip=new Uint8Array(4096*256*4);
  for(let i=0;i<16;i++)for(let y=0;y<256;y++){const row=raw[i+1].pixels.subarray(y*1024,(y+1)*1024);sheet.set(row,((Math.floor(i/4)*256+y)*1024+i%4*256)*4);strip.set(row,(y*4096+i*256)*4);}
  writeFileSync(path+name+'.png',png(sheet,1024,1024));writeFileSync(path+name+'-strip.png',png(strip,4096,256));
  const durationMs=q.motion==='walk'?80:60;writeFileSync(path+name+'.json',JSON.stringify({image:name+'.png',direction:q.direction,motion:q.motion,frameCount:16,width:256,height:256,columns:4,rows:4,durationMs,sourceIndices:[1,16],frames:Array.from({length:16},(_,i)=>({index:i,sourceIndex:i+1,frame:{x:i%4*256,y:Math.floor(i/4)*256,w:256,h:256},duration:durationMs}))},null,2)+'\n');
  const audit={id:q.id,job:result.job_id,inputDifferences,rawFrames:17,generatedFrames:16,protectedFilesUnchanged:Object.keys(source.protectedFiles).length,frames};writeFileSync(path+'pixel-audit.json',JSON.stringify(audit,null,2)+'\n');summaries.push({id:q.id,frames:16,edgePixels:frames.reduce((n,f)=>n+f.edgePixels,0),partialAlpha:frames.reduce((n,f)=>n+f.partialAlpha,0)});
}
globalThis.console.log(JSON.stringify(summaries));
