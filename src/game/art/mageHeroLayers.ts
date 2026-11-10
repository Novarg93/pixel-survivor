import waists from './mageHeroWaists.json';
import {MAGE_HERO,mageHeroSelection} from './mageHeroPack';
import type {MageHeroPose} from './MageHeroAnimation';

export function mageMovingLayers(pose:MageHeroPose){
  if(!pose.casting||!pose.locomotion||pose.phantom||pose.castVariant!==undefined)return undefined;
  const lower=mageHeroSelection({...pose.locomotion,casting:false}),upper=mageHeroSelection(pose);
  const anchors=waists.frames as Record<string,{x:number;y:number}>,a=anchors[lower.frame],b=anchors[upper.frame];
  if(!a||!b)throw new Error('Missing Mage waist registration');
  const size=MAGE_HERO.canvas;
  return {lower,upper,lowerWaist:a,upperWaist:b,offset:{x:a.x-b.x,y:a.y-b.y},
    lowerCrop:{x:0,y:a.y,width:size,height:size-a.y},upperCrop:{x:0,y:0,width:size,height:b.y+1}};
}
