import {Buffer} from 'node:buffer';
const word=n=>[n&255,n>>8&255];
export function encodeGif(frames,durations,size=192){
 const palette=[[0,0,0]],indices=new Map();
 for(const f of frames)for(let k=0;k<f.pixels.length;k+=4)if(f.pixels[k+3]){const key=f.pixels.slice(k,k+3).join(',');if(!indices.has(key)){indices.set(key,palette.length);palette.push(f.pixels.slice(k,k+3));}}
 if(palette.length>256)throw Error('Refuse palette quantization: '+palette.length+' colors');
 const bytes=[...Buffer.from('GIF89a'),...word(size),...word(size),0xf7,0,0];
 for(let i=0;i<256;i++)bytes.push(...(palette[i]??[0,0,0]));
 bytes.push(0x21,0xff,11,...Buffer.from('NETSCAPE2.0'),3,1,0,0,0);
 let elapsed=0,previousTicks=0;
 frames.forEach((f,i)=>{
  elapsed+=durations[i];const ticks=Math.round(elapsed/10)-previousTicks;previousTicks+=ticks;
  bytes.push(0x21,0xf9,4,9,...word(ticks),0,0,0x2c,0,0,0,0,...word(size),...word(size),0,8);
  const codes=[256];let literals=0;
  for(let k=0;k<f.pixels.length;k+=4){if(literals===200){codes.push(256);literals=0;}codes.push(f.pixels[k+3]?indices.get(f.pixels.slice(k,k+3).join(',')):0);literals++;}codes.push(257);
  const packed=[];let bits=0,acc=0;for(const code of codes){acc|=code<<bits;bits+=9;while(bits>=8){packed.push(acc&255);acc>>>=8;bits-=8;}}if(bits)packed.push(acc&255);
  for(let p=0;p<packed.length;p+=255){const block=packed.slice(p,p+255);bytes.push(block.length,...block);}bytes.push(0);
 });bytes.push(0x3b);return {bytes:Buffer.from(bytes),paletteColors:palette.length-1,durationMs:previousTicks*10};
}
