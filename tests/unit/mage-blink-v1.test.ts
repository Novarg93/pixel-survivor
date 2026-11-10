import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {rgbaPng} from '../helpers/rgbaPng';
import {MOBILITY} from '../../src/game/config/encounters';

const root='art/generated/mage-blink-v1';
interface Rect{x:number;y:number;w:number;h:number}
interface Frame{index:number;rect:Rect;durationMs:number;pixelSha256:string;count:number;partial:number;edge:number;colors:number;bounds:{left:number;right:number;top:number;bottom:number}|null}
interface Clip{file:string;back:string;front:string;source:string;sourceJson:string;pack:string;frames:Frame[]}
interface Data{size:number;pivot:number[];frameMs:number;durationMs:number;productionIntegrated:boolean;game:{distance:number;instant:boolean;visualDurationMs:number};sources:Record<string,string>;clips:Record<string,Clip>;hero:{file:string;size:number;pivot:number[];frames:number;frameMs:number;displaySizeWorld:number;source:string;sourceSha256:string}}
const data=JSON.parse(readFileSync(root+'/animation.json','utf8')) as Data;
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
function crop(sheet:ReturnType<typeof rgbaPng>,r:Rect){return Buffer.concat(Array.from({length:r.h},(_,y)=>sheet.pixels.subarray(((r.y+y)*sheet.width+r.x)*4,((r.y+y)*sheet.width+r.x+r.w)*4)));}
interface State{mode:string;time:number;age:number;active:boolean;index:number|null;phase:string;heroAt:string}
interface Timeline{mode:string;time:number;auto:boolean;leadMs:number;period:number;setMode(mode:string):void;reset():void;trigger():void;advance(ms:number):void;seekFrame(index:number):void;snapshot():State}
function timeline(){const c:{MageBlinkTimeline?:new(data:Data)=>Timeline}={};runInNewContext(readFileSync(root+'/blink-timeline.js','utf8'),c);if(!c.MageBlinkTimeline)throw Error('Missing timeline');return new c.MageBlinkTimeline(data);}

