import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const root='art/main-hero-mage/casting/directions-pixminimax-v2/lightning/north-west',out=root+'/repair-v1';
mkdirSync(out,{recursive:true});
const toolId='2ffb7845-6950-4675-8af1-ded2c24ad864',url=`https://api.pixellab.ai/mcp/pixel-tools/${toolId}/frames.png`;
const response=await globalThis.fetch(url);if(!response.ok)throw Error('Repair download '+response.status);
writeFileSync(out+'/frames.png',new Uint8Array(await response.arrayBuffer()));
const sheet=readPNG(out+'/frames.png');if(sheet.width%256||sheet.height%256)throw Error('Unexpected repaired sheet size '+sheet.width+'x'+sheet.height);
const columns=sheet.width/256,index=6,pixels=new Uint8Array(256*256*4),original=readPNG(root+'/raw/06.png');
for(let y=0;y<256;y++){const a=((Math.floor(index/columns)*256+y)*sheet.width+index%columns*256)*4;pixels.set(sheet.pixels.subarray(a,a+1024),y*1024);}
let changed=0,otherChanged=0;
for(let k=0;k<pixels.length;k+=4)if([0,1,2,3].some(c=>pixels[k+c]!==original.pixels[k+c])){
  changed++;if(!(original.pixels[k]===126&&original.pixels[k+1]===126&&original.pixels[k+2]===125&&original.pixels[k+3]===255&&pixels[k+3]===0))otherChanged++;
}
if(changed!==13432||otherChanged)throw Error('Unexpected repair changes '+JSON.stringify({changed,otherChanged,sheet:[sheet.width,sheet.height]}));
writeFileSync(out+'/06.png',png(pixels,256,256));
const audit={provider:'PixelLab MCP pixelart_workbench',inputImage:'2d555659-915c-4286-94ff-d5c2a4526bc6',outputImage:toolId,job:'948840f9-b2e9-4b28-9e5c-82f1a6d467d7',oneBasedFrame:7,operation:{operation:'flood_fill',layer:'image',frames:[7],seed:[180,50],expected:'#7e7e7dff',color:'#00000000'},changedPixels:changed,nonArtifactChanges:otherChanged,remainingGrayBootPixels:5,originalSHA256:createHash('sha256').update(readFileSync(root+'/raw/06.png')).digest('hex'),repairedSHA256:createHash('sha256').update(readFileSync(out+'/06.png')).digest('hex'),download:url};
writeFileSync(out+'/audit.json',JSON.stringify(audit,null,2)+'\n');globalThis.console.log(JSON.stringify(audit,null,2));
