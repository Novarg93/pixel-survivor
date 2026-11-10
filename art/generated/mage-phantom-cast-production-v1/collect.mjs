import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {readPNG,png} from '../ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/mage-phantom-cast-production-v1';
const manifest=JSON.parse(readFileSync(root+'/generation-manifest.json'));
const results=await Promise.all(manifest.jobs.map(async job=>{
  const dir=root+'/raw/'+job.direction;mkdirSync(dir,{recursive:true});
  if(!existsSync(dir+'/11.png')){
    const first=await fetch(`https://api.pixellab.ai/mcp/images/${job.id}/download?index=0`);
    if(first.status===423)return {direction:job.direction,status:'processing'};
    if(!first.ok)throw Error(job.direction+' HTTP '+first.status);
    writeFileSync(dir+'/00.png',new Uint8Array(await first.arrayBuffer()));
    await Promise.all(Array.from({length:11},async(_,i)=>{
      const response=await fetch(`https://api.pixellab.ai/mcp/images/${job.id}/download?index=${i+1}`);
      if(!response.ok)throw Error(job.direction+' frame '+(i+1)+' HTTP '+response.status);
      writeFileSync(dir+'/'+String(i+1).padStart(2,'0')+'.png',new Uint8Array(await response.arrayBuffer()));
    }));
  }
  const pixels=new Uint8Array(1024*768*4);
  for(let y=0;y<768;y++)for(let x=0;x<1024;x++){const p=(y*1024+x)*4,c=(Math.floor(x/8)+Math.floor(y/8))%2?28:35;pixels.set([c,c+9,c+16,255],p);}
  for(let i=0;i<12;i++){
    const image=readPNG(dir+'/'+String(i).padStart(2,'0')+'.png');
    if(image.width!==256||image.height!==256)throw Error('Invalid canvas '+job.direction);
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){const a=(y*256+x)*4,b=((Math.floor(i/4)*256+y)*1024+i%4*256+x)*4,t=image.pixels[a+3]/255;for(let c=0;c<3;c++)pixels[b+c]=Math.round(image.pixels[a+c]*t+pixels[b+c]*(1-t));}
  }
  writeFileSync(root+'/comparisons/'+job.direction+'-raw.png',png(pixels,1024,768));
  writeFileSync(dir+'/receipt.json',JSON.stringify({...job,status:'completed',privateLinksOmitted:true},null,2)+'\n');
  return {direction:job.direction,status:'collected'};
}));
console.log(JSON.stringify(results));
