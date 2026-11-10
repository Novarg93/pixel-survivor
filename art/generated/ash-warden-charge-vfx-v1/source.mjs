// Authored pixel paths. Native source pixels match the 192px boss, without fitting.
export const SIZE=96, PIVOT=[48,56], SCALE=0.6548310811;
export const COLORS={dark:[18,17,15,255],edge:[165,146,110,255],rim:[185,165,123,255],rock:[101,91,72,255],top:[205,185,144,255],shade:[34,30,25,255]};
const paths=[[[27,56],[21,53],[17,54],[11,50]],[[27,56],[29,61],[24,64],[25,68]],[[27,56],[33,52],[39,53],[43,49]],[[27,56],[22,59],[16,59]],[[70,53],[75,49],[81,50],[86,46]],[[70,53],[75,57],[80,57],[83,62]],[[70,53],[65,58],[60,57],[56,61]],[[70,53],[66,49],[60,48]]];
const chips=[[-1,-.2,27,54,3],[1,-.4,70,53,3],[-.7,.5,24,58,2],[.8,.6,73,57,2],[-.5,-.7,39,52,2],[.5,-.8,61,52,2],[-.9,.1,34,56,3],[.8,.2,66,56,3]];
export const DEFINITIONS={start:{id:'charge-start-vfx',event:'chargeStart',durationsMs:[20,20,30,30,30,30],maxChips:6},stop:{id:'charge-stop-vfx',event:'chargeStop',durationsMs:[20,30,30,40,40,40,40],maxChips:8}};
const blank=()=>new Uint8ClampedArray(SIZE*SIZE*4);
function dot(p,x,y,c){x=Math.round(x);y=Math.round(y);if(x>=0&&x<SIZE&&y>=0&&y<SIZE)p.set(c,(y*SIZE+x)*4);}
function line(p,a,b,c){let [x,y]=a;const dx=Math.abs(b[0]-x),sx=x<b[0]?1:-1,dy=-Math.abs(b[1]-y),sy=y<b[1]?1:-1;let e=dx+dy;for(;;){dot(p,x,y,c);if(x===b[0]&&y===b[1])break;const n=2*e;if(n>=dy){e+=dy;x+=sx;}if(n<=dx){e+=dx;y+=sy;}}}
export function compose(layers){const out=blank();for(const p of layers)for(let k=0;k<p.length;k+=4)if(p[k+3])out.set(p.slice(k,k+4),k);return out;}
export function makeEffect(kind){const d=DEFINITIONS[kind];return d.durationsMs.map((durationMs,f)=>{
 const ground=blank(),back=blank(),front=blank();const last=d.durationsMs.length-1;
 if(f<last){
  const strength=kind==='stop'?1:0.72;
  paths.forEach((path,n)=>{const count=f===0?2:path.length;for(let j=1;j<count;j++){
   if(f>=last-2&&(n+j+f)%3===0)continue;
   const a=path[j-1],b=path[j];line(ground,[a[0],a[1]-2],[b[0],b[1]-2],f===0?COLORS.rim:COLORS.edge);line(ground,[a[0],a[1]-1],[b[0],b[1]-1],COLORS.rim);line(ground,a,b,COLORS.dark);line(ground,[a[0],a[1]+1],[b[0],b[1]+1],COLORS.dark);
  }});
  // Short broken compression pulse; no filled crater, dust, glow or flame.
  if(kind==='stop'&&f<3)for(let a=0;a<40;a++){if(a%5===0)continue;const angle=a*Math.PI/20,r=30+f*5;const x=48+Math.cos(angle)*r,y=55+Math.sin(angle)*r*.28;dot(ground,x,y,COLORS.rim);dot(ground,x,y+1,COLORS.dark);}
  chips.slice(0,d.maxChips).forEach(([vx,vy,x,y,size],n)=>{
   if(f===0&&n%2===1)return;if(f===last-1&&n%2===0)return;
   const t=f/(last-1),spread=(kind==='stop'?18:12)*t,up=Math.sin(Math.PI*t)*(kind==='stop'?18:11);
   const xx=Math.round(x+vx*spread),yy=Math.round(y+vy*spread*.5-up),p=vy>0?front:back;
   const sz=f===last-1?1:size+1;
   for(let j=0;j<sz;j++)for(let i=0;i<sz+1;i++)dot(p,xx+i,yy+j,COLORS.rock);
   line(p,[xx,yy+sz],[xx+sz,yy+sz],COLORS.shade);line(p,[xx,yy],[xx+Math.max(0,sz-1),yy],strength>0.9?COLORS.top:COLORS.rim);
   // A tiny ground shadow keeps airborne stones spatially readable.
   line(ground,[xx,Math.round(y+vy*spread*.5)+1],[xx+sz,Math.round(y+vy*spread*.5)+1],COLORS.shade);
  });
 }
 return {durationMs,ground,back,front,combined:compose([ground,back,front])};
});}
