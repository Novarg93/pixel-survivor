import {copyFileSync,writeFileSync,existsSync} from 'node:fs';
import {readPNG} from './io.mjs';
import {encodeGif} from '../ash-warden-directions-v1/gif.mjs';
const root='art/generated/ash-warden-run-aseprite-pilot-01/';
const rows=[];
for(const [kind,n,ms]of [['walk',8,80],['run',12,50]]){
 const file=root+kind+'/east-'+kind+'.gif',native=root+'analysis/aseprite-native-'+kind+'.gif';
 if(!existsSync(native))copyFileSync(file,native);
 // Format encoding only: the pixels remain the PNGs exported by Live Aseprite.
 const frames=Array.from({length:n},(_,i)=>({pixels:readPNG(root+kind+'/frames/'+i+'.png').pixels}));
 const gif=encodeGif(frames,Array(n).fill(ms));writeFileSync(file,gif.bytes);
 rows.push({clip:kind,paletteColors:gif.paletteColors,durationMs:gif.durationMs,source:'Unmodified Live PNG exports',encoder:'Existing repository lossless GIF encoder',nativeExportPreserved:native});
}
writeFileSync(root+'gif-encoding.json',JSON.stringify(rows,null,2));globalThis.console.log(JSON.stringify(rows));
