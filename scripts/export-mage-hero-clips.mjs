import {readFileSync,writeFileSync} from 'node:fs';
import {readPNG,png} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
import {encodeGif} from '../art/generated/ash-warden-directions-v1/gif.mjs';
const root='art/main-hero-mage/casting/directions-pixminimax-v2',pack=JSON.parse(readFileSync('src/game/art/mageHeroManifest.json','utf8')),selection=JSON.parse(readFileSync(root+'/selection.json','utf8')),requests=JSON.parse(readFileSync(root+'/requests.json','utf8')),exports=[];
for(const q of requests){
  const id=selection[q.id]??q.id,path=root+'/'+id;
  // These exports document the archived generation, even when active movement
  // has been replaced by run-cycle-v2. Never overwrite it with a different job.
  const clip=['walk','run'].includes(q.motion)?{sourceFiles:Array.from({length:16},(_,i)=>path+'/raw/'+String(i+1).padStart(2,'0')+'.png')}:pack.clips[q.motion+'-'+q.direction];
  const frames=clip.sourceFiles.map(readPNG),columns=4,height=Math.ceil(frames.length/columns)*256,pixels=new Uint8Array(1024*height*4);
  for(const [i,f]of frames.entries())for(let y=0;y<256;y++)pixels.set(f.pixels.subarray(y*1024,(y+1)*1024),((Math.floor(i/4)*256+y)*1024+i%4*256)*4);
  writeFileSync(path+'/native.png',png(pixels,1024,height));
  const duration=q.motion==='walk'?80:q.motion==='run'?60:q.motion==='death'?62.5:130,durations=frames.map(()=>duration);
  let gif=null,gifNote=null;
  if(frames.some(f=>f.pixels.some((v,i)=>i%4===3&&v!==0&&v!==255)))gifNote='Partial alpha preserved in PNG; GIF omitted.';
  else try{const encoded=encodeGif(frames,durations,256);writeFileSync(path+'/native.gif',encoded.bytes);gif={file:'native.gif',paletteColors:encoded.paletteColors,durationMs:encoded.durationMs};}
  catch(error){if(!String(error).includes('Refuse palette quantization'))throw error;gifNote=String(error);}
  const metadata={motion:q.motion,direction:q.direction,sourceFiles:clip.sourceFiles,frameCount:frames.length,canvas:256,columns,rows:Math.ceil(frames.length/columns),durationsMs:durations,playback:'Review timing; game casting follows simulation-owned ability timing.',gif,gifNote,frames:frames.map((_,i)=>({index:i,frame:{x:i%4*256,y:Math.floor(i/4)*256,w:256,h:256}}))};
  writeFileSync(path+'/native.json',JSON.stringify(metadata,null,2)+'\n');exports.push({id,frames:frames.length,gif:!!gif,gifNote});
}
writeFileSync(root+'/exports.json',JSON.stringify(exports,null,2)+'\n');globalThis.console.log(JSON.stringify({clips:exports.length,gifs:exports.filter(e=>e.gif).length,notes:exports.filter(e=>e.gifNote)},null,2));