it('preserves PixelLab originals and records the free exact-renderer provenance',()=>{
 expect(Object.keys(data.sources)).toHaveLength(23);
 for(const [file,digest]of Object.entries(data.sources))expect(hash(readFileSync(root+'/'+file)),file).toBe(digest);
 const p=JSON.parse(readFileSync(root+'/source/pixellab-provenance.json','utf8')) as {tool:string;chargedUSD:number;departure:{step:string};arrival:{step:string}};
 expect(p.tool).toBe('PixelLab vfx_workbench');expect(p.chargedUSD).toBe(0);expect(p.departure.step).not.toBe(p.arrival.step);
 expect(data.productionIntegrated).toBe(true);expect(data.game.instant).toBe(MOBILITY.mage.duration===0);expect(data.game.distance).toBe(MOBILITY.mage.distance);expect(data.durationMs).toBe(MOBILITY.visualDuration*1000);
});
it('retains every raw frame exactly, with binary alpha, transparent margins and one clean ending frame',()=>{
 for(const clip of Object.values(data.clips)){
  const source=rgbaPng(root+'/'+clip.source),packed=rgbaPng(root+'/'+clip.file),raw=JSON.parse(readFileSync(root+'/'+clip.sourceJson,'utf8')) as {frames:{frame:Rect;duration:number;pivot:{x:number;y:number};trimmed:boolean}[]};
  expect(raw.frames).toHaveLength(8);expect(clip.frames).toHaveLength(8);expect(clip.frames.reduce((n,f)=>n+f.durationMs,0)).toBe(320);
  for(const f of clip.frames){
   const pixels=crop(packed,f.rect),original=raw.frames[f.index]!;expect(pixels).toEqual(crop(source,original.frame));expect(hash(pixels)).toBe(f.pixelSha256);
   expect(original.pivot).toEqual({x:.5,y:.8125});expect(original.trimmed).toBe(false);expect(original.duration).toBe(40);
   const alpha=Array.from(pixels.filter((_,i)=>i%4===3));expect(alpha.every(a=>a===0||a===255)).toBe(true);expect(alpha.filter(a=>a>0)).toHaveLength(f.count);expect(f.partial).toBe(0);expect(f.edge).toBe(0);expect(f.colors).toBeLessThanOrEqual(8);
   for(let p=0;p<128;p++)for(const k of [(p*128)*4+3,(p*128+127)*4+3,p*4+3,(127*128+p)*4+3])expect(pixels[k]).toBe(0);
   expect(f.count>0).toBe(f.index<7);
  }
 }
});
it('reconstructs fixed-offset depth pieces without losing a pixel or moving the feet anchor',()=>{
 expect(data.pivot).toEqual([64,104]);
 for(const clip of Object.values(data.clips)){
  const whole=rgbaPng(root+'/'+clip.file),back=rgbaPng(root+'/'+clip.back),front=rgbaPng(root+'/'+clip.front);
  const combined=Buffer.from(back.pixels);for(let k=0;k<combined.length;k+=4)if(front.pixels[k+3])front.pixels.copy(combined,k,k,k+4);
  expect(combined).toEqual(whole.pixels);
  const pack=JSON.parse(readFileSync(root+'/'+clip.pack,'utf8')) as {anchor:{x:number;y:number};clips:{name:string;start_frame:number;frames:number;frame:{w:number;h:number};offset:{x:number;y:number};sheets:{file:string;columns:number}[]}[]};
  expect(pack.anchor).toMatchObject({x:64,y:104});
  for(const side of ['behind','front']){const p=pack.clips.find(c=>c.name===side)!;const source=rgbaPng(root+'/'+clip.pack.replace('manifest.json',p.sheets[0]!.file)),target=side==='behind'?back:front;
   for(let i=0;i<p.frames;i++){const rect={x:i%p.sheets[0]!.columns*p.frame.w,y:Math.floor(i/p.sheets[0]!.columns)*p.frame.h,...p.frame};const output=clip.frames[i+p.start_frame]!.rect;expect(crop(target,{x:output.x+64+p.offset.x,y:output.y+104+p.offset.y,...p.frame})).toEqual(crop(source,rect));}
  }
 }
});
it('uses the current Mage V2 pixels, timings and world proportions',()=>{
 const h=data.hero;expect(hash(readFileSync(h.source))).toBe(h.sourceSha256);expect(h.pivot).toEqual([46,84]);expect(h.frameMs).toBe(130);expect(h.displaySizeWorld).toBeCloseTo(46.35814889336016);
 const source=rgbaPng(h.source),prepared=rgbaPng(root+'/'+h.file);for(let i=0;i<13;i++){const r={x:i%4*96,y:Math.floor(i/4)*96,w:96,h:96};expect(crop(prepared,r)).toEqual(crop(source,r));}
});
it('keeps departure contracting and arrival opening with a shared short flash',()=>{
 const a=data.clips.departure!.frames,b=data.clips.arrival!.frames,width=(f:Frame)=>f.bounds?f.bounds.right-f.bounds.left+1:0;
 expect(width(a[0]!)).toBeGreaterThan(width(a[6]!)*2);expect(width(b[5]!)).toBeGreaterThan(width(b[0]!)*2);
 expect(a[7]!.count).toBe(0);expect(b[7]!.count).toBe(0);
});
it('moves the demo hero immediately at Blink activation, and holds B after both clips finish',()=>{
 const t=timeline();t.auto=false;t.advance(t.leadMs-.01);expect(t.snapshot()).toMatchObject({heroAt:'A',active:false,phase:'ready'});
 t.advance(.01);expect(t.snapshot()).toMatchObject({heroAt:'B',active:true,index:0,age:0});
 t.advance(279.99);expect(t.snapshot().index).toBe(6);t.advance(.01);expect(t.snapshot().index).toBe(7);t.advance(40);expect(t.snapshot()).toMatchObject({heroAt:'B',active:false,index:null,phase:'settled'});
 t.advance(10000);expect(t.time).toBe(t.period);expect(t.snapshot().heroAt).toBe('B');
});
it('seeks every frame exactly, resets modes and repeats without elapsed-time drift',()=>{
 const t=timeline();for(const mode of ['sequence','compare','departure','arrival']){t.setMode(mode);for(let i=0;i<8;i++){t.seekFrame(i);expect(t.snapshot()).toMatchObject({index:i,age:i*40,active:true});}t.seekFrame(999);expect(t.snapshot().index).toBe(7);t.seekFrame(-10);expect(t.snapshot().index).toBe(0);}
 t.setMode('sequence');t.advance(t.period*100+333);expect(t.time).toBe(333);t.trigger();expect(t.snapshot()).toMatchObject({mode:'sequence',age:0,index:0,heroAt:'B'});t.reset();expect(t.snapshot().heroAt).toBe('A');
 expect(()=>t.advance(-1)).toThrow();expect(()=>t.advance(Number.NaN)).toThrow();expect(()=>t.setMode('unknown')).toThrow();
});
