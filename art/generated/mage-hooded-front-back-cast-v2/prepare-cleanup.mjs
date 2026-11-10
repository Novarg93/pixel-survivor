import {writeFileSync} from 'node:fs';
import {readPNG} from '../ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/mage-hooded-front-back-cast-v2',operations=[];
// These four frames were inspected: separate fragments are unwanted gesture/VFX ghosts.
for(const [clip,index]of [['front-e',2],['back-nw',2],['front-se',4],['front-se',5]]){
 const im=readPNG(root+'/raw/'+clip+'/frame-'+String(index).padStart(2,'0')+'.png'),seen=new Set(),components=[];
 for(let k=0;k<9216;k++){
  if(seen.has(k)||!im.pixels[k*4+3])continue;const q=[k];seen.add(k);
  for(let i=0;i<q.length;i++)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=q[i]%96+dx,y=Math.floor(q[i]/96)+dy,j=y*96+x;if(x>=0&&x<96&&y>=0&&y<96&&!seen.has(j)&&im.pixels[j*4+3]){seen.add(j);q.push(j);}}
  components.push(q);
 }
 components.sort((a,b)=>b.length-a.length);
 operations.push({clip,index,reason:'Remove inspected detached ghost fragments, preserve attached hands/body',clearPixels:components.slice(1).flat().map(k=>[k%96,Math.floor(k/96)])});
}
// The generator added a yellow orb despite the no-VFX brief. Remove only its exact colours in the palm ROI.
const im=readPNG(root+'/raw/front-se/frame-03.png'),orb=new Set(['210,158,67','239,180,38','253,213,25','255,240,59','170,136,91','190,144,71']),pixels=[];
for(let y=50;y<76;y++)for(let x=65;x<92;x++){const k=(y*96+x)*4;if(im.pixels[k+3]&&orb.has(Array.from(im.pixels.slice(k,k+3)).join(',')))pixels.push([x,y]);}
operations.push({clip:'front-se',index:3,reason:'Remove unwanted yellow spell orb; skin and sleeve colours are excluded',clearPixels:pixels});
writeFileSync(root+'/cleanup.json',JSON.stringify({operations},null,2)+'\n');
globalThis.console.log(JSON.stringify(operations.map(o=>({clip:o.clip,index:o.index,removedPixels:o.clearPixels.length}))));
