(function(root){
 'use strict';
 class MageBlinkTimeline{
  constructor(data){this.data=data;this.mode='sequence';this.time=0;this.auto=true;this.leadMs=700;this.holdMs=900;}
  get period(){return this.leadMs+this.data.durationMs+this.holdMs;}
  reset(){this.time=0;}
  setMode(mode){if(!['sequence','compare','departure','arrival'].includes(mode))throw Error('Unknown Blink mode');this.mode=mode;this.reset();}
  trigger(){this.mode='sequence';this.time=this.leadMs;}
  advance(ms){if(!Number.isFinite(ms)||ms<0)throw Error('Invalid elapsed time');const limit=this.mode==='sequence'?this.period:this.data.durationMs+600;this.time=this.auto?(this.time+ms)%limit:Math.min(limit,this.time+ms);}
  seekFrame(index){this.time=(this.mode==='sequence'?this.leadMs:0)+Math.max(0,Math.min(7,Math.floor(index)))*this.data.frameMs;}
  snapshot(){const age=this.time-(this.mode==='sequence'?this.leadMs:0),active=age>=0&&age<this.data.durationMs;return{mode:this.mode,time:this.time,age,active,index:active?Math.min(7,Math.floor(age/this.data.frameMs)):null,phase:age<0?'ready':active?'blink':'settled',heroAt:this.mode==='sequence'&&age<0?'A':'B'};}
 }
 root.MageBlinkTimeline=MageBlinkTimeline;
})(globalThis);
