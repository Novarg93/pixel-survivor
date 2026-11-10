import fs from 'node:fs';
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {createServer} from 'node:http';
import process from 'node:process';
import {readPNG} from '../ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/ash-warden-flame-strike-vfx-v1/',read=p=>JSON.parse(fs.readFileSync(root+p,'utf8')),m=read('metadata.json'),manifest=read('generation-manifest.json'),hash=p=>createHash('sha256').update(p).digest('hex');
assert.equal(manifest.paidGenerations,3);const sequences=[],metrics=[];
for(const c of m.clips){assert.equal(c.frameCount,12);assert.equal(c.uniqueFrames,12);assert.deepEqual(c.canvas,[192,192]);assert.deepEqual(c.durationsMs,Array(12).fill(150));assert.equal(c.durationMs,1800);assert.equal(c.loop,false);assert.ok(c.allFramesHaveTransparency);assert.equal(c.rawEdgeClipping,false);
 assert.equal(hash(fs.readFileSync(root+c.rawGIF)),manifest.variants.find(v=>v.id===c.id).rawSHA256);assert.equal(hash(fs.readFileSync(root+c.inputImage)),c.inputHash);
 const raw=c.rawFrames.map(p=>readPNG(root+p)),preview=c.previewFrames.map(p=>readPNG(root+p));
 for(let i=0;i<12;i++){assert.deepEqual([raw[i].width,raw[i].height],[192,192]);assert.deepEqual([preview[i].width,preview[i].height],[192,192]);if(i<9)assert.deepEqual(preview[i].pixels,raw[i].pixels);for(let k=0;k<preview[i].pixels.length;k+=4)if(preview[i].pixels[k+3])assert.deepEqual(preview[i].pixels.subarray(k,k+4),raw[i].pixels.subarray(k,k+4));}
 assert.ok(preview.at(-1).pixels.every((v,i)=>i%4!==3||v===0));
 for(const [file,frames]of [[c.rawGIF,raw],[c.rawPreviewGIF,raw],[c.previewGIF,preview]]){if(file!==c.rawGIF)assert.equal(fs.readFileSync(root+file).includes(Buffer.from('NETSCAPE2.0')),false);sequences.push({file,gif:fs.readFileSync(root+file).toString('base64'),expected:frames.map(f=>hash(f.pixels)),durations:c.durationsMs});}
 const valid=c.analysis.filter(f=>f.bounds),minPadding=Math.min(...valid.flatMap(f=>[f.bounds.minX,f.bounds.minY,191-f.bounds.maxX,191-f.bounds.maxY])),bases=c.analysis.filter(f=>f.baseCentroid).map(f=>f.baseCentroid);
 metrics.push({id:c.id,minTransparentPaddingPx:minPadding,peakFrame:c.analysis.reduce((a,b)=>a.occupied>b.occupied?a:b).index+1,rawLastOccupied:c.rawLastOccupied,rawFullyFades:c.rawFullyFades,preparedFullyFades:true,lowerBandCentroidSpan:[0,1].map(k=>Math.max(...bases.map(v=>v[k]))-Math.min(...bases.map(v=>v[k])))});
}
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');const{chromium}=await import('@playwright/test');const server=createServer((req,res)=>res.end('<!doctype html>'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chromium',headless:true});
let decodedFrames=0;
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 for(const s of sequences){const decoded=await page.evaluate(async source=>{const dec=new globalThis.ImageDecoder({data:Uint8Array.from(globalThis.atob(source),c=>c.charCodeAt(0)),type:'image/gif',preferAnimation:true});await dec.tracks.ready;const out=[];for(let i=0;i<dec.tracks.selectedTrack.frameCount;i++){const{image}=await dec.decode({frameIndex:i}),c=globalThis.document.createElement('canvas');c.width=image.displayWidth;c.height=image.displayHeight;const x=c.getContext('2d');x.drawImage(image,0,0);const p=x.getImageData(0,0,c.width,c.height).data,digest=await globalThis.crypto.subtle.digest('SHA-256',p);out.push({hash:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join(''),duration:image.duration/1000});image.close();}dec.close();return out;},s.gif);
  assert.deepEqual(decoded.map(f=>f.hash),s.expected,'GIF visible pixels differ: '+s.file);assert.deepEqual(decoded.map(f=>f.duration),s.durations,'GIF timing differs: '+s.file);decodedFrames+=decoded.length;
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
const baseline=read('protected-baseline.json');let protectedFiles=0;for(const [file,digest]of Object.entries(baseline.files)){assert.equal(hash(fs.readFileSync(file)),digest,'Outside accepted file changed: '+file);protectedFiles++;}
const expenses=read('expenses.json');assert.equal(expenses.actualTotal,.75);assert.equal(expenses.observedBalanceDelta,.75);
const result={technicalResult:'PASS',rawFadeoutResult:'FAIL: all three retain ground residue; raw untouched',preparedFadeoutResult:'PASS: documented pixel-dither extinction in frames10–12',frameCount:36,gifRoundtripFrames:decodedFrames,protectedFiles,administrativeLogExceptions:baseline.excludedAdministrativeLogs,metrics};fs.writeFileSync(root+'validation.json',JSON.stringify(result,null,2));globalThis.console.log(JSON.stringify(result));
