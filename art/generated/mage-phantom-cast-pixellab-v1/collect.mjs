import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/mage-phantom-cast-pixellab-v1',job=process.argv[2],attempt=process.argv[3],count=Number(process.argv[4]);
const dir=root+'/raw/'+attempt;mkdirSync(dir,{recursive:true});
await Promise.all(Array.from({length:count},async(_,i)=>{const response=await fetch(`https://api.pixellab.ai/mcp/images/${job}/download?index=${i}`);if(!response.ok)throw Error('Frame '+i+' HTTP '+response.status);writeFileSync(dir+'/'+String(i).padStart(2,'0')+'.png',new Uint8Array(await response.arrayBuffer()));}));
const images=Array.from({length:count},(_,i)=>readPNG(dir+'/'+String(i).padStart(2,'0')+'.png'));
const columns=4,width=columns*256,height=Math.ceil(count/columns)*256,pixels=new Uint8Array(width*height*4);
for(let y=0;y<height;y++)for(let x=0;x<width;x++){const k=(y*width+x)*4,c=(Math.floor(x/8)+Math.floor(y/8))%2?35:28;pixels.set([c,c+9,c+16,255],k);}
const audit=images.map((image,i)=>{let visible=0,partial=0,edge=0,minX=256,minY=256,maxX=-1,maxY=-1;for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const k=(y*256+x)*4,a=image.pixels[k+3];if(a){visible++;if(a<255)partial++;if(!x||!y||x===255||y===255)edge++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);const d=((Math.floor(i/columns)*256+y)*width+i%columns*256+x)*4;for(let c=0;c<3;c++)pixels[d+c]=Math.round(image.pixels[k+c]*a/255+pixels[d+c]*(1-a/255));}
}return {index:i,width:image.width,height:image.height,visible,partial,edge,bounds:{minX,minY,maxX,maxY},sha256:createHash('sha256').update(readFileSync(dir+'/'+String(i).padStart(2,'0')+'.png')).digest('hex')};});
writeFileSync(root+'/comparisons/'+attempt+'-raw.png',png(pixels,width,height));
writeFileSync(dir+'/audit.json',JSON.stringify({jobId:job,frames:audit},null,2)+'\n');
console.log(JSON.stringify({attempt,count,canvas:images.map(i=>[i.width,i.height]),edge:audit.reduce((n,f)=>n+f.edge,0)}));
