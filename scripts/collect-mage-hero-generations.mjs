import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/main-hero-mage/casting/directions-pixminimax-v2',requests=JSON.parse(readFileSync(root+'/requests-refined.json','utf8'));
const summary=[];
for(const q of requests){
  const path=root+'/'+q.id;if(!existsSync(path+'/result.json'))continue;
  const r=JSON.parse(readFileSync(path+'/result.json','utf8')).structuredContent;
  if(r?.status!=='completed'||r.frames!==q.args.frame_count+1)throw Error('Bad completed result '+q.id);
  mkdirSync(path+'/raw',{recursive:true});
  for(let start=0;start<r.frames;start+=4)await Promise.all(Array.from({length:Math.min(4,r.frames-start)},async(_,k)=>{
    const i=start+k,file=path+'/raw/'+String(i).padStart(2,'0')+'.png';if(existsSync(file))return;
    const response=await globalThis.fetch(r.download_urls[i],{signal:globalThis.AbortSignal.timeout(45000)});if(!response.ok)throw Error('Download '+q.id+' '+i+' '+response.status);
    writeFileSync(file,new Uint8Array(await response.arrayBuffer()));
  }));
  const frames=Array.from({length:r.frames},(_,i)=>readPNG(path+'/raw/'+String(i).padStart(2,'0')+'.png'));
  const original=readPNG('art/generated/mage-hero-v2/first-frames/'+q.direction+'.png');
  if(frames.some(f=>f.width!==256||f.height!==256))throw Error('Wrong canvas '+q.id);
  if(!frames[0].pixels.every((c,i)=>c===original.pixels[i]))throw Error('Input frame changed '+q.id);
  const sheet=new Uint8Array(512*Math.ceil(q.args.frame_count/4)*128*4),height=Math.ceil(q.args.frame_count/4)*128;
  const audit=frames.map((f,i)=>{
    let count=0,partial=0,edge=0,minX=256,minY=256,maxX=-1,maxY=-1;
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){const a=f.pixels[(y*256+x)*4+3];if(!a)continue;count++;if(a!==255)partial++;if(!x||!y||x===255||y===255)edge++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    if(!count||count===65536)throw Error('Empty/opaque background '+q.id+' '+i);
    if(i>0)for(let y=0;y<128;y++)for(let x=0;x<128;x++){
      const a=((y*2)*256+x*2)*4,b=((Math.floor((i-1)/4)*128+y)*512+(i-1)%4*128+x)*4;
      sheet.set(f.pixels.subarray(a,a+4),b);
    }
    return {index:i,sha256:createHash('sha256').update(f.pixels).digest('hex'),visible:count,partial,edge,bounds:{minX,minY,maxX,maxY}};
  });
  writeFileSync(path+'/contact.png',png(sheet,512,height));writeFileSync(path+'/audit.json',JSON.stringify({job:r.job_id,direction:q.direction,motion:q.motion,generated:q.args.frame_count,frames:audit},null,2)+'\n');
  summary.push({id:q.id,frames:q.args.frame_count,edge:audit.reduce((s,f)=>s+f.edge,0)});
}
writeFileSync(root+'/collected.json',JSON.stringify(summary,null,2)+'\n');globalThis.console.log(JSON.stringify(summary));
