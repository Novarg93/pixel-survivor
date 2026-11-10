import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';

export function rgbaPng(file:string){
 const bytes=readFileSync(file),idat:Buffer[]=[];let width=0,height=0;
 for(let pos=8;pos<bytes.length;){const length=bytes.readUInt32BE(pos),type=bytes.toString('ascii',pos+4,pos+8),data=bytes.subarray(pos+8,pos+8+length);if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);if(data[8]!==8||data[9]!==6||data[12]!==0)throw Error('Expected RGBA8 PNG');}if(type==='IDAT')idat.push(data);pos+=length+12;}
 const raw=inflateSync(Buffer.concat(idat)),stride=width*4,pixels=Buffer.alloc(stride*height);
 const paeth=(a:number,b:number,c:number)=>{const p=a+b-c,x=Math.abs(p-a),y=Math.abs(p-b),z=Math.abs(p-c);return x<=y&&x<=z?a:y<=z?b:c;};
 for(let y=0;y<height;y++)for(let x=0;x<stride;x++){const k=y*stride+x,a=x>=4?pixels[k-4]!:0,b=y?pixels[k-stride]!:0,c=y&&x>=4?pixels[k-stride-4]!:0;pixels[k]=(raw[y*(stride+1)+1+x]!+[0,a,b,(a+b)>>1,paeth(a,b,c)][raw[y*(stride+1)]!]!)&255;}
 return{width,height,pixels};
}
