import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readPNG} from '../ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/ash-warden-flame-strike-runtime-v1/',m=JSON.parse(fs.readFileSync('src/game/art/flameStrikeManifest.json','utf8')),atlas=JSON.parse(fs.readFileSync('public/assets/hd/ash-warden-flame-strike-v1/atlas.json','utf8')),image=readPNG('public/assets/hd/ash-warden-flame-strike-v1/atlas.png'),source=JSON.parse(fs.readFileSync('art/generated/ash-warden-flame-strike-vfx-v1/variant-c/metadata.json','utf8'));
const hash=p=>createHash('sha256').update(p).digest('hex');let frames=0;
for(const [i,name]of m.frames.entries()){
 const p=new Uint8Array(192*192*4),r=name?atlas.frames[name]:null;if(r){assert.deepEqual(r.sourceSize,{w:192,h:192});for(let y=0;y<r.frame.h;y++)for(let x=0;x<r.frame.w;x++){const from=((r.frame.y+y)*image.width+r.frame.x+x)*4,to=((r.spriteSourceSize.y+y)*192+r.spriteSourceSize.x+x)*4;p.set(image.pixels.subarray(from,from+4),to);}}
 const expected=readPNG('art/generated/ash-warden-flame-strike-vfx-v1/'+source.previewFrames[i]);assert.deepEqual(p,expected.pixels,'C frame changed in atlas: '+i);if(i===11)assert.ok(p.every(v=>v===0));frames++;
}
const glow=atlas.frames['ground-glow'].frame,alpha=(x,y)=>image.pixels[((glow.y+y)*image.width+glow.x+x)*4+3];for(let x=0;x<glow.w;x++){assert.equal(alpha(x,0),0);assert.equal(alpha(x,glow.h-1),0);}for(let y=0;y<glow.h;y++){assert.equal(alpha(0,y),0);assert.equal(alpha(glow.w-1,y),0);}assert.ok(alpha(128,32)>250);assert.ok(alpha(128,8)<alpha(128,16));assert.ok(alpha(128,16)<alpha(128,32));
let sources=0;for(const [p,h]of Object.entries(m.sources)){assert.equal(hash(fs.readFileSync(p)),h);sources++;}
const baseline=JSON.parse(fs.readFileSync(root+'protected-baseline.json','utf8'));let protectedFiles=0;for(const [p,h]of Object.entries(baseline.files)){assert.equal(hash(fs.readFileSync(p)),h,'Accepted/gameplay file changed: '+p);protectedFiles++;}
assert.ok(m.rgbaBytes<=1048576);assert.deepEqual(m.pivot,[96,144]);assert.equal(m.loop,false);assert.equal(m.durationsMs.reduce((a,b)=>a+b),600);assert.equal(m.propagationMs,90);const result={result:'PASS',selectedCFramesExact:frames,sourceFiles:sources,protectedFiles,groundGlowFeathered:true,emptyFinalFrame:true,atlasBytes:m.rgbaBytes,originalBossAtlasUnchanged:true,gameplayUnchanged:true};fs.writeFileSync(root+'validation.json',JSON.stringify(result,null,2));globalThis.console.log(JSON.stringify(result));
