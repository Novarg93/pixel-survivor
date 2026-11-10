import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Buffer} from 'node:buffer';
import console from 'node:console';
const directory='art/generated/mage-sfx-elevenlabs-v1';
const request=JSON.parse(await readFile(`${directory}/request.json`,'utf8'));
const generations=JSON.parse(await readFile('.tmp/mage-sfx-download.json','utf8'));
await mkdir(`${directory}/source`,{recursive:true});
const entries=[];
for(const g of generations){
  if(g.status!=='completed')throw new Error(`Generation incomplete: ${g.id}`);
  const receipt=request.run.results.find(r=>Object.hasOwn(r.credit_costs??{},g.id));
  const spec=request.specs.find(s=>s.nodeId===receipt.node_id);
  const variant=request.run.results.filter(r=>r.node_id===spec.nodeId).findIndex(r=>Object.hasOwn(r.credit_costs??{},g.id))+1;
  const file=`source/${spec.id}-${variant}.mp3`;
  const response=await globalThis.fetch(g.content_url,{signal:globalThis.AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error(`Download ${g.id}: HTTP ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  await writeFile(`${directory}/${file}`,bytes);
  const {content_url,thumbnail_url,...clean}=g;
  void content_url;void thumbnail_url;
  entries.push({...clean,generationId:g.id,nodeId:spec.nodeId,id:spec.id,variant,file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),contentType:response.headers.get('content-type')});
}
await writeFile(`${directory}/generations.json`,JSON.stringify(entries,null,2)+'\n');
console.log(JSON.stringify({downloaded:entries.length,bytes:entries.reduce((n,e)=>n+e.bytes,0),reportedCredits:entries.reduce((n,e)=>n+(e.price?.credits??0),0)}));
