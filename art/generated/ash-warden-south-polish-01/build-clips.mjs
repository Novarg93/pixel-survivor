import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {Buffer} from 'node:buffer';
import {resolve} from 'node:path';
import process from 'node:process';
import {RIG} from './rig.mjs';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve('.browsers');
const {chromium}=await import('@playwright/test');
const dir='art/generated/ash-warden-south-polish-01/';
const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage();
 const result=await page.evaluate(async({src,rig})=>{
  const im=new globalThis.Image();im.src=src;await im.decode();
  const c=globalThis.document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const source=ctx.getImageData(0,0,128,128).data;
  const inside=(x,y,p)=>{let b=false;for(let i=0,j=p.length-1;i<p.length;j=i++){if(((p[i][1]>y)!==(p[j][1]>y))&&(x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0]))b=!b;}return b;};
  const layers=Object.fromEntries(['upper','weapon','cloth','leftLeg','rightLeg','chest'].map(k=>[k,new Uint8ClampedArray(128*128*4)]));
  const labels=new Uint8ClampedArray(128*128*4),labelColors={upper:[80,130,185],weapon:[238,175,70],cloth:[180,100,180],leftLeg:[100,190,105],rightLeg:[220,100,90],chest:[60,190,195]};
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
   const k=(y*128+x)*4;if(!source[k+3])continue;
   const weapon=inside(x+.5,y+.5,rig.masks.weapon)&&(y<78||x+y<=134);
   const name=weapon?'weapon':inside(x+.5,y+.5,rig.masks.cloth)?'cloth':y>=80?(x<69?'leftLeg':'rightLeg'):inside(x+.5,y+.5,rig.masks.chest)?'chest':'upper';
   layers[name].set(source.slice(k,k+4),k);labels.set([...labelColors[name],255],k);
  }
  const palette=[];for(let k=0;k<source.length;k+=4)if(source[k+3]&&!palette.some(p=>p[0]===source[k]&&p[1]===source[k+1]&&p[2]===source[k+2]))palette.push(Array.from(source.slice(k,k+3)));
  function nearest(rgb){return palette.reduce((best,p)=>p.reduce((v,c,i)=>v+(c-rgb[i])**2,0)<best.d?{p,d:p.reduce((v,c,i)=>v+(c-rgb[i])**2,0)}:best,{p:palette[0],d:Infinity}).p;}
  const shade=nearest([28,24,26]),edge=nearest([65,57,58]),mid=nearest([43,37,39]);
  function canvasData(pixels,size){const cc=globalThis.document.createElement('canvas');cc.width=cc.height=size;cc.getContext('2d').putImageData(new globalThis.ImageData(pixels,size,size),0,0);return cc.toDataURL();}
  function blit(dst,src,{dx=0,dy=0,angle=0,pivot=[0,0],target=pivot,scaleY=1,filter=()=>true}={}){
   const co=Math.cos(angle),si=Math.sin(angle);
   for(let y=0;y<192;y++)for(let x=0;x<192;x++){
    const xx=x-32-dx-target[0],yy=y-32-dy-target[1],sx=Math.round(co*xx+si*yy+pivot[0]),sy=Math.round((-si*xx+co*yy)/scaleY+pivot[1]);
    if(sx<0||sx>=128||sy<0||sy>=128||!filter(sx,sy))continue;const k=(sy*128+sx)*4;if(src[k+3])dst.set(src.slice(k,k+4),(y*192+x)*4);
   }
  }
  function poly(dst,points,color){for(let y=0;y<192;y++)for(let x=0;x<192;x++)if(inside(x-32+.5,y-32+.5,points))dst.set([...color,255],(y*192+x)*4);}
  function link(dst,a,b,wa,wb){const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,n=[-dy/l,dx/l];poly(dst,[[a[0]+n[0]*wa,a[1]+n[1]*wa],[b[0]+n[0]*wb,b[1]+n[1]*wb],[b[0]-n[0]*wb,b[1]-n[1]*wb],[a[0]-n[0]*wa,a[1]-n[1]*wa]],shade);}
  const exports={},idle=[],walk=[],motion=[];
  for(const [name,data]of Object.entries(layers))exports['layers/'+name+'.png']=canvasData(data,128);exports['layers/segmentation.png']=canvasData(labels,128);
  for(let i=0;i<4;i++){
   const dst=new Uint8ClampedArray(192*192*4);blit(dst,source);
   // Only internal cuirass pixels translate; helmet, hands, sword and outer shoulders stay fixed.
   if(i===1)blit(dst,layers.chest,{dy:1});
   // A1px reversible tail deformation, pinned at the belt, does not touch the hands/weapon.
   const tail=i===1?1:i===3?-1:0;
   if(tail){for(let y=80;y<106;y++)for(let x=50;x<105;x++){const k=(y*128+x)*4;if(layers.cloth[k+3]){
      const dk=((y+32)*192+x+32)*4;dst[dk+3]=0;if(x>58&&x<77&&y<96)dst.set([...shade,255],dk);
    }}
    for(let y=80;y<106;y++)blit(dst,layers.cloth,{filter:(x,sy)=>sy===y,dx:Math.round(tail*(y-80)/25)});
   }
   blit(dst,layers.weapon);
   const pulse=[1,1.06,1,.96][i];
   for(let k=0;k<dst.length;k+=4)if(Math.floor(k/4/192)>=67&&dst[k+3]&&dst[k]>dst[k+1]*1.3&&dst[k+1]>dst[k+2]*1.25&&dst[k]>110){dst[k]=Math.min(255,Math.round(dst[k]*pulse));dst[k+1]=Math.min(255,Math.round(dst[k+1]*pulse));}
   idle.push({png:canvasData(dst,192),pixels:Array.from(dst),durationMs:450});
  }
  function leg(name,phase,bx,by){
   const cfg=rig.legs[name],dst=new Uint8ClampedArray(192*192*4),lift=rig.gait.lift[phase],stance=phase<=4;
   const sole=[cfg.sole[0],cfg.sole[1]+rig.gait.footY[phase]-lift];
   const ankle=[sole[0]-(name==='right'?5:0),sole[1]-(name==='right'?5:8)],hip=[cfg.hip[0]+bx,cfg.hip[1]+by];
   const knee=[hip[0]+(ankle[0]-hip[0])*.52+(name==='left'?-3:3),hip[1]+(ankle[1]-hip[1])*.5-lift*.3];
   link(dst,hip,knee,7,7);link(dst,knee,ankle,6,4);link(dst,ankle,[sole[0],sole[1]-1],4,5);
   // Narrow inner greave surfaces keep the black articulated joints connected and readable.
   poly(dst,[[knee[0]-3,knee[1]],[ankle[0]-2,ankle[1]+2],[ankle[0]+2,ankle[1]+2],[knee[0]+3,knee[1]]],mid);
   poly(dst,[[knee[0]-4,knee[1]],[ankle[0]-3,ankle[1]],[ankle[0]-2,ankle[1]],[knee[0]-3,knee[1]]],edge);
   const angles=[Math.atan2(knee[1]-hip[1],knee[0]-hip[0])-Math.PI/2,Math.atan2(ankle[1]-knee[1],ankle[0]-knee[0])-Math.PI/2,stance?0:(phase===5?-.12:phase===7?.1:0)];
   const targets=[[hip[0]*.3+knee[0]*.7,hip[1]*.3+knee[1]*.7],[(knee[0]+ankle[0])/2,(knee[1]+ankle[1])/2],[sole[0],sole[1]]];
   cfg.parts.forEach((p,j)=>blit(dst,layers[name+'Leg'],{pivot:p.pivot,target:targets[j],angle:angles[j],scaleY:j===1?Math.max(.7,Math.min(2.2,Math.hypot(ankle[0]-knee[0],ankle[1]-knee[1])/12)):1,filter:(x,y)=>x>=p.box[0]&&y>=p.box[1]&&x<p.box[2]&&y<p.box[3]}));
   return{dst,stance,sole,ankle,knee,hip,lift};
  }
  for(let i=0;i<8;i++){
   const dst=new Uint8ClampedArray(192*192*4),bx=rig.gait.bodyX[i],by=rig.gait.bodyY[i];
   const left=leg('left',i,bx,by),right=leg('right',(i+4)%8,bx,by);
   const order=left.sole[1]>right.sole[1]?[right,left]:[left,right];
   for(const l of order)for(let k=0;k<dst.length;k+=4)if(l.dst[k+3])dst.set(l.dst.slice(k,k+4),k);
   // Belt/backfill covers moving hip seams; cape and tabard overlap the upper leg plates.
   poly(dst,[[50+bx,72+by],[83+bx,72+by],[90+bx,88+by],[51+bx,91+by]],shade);
   blit(dst,layers.upper,{dx:bx,dy:by});blit(dst,layers.chest,{dx:bx,dy:by});
   const clothLag=[0,0,1,1,0,0,-1,-1][i];
   for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const k=(y*128+x)*4;if(!layers.cloth[k+3])continue;
    const xx=x+32+bx+Math.round(clothLag*Math.max(0,y-78)/27),yy=y+32+by;
    dst.set(layers.cloth.slice(k,k+4),(yy*192+xx)*4);
   }
   blit(dst,layers.weapon,{dx:bx,dy:by});
   walk.push({png:canvasData(dst,192),pixels:Array.from(dst),durationMs:56*rig.worldScale/72/8*1000});
   let overlap=0;for(let k=0;k<dst.length;k+=4)if(left.dst[k+3]&&right.dst[k+3])overlap++;
   motion.push({index:i,body:[bx,by],clothTailLag:clothLag,left:{phase:i,stance:left.stance,sole:left.sole,knee:left.knee,hip:left.hip,lift:left.lift},right:{phase:(i+4)%8,stance:right.stance,sole:right.sole,knee:right.knee,hip:right.hip,lift:right.lift},legOverlapPixels:overlap});
  }
  const [sheet,s]=(()=>{const t=globalThis.document.createElement('canvas');t.width=1536;t.height=660;return[t,t.getContext('2d')];})();s.fillStyle='#27343c';s.fillRect(0,0,1536,660);s.imageSmoothingEnabled=false;
  const all=[...idle,...walk];for(let i=0;i<all.length;i++){const im=new globalThis.Image();im.src=all[i].png;await im.decode();const xx=(i%4)*384,yy=Math.floor(i/4)*220;s.drawImage(im,xx+96,yy+24,192,192);s.fillStyle='#fff1d0';s.font='13px monospace';s.fillText((i<4?'Idle '+i:'Walk '+(i-4)),xx+96,yy+18);}
  return{idle,walk,motion,exports,palette,preview:sheet.toDataURL(),shade,edge};
 },{src:'data:image/png;base64,'+readFileSync('art/generated/ash-warden-retrodiffusion-01/best-candidate.png').toString('base64'),rig:RIG});
 for(const [name,png]of Object.entries(result.exports)){mkdirSync(dir+name.slice(0,name.lastIndexOf('/')),{recursive:true});writeFileSync(dir+name,Buffer.from(png.split(',')[1],'base64'));}
 for(const id of ['idle','walk']){mkdirSync(dir+id+'/frames',{recursive:true});result[id].forEach((f,i)=>writeFileSync(dir+id+'/frames/'+String(i).padStart(2,'0')+'.png',Buffer.from(f.png.split(',')[1],'base64')));}
 writeFileSync(dir+'draft-sheet.png',Buffer.from(result.preview.split(',')[1],'base64'));
 writeFileSync(dir+'motion.json',JSON.stringify(result.motion,null,2));
 writeFileSync(dir+'pixel-data.json',JSON.stringify({idle:result.idle.map(f=>({pixels:f.pixels,durationMs:f.durationMs})),walk:result.walk.map(f=>({pixels:f.pixels,durationMs:f.durationMs})),size:192}));
 writeFileSync(dir+'rig-manifest.json',JSON.stringify({rig:RIG,palette:result.palette,costUSD:0,paidCalls:0,method:'Fixed RD pixel masks; rigid upper armor/hands/weapon; authored limb contacts, nearest-sampled projected greaves and dark joint backfill',idleDurationMs:1800,walkStrideSourcePixels:56,walkStrideWorld:56*RIG.worldScale},null,2));
 globalThis.console.log(JSON.stringify({idle:result.idle.length,walk:result.walk.length,overlap:result.motion.map(f=>f.legOverlapPixels)}));
}finally{await browser.close();}
