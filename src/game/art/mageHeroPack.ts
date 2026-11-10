import manifest from './mageHeroManifest.json';
import type {MageHeroPose} from './MageHeroAnimation';

interface HeroClip {motion:string;direction:string;frames:string[];fps:number;loop:boolean;sourceFiles:string[]}
export const MAGE_HERO=manifest;
export const MAGE_HERO_ORIGIN={x:manifest.pivot.x/manifest.canvas,y:manifest.pivot.y/manifest.canvas};
export const mageHeroTexture=(page:number)=>'mage-hero-v2-'+page;
export const mageHeroUrls=(page:number)=>({image:`assets/hd/mage-hero-v2/${page}.png`,data:`assets/hd/mage-hero-v2/${page}.json`});
const runPlan=manifest as typeof manifest&{runStops?:Record<string,string[]>;runResumes?:Record<string,number>};
const startClip=(manifest.clips as Record<string,HeroClip>)['run-start-south'];
export const MAGE_RUN_START_SECONDS=startClip?startClip.frames.length/startClip.fps:.16;
export function mageRunStopFrames(frame:string){const route=runPlan.runStops?.[frame];if(!route)throw Error('Missing Mage stop route '+frame);return route;}
export const mageRunStopSeconds=(frame:string)=>mageRunStopFrames(frame).length/30;
export function mageRunResumeAge(frame:string){const age=runPlan.runResumes?.[frame];if(age===undefined)throw Error('Missing Mage resume phase '+frame);return age;}
export function mageHeroFrame(pose:MageHeroPose){
  if(pose.motion==='run-stop'&&pose.stopFrame){const route=mageRunStopFrames(pose.stopFrame);return route[Math.min(route.length-1,Math.floor(Math.max(0,pose.age)*30+1e-7))]!;}
  const clip=(manifest.clips as Record<string,HeroClip>)[pose.motion+'-'+pose.direction];
  if(!clip)throw new Error('Missing Mage clip '+pose.motion+'-'+pose.direction);
  const frame=pose.progress===undefined?Math.floor(Math.max(0,pose.age)*clip.fps+1e-7):Math.min(clip.frames.length-1,Math.floor(Math.max(0,pose.progress)*clip.frames.length));
  return clip.frames[clip.loop?frame%clip.frames.length:Math.min(frame,clip.frames.length-1)]!;
}
export function mageHeroSelection(pose:MageHeroPose){
  const frame=mageHeroFrame(pose),page=(manifest.locations as Record<string,number>)[frame];
  if(page===undefined)throw new Error('Missing Mage atlas frame '+frame);
  return {frame,texture:mageHeroTexture(page)};
}
