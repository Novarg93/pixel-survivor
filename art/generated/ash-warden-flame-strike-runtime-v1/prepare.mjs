import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='art/generated/ash-warden-flame-strike-runtime-v1/';fs.mkdirSync(root+'screenshots',{recursive:true});
const allowed=new Set(['src/game/art/GameArt.ts','src/game/art/FinalBossArt.ts','tests/e2e/hd-integration.spec.ts']);
if(!fs.existsSync(root+'protected-baseline.json')){
 const files=new Set(execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(p=>p&&!allowed.has(p)));
 function visit(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=d+'/'+e.name;if(p===root.slice(0,-1))continue;if(e.isDirectory())visit(p);else files.add(p);}}
 visit('art');fs.writeFileSync(root+'protected-baseline.json',JSON.stringify({head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),allowedExistingChanges:[...allowed],files:Object.fromEntries([...files].sort().map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))},null,2));
}
globalThis.console.log('Captured accepted assets, gameplay and tests before Flame Strike integration.');
