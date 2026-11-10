// Original Mage art. No Ash Warden pixels or shape generator are imported.
export const METEOR_ART={canvas:128,angleDegrees:45,flightSize:56,impactSize:56,flightPivot:{x:64,y:80},groundPivot:{x:64,y:80},lightPivot:{x:64,y:64},lightRadius:60};
export const METEOR_PALETTE={edge:'#343b40',stone:'#596561',facet:'#829081',light:'#abb39a',ember:'#955636',fire:'#dc8648',amber:'#fba35e',hot:'#ffdb9b',ash:'#56554b'};
const rgba=Object.fromEntries(Object.entries(METEOR_PALETTE).map(([key,hex])=>[key,[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).concat(255)]));
const fresh=()=>new Uint8Array(128*128*4);
function dot(p,x,y,c,alpha=255){x=Math.round(x);y=Math.round(y);if(x<0||x>=64||y<0||y>=64)return;const color=typeof c==='string'?rgba[c]:c;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)p.set([...color.slice(0,3),alpha],((y*2+dy)*128+x*2+dx)*4);}
function polygon(p,points,c){for(let y=0;y<64;y++)for(let x=0;x<64;x++){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y+.5)!==(b[1]>y+.5)&&x+.5<(b[0]-a[0])*(y+.5-a[1])/(b[1]-a[1])+a[0])inside=!inside;}if(inside)dot(p,x,y,c);}}
function disc(p,cx,cy,rx,ry,c){for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++)if(((x-cx)/(rx+.5))**2+((y-cy)/(ry+.5))**2<=1)dot(p,x,y,c);}
function stroke(p,x0,y0,x1,y1,c){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let i=0;i<=n;i++)dot(p,x0+(x1-x0)*i/n,y0+(y1-y0)*i/n,c);}
function chip(p,x,y,r){polygon(p,[[x-r,y-1],[x,y-r],[x+r,y],[x+1,y+r],[x-r,y+1]],'edge');disc(p,x,y,Math.max(0,r-1),Math.max(0,r-1),'facet');}
export function meteorArtwork(){
 const flight=Array.from({length:4},(_,i)=>{const p=fresh(),f=[0,2,-1,1][i];
  // Positive-X/negative-Y tail, negative-X/positive-Y travel: one 45 degree axis.
  polygon(p,[[31,38],[36,32],[40,31],[45,24],[50+f,22-f],[45,30],[42,32],[41,36],[35,43]],'ember');
  polygon(p,[[33,38],[38,32],[41,32],[45+f,27-f],[42,34],[39,35],[37,40]],'fire');
  polygon(p,[[34,39],[38,35],[40,34],[38,39],[36,41]],'amber');
  // A chipped slate/bronze shard with three broad facets, one warm seam.
  polygon(p,[[26,35],[31,33],[36,34],[39,39],[37,44],[32,47],[26,44],[24,40]],'edge');
  polygon(p,[[27,35],[32,34],[36,36],[37,41],[33,45],[28,44],[25,40]],'stone');
  polygon(p,[[27,36],[31,34],[35,36],[31,40],[26,39]],'facet');
  polygon(p,[[27,36],[30,35],[32,36],[29,38],[26,38]],'light');
  polygon(p,[[32,40],[36,36],[37,40],[34,44]],'facet');
  stroke(p,26,42,30,45,'fire');stroke(p,30,45,34,44,'ember');dot(p,26,42,'amber');
  return p;
 });
 const illumination=Array.from({length:12},(_,i)=>{const p=fresh(),power=[.025,.045,.075,.11,.15,.19,.23,.27,.20,.13,.06,0][i],radius=30*(i<8?.84+i*.16/7:1);
  // Authored alpha feather, sampled on the pixel grid. No filter or runtime blur.
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const r=Math.hypot(x-31.5,y-31.5)/radius;if(r>=1)continue;const falloff=(1-r*r)**2,alpha=Math.round(255*power*falloff);if(alpha)dot(p,x,y,'amber',alpha);}
  return p;
 });
 const impact=Array.from({length:6},(_,i)=>{const p=fresh();if(i===5)return p;const t=i/5;
  if(i<3){disc(p,32,40,4+i*2,2+i,'ember');disc(p,31,39,3,2,'fire');if(i===0)disc(p,31,39,1,1,'hot');}
  for(let n=0;n<5;n++){const a=n*2.399+.3,r=4+t*20,x=32+Math.cos(a)*r,y=40+Math.sin(a)*r*.42-Math.sin(t*Math.PI)*6;chip(p,x,y,i<3?2:1);if(n%2===0&&i<4)dot(p,x-1,y-2,'amber');}
  // Small dry dust wedges, no explosion ring, lava cracks or smoke pillar.
  if(i===1||i===2){disc(p,24-i*2,41,3,1,'ash');disc(p,39+i,42,3,1,'ash');}
  return p;
 });
 const ground=Array.from({length:8},(_,i)=>{const p=fresh();if(i===7)return p;
  disc(p,32,41,8,3,'ash');polygon(p,[[25,40],[29,38],[36,39],[40,41],[34,43],[27,42]],'edge');
  stroke(p,27,40,32,42,i<3?'ember':'stone');stroke(p,33,40,37,41,i<2?'fire':i<5?'ember':'stone');chip(p,23,42,1);chip(p,41,40,1);
  return p;
 });
 return {flight:{pixels:flight,durationsMs:Array(4).fill(50),pivot:METEOR_ART.flightPivot},illumination:{pixels:illumination,durationsMs:Array(12).fill(40),pivot:METEOR_ART.lightPivot},impact:{pixels:impact,durationsMs:Array(6).fill(60),pivot:METEOR_ART.groundPivot},ground:{pixels:ground,durationsMs:Array(8).fill(100),pivot:METEOR_ART.groundPivot}};
}
