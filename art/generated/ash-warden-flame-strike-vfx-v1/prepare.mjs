import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {png,empty,poly} from '../ash-warden-directions-v1/pixels.mjs';
const root='art/generated/ash-warden-flame-strike-vfx-v1/';
for(const sub of ['preflight','comparisons',...['a','b','c'].flatMap(id=>[`variant-${id}/raw`,`variant-${id}/frames`,`variant-${id}/preview-frames`])])fs.mkdirSync(root+sub,{recursive:true});
if(!fs.existsSync(root+'protected-baseline.json')){
 const files=new Set(execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean));
 function visit(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=d+'/'+e.name;if(p===root.slice(0,-1))continue;if(e.isDirectory())visit(p);else files.add(p);}}
 for(const dir of ['art','docs'])visit(dir);
 for(const p of ['ASEPRITE_MCP_DIAGNOSTIC_REPORT.txt','PIXEL_SURVIVOR_FINAL_BOSS_SPEC.md'])if(fs.existsSync(p))files.add(p);
 files.delete('docs/PROGRESS.md');files.delete('docs/DECISIONS.md');
 fs.writeFileSync(root+'protected-baseline.json',JSON.stringify({head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),excludedAdministrativeLogs:['docs/PROGRESS.md','docs/DECISIONS.md'],files:Object.fromEntries([...files].sort().filter(p=>!p.startsWith(root)).map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))},null,2));
}
const palette={rock:[31,29,28],rim:[70,39,27],red:[129,34,19],orange:[239,88,18],amber:[255,159,32],core:[255,224,125]};
for(const [id,half,flame]of [['a',32,22],['b',46,30],['c',39,20]]){
 const p=empty(),shape=(points,c)=>poly(p,points,palette[c]);
 shape([[96-half,142],[78,137],[96,139],[112,137],[96+half,142],[120,149],[94,151],[72,148]],'rock');
 shape([[96-half+5,143],[78,140],[96,142],[111,140],[96+half-5,143],[113,146],[93,147],[76,145]],'rim');
 shape([[96-half+10,143],[84,141],[98,143],[111,141],[96+half-10,144],[109,145],[93,145],[81,144]],'orange');
 for(const [x,h]of [[82,flame*.55],[96,flame],[111,flame*.7]]){
  shape([[x-8,144],[x-7,134],[x-3,133],[x-2,144-h],[x+2,137],[x+6,132],[x+5,144],[x,147]],'red');
  shape([[x-5,143],[x-3,137],[x-1,149-h],[x+2,140],[x+4,137],[x+3,144]],'orange');
  shape([[x-2,144],[x,136],[x+2,144]],'amber');
 }
 if(id==='c')for(const [x,y]of [[69,144],[117,146],[88,149],[106,138]]){shape([[x-3,y],[x,y-3],[x+4,y-1],[x+2,y+3]],'red');shape([[x,y],[x+2,y],[x+2,y+1]],'amber');}
 shape([[90,143],[94,143],[95,144],[92,145]],'core');
 fs.writeFileSync(root+`variant-${id}/input-ignition.png`,png(p));
}
globalThis.console.log('Prepared original ignition reference images and immutable source baseline.');
