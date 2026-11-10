import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {Buffer} from 'node:buffer';
export function decodePng(path){const f=readFileSync(path),w=f.readUInt32BE(16),h=f.readUInt32BE(20),blocks=[];let p=8;while(p<f.length){const n=f.readUInt32BE(p);if(f.subarray(p+4,p+8).toString()==='IDAT')blocks.push(f.subarray(p+8,p+8+n));p+=12+n;}const rows=inflateSync(Buffer.concat(blocks)),pixels=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++){if(rows[y*(w*4+1)]!==0)throw Error('Expected authored filter0 PNG');pixels.set(rows.subarray(y*(w*4+1)+1,(y+1)*(w*4+1)),y*w*4);}return{w,h,pixels};}
