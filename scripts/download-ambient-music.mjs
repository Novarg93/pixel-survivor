import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Buffer} from 'node:buffer';
import console from 'node:console';
const root='art/generated/music-ambient-review-v1';
const request=JSON.parse(await readFile(`${root}/request.json`,'utf8'));
const generations=JSON.parse(await readFile('.tmp/ambient-music-download.json','utf8'));
await mkdir(`${root}/source`,{recursive:true});
const entries=[];
for(const g of generations){
  if(g.status!=='completed')throw new Error(`Generation incomplete: ${g.id}`);
  const receipt=request.run.results.find(r=>Object.hasOwn(r.credit_costs??{},g.id));
  const spec=request.specs.find(s=>s.nodeId===receipt.node_id);
  const variant=request.run.results.filter(r=>r.node_id===spec.nodeId).findIndex(r=>Object.hasOwn(r.credit_costs??{},g.id))+1;
  const file=`source/${spec.id}-${variant}.mp3`;
  const response=await globalThis.fetch(g.content_url,{signal:globalThis.AbortSignal.timeout(45000)});
  if(!response.ok)throw new Error(`Download ${g.id}: HTTP ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  await writeFile(`${root}/${file}`,bytes);
  const {content_url,thumbnail_url,...clean}=g;void content_url;void thumbnail_url;
  entries.push({...clean,generationId:g.id,nodeId:spec.nodeId,trackId:spec.id,variant,file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),contentType:response.headers.get('content-type')});
}
await writeFile(`${root}/generations.json`,JSON.stringify(entries,null,2)+'\n');
console.log(JSON.stringify({downloaded:entries.length,bytes:entries.reduce((n,e)=>n+e.bytes,0),reportedCredits:entries.reduce((n,e)=>n+(e.price?.credits??0),0)}));
