import type {MageDirection} from './MageHeroAnimation';
import type {Point} from '../utils/math';

type Mark=readonly [number,number];
// Native 256px marks at frames 0,4,8,12,16 of the accepted body animations.
// Fireball winds up/retracts differently from the regular pointing Lightning.
const marks:Record<'fireball'|'lightning',Record<MageDirection,readonly Mark[]>>={
  fireball:{
    south:[[174,140],[214,90],[209,92],[175,140],[174,140]],
    'south-east':[[106,139],[192,89],[192,89],[106,139],[106,139]],
    east:[[128,140],[142,82],[202,92],[128,140],[128,140]],
    'north-east':[[171,140],[171,85],[194,70],[198,70],[170,140]],
    north:[[86,139],[103,86],[104,59],[86,139],[86,139]],
    'north-west':[[94,141],[50,84],[40,95],[94,141],[94,141]],
    west:[[146,140],[133,80],[65,85],[131,133],[146,140]],
    'south-west':[[157,139],[86,98],[157,139],[157,139],[157,139]]
  },
  lightning:{
    south:[[174,140],[216,97],[216,97],[216,97],[174,140]],
    'south-east':[[163,140],[218,78],[218,78],[163,140],[163,140]],
    east:[[146,136],[213,77],[213,77],[146,136],[146,136]],
    'north-east':[[171,140],[180,70],[180,70],[180,70],[171,140]],
    north:[[86,139],[107,54],[108,45],[108,46],[86,139]],
    'north-west':[[94,141],[45,72],[45,72],[83,108],[94,141]],
    west:[[146,140],[40,83],[40,83],[146,139],[146,140]],
    'south-west':[[157,139],[84,87],[84,87],[157,139],[157,139]]
  }
};
export function mageNativeCastPalm(spell:'fireball'|'lightning',direction:MageDirection,frame:number):Point{
  const f=Math.max(0,Math.min(16,frame)),a=Math.min(3,Math.floor(f/4)),t=(f-a*4)/4;
  const from=marks[spell][direction][a]!,to=marks[spell][direction][a+1]!;
  return {x:from[0]+(to[0]-from[0])*t,y:from[1]+(to[1]-from[1])*t};
}
export const MAGE_PHANTOM_REST_PALMS:Record<MageDirection,Point>={
  south:{x:88,y:139},'south-east':{x:106,y:139},east:{x:128,y:139},'north-east':{x:171,y:140},
  north:{x:169,y:139},'north-west':{x:94,y:139},west:{x:146,y:140},'south-west':{x:157,y:139}
};
