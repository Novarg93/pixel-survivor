import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {readPNG,png} from './png-io.mjs';
import {encodeGif} from '../ash-warden-directions-v1/gif.mjs';
const root='art/generated/ash-warden-walk-rd-v2/',meta=JSON.parse(readFileSync(root+'east/import-validation.json','utf8'));
const frames=[];let differences=0;
const width=meta.width,height=meta.height,cols=4,sheet=new Uint8Array(width*cols*height*Math.ceil(meta.frameCount/cols)*4);
for(let i=0;i<meta.frameCount;i++){
 const a=readPNG(root+'east/frames/'+String(i).padStart(2,'0')+'.png'),b=readPNG(root+'west/frames/'+String(i).padStart(2,'0')+'.png');assert.equal(a.width,b.width);assert.equal(a.height,b.height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const k=(y*width+x)*4,j=(y*width+width-1-x)*4;if(a.pixels[k+3]!==b.pixels[j+3]||(a.pixels[k+3]&&[0,1,2].some(t=>a.pixels[k+t]!==b.pixels[j+t])))differences++;}
 for(let y=0;y<height;y++)sheet.set(b.pixels.subarray(y*width*4,(y+1)*width*4),((Math.floor(i/cols)*height+y)*width*cols+i%cols*width)*4);
 frames.push({pixels:b.pixels});
}
assert.equal(differences,0);
const gif=encodeGif(frames,meta.frames.map(f=>f.durationMs),width);writeFileSync(root+'west/west-walk.gif',gif.bytes);writeFileSync(root+'west/spritesheet.png',png(sheet,width*cols,height*Math.ceil(meta.frameCount/cols)));
const result={mirror:'x=width-1-x',width,height,frames:meta.frameCount,differences,durationsMs:meta.frames.map(f=>f.durationMs),durationMs:gif.durationMs,paletteColors:gif.paletteColors,rdCalls:0};writeFileSync(root+'west/mirror-validation.json',JSON.stringify(result,null,2));globalThis.console.log(JSON.stringify(result));
