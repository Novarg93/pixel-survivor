// Original deterministic pixel art. Local authorship, no AI inference.
export const RUNE_PALETTE=['#2d2b40','#4d405e','#756187','#9d80ae','#bf9dc8','#ddd0df','#b87896'];
const rgb=RUNE_PALETTE.map(s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)));
function canvas(){return new Uint8Array(128*128*4);}
function dot(p,x,y,color,alpha=255){x=Math.round(x);y=Math.round(y);for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){const a=x*2+xx,b=y*2+yy;if(a<0||b<0||a>=128||b>=128)continue;const k=(b*128+a)*4;p.set([...rgb[color],Math.max(0,Math.min(255,Math.round(alpha)))],k);}}
function rect(p,x,y,w,h,c,a=255){for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)dot(p,x+xx,y+yy,c,a);}
function line(p,x0,y0,x1,y1,c,a=255){const steps=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let i=0;i<=steps;i++){const t=steps?i/steps:0;dot(p,x0+(x1-x0)*t,y0+(y1-y0)*t,c,a);}}
function poly(p,points,c,a=255){const minY=Math.floor(Math.min(...points.map(p=>p[1]))),maxY=Math.ceil(Math.max(...points.map(p=>p[1])));for(let y=minY;y<=maxY;y++){const cuts=[];for(let i=0;i<points.length;i++){const [x0,y0]=points[i],[x1,y1]=points[(i+1)%points.length];if((y0<=y&&y1>y)||(y1<=y&&y0>y))cuts.push(x0+(y-y0)*(x1-x0)/(y1-y0));}cuts.sort((a,b)=>a-b);for(let i=0;i+1<cuts.length;i+=2)for(let x=Math.ceil(cuts[i]);x<=Math.floor(cuts[i+1]);x++)dot(p,x,y,c,a);}}
function projectile(frame){const p=canvas(),shift=[0,1,2,1,0,-1][frame];
 rect(p,22+shift,32,4,1,1,90);rect(p,27+shift,31,6,2,2,150);rect(p,34,30,4,2,3,185);rect(p,31-shift,35,3,1,6,120);
 poly(p,[[35,32],[42,26],[53,32],[42,38]],0);poly(p,[[37,32],[42,27],[51,32],[42,36]],2);poly(p,[[40,30],[43,28],[50,32],[42,32]],3);
 line(p,43,28,50,31,4);line(p,47,31,51,32,5);line(p,42,34,46,34,6,190);line(p,40,31,42,33,1);line(p,42,31,44,31,1);dot(p,52,32,4);return p;
}
function impact(frame){const p=canvas();if(frame===5)return p;const a=[255,230,180,125,60][frame],d=2+frame;
 if(frame<3)poly(p,[[50-frame,32],[52,30-frame],[54+frame,32],[52,34+frame]],frame===0?5:3,a);
 for(const [dx,dy]of [[1,0],[-1,0],[.6,-.8],[-.6,.8]]){const x=52+dx*d,y=32+dy*d;line(p,x,y,x+dx*2,y+dy*2,frame%2?4:6,a);}
 return p;
}
const corners=[[20,21],[44,21],[54,28],[54,36],[44,43],[20,43],[10,36],[10,28]];
function seal(frame,fade=1){const p=canvas(),pulse=[.9,.94,1,.98,.92,.88,.86,.88][frame%8],a=245*fade*pulse;if(fade===0)return p;
 for(let i=0;i<corners.length;i++){const [x,y]=corners[i],[nx,ny]=corners[(i+1)%corners.length],end=.68;
  line(p,x,y,x+(nx-x)*end,y+(ny-y)*end,i%2?3:2,a);if((i+frame)%4===0)line(p,x,y,x+(nx-x)*.35,y+(ny-y)*.35,5,a);
 }
 // Four broad marks. The centre stays entirely open over the terrain and feet.
 for(const [x,y,side]of [[31,20,1],[31,43,-1],[10,31,1],[53,31,-1]]){line(p,x,y,x+side*2,y,4,a);line(p,x,y,x,y+2,4,a);dot(p,x+side,y+1,5,a);}
 return p;
}
export function runeCodeClips(){return {
 'projectile-flight':{frames:Array.from({length:6},(_,i)=>projectile(i)),durationsMs:Array(6).fill(80),loop:true,pivot:[104,64],size:52},
 'projectile-impact':{frames:Array.from({length:6},(_,i)=>impact(i)),durationsMs:Array(6).fill(50),loop:false,pivot:[104,64],size:52},
 'blink-idle':{frames:Array.from({length:8},(_,i)=>seal(i)),durationsMs:Array(8).fill(90),loop:true,pivot:[64,64],size:62},
 'blink-fade':{frames:Array.from({length:9},(_,i)=>seal(i,Math.max(0,1-i/8)**1.35)),durationsMs:Array(9).fill(40),loop:false,pivot:[64,64],size:62}
};}
