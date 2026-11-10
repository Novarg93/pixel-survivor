import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root='art/generated/ash-warden-melee-combo-v1/';for(const sub of ['slash/raw','slash/frames','slash/prepared','slash/west','a/frames','a/overlays','screenshots'])fs.mkdirSync(root+sub,{recursive:true});
const allowed=new Set(['src/game/art/ashWardenPack.ts','src/game/art/FinalBossArt.ts','src/game/art/GameArt.ts','src/game/systems/FinalEncounter.ts','tests/e2e/hd-integration.spec.ts']);
if(!fs.existsSync(root+'protected-baseline.json')){
 const files=[];function visit(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=d+'/'+e.name;if(e.isDirectory())visit(p);else if(!allowed.has(p))files.push(p);}}
 for(const d of ['src','public','scripts','art/generated/ash-warden-melee-swing-experiment-01','art/generated/ash-warden-directional-melee-b-v1','art/generated/ash-warden-flame-strike-vfx-v1','art/generated/ash-warden-walk-manual-v1','art/generated/ash-warden-walk-rd-v2/incoming'])visit(d);
 fs.writeFileSync(root+'protected-baseline.json',JSON.stringify({allowedExistingChanges:[...allowed],files:Object.fromEntries(files.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))},null,2));
}
globalThis.console.log('Protected accepted source packs and prior runtime assets.');
