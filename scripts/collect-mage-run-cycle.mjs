import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
import {encodeGif} from '../art/generated/ash-warden-directions-v1/gif.mjs';
const root='art/main-hero-mage/abilities/hero-model/run-cycle-v2',requests=JSON.parse(readFileSync(root+'/requests.json','utf8')),selection={},audits=[],pack=JSON.parse(readFileSync('src/game/art/mageHeroManifest.json','utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const q of requests){
 const path=root+'/'+q.direction;if(!existsSync(path+'/result.json'))continue;
 const result=JSON.parse(readFileSync(path+'/result.json','utf8')).structuredContent;
 if(result.status!=='completed'||result.frames!==9||result.asset.status!=='saved')throw Error('Incomplete '+q.direction);
 mkdirSync(path+'/raw',{recursive:true});
 for(let i=0;i<9;i++){const file=path+'/raw/'+String(i).padStart(2,'0')+'.png';if(existsSync(file))continue;const r=await globalThis.fetch(result.download_urls[i]);if(!r.ok)throw Error('Download '+r.status);writeFileSync(file,new Uint8Array(await r.arrayBuffer()));}
 const frames=Array.from({length:9},(_,i)=>readPNG(path+'/raw/'+String(i).padStart(2,'0')+'.png'));
 if(frames.some(f=>f.width!==256||f.height!==256))throw Error('Wrong size');
 if(hash(frames[0].pixels)!==hash(readPNG(q.reference).pixels))throw Error('Reference changed');
 const delta=(a,b)=>{let n=0;for(let k=0;k<a.pixels.length;k+=4){n+=Math.abs(a.pixels[k+3]-b.pixels[k+3]);if(a.pixels[k+3]&&b.pixels[k+3])for(let c=0;c<3;c++)n+=Math.abs(a.pixels[k+c]-b.pixels[k+c])/3;}return n;};
 const duplicateEnd=hash(frames[8].pixels)===hash(frames[0].pixels),endDelta=delta(frames[8],frames[0]);
 const duplicateClosingPose=endDelta<Math.max(...frames.slice(0,8).map((f,i)=>delta(f,frames[i+1])))*.15,count=duplicateClosingPose?8:9;
 const deltas=Array.from({length:count},(_,i)=>delta(frames[i],frames[(i+1)%count]));
 const audit={direction:q.direction,job:result.job_id,duplicateEnd,duplicateClosingPose,endDelta,count,deltas,joinRatio:deltas.at(-1)/Math.max(...deltas.slice(0,-1)),frames:frames.map((f,i)=>{let visible=0,edge=0,soft=0;for(let y=0;y<256;y++)for(let x=0;x<256;x++){const a=f.pixels[(y*256+x)*4+3];if(a){visible++;if(a!==255)soft++;if(!x||!y||x===255||y===255)edge++;}}if(!visible||visible===65536||edge)throw Error('Bad alpha '+q.direction+' '+i);return{index:i,hash:hash(f.pixels),visible,soft,edge};})};
 const pixels=new Uint8Array(9*128*128*4);for(const [i,f]of frames.entries())for(let y=0;y<128;y++)for(let x=0;x<128;x++){const a=(y*2*256+x*2)*4,b=(y*9*128+i*128+x)*4;pixels.set(f.pixels[a+3]?f.pixels.subarray(a,a+4):[24,35,40,255],b);}
 writeFileSync(path+'/contact.png',png(pixels,9*128,128));writeFileSync(path+'/audit.json',JSON.stringify(audit,null,2)+'\n');audits.push(audit);
 const idle=pack.clips['idle-'+q.direction].sourceFiles[0];
 selection[q.direction]={'run-start':[idle,...q.originalRun.slice(0,3)],run:Array.from({length:count},(_,i)=>path+'/raw/'+String(i).padStart(2,'0')+'.png'),'run-stop':[...q.originalRun.slice(12),idle]};
 const sheet=new Uint8Array(1024*Math.ceil(count/4)*256*4),height=Math.ceil(count/4)*256;
 for(const [i,f]of frames.slice(0,count).entries())for(let y=0;y<256;y++)sheet.set(f.pixels.subarray(y*1024,(y+1)*1024),((Math.floor(i/4)*256+y)*1024+i%4*256)*4);
 writeFileSync(path+'/native.png',png(sheet,1024,height));
 let gif=null,gifNote=null;
 try{const result=encodeGif(frames.slice(0,count),frames.slice(0,count).map(()=>60),256);writeFileSync(path+'/native.gif',result.bytes);gif={file:'native.gif',durationMs:result.durationMs};}
 catch(error){if(!String(error).includes('Refuse palette quantization'))throw error;gifNote=String(error);}
 writeFileSync(path+'/native.json',JSON.stringify({motion:'run',direction:q.direction,frames:count,sourceFiles:selection[q.direction].run,canvas:256,columns:4,durationMs:60,loop:true,endpointExcluded:duplicateClosingPose,gif,gifNote},null,2)+'\n');
}
if(Object.keys(selection).length===8)writeFileSync(root+'/selection.json',JSON.stringify(selection,null,2)+'\n');
writeFileSync(root+'/audit.json',JSON.stringify(audits,null,2)+'\n');globalThis.console.log(JSON.stringify(audits.map(({frames,deltas,...a})=>({...a,rawFrameCount:frames.length,deltas:deltas.map(Math.round)}))));
