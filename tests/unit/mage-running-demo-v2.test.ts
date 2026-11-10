import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {rgbaPng} from '../helpers/rgbaPng';

const root='art/main-hero-mage-v2/animation/runing';
interface Frame{sourceFrame:number;rect:{x:number;y:number;w:number;h:number};pixelSha256:string}
interface Clip{file:string;source:string;frames:Frame[];frameMs:number;periodMs:number}
interface Data{sources:Record<string,string>;clips:Record<string,Clip>;runMs:number}
const data=JSON.parse(readFileSync(root+'/animation.json','utf8')) as Data;
const north=JSON.parse(readFileSync(root+'/north/animation.json','utf8')) as Data;
const northEast=JSON.parse(readFileSync(root+'/north-east/animation.json','utf8')) as Data;
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
interface State{stage:string;index:number;sourceFrame:number;frameAge:number;runAge:number;loops:number;travel:number;stopping:boolean}
interface Timeline{
 stage:string;index:number;frame:Frame;mode:string;auto:boolean;held:boolean;
 advance(ms:number):void;setRunning(value:boolean):void;setMode(mode:string):void;
 seek(mode:string,index:number):void;reset():void;snapshot():State;
}
function timeline(input=data){
 const context:{MageRunTimeline?:new(data:Data)=>Timeline}={};
 runInNewContext(readFileSync(root+'/run-timeline.js','utf8'),context);
 if(!context.MageRunTimeline)throw Error('Timeline did not initialize');
 return new context.MageRunTimeline(input);
}
function framePixels(sheet:ReturnType<typeof rgbaPng>,r:{x:number;y:number;w:number;h:number}){
 return Buffer.concat(Array.from({length:r.h},(_,y)=>sheet.pixels.subarray(((r.y+y)*sheet.width+r.x)*4,((r.y+y)*sheet.width+r.x+r.w)*4)));
}
it('preserves all source files and the exact RGBA pixels of every selected frame',()=>{
 for(const [file,sha]of Object.entries(data.sources))expect(hash(readFileSync(root+'/'+file))).toBe(sha);
 for(const clip of Object.values(data.clips)){
  const atlas=rgbaPng(root+'/'+clip.file),source=rgbaPng(root+'/'+clip.source);
  expect(clip.periodMs).toBe(clip.frameMs*clip.frames.length);
  for(const f of clip.frames){const packed=framePixels(atlas,f.rect),i=f.sourceFrame-1;
   const original=framePixels(source,{x:i%4*96,y:Math.floor(i/4)*96,w:96,h:96});
   expect(packed.equals(original)).toBe(true);expect(hash(packed)).toBe(f.pixelSha256);
  }
 }
});
it('keeps the eight user-selected running poses and a seam within the authored transition range',()=>{
 expect(data.clips.loop.frames.map(f=>f.sourceFrame)).toEqual([4,5,6,7,8,9,10,11]);
 expect(data.clips.stop.frames.map(f=>f.sourceFrame)).toEqual([4,5,6,7,8,9,10,11,12,13]);
 const atlas=rgbaPng(root+'/'+data.clips.loop.file),pixels=data.clips.loop.frames.map(f=>framePixels(atlas,f.rect));
 const distance=(a:Buffer,b:Buffer)=>a.reduce((n,v,k)=>n+Math.abs(v-b[k]!),0);
 const seam=distance(pixels.at(-1)!,pixels[0]!);
 expect(seam).toBeLessThan(Math.max(...pixels.slice(1).map((p,i)=>distance(pixels[i]!,p))));
});
it('joins start to loop frame11 and stops at the compatible step before frame4 of stop',()=>{
 const t=timeline();t.setRunning(true);t.advance(1300);expect(t.stage).toBe('loop');expect(t.frame.sourceFrame).toBe(11);
 t.advance(5*720);expect(t.stage).toBe('loop');expect(t.frame.sourceFrame).toBe(11);
 t.setRunning(false);t.advance(90*2);expect(t.stage).toBe('loop');expect(t.frame.sourceFrame).toBe(5);
 t.advance(90);expect(t.stage).toBe('stop');expect(t.frame.sourceFrame).toBe(4);
 t.advance(1000);expect(t.stage).toBe('idle');t.advance(100000);expect(t.stage).toBe('idle');
});
it('automatically shows all three phases, then repeats from idle',()=>{
 const t=timeline(),phases:string[]=[];
 for(let ms=0;ms<13000;ms+=10){t.advance(10);if(phases.at(-1)!==t.stage)phases.push(t.stage);}
 expect(phases.slice(0,9)).toEqual(['idle','start','loop','stop','idle','start','loop','stop','idle']);
});
it('keeps clocks and transitions stable under different frame rates',()=>{
 const a=timeline(),b=timeline();a.advance(16000);for(let i=0;i<1600;i++)b.advance(10);
 expect(b.snapshot()).toMatchObject({...a.snapshot(),travel:expect.closeTo(a.snapshot().travel,8)});
 expect(()=>a.advance(-1)).toThrow('Invalid');expect(()=>a.advance(Infinity)).toThrow('Invalid');
});
it('handles early release, restart while running and switching out of source inspection',()=>{
 const t=timeline();t.setRunning(true);t.advance(200);t.setRunning(false);t.advance(2100);expect(t.stage).toBe('stop');
 t.setRunning(true);t.advance(2000);expect(t.stage).toBe('loop');t.reset();expect(t.stage).toBe('start');
 t.seek('raw-loop',99);expect(t.index).toBe(12);t.setRunning(true);expect(t.stage).toBe('start');expect(t.index).toBe(0);
 t.setMode('loop');t.advance(720*100);expect(t.frame.sourceFrame).toBe(4);expect(t.stage).toBe('loop');
 expect(()=>t.setMode('missing')).toThrow('Unknown');
});
it('splits the north sheet into contiguous start1-3, loop4-9 and end10-13 without editing pixels',()=>{
 expect(north.clips.start.frames.map(f=>f.sourceFrame)).toEqual([1,2,3]);
 expect(north.clips.loop.frames.map(f=>f.sourceFrame)).toEqual([4,5,6,7,8,9]);
 expect(north.clips.stop.frames.map(f=>f.sourceFrame)).toEqual([10,11,12,13]);
 expect(north.clips.loop.periodMs).toBe(540);
 for(const [file,sha]of Object.entries(north.sources))expect(hash(readFileSync(root+'/'+file))).toBe(sha);
 for(const clip of Object.values(north.clips)){
  const atlas=rgbaPng(root+'/'+clip.file),source=rgbaPng(root+'/'+clip.source);
  for(const f of clip.frames){const i=f.sourceFrame-1,pixels=framePixels(atlas,f.rect);
   expect(pixels.equals(framePixels(source,{x:i%4*96,y:Math.floor(i/4)*96,w:96,h:96}))).toBe(true);
   expect(hash(pixels)).toBe(f.pixelSha256);
  }
 }
});
it('repeats the six north poses and exits through the original 9→10 transition',()=>{
 const t=timeline(north);t.setRunning(true);t.advance(300);
 expect(t.stage).toBe('loop');expect(t.frame.sourceFrame).toBe(4);
 t.advance(540*20);expect(t.frame.sourceFrame).toBe(4);
 t.setRunning(false);t.advance(450);expect(t.frame.sourceFrame).toBe(9);expect(t.stage).toBe('loop');
 t.advance(90);expect(t.frame.sourceFrame).toBe(10);expect(t.stage).toBe('stop');
 t.advance(400);expect(t.stage).toBe('idle');t.advance(10000);expect(t.stage).toBe('idle');
});
it('preserves all13 north source poses when stopping immediately and maintains deterministic timing',()=>{
 const t=timeline(north);t.setRunning(true);t.setRunning(false);const poses=[t.frame.sourceFrame];
 for(let i=0;i<123;i++){t.advance(10);if(poses.at(-1)!==t.frame.sourceFrame)poses.push(t.frame.sourceFrame);}
 expect(poses).toEqual(Array.from({length:13},(_,i)=>i+1));t.advance(10);expect(t.stage).toBe('idle');
 const a=timeline(north),b=timeline(north);a.advance(15000);for(let i=0;i<1500;i++)b.advance(10);
 expect(b.snapshot()).toMatchObject({...a.snapshot(),travel:expect.closeTo(a.snapshot().travel,8)});
});
it('extracts north-east start/end from their sheet and a lossless six-frame cycle from the other sheet',()=>{
 expect(northEast.clips.start.frames.map(f=>f.sourceFrame)).toEqual([1,2,3,4,5]);
 expect(northEast.clips.stop.frames.map(f=>f.sourceFrame)).toEqual([10,11,12,13]);
 expect(northEast.clips.loop.frames.map(f=>f.sourceFrame)).toEqual([5,6,7,8,9,10]);
 expect(northEast.clips.start.source).toBe('north-east/run-start-end.png');
 expect(northEast.clips.stop.source).toBe(northEast.clips.start.source);
 expect(northEast.clips.loop.source).toBe('north-east/run-loop.png');
 expect(northEast.clips.loop.periodMs).toBe(540);
 for(const [file,sha]of Object.entries(northEast.sources))expect(hash(readFileSync(root+'/'+file))).toBe(sha);
 for(const clip of Object.values(northEast.clips)){
  const atlas=rgbaPng(root+'/'+clip.file),source=rgbaPng(root+'/'+clip.source);
  for(const f of clip.frames){const i=f.sourceFrame-1,pixels=framePixels(atlas,f.rect);
   expect(pixels.equals(framePixels(source,{x:i%4*96,y:Math.floor(i/4)*96,w:96,h:96}))).toBe(true);
   expect(hash(pixels)).toBe(f.pixelSha256);
  }
 }
});
it('joins north-east start to loop10 and waits for loop7 before the end10 pose',()=>{
 const t=timeline(northEast);t.setRunning(true);t.advance(500);expect(t.stage).toBe('loop');expect(t.frame.sourceFrame).toBe(10);
 t.advance(540*20);expect(t.stage).toBe('loop');expect(t.frame.sourceFrame).toBe(10);
 t.setRunning(false);t.advance(270);expect(t.frame.sourceFrame).toBe(7);expect(t.stage).toBe('loop');
 t.advance(90);expect(t.stage).toBe('stop');expect(t.frame.sourceFrame).toBe(10);
 t.advance(400);expect(t.stage).toBe('idle');t.advance(10000);expect(t.stage).toBe('idle');
});
it('keeps north-east early-stop, source inspection and frame-rate-independent clocks consistent',()=>{
 const t=timeline(northEast);t.setRunning(true);t.advance(200);t.setRunning(false);t.advance(1060);expect(t.stage).toBe('idle');
 t.seek('raw-start-end',12);expect(t.frame.sourceFrame).toBe(13);t.setRunning(true);expect(t.stage).toBe('start');expect(t.index).toBe(0);
 const a=timeline(northEast),b=timeline(northEast);a.advance(15000);for(let i=0;i<1500;i++)b.advance(10);
 expect(b.snapshot()).toMatchObject({...a.snapshot(),travel:expect.closeTo(a.snapshot().travel,8)});
});
