import {existsSync,mkdirSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import process from 'node:process';
const root=process.argv[2]??'art/generated/mage-spells-pixellab-ai-v1';
for(const file of readdirSync(`${root}/source`).filter(n=>n.endsWith('-result.json'))){
 const id=file.slice(0,-12),result=JSON.parse(readFileSync(`${root}/source/${file}`,'utf8')).structuredContent;
 if(result?.status!=='completed')continue;
 const urls=result.download_urls;
 if(!Array.isArray(urls)||urls.length!==result.frames)throw Error('Unexpected PixelLab download list '+id);
 const directory=`${root}/raw/${id}`;mkdirSync(directory,{recursive:true});
 for(let start=0;start<urls.length;start+=4)await Promise.all(urls.slice(start,start+4).map(async(url,j)=>{
  const target=`${directory}/${String(start+j).padStart(2,'0')}.png`;if(existsSync(target))return;
  const response=await globalThis.fetch(url,{signal:globalThis.AbortSignal.timeout(45000)});if(!response.ok)throw Error('PixelLab download '+response.status+' '+id);
  writeFileSync(target,new Uint8Array(await response.arrayBuffer()));
 }));
 const audit=urls.map((url,i)=>{const name=`${String(i).padStart(2,'0')}.png`,bytes=readFileSync(`${directory}/${name}`);return{index:i,file:`raw/${id}/${name}`,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length};});
 writeFileSync(`${directory}/download-audit.json`,JSON.stringify({id,jobId:result.job_id,provider:'PixelLab',generated:true,frames:audit},null,2)+'\n');
 globalThis.console.log(`${id}: ${audit.length} original PNG(s) saved`);
}
