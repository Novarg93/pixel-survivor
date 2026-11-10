import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import process from 'node:process';
const dir='art/generated/ash-warden-meteor-v1/';
const roots=['art/generated/ash-warden-directional-melee-b-v1/','art/generated/ash-warden-charge-v1/','art/generated/ash-warden-charge-vfx-v1/','art/generated/ash-warden-south-polish-01/','art/generated/ash-warden-directions-v1/','src/','public/'];
function scan(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?scan(dir+e.name+'/'):[dir+e.name]);}
export function hashes(){return Object.fromEntries(roots.flatMap(scan).map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]));}
const baseline=dir+'protected-baseline.json';
if(process.argv.includes('--record')){if(existsSync(baseline))throw Error('Refuse to overwrite protected baseline');writeFileSync(baseline,JSON.stringify(hashes(),null,2));}
if(process.argv.includes('--verify')){const before=JSON.parse(readFileSync(baseline)),after=hashes(),changed=Object.keys(before).filter(p=>before[p]!==after[p]);if(changed.length)throw Error(JSON.stringify(changed));globalThis.console.log('Protected '+Object.keys(before).length+' files unchanged');}
