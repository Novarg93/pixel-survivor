import {deflateSync} from 'node:zlib';
import {Buffer} from 'node:buffer';
const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc(bytes){let n=0xffffffff;for(const b of bytes)n=table[(n^b)&255]^(n>>>8);return(n^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),n=Buffer.alloc(4),c=Buffer.alloc(4);n.writeUInt32BE(data.length);c.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([n,t,data,c]);}
export function png(pixels,width=192,height=192){const head=Buffer.alloc(13);head.writeUInt32BE(width,0);head.writeUInt32BE(height,4);head[8]=8;head[9]=6;const rows=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++)Buffer.from(pixels.slice(y*width*4,(y+1)*width*4)).copy(rows,y*(width*4+1)+1);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);}
export const empty=()=>new Uint8ClampedArray(192*192*4);
export function inside(x,y,p){let b=false;for(let i=0,j=p.length-1;i<p.length;j=i++){if(((p[i][1]>y)!==(p[j][1]>y))&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])b=!b;}return b;}
export function blit(dst,src,{dx=0,dy=0,angle=0,pivot=[0,0],target=pivot,scaleY=1,filter=()=>true}={}){const co=Math.cos(angle),si=Math.sin(angle);for(let y=0;y<192;y++)for(let x=0;x<192;x++){const xx=x-dx-target[0],yy=y-dy-target[1],sx=Math.round(co*xx+si*yy+pivot[0]),sy=Math.round((-si*xx+co*yy)/scaleY+pivot[1]);if(sx<0||sx>=192||sy<0||sy>=192||!filter(sx,sy))continue;const k=(sy*192+sx)*4;if(src[k+3])dst.set(src.slice(k,k+4),(y*192+x)*4);}}
export function poly(dst,points,color){for(let y=0;y<192;y++)for(let x=0;x<192;x++)if(inside(x+.5,y+.5,points))dst.set([...color,255],(y*192+x)*4);}
export function link(dst,a,b,wa,wb,color){const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,n=[-dy/l,dx/l];poly(dst,[[a[0]+n[0]*wa,a[1]+n[1]*wa],[b[0]+n[0]*wb,b[1]+n[1]*wb],[b[0]-n[0]*wb,b[1]-n[1]*wb],[a[0]-n[0]*wa,a[1]-n[1]*wa]],color);}
export function flip(pixels){const out=empty();for(let y=0;y<192;y++)for(let x=0;x<192;x++)out.set(pixels.slice((y*192+x)*4,(y*192+x)*4+4),(y*192+191-x)*4);return out;}
export function nearest(src,color){let best=null,d=Infinity;for(let k=0;k<src.length;k+=4){if(!src[k+3])continue;const dist=(src[k]-color[0])**2+(src[k+1]-color[1])**2+(src[k+2]-color[2])**2;if(dist<d){d=dist;best=Array.from(src.slice(k,k+3));}}return best;}
