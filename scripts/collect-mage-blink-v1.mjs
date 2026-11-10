import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Buffer} from 'node:buffer';
import console from 'node:console';
const root='art/generated/mage-blink-v1/source';
const items=[['departure','7048127f-53ef-4a0d-9d89-56b62e92f1e4','pixel-survivor-mage-blink-departure-a-v1'],['arrival','66bbacb0-0de1-418f-9576-018eee93768c','pixel-survivor-mage-blink-arrival-b-v1']];
const downloads=[];
for(const [clip,id,stem] of items){
 mkdirSync(`${root}/${clip}`,{recursive:true});
 for(const suffix of ['.png','.json','.gif','-game.zip']){
  const url=`https://api.pixellab.ai/mcp/pixel-tools/${id}/${stem}${suffix}`;
  const response=await globalThis.fetch(url);if(!response.ok)throw Error(`${response.status} ${url}`);
  const bytes=Buffer.from(await response.arrayBuffer()),file=`${root}/${clip}/${stem}${suffix}`;
  writeFileSync(file,bytes);downloads.push({file,url,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
 }
}
writeFileSync(`${root}/downloads.json`,JSON.stringify(downloads,null,2)+'\n');
console.log(JSON.stringify(downloads.map(({file,bytes})=>({file,bytes})),null,2));
