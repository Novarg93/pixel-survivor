import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import process from 'node:process';
const root='art/generated/ash-warden-directional-melee-b-v1/';
const file='art/generated/ash-warden-charge-v1/protected-baseline.json';
function scan(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?scan(dir+e.name+'/'):[dir+e.name]);}
const hashes=Object.fromEntries(scan(root).map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]));
if(process.argv.includes('--verify')){const before=JSON.parse(readFileSync(file));const changed=Object.keys(before).filter(p=>hashes[p]!==before[p]);if(changed.length)throw Error(JSON.stringify(changed));globalThis.console.log('Protected accepted pack unchanged: '+Object.keys(before).length+' files');}
else writeFileSync(file,JSON.stringify(hashes,null,2));
