import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Buffer} from 'node:buffer';
import console from 'node:console';
import assert from 'node:assert/strict';
import {readPNG} from '../art/generated/warrior-concept-pack-v1/source/png.mjs';
const m=JSON.parse(readFileSync('src/game/art/warriorHeroManifest.json')),review=JSON.parse(readFileSync(m.source)),root='public/assets/hd/warrior-hero-v1';
const hash=b=>createHash('sha256').update(b).digest('hex'),pages=m.pages.map(p=>{
 assert.equal(hash(readFileSync(`${root}/${p.index}.png`)),p.sha256);
 return {image:readPNG(`${root}/${p.index}.png`),data:JSON.parse(readFileSync(`${root}/${p.index}.json`))};
});
for(const [name,location]of Object.entries(m.locations)){
 const {image,data}=pages[location.page],rect=data.frames[name].frame,pixels=new Uint8Array(m.canvas*m.canvas*4);
 for(let y=0;y<m.canvas;y++)pixels.set(image.pixels.subarray(((rect.y+y)*image.width+rect.x)*4,((rect.y+y)*image.width+rect.x+m.canvas)*4),y*m.canvas*4);
 assert.equal(hash(Buffer.from(pixels)),location.pixelSHA256,name);
 const raw=readPNG(`${location.sourceRoot}/${location.source}`);assert.deepEqual(pixels,raw.pixels,name);
}
for(const [id,c]of Object.entries(m.clips)){if(id==='legacy-charge'){assert.equal(c.frameMs,20);assert.equal(c.frames.length,9);continue;}assert.deepEqual(c.frames,review.clips[id].frames);assert.equal(c.frameMs,review.clips[id].motion==='attack'?60:review.clips[id].frameMs);assert.deepEqual(c.frameMap,review.clips[id].frameMap);}
assert.equal(Object.keys(m.locations).length,127);assert.equal(m.playbackFrameCount,147);
console.log('PASS: 127 source RGBA frames, 147 playback references, six page hashes, attacks60ms and legacyCharge9x20ms.');
