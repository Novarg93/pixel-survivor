import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {readPNG} from '../ash-warden-walk-rd-v2/png-io.mjs';
const root='art/generated/mage-phantom-cast-production-v1',pilot='art/generated/mage-phantom-cast-pixellab-v1';
const vectors={'south':[0,1],'south-east':[Math.SQRT1_2,Math.SQRT1_2],east:[1,0],'north-east':[Math.SQRT1_2,-Math.SQRT1_2],north:[0,-1],'north-west':[-Math.SQRT1_2,-Math.SQRT1_2],west:[-1,0],'south-west':[-Math.SQRT1_2,Math.SQRT1_2]};
for(const dir of ['processed','sources','manifestation'])mkdirSync(root+'/'+dir,{recursive:true});
const directions=Object.entries(vectors).map(([direction,vector])=>{
  mkdirSync(root+'/processed/'+direction,{recursive:true});
  if(direction==='south'){
    for(let i=0;i<12;i++)copyFileSync(pilot+'/processed/frame-'+String(i).padStart(2,'0')+'.png',root+'/processed/south/'+String(i).padStart(2,'0')+'.png');
    copyFileSync(pilot+'/phantom-cast.aseprite',root+'/sources/south.aseprite');
    return {direction,vector,reuse:true};
  }
  const request=JSON.parse(readFileSync(root+'/requests/'+direction+'.json')).parameters;
  const poses=request.keypoints.map(frame=>Object.fromEntries(['right','left'].map(side=>[side,Object.fromEntries(['shoulder','elbow','palm'].map(part=>{
    const p=frame.find(p=>p.label===side.toUpperCase()+' '+(part==='palm'?'ARM':part.toUpperCase()));
    return [part,[p.x*256,p.y*256]];
  }))])));
  if(direction==='north')for(let i=3;i<11;i++){
    const image=readPNG(root+'/raw/north/'+String(i===5?6:i).padStart(2,'0')+'.png');let top=70;
    for(let y=8;y<60;y++)for(let x=149;x<194;x++)if(image.pixels[(y*256+x)*4+3]>180)top=Math.min(top,y);
    if(top<60){let sum=0,count=0;for(let y=top;y<top+8;y++)for(let x=149;x<194;x++)if(image.pixels[(y*256+x)*4+3]>180){sum+=x;count++;}poses[i].right.palm=[sum/count,top+5];}
  }
  return {direction,vector,active:vector[0]<0?'left':'right',poses};
});
writeFileSync(root+'/process-args.json',JSON.stringify({root:resolve(root).replaceAll('\\','/'),directions},null,2)+'\n');
