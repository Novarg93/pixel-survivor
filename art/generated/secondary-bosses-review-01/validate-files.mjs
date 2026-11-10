import process from 'node:process';
import {Buffer} from 'node:buffer';
import {readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
const root=resolve('art/generated/secondary-bosses-review-01');
const files=[];function walk(p){for(const d of readdirSync(p,{withFileTypes:true})){const f=join(p,d.name);if(d.isDirectory())walk(f);else files.push(f);}}walk(root);
const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc(b){let n=0xffffffff;for(const x of b)n=table[(n^x)&255]^(n>>>8);return(n^0xffffffff)>>>0;}
const errors=[],pngs=[];
for(const file of files.filter(f=>f.endsWith('.png'))){const b=readFileSync(file);try{
 if(!b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('PNG signature');
 let offset=8,ended=false;while(offset<b.length){const n=b.readUInt32BE(offset),type=b.toString('ascii',offset+4,offset+8);if(offset+12+n>b.length)throw Error('Truncated chunk');if(crc(b.subarray(offset+4,offset+8+n))!==b.readUInt32BE(offset+8+n))throw Error('CRC '+type);offset+=12+n;if(type==='IEND'){ended=true;break;}}
 if(!ended||offset!==b.length)throw Error('PNG termination');pngs.push({file:relative(root,file).replaceAll('\\','/'),width:b.readUInt32BE(16),height:b.readUInt32BE(20),bitDepth:b[24],colorType:b[25]});
 }catch(e){errors.push({file:relative(root,file),error:e.message});}}
const data=JSON.parse(readFileSync(join(root,'review-data.json'),'utf8'));let atlasBytes=0;
for(const model of Object.values(data.models))if(model.frames.length!==1||model.frames[0].visible<100||model.frames[0].edge||model.frames[0].partialAlpha)errors.push({file:model.folder,error:'Invalid active model alpha / bounds'});
for(const clip of Object.values(data.clips)){const atlas=JSON.parse(readFileSync(join(root,clip.folder,'spritesheet.json'),'utf8')),image=pngs.find(p=>p.file===clip.folder+'/spritesheet.png');
 if(!image||image.width!==atlas.meta.size.w||image.height!==atlas.meta.size.h)errors.push({file:clip.folder,error:'Atlas dimensions'});
 if(Object.keys(atlas.frames).length!==clip.frames.length)errors.push({file:clip.folder,error:'Atlas frame count'});
 for(const f of Object.values(atlas.frames))if(f.frame.x<0||f.frame.y<0||f.frame.x+f.frame.w>image.width||f.frame.y+f.frame.h>image.height||f.sourceSize.w!==192||f.sourceSize.h!==192||f.trimmed||f.rotated)errors.push({file:clip.folder,error:'Frame rectangle / logical canvas'});
 atlasBytes+=image.width*image.height*4;
 for(const name of ['original.gif',clip.preview.split('/').at(-1)])if(!readFileSync(join(root,clip.folder,name)).subarray(0,6).toString('ascii').startsWith('GIF8'))errors.push({file:clip.folder+'/'+name,error:'GIF signature'});
}
const privateReferences=[];for(const file of files.filter(f=>/\.(json|txt|md|js|mjs|html)$/.test(f))){const text=readFileSync(file,'utf8');if(/https?:\/\/[^\s"'<>]*(?:X-Amz-Signature=|AWSAccessKeyId=|s3\.amazonaws\.com\/)/.test(text))privateReferences.push(relative(root,file));}
const result={pngFiles:pngs.length,pngCRCErrors:errors.filter(e=>e.error.includes('CRC')),gifFiles:files.filter(f=>f.endsWith('.gif')).length,usableModels:Object.keys(data.models).length,motions:Object.keys(data.clips).length,motionFrames:Object.values(data.clips).reduce((s,c)=>s+c.frames.length,0),sourceMotionAtlasBaseRGBABytes:atlasBytes,sourceMotionAtlasBaseMiB:atlasBytes/1024/1024,modelBaseRGBABytes:Object.keys(data.models).length*128*128*4,totalStagingFileBytes:files.reduce((s,f)=>s+statSync(f).size,0),privateReferences,errors,pngs};
writeFileSync(join(root,'file-validation.json'),JSON.stringify(result,null,2));globalThis.console.log(JSON.stringify({...result,pngs:undefined}));if(errors.length||privateReferences.length)process.exitCode=1;
