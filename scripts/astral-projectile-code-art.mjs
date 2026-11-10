// Independently authored pixel art, drawn on a64px logical grid then doubled.
// No AI source, tracing, random noise or frame-by-frame image fitting.
export const ASTRAL_PALETTE=['#202f3b','#304650','#426668','#568d87','#7eb5a7','#a6d2bd','#d2e6ce','#7d8f9b'];
const rgba=ASTRAL_PALETTE.map(h=>h.match(/\w\w/g).map(c=>parseInt(c,16)));
const canvas=()=>new Uint8Array(128*128*4);
function dot(p,x,y,c,a=255){x=Math.round(x);y=Math.round(y);if(x<0||x>=64||y<0||y>=64)return;for(let j=0;j<2;j++)for(let i=0;i<2;i++)p.set([...rgba[c],Math.round(a)],((y*2+j)*128+x*2+i)*4);}
function line(p,x,y,tx,ty,c,a=255){const steps=Math.max(Math.abs(tx-x),Math.abs(ty-y));for(let n=0;n<=steps;n++)dot(p,x+(tx-x)*n/Math.max(1,steps),y+(ty-y)*n/Math.max(1,steps),c,a);}
function poly(p,v,c,a=255){for(let y=0;y<64;y++)for(let x=0;x<64;x++){let inside=false;for(let i=0,j=v.length-1;i<v.length;j=i++){const [xi,yi]=v[i],[xj,yj]=v[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;}if(inside)dot(p,x,y,c,a);}}
function flight(n){const p=canvas(),s=[0,1,1,0,-1,-1,0,0][n];
 // Split, asymmetric hooked wake around a dark kernel, rather than a Rune arrow.
 line(p,13+s,33,23,32,2,100);line(p,18,28-s,28,28,3,145);line(p,24,28,36,30,4,180);
 line(p,21-s,38,29,36+s,2,140);line(p,29,36+s,39,35,3,190);
 poly(p,[[32,28],[39,23],[46,24],[52,29],[53,33],[49,40],[42,41],[36,37],[43,37],[48,33],[46,28],[40,27]],0);
 poly(p,[[34,28],[40,24],[46,25],[51,29],[51,34],[48,39],[42,40],[38,37],[44,37],[49,32],[46,28],[40,28]],3);
 line(p,37,27,40,24,4);line(p,40,24,46,25,5);line(p,46,25,51,29,6);line(p,51,30,51,34,5);line(p,48,38,43,40,4);
 poly(p,[[41,29],[46,28],[49,32],[46,36],[41,35]],1);line(p,43,29,46,29,7);line(p,48,32,48,34,4);
 line(p,36,32,40,33,2,210);line(p,33-s,34,37,35,3,170);return p;
}
function impact(n){const p=canvas();if(n===7)return p;const fade=[255,245,220,185,140,90,40][n],r=2+n;
 if(n<3){poly(p,[[45-n,31],[48,28-n],[51+n,31],[49,35+n],[46,34]],n===0?5:3,fade);line(p,48,29-n,50+n,31,6,fade);}
 for(const [dx,dy]of [[-1,-.35],[-.6,.8],[.9,-.7],[1,.55]]){const x=48+dx*r,y=32+dy*r;line(p,x,y,x+dx*2,y+dy*2,n<3?4:3,fade);}
 return p;
}
export function astralCodeClips(){return{
 flight:{frames:Array.from({length:8},(_,i)=>flight(i)),durationsMs:Array(8).fill(80),loop:true,pivot:[96,64],size:40},
 impact:{frames:Array.from({length:8},(_,i)=>impact(i)),durationsMs:Array(8).fill(45),loop:false,pivot:[96,64],size:40}
};}
