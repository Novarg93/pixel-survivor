import type { MageSpell } from './MageCastingController';
export type CastDirection = 'down' | 'up' | 'left' | 'right';
type Hands = readonly [number, number, number, number];
export const CAST_COLORS: Record<MageSpell, number> = { fireball:0xffc880, frost:0xdef7ff, lightning:0xd7d9ff, meteor:0xffd28b, shield:0xd1baff };
const POSES: Record<MageSpell, readonly Hands[]> = {
  fireball:[[4.9,11.7,10.9,9.3],[5.1,10.7,11.5,7.2],[6,10.2,14.3,8.9],[6.2,11,14.5,9.8],[5.3,11.8,12.2,11],[4.6,12.5,10.9,12.1]],
  frost:[[4,10.5,11.1,9.7],[2.3,7.5,12.7,7.1],[1.5,8.1,14,7.7],[3.1,5.8,13.7,9.1],[6.1,8.4,14.5,10.7],[4.6,12.2,10.9,12.1]],
  lightning:[[5,11.1,11,8.9],[4.8,9.4,12,7.2],[5.6,8.3,14.1,8.1],[7.1,9.6,14.5,9.8],[5.8,10.7,12.5,11],[4.6,12.3,10.9,12.1]],
  meteor:[[4.8,8.8,10.8,8.1],[4,5.6,11.5,4.8],[2.8,3.1,12,2.7],[5,7,14,7.5],[3.1,7.6,11,6.6],[4.6,11.8,10.9,12.1]],
  shield:[[4.9,11.4,10.4,9.1],[5.7,10.8,8.7,7.8],[5.5,8.8,7.8,9.6],[6,10.1,9,10],[5.2,11.2,10.1,11],[4.6,12.3,10.9,12.1]],
};
// Shared authoring/runtime coordinates keep the palm effects on the drawn hands.
export function castingHands(spell: MageSpell, rank: number, direction: CastDirection, frame: number): Hands {
  const f=Math.max(0,Math.min(5,frame)), strong=rank>=4&&(spell==='fireball'||spell==='lightning');
  let [lx,ly,rx,ry]=POSES[spell][f];
  if(strong&&f>=1&&f<=4){lx-=.5;ly-=1.2;ry-=.5;}
  if(direction==='up'){
    if(spell==='fireball'||spell==='lightning'){rx=[10.4,10.8,10.1,10.5,10.6,10.9][f];ry=[8.8,5.6,3.8,4.8,8.8,12.1][f];ly-=f>0&&f<5?1:0;if(strong&&f>=1&&f<=4){lx=5.4;ly=4.3+f%2;}}
    if((spell==='frost'||spell==='meteor')&&f===3){lx=5.4;ly=4.2;rx=10.7;ry=6.2;}
    if((spell==='frost'||spell==='meteor')&&f===4){lx=5;ly=7;rx=10.2;ry=3.8;}
    if(spell==='shield'&&f>0&&f<5){ly-=1.5;ry-=1.7;}
  }else if(direction==='down'){
    if(spell==='fireball'||spell==='lightning'){rx=[10.7,11.1,11.4,11.2,11,10.9][f];ry=[9.1,10.2,14,14.6,13,12.1][f];if(strong&&f>=1&&f<=4){lx=5.7;ly=12.8+f%2;}}
    if((spell==='frost'||spell==='meteor')&&f===3){lx=5.2;ly=11;rx=11.6;ry=14;}
    if((spell==='frost'||spell==='meteor')&&f===4){lx=5;ly=14.1;rx=10.8;ry=11.1;}
  }else if(direction==='left'){const x=lx,y=ly;lx=16-rx;ly=ry;rx=16-x;ry=y;}
  return [lx,ly,rx,ry];
}
