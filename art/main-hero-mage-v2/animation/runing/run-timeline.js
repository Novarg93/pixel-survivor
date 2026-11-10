(()=>{
class RunTimeline{
 constructor(data){this.data=data;this.mode='sequence';this.auto=true;this.held=false;this.reset();}
 reset(){this.stage=this.mode==='sequence'?(this.held?'start':'idle'):this.mode;this.index=0;this.frameAge=0;this.runAge=0;this.loops=0;this.travel=0;this.stopping=false;}
 setMode(mode){if(mode!=='sequence'&&!this.data.clips[mode])throw Error('Unknown clip '+mode);this.mode=mode;this.held=false;this.reset();}
 setAuto(value){this.auto=value;this.held=false;this.reset();}
 setRunning(value){const previousMode=this.mode;this.mode='sequence';this.auto=false;this.held=value;this.stopping=!value;if(previousMode!=='sequence')this.enter('idle');if(value&&this.stage==='idle')this.enter('start');}
 enter(stage,index=0){this.stage=stage;this.index=index;this.frameAge=0;if(stage==='start'){this.runAge=0;this.loops=0;this.stopping=false;}}
 get clip(){return this.data.clips[this.stage==='idle'?'start':this.stage];}
 get frame(){return this.clip.frames[this.index];}
 get duration(){return this.stage==='idle'?(this.auto?this.data.idleMs:Infinity):this.clip.frameMs;}
 seek(stage,index){if(!this.data.clips[stage])throw Error('Unknown clip');this.mode=stage;this.enter(stage,Math.max(0,Math.min(this.data.clips[stage].frames.length-1,index)));}
 next(){
  if(this.mode!=='sequence'){this.index=(this.index+1)%this.clip.frames.length;return;}
  if(this.stage==='idle'){if(this.auto||this.held)this.enter('start');return;}
  if(this.stage==='start'){
   if(++this.index===this.clip.frames.length)this.enter('loop',this.data.clips.loop.frames.findIndex(f=>f.sourceFrame===this.data.loopEntry));return;
  }
  if(this.stage==='loop'){
   if((this.stopping||!this.auto&&!this.held)&&this.frame.sourceFrame===this.data.stopAfter){this.enter('stop');return;}
   this.index=(this.index+1)%this.clip.frames.length;if(!this.index)this.loops++;return;
  }
  if(++this.index===this.clip.frames.length){this.enter('idle');if(this.held)this.enter('start');}
 }
 advance(ms){
  if(!Number.isFinite(ms)||ms<0)throw Error('Invalid elapsed time');
  while(ms>0){
   const dt=Math.min(ms,this.duration-this.frameAge);
   const speed=this.stage==='loop'?1:this.stage==='start'?(this.index+1)/this.clip.frames.length:this.stage==='stop'?1-(this.index+1)/this.clip.frames.length:0;
   this.travel+=dt/1000*110*speed;
   if(this.stage==='loop'){this.runAge+=dt;if(this.auto&&this.runAge>=this.data.runMs)this.stopping=true;}
   this.frameAge+=dt;ms-=dt;
   if(this.frameAge>=this.duration){this.frameAge=0;this.next();}
  }
 }
 snapshot(){return{mode:this.mode,stage:this.stage,index:this.index,sourceFrame:this.frame.sourceFrame,frameAge:this.frameAge,runAge:this.runAge,loops:this.loops,travel:this.travel,stopping:this.stopping,auto:this.auto,held:this.held};}
}
globalThis.MageRunTimeline=RunTimeline;
})();
