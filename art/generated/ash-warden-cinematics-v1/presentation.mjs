export function frameAt(durations,time){let end=0;for(let i=0;i<durations.length;i++){end+=durations[i];if(time<end)return i;}return durations.length-1;}
export function activeFrame(clip,time){return time<0||time>=clip.totalMs?-1:frameAt(clip.durationsMs,time);}
export function scenePose(meta,mode,time){if(mode==='spawn')return time<2300?{clip:'spawn',index:frameAt(meta.clips.spawn.durationsMs,time)}:{source:'art/generated/ash-warden-directional-melee-b-v1/south/idle/frames/00.png',index:0};
 if(mode==='shield'){if(time<300)return{source:'art/generated/ash-warden-magic-pack-v1/ritual-channel/frames/00.png',index:0};if(time<1340)return{clip:'shield-break',index:frameAt(meta.clips['shield-break'].durationsMs,time-300)};if(time<2600)return{clip:'stagger',index:0};if(time<3300)return{clip:'stagger-recover',index:frameAt(meta.clips['stagger-recover'].durationsMs,time-2600)};return{source:'art/generated/ash-warden-directional-melee-b-v1/south/idle/frames/00.png',index:0};}
 if(mode==='phase3')return time<600?{source:'art/generated/ash-warden-directional-melee-b-v1/south/idle/frames/00.png',index:0}:{clip:'transformation',index:frameAt(meta.clips.transformation.durationsMs,time-600)};
 return{clip:'death-a',index:frameAt(meta.clips['death-a'].durationsMs,time)};}
export class CinematicState{
 constructor(){this.phase3=false;this.dead=false;this.dispatched=new Set();this.log=[];}
 enterPhase3(){if(this.dead||this.phase3)return false;this.phase3=true;return true;}
 die(){if(this.dead)return false;this.dead=true;return true;}
 events(events,from,to,{playing=true,scrub=false}={}){if(!playing||scrub||to<from)return[];const fired=[];for(const e of events)if(e.timeMs>from&&e.timeMs<=to&&!this.dispatched.has(e.name)){this.dispatched.add(e.name);this.log.push(e.name);fired.push(e);}return fired;}
 overlayVisible(){return this.phase3&&!this.dead;}
}
