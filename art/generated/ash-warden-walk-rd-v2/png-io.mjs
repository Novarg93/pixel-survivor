import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {Buffer} from 'node:buffer';
export {png} from '../ash-warden-directions-v1/pixels.mjs';
export function readPNG(path){
 const b=readFileSync(path),chunks=[];let width,height;
 for(let p=8;p<b.length;){const n=b.readUInt32BE(p),type=b.toString('ascii',p+4,p+8),d=b.subarray(p+8,p+8+n);if(type==='IHDR'){width=d.readUInt32BE(0);height=d.readUInt32BE(4);if(d[8]!==8||d[9]!==6||d[12]!==0)throw Error('Expected RGBA8: '+path);}if(type==='IDAT')chunks.push(d);p+=n+12;}
 const raw=inflateSync(Buffer.concat(chunks)),pixels=new Uint8Array(width*height*4),stride=width*4;
 const paeth=(a,b,c)=>{const p=a+b-c,x=Math.abs(p-a),y=Math.abs(p-b),z=Math.abs(p-c);return x<=y&&x<=z?a:y<=z?b:c;};
 for(let y=0;y<height;y++){const f=raw[y*(stride+1)];if(f>4)throw Error('Bad PNG filter');for(let x=0;x<stride;x++){const k=y*stride+x,a=x>=4?pixels[k-4]:0,b=y?pixels[k-stride]:0,c=y&&x>=4?pixels[k-stride-4]:0;pixels[k]=(raw[y*(stride+1)+1+x]+[0,a,b,(a+b)>>1,paeth(a,b,c)][f])&255;}}
 return {width,height,pixels};
}
