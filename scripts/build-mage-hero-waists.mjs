import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readPNG} from '../art/generated/ash-warden-walk-rd-v2/png-io.mjs';
const pack=JSON.parse(readFileSync('src/game/art/mageHeroManifest.json','utf8')),size=pack.canvas,frames={};
function sample(file){
  const source=readPNG(file),pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const a=(Math.floor(y*256/size)*256+Math.floor(x*256/size))*4;pixels.set(source.pixels.subarray(a,a+4),(y*size+x)*4);}
  return pixels;
}
// Register the belt band against the same direction's neutral pose. Search is
// deliberately small: no image is warped, rescaled or repainted at runtime.
for(const direction of pack.directions){
  const reference=sample(pack.clips['idle-'+direction].sourceFiles[0]);
  for(const clip of Object.values(pack.clips).filter(c=>c.direction===direction))for(const [i,name]of clip.frames.entries()){
    const image=sample(clip.sourceFiles[i]);let best=Infinity,offset={x:0,y:0};
    for(let dy=-4;dy<=4;dy++)for(let dx=-5;dx<=5;dx++){
      let cost=(Math.abs(dx)+Math.abs(dy))*100;
      for(let y=51;y<61;y++)for(let x=39;x<74;x++){
        const a=(y*size+x)*4,b=((y+dy)*size+x+dx)*4;
        if(!reference[a+3]&&!image[b+3])continue;
        cost+=Math.abs(reference[a+3]-image[b+3])*2;
        if(reference[a+3]&&image[b+3])for(let c=0;c<3;c++)cost+=Math.abs(reference[a+c]-image[b+c]);
      }
      if(cost<best){best=cost;offset={x:dx,y:dy};}
    }
    frames[name]={x:size/2+offset.x,y:58+offset.y};
  }
}
const manifestHash=createHash('sha256').update(readFileSync('src/game/art/mageHeroManifest.json')).digest('hex');
writeFileSync('src/game/art/mageHeroWaists.json',JSON.stringify({version:1,canvas:size,manifestHash,referenceBand:{x:39,y:51,width:35,height:10},frames},null,2)+'\n');
globalThis.console.log(JSON.stringify({frames:Object.keys(frames).length,canvas:size,manifestHash}));
