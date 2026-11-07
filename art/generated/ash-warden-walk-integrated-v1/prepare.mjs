import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG} from '../ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/ash-warden-walk-integrated-v1/';
for(const sub of ['east/frames','west/frames','south/frames','north/frames','east/overlays','west/overlays','south/overlays','north/overlays','screenshots'])mkdirSync(root+sub,{recursive:true});
const allowed=new Set(['src/game/art/ashWardenManifest.json','scripts/build-ash-warden-runtime.mjs']);
const files=[];function visit(dir){if(dir===root.slice(0,-1)||dir==='public/assets/hd/ash-warden-v1')return;for(const e of readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())visit(p);else if(!allowed.has(p))files.push(p);}}
for(const dir of ['art','src','public','scripts','tests'])visit(dir);for(const p of ['package.json','package-lock.json','vite.config.ts','.gitignore'])files.push(p);
if(!existsSync(root+'protected-baseline.json'))writeFileSync(root+'protected-baseline.json',JSON.stringify(Object.fromEntries(files.map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')])),null,2));
if(!existsSync(root+'previous-runtime-clips.json')){
 const m=JSON.parse(readFileSync('src/game/art/ashWardenManifest.json','utf8')),clips=Object.fromEntries(Object.entries(m.clips).filter(([id])=>!id.endsWith('-walk'))),refs=new Set(Object.values(clips).flatMap(c=>c.frames.flatMap(f=>[...f.layers,...(f.overlay?[f.overlay]:[])].map(l=>l.frame))));
 const atlas=Array.from({length:m.pages},(_,i)=>({data:JSON.parse(readFileSync(`public/assets/hd/ash-warden-v1/${i}.json`,'utf8')),image:readPNG(`public/assets/hd/ash-warden-v1/${i}.png`)}));const textures={};
 for(const id of refs){const a=atlas[m.locations[id]],r=a.data.frames[id],p=new Uint8Array(r.frame.w*r.frame.h*4);for(let y=0;y<r.frame.h;y++)p.set(a.image.pixels.subarray(((r.frame.y+y)*a.image.width+r.frame.x)*4,((r.frame.y+y)*a.image.width+r.frame.x+r.frame.w)*4),y*r.frame.w*4);textures[id]={descriptor:{...r,frame:{w:r.frame.w,h:r.frame.h}},sha256:createHash('sha256').update(p).digest('hex')};}
 writeFileSync(root+'previous-runtime-clips.json',JSON.stringify({clips,textures},null,2));
}
globalThis.console.log({protectedFiles:files.length});
