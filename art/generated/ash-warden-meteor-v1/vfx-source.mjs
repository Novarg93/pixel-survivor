export const SIZE=128,PIVOT=[64,96],SCALE=0.6548310811;
export const PALETTE={outline:[30,25,27,255],rock:[72,62,58,255],facet:[116,98,79,255],light:[173,145,103,255],ash:[109,108,99,255],darkAsh:[63,62,60,255],red:[132,47,32,255],orange:[226,98,40,255],hot:[255,185,78,255],core:[255,225,142,255]};
export const VARIANTS={a:{name:'Clean Compact',radius:36,rockRadius:11,chips:7,embers:4},b:{name:'Heavy Rock Impact',radius:45,rockRadius:17,chips:13,embers:3},c:{name:'Infernal Ash',radius:39,rockRadius:13,chips:8,embers:15}};
export const TIMINGS={telegraph:Array(6).fill(150),fall:Array(5).fill(60),impact:[30,30,40,40,50,60,70,80],aftermath:Array(4).fill(80)};
const empty=()=>new Uint8ClampedArray(SIZE*SIZE*4);
function dot(p,x,y,c){x=Math.round(x);y=Math.round(y);if(x>=0&&x<SIZE&&y>=0&&y<SIZE)p.set(c,(y*SIZE+x)*4);}
function line(p,a,b,c,width=1){let[x,y]=a.map(Math.round);b=b.map(Math.round);const dx=Math.abs(b[0]-x),sx=x<b[0]?1:-1,dy=-Math.abs(b[1]-y),sy=y<b[1]?1:-1;let e=dx+dy;for(;;){for(let j=0;j<width;j++)dot(p,x,y+j,c);if(x===b[0]&&y===b[1])break;const n=2*e;if(n>=dy){e+=dy;x+=sx;}if(n<=dx){e+=dx;y+=sy;}}}
function disc(p,cx,cy,rx,ry,c){for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)dot(p,x,y,c);}
function ring(p,r,y,kind,frame){for(let a=0;a<180;a++){if(kind==='b'&&a%15>11)continue;const t=a*Math.PI/90,x=64+Math.cos(t)*r,yy=y+Math.sin(t)*r*.46;dot(p,x,yy+1,PALETTE.outline);dot(p,x,yy,frame%2?PALETTE.hot:PALETTE.orange);if(kind==='c'&&a%12===0)line(p,[x,yy],[64+Math.cos(t)*(r-5),y+Math.sin(t)*(r-5)*.46],PALETTE.hot);}}
function fracture(p,kind,phase,color){const cfg=VARIANTS[kind];for(let n=0;n<(kind==='b'?9:6);n++){const t=n*6.283/(kind==='b'?9:6)+.31,r=cfg.radius*(.4+phase*.35),mid=[64+Math.cos(t)*r*.6,96+Math.sin(t)*r*.3],tip=[64+Math.cos(t)*r,96+Math.sin(t)*r*.48];line(p,[64,96],mid,color,2);line(p,mid,[tip[0]+(n%2?3:-3),tip[1]],color);}}
function rock(p,x,y,r,kind,seed=0){disc(p,x,y,r,r*.85,PALETTE.outline);disc(p,x,y-1,r-2,r*.72,PALETTE.rock);disc(p,x-r*.22,y-r*.22,r*.5,r*.32,PALETTE.facet);line(p,[x-r*.6,y-r*.2],[x+r*.3,y+r*.3],PALETTE.orange,kind==='c'?2:1);line(p,[x+r*.3,y+r*.3],[x+r*.1,y+r*.6],PALETTE.hot);if(kind==='b')line(p,[x-r*.5,y-r*.5],[x+r*.1,y-r*.65],PALETTE.light);if(seed%2===0)dot(p,x-r*.2,y-r*.1,PALETTE.core);}
export function generateVfx(kind,component){const cfg=VARIANTS[kind],durations=TIMINGS[component];return durations.map((durationMs,i)=>{const p=empty(),progress=i/(durations.length-1);
 if(component==='telegraph'){
  ring(p,cfg.radius,96,kind,i);ring(p,cfg.radius-3,96,'a',i+1);
  for(let n=0;n<4;n++){const a=n*Math.PI/2;line(p,[64+Math.cos(a)*(cfg.radius+2),96+Math.sin(a)*(cfg.radius+2)*.46],[64+Math.cos(a)*(cfg.radius+6),96+Math.sin(a)*(cfg.radius+6)*.46],PALETTE.hot,2);}
  if(kind==='c')fracture(p,kind,progress*.6,progress>.5?PALETTE.orange:PALETTE.red);
  if(kind==='b')for(let n=0;n<8;n++){const a=n*Math.PI/4;disc(p,64+Math.cos(a)*(cfg.radius-7),96+Math.sin(a)*(cfg.radius-7)*.46,2,1,PALETTE.facet);}
  // A tightening inner arc signals urgency without changing the warning boundary.
  if(i>2)ring(p,Math.max(5,cfg.radius*(1-progress*.8)),96,'a',i);
 }else if(component==='fall'){
  const r=cfg.rockRadius,cy=89;
  for(let n=0;n<(kind==='c'?5:3);n++){const x=64+(n-1)*4,y=cy-r-5-(n%3)*7-(i%2)*2;line(p,[x-3,y],[x+2,cy-r+4],n%2?PALETTE.red:PALETTE.orange,2);}
  if(kind==='c')for(let n=0;n<9;n++)dot(p,51+(n*11+i*3)%27,38+(n*7+i*4)%35,n%2?PALETTE.ash:PALETTE.hot);
  rock(p,64,cy,r,kind,i);
 }else if(component==='impact'&&i<durations.length-1){
  const radius=cfg.radius*(.25+Math.min(1,progress*2)*.65);
  if(i<3){disc(p,64,94,radius*.65,radius*.3,PALETTE.red);disc(p,64,92,radius*.4,radius*.28,i===0?PALETTE.core:PALETTE.hot);}
  if(i<5)ring(p,radius,96,kind,i);
  fracture(p,kind,progress,i<3?PALETTE.orange:PALETTE.outline);
  for(let n=0;n<cfg.chips;n++){const a=n*2.399,r=(8+progress*cfg.radius),x=64+Math.cos(a)*r,y=94+Math.sin(a)*r*.4-Math.sin(progress*Math.PI)*(kind==='b'?26:17),size=kind==='b'?3+n%3:2+n%2;rock(p,x,y,size,kind,n);}
  for(let n=0;n<cfg.embers;n++){const a=n*2.12+1,r=12+progress*cfg.radius;dot(p,64+Math.cos(a)*r,91+Math.sin(a)*r*.4-progress*20,kind==='c'&&n%3===0?PALETTE.ash:PALETTE.hot);}
  if(kind==='c'&&i<6)for(let n=0;n<8;n++){const a=n*2.4,r=10+progress*27,x=64+Math.cos(a)*r,y=86+Math.sin(a)*r*.4-progress*20;disc(p,x,y,3,2,PALETTE.darkAsh);line(p,[x-1,y-1],[x+1,y-1],PALETTE.ash);}
 }else if(component==='aftermath'&&i<durations.length-1){
  fracture(p,kind,.6,i===0?PALETTE.red:PALETTE.outline);
  if(kind==='c')for(let n=0;n<9-i*2;n++)dot(p,45+n*5,91+(n%3)*3,i===0?PALETTE.orange:PALETTE.red);
  if(kind==='b')for(let n=0;n<5-i;n++)disc(p,46+n*9,94+n%2*6,2,1,PALETTE.darkAsh);
 }
 return {pixels:p,durationMs};});}
