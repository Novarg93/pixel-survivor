import { distance,segmentDistance,type Point } from '../utils/math';
export type FinalDanger = {at:number;duration:number} & (
  {kind:'circle';center:Point;radius:number} |
  {kind:'sector';center:Point;aim:Point;radius:number;angle:number} |
  {kind:'strip';from:Point;to:Point;radius:number});
export function dangerContains(p:Point,d:FinalDanger,padding=9){
  if(d.kind==='circle')return distance(p,d.center)<=d.radius+padding;
  if(d.kind==='strip')return segmentDistance(p,d.from,d.to)<=d.radius+padding;
  const dx=p.x-d.center.x,dy=p.y-d.center.y,r=Math.hypot(dx,dy);
  return r<=d.radius+padding&&(r<=padding||(dx*d.aim.x+dy*d.aim.y)/r>=Math.cos(d.angle/2+Math.asin(Math.min(1,padding/r))));
}
/** Bounded straight walking routes, sampled throughout each impact window. No Blink assumption. */
export function findFinalEscape(start:Point,speed:number,hazards:FinalDanger[],clamp:(p:Point)=>Point):Point|null{
  const horizon=Math.max(.1,...hazards.map(d=>d.at+d.duration));
  for(const fraction of [0,.55,.8,1])for(let i=0;i<(fraction?32:1);i++){
    const angle=i*Math.PI/16,v={x:Math.cos(angle)*speed*fraction,y:Math.sin(angle)*speed*fraction};let safe=true;
    for(const d of hazards){
      for(let time=Math.max(0,d.at);time<=d.at+d.duration+.025;time+=.025){
        if(dangerContains(clamp({x:start.x+v.x*time,y:start.y+v.y*time}),d,15)){safe=false;break;}
      }if(!safe)break;
    }
    if(safe)return clamp({x:start.x+v.x*horizon,y:start.y+v.y*horizon});
  }return null;
}
