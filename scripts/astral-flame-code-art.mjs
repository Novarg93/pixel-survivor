// Original coarse pixel art. Independently drawn, no AI input or recolouring.
export const FLAME_PALETTE=['#202f3b','#24494b','#31675f','#438e7c','#64b39a','#90cdb0','#c0dfc3','#506b70'];
const colors=FLAME_PALETTE.map(h=>h.match(/\w\w/g).map(n=>parseInt(n,16)));
function flame(frame,growth=1,opacity=1){
 const p=new Uint8Array(65536);if(growth<=0||opacity<=0)return p;
 const dot=(x,y,c,a=255)=>{x=Math.round(x);y=Math.round(52+(y-52)*growth);if(x<0||x>=64||y<0||y>=64)return;for(let j=0;j<2;j++)for(let i=0;i<2;i++)p.set([...colors[c],Math.round(a*opacity)],((y*2+j)*128+x*2+i)*4);};
 const poly=(v,c,a=255)=>{for(let y=0;y<64;y++)for(let x=0;x<64;x++){let inside=false;for(let i=0,j=v.length-1;i<v.length;j=i++){const [xi,yi]=v[i],[xj,yj]=v[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;}if(inside)dot(x,y,c,a);}};
 const line=(x,y,tx,ty,c,a=255)=>{const steps=Math.max(Math.abs(tx-x),Math.abs(ty-y));for(let i=0;i<=steps;i++)dot(x+(tx-x)*i/Math.max(1,steps),y+(ty-y)*i/Math.max(1,steps),c,a);};
 const s=[0,1,2,1,0,-1,-2,-1][frame%8],q=[0,-1,-1,0,1,1,0,-1][frame%8];
 poly([[12,51],[20,49],[44,49],[52,51],[48,53],[16,53]],1,100);
 // Each tongue rises from the same floor, leaving dark gaps above the roots.
 poly([[15,52],[13,46],[15,40],[20,36],[21,30+q],[18+s,25],[24+s,28],[26,34],[24,41],[26,46],[25,52]],1);
 poly([[17,52],[15,46],[17,41],[21,37],[23,32+q],[23+s,28],[25,34],[22,41],[24,46],[23,52]],3);
 poly([[27,52],[24,46],[26,38],[30,32],[29,23],[32+s,16],[31+s,10],[36+s,16],[37,24],[34,32],[36,39],[35,47],[38,52]],1);
 poly([[29,52],[27,46],[29,39],[33,33],[31,25],[33+s,18],[33+s,13],[35+s,18],[35,25],[32,33],[34,40],[33,47],[36,52]],3);
 poly([[39,52],[37,46],[40,39],[44,34],[44,28+q],[42-s,22],[48-s,26],[50,33],[47,40],[49,45],[47,52]],1);
 poly([[41,52],[39,46],[42,40],[46,35],[46,29+q],[45-s,25],[48,29],[48,34],[45,41],[47,46],[45,52]],3);
 line(19,45,22,39,4);line(22,39,23,35,5);line(29,45,32,39,4);line(32,39,31,34,5);line(32,28,34,23,4);line(34,23,34+s,18,5);line(42,46,45,40,4);line(45,40,46,37,5);
 line(28,50,29,47,5);line(43,50,43,48,6);line(19,50,20,47,5);return p;
}
export function astralFlameCodeClips(){return{
 spawn:{frames:[0,.08,.2,.4,.65,.9,1,1].map((g,i)=>flame(i,g)),durationsMs:[70,70,70,70,80,80,80,80],loop:false,pivot:[64,104],size:62},
 idle:{frames:Array.from({length:8},(_,i)=>flame(i)),durationsMs:Array(8).fill(100),loop:true,pivot:[64,104],size:62},
 vanish:{frames:[1,.95,.8,.6,.4,.22,.12,.05,0].map((g,i)=>flame(i,g,Math.max(0,1-i/8))),durationsMs:[60,60,60,70,70,70,70,70,70],loop:false,pivot:[64,104],size:62}
};}
