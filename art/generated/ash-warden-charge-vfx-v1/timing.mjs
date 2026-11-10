export function frameAt(durations,time){if(time<0)return -1;let end=0;for(let i=0;i<durations.length;i++){end+=durations[i];if(time<end)return i;}return -1;}
export function effectAt(effect,eventMs,time){return frameAt(effect.durationsMs,time-eventMs);}
export function travelDistance(time,startMs,stopMs,distance=60){return Math.max(0,Math.min(1,(time-startMs)/(stopMs-startMs)))*distance;}
export function crossings(previous,time,events){return events.filter(e=>e.timeMs>previous&&e.timeMs<=time);}
