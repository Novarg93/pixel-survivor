/* global document, Path2D, createImageBitmap, fetch */
// Original Lantern Weaver gesture studies, in the same 4x indigo/ivory/copper
// material language as mage-art-source.mjs. Body/feet are drawn by that source.
export async function drawMageCastingAtlas({ layout, body }) {
  const atlas = document.createElement('canvas'); atlas.width = layout.width; atlas.height = layout.height;
  const out = atlas.getContext('2d'); out.drawImage(await createImageBitmap(await (await fetch(body)).blob()), 0, 0);
  for (const entry of layout.frames) {
    if (entry.layer !== 'arms') continue;
    const c = document.createElement('canvas'); c.width = 64; c.height = 80; const g = c.getContext('2d', { willReadFrequently:true }); g.scale(4,4);
    const path = (p, fill, stroke = '#202432', width = .28) => { const shape = new Path2D(p); g.fillStyle = fill; g.fill(shape); if (width) { g.strokeStyle = stroke; g.lineWidth = width; g.lineJoin = 'round'; g.stroke(shape); } };
    const line = (p, color, width=.22) => { g.strokeStyle=color; g.lineWidth=width; g.stroke(new Path2D(p)); };
    const f=entry.index, [lx,ly,rx,ry]=entry.hands, color='#'+entry.color.toString(16).padStart(6,'0');
    const cloth=g.createLinearGradient(3,3,13,17); cloth.addColorStop(0,'#a6b3b9');cloth.addColorStop(.4,'#627e90');cloth.addColorStop(1,'#303347');
    // A foreshortened copper focus tilts into the available frame as the palm
    // rises. Its whole silhouette is authored, never clipped to atlas borders.
    const staffHand=entry.direction==='left'?{x:lx,y:ly}:{x:rx,y:ry};
    let shaft;
    const angles=Array.from({length:125},(_,i)=>(i-62)*.025).sort((a,b)=>Math.abs(a)-Math.abs(b));
    for(const angle of angles){ const tip={x:staffHand.x+Math.sin(angle)*7.2,y:staffHand.y-Math.cos(angle)*7.2}, butt={x:staffHand.x-Math.sin(angle)*2.4,y:staffHand.y+Math.cos(angle)*2.4};
      if(tip.x>=1.2&&tip.x<=14.8&&tip.y>=1.3&&tip.y<=17.7&&butt.x>=.6&&butt.x<=15.4&&butt.y>=.6&&butt.y<=18.8){shaft={tip,butt};break;} }
    if(!shaft)throw new Error('Unbounded staff pose '+entry.name);
    const {tip,butt}=shaft;
    line(`M${tip.x} ${tip.y} L${butt.x} ${butt.y}`,'#272735',.66);line(`M${tip.x-.12} ${tip.y} L${butt.x-.12} ${butt.y}`,'#b88d66',.32);
    path(`M${tip.x-.65} ${tip.y-.6} L${tip.x} ${tip.y-.95} L${tip.x+.65} ${tip.y-.55} L${tip.x+.6} ${tip.y+.65} L${tip.x} ${tip.y+1} L${tip.x-.65} ${tip.y+.55}Z`,'#a67c55');
    path(`M${tip.x-.28} ${tip.y-.35} L${tip.x+.29} ${tip.y-.35} L${tip.x+.3} ${tip.y+.4} L${tip.x-.3} ${tip.y+.4}Z`,f>=1&&f<=4?color:'#d9f7e5','#77bebd',.12);
    for(const [side,x,y] of [[-1,lx,ly],[1,rx,ry]]){
      const sx=side<0?5.2:9.5, sy=10.2, ex=(sx+x)*.5+side*.5, ey=(sy+y)*.5+.35;
      path(`M${sx-.65} ${sy-.4} L${sx+.75} ${sy-.25} L${ex+.6} ${ey} L${x+.45} ${y-.3} L${x+.48} ${y+.7} L${ex-.55} ${ey+1} L${sx-.6} ${sy+.8}Z`,cloth);
      line(`M${sx-.25} ${sy-.1} L${ex-.3} ${ey+.15} L${x-.25} ${y+.2}`,'#c2c8ce',.18);
      path(`M${x-.55} ${y-.35} L${x+.5} ${y-.45} L${x+.65} ${y+.35} L${x+.1} ${y+.75} L${x-.6} ${y+.4}Z`,'#e8d4ad','#8d6d64',.18);
      line(`M${x-.3} ${y-.13} L${x+.3} ${y-.2}`,'#fff0cb',.2);
      if(f>=1&&f<=4){path(`M${x-.25} ${y-.2} L${x+.2} ${y-.25} L${x+.25} ${y+.17} L${x-.2} ${y+.23}Z`,color,color,.1);}
    }
    const data=g.getImageData(0,0,64,80);
    for(let i=0;i<data.data.length;i+=4){data.data[i+3]=data.data[i+3]<128?0:255;if(data.data[i+3])for(let k=0;k<3;k++)data.data[i+k]=Math.min(255,Math.round(data.data[i+k]/8)*8);}
    g.putImageData(data,0,0);out.drawImage(c,entry.frame.x,entry.frame.y);
  }
  return atlas.toDataURL('image/png');
}
