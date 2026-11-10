import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='art/generated/ash-warden-walk-rd-v2/';
for(const sub of ['east/frames','east/originals','west/frames','south/originals','north/originals','comparisons','mcp','inputs'])mkdirSync(root+sub,{recursive:true});
const files=[];
function walk(path){if(path===root.slice(0,-1))return;for(const e of readdirSync(path,{withFileTypes:true})){const p=path+'/'+e.name;if(e.isDirectory())walk(p);else files.push(p);}}
for(const path of ['src','public','art'])walk(path);
for(const p of ['package.json','package-lock.json','vite.config.ts',root+'incoming/east/east-walk.gif',root+'incoming/east/east-walk-spritesheet.png'])files.push(p);
if(!existsSync(root+'protected-baseline.json'))writeFileSync(root+'protected-baseline.json',JSON.stringify(Object.fromEntries(files.map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')])),null,2));
for(const n of ['south','north'])copyFileSync('art/generated/ash-warden-directional-melee-b-v1/bases/'+n+'.png',root+'inputs/'+n+'.png');
globalThis.console.log(JSON.stringify({protectedFiles:files.length}));
