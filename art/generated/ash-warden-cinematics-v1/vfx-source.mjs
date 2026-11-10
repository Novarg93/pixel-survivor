import {empty,poly} from '../ash-warden-directions-v1/pixels.mjs';
const C={ash:[112,111,100,255],dark:[48,43,40,255],stone:[159,142,112,255],ember:[246,142,47,255],hot:[255,202,98,255],energy:[163,223,232,255],edge:[64,126,150,255]};
export const VFX_TIMINGS={spawn:[100,100,100,100,100,120],shatter:[30,40,50,60,70,80,90],overload:[40,50,60,70,80,100],deathAsh:[70,80,100,100,100,150],stoneHit:[30,40,50,60,80,100],phase3Embers:[100,100,100,100,100,100]};
function dot(p,x,y,color,size=1){for(let yy=0;yy<size;yy++)for(let xx=0;xx<size;xx++){const x0=Math.round(x)+xx,y0=Math.round(y)+yy;if(x0>0&&x0<191&&y0>0&&y0<191)p.set(color,(y0*192+x0)*4);}}
export function makeVfx(kind){return VFX_TIMINGS[kind].map((durationMs,i)=>{const pixels=empty(),n=VFX_TIMINGS[kind].length,t=i/(n-1);if(i===n-1)return{pixels,durationMs};
 if(kind==='phase3Embers'){for(let j=0;j<4;j++)dot(pixels,78+j*12+Math.sin(j+i)*3,118-(j%2)*24-t*12,j%2?C.ember:C.hot);}
 else if(kind==='shatter'){for(let j=0;j<12;j++){const a=j*Math.PI/6,r=30+t*35,x=96+Math.cos(a)*r,y=105+Math.sin(a)*r*.85;poly(pixels,[[x,y],[x+Math.cos(a)*7,y+Math.sin(a)*7],[x-3,y+4]],(j%2?C.energy:C.edge).slice(0,3));}}
 else{const count=kind==='deathAsh'?18:kind==='overload'?16:12;for(let j=0;j<count;j++){const a=j*2.4,r=(kind==='overload'?18:8)+t*(kind==='overload'?42:32),x=96+Math.cos(a)*r,y=(kind==='overload'?112:150)+Math.sin(a)*r*.25-Math.sin(t*Math.PI)*(kind==='spawn'?24:14);const color=kind==='overload'||kind==='spawn'?j%3?C.ember:C.ash:kind==='stoneHit'?j%2?C.stone:C.dark:j%4?C.ash:C.ember;dot(pixels,x,y,color,j%3===0?3:2);if(kind==='spawn'&&i<3&&j<8)dot(pixels,96+Math.cos(a)*26,150+Math.sin(a)*8,C.hot);}}
 return{pixels,durationMs};});}
