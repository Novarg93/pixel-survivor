import fs from 'node:fs';
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import process from 'node:process';
const root='art/generated/ash-warden-flame-strike-vfx-v1/';
for(const id of process.argv.slice(2)){
 const dir=root+`variant-${id}/`,response=JSON.parse(fs.readFileSync(dir+'job-result.json','utf8')),d=response.structuredContent??JSON.parse(response.content.find(c=>c.type==='text').text);
 if(d.status!=='succeeded')throw Error('Existing job not succeeded: '+id);
 const rows=[];for(const [i,url]of d.result.output_urls.entries()){
  const r=await globalThis.fetch(url,{signal:globalThis.AbortSignal.timeout(60000)});if(!r.ok)throw Error('Download HTTP '+r.status+'; retrieve existing task, do not regenerate');const bytes=Buffer.from(await r.arrayBuffer());if(!bytes.subarray(0,6).toString().startsWith('GIF8'))throw Error('Expected actual GIF, not response/error content');
  const file='raw/'+(i?'output-'+i:'output')+'.gif';fs.writeFileSync(dir+file,bytes);rows.push({file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),contentType:r.headers.get('content-type')});
 }fs.writeFileSync(dir+'downloads.json',JSON.stringify(rows,null,2));globalThis.console.log({id,downloads:rows});
}
