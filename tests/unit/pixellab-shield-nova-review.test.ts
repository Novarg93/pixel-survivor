import {expect,it} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {rgbaPng} from '../helpers/rgbaPng';
const root='art/generated/mage-shield-nova-pixellab-v1';
interface Clip{model:string;sheet:string;gif:string;frameCount:number;loop:boolean;playbackIndices:number[];durationsMs:number[];frames:{file:string;sha256:string;pixelSHA256:string;visible:number;center:number;edge:number}[]}
const m=JSON.parse(readFileSync(root+'/manifest.json','utf8')) as {runtimeIntegration:boolean;ultimateChanged:boolean;provider:string;chargedGenerations:number;jobs:{tool:string;jobId:string}[];clips:Record<string,Clip>};
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
it('records genuine PixelLab model and animation jobs for ordinary abilities, retaining the first Nova candidate',()=>{
 expect(m.runtimeIntegration).toBe(true);expect(m.ultimateChanged).toBe(false);expect(m.provider).toBe('PixelLab AI');expect(m.jobs).toHaveLength(6);expect(m.chargedGenerations).toBe(18);
 expect(m.jobs.filter(j=>j.tool==='create_image_pro_flash')).toHaveLength(2);expect(m.jobs.filter(j=>j.tool==='animate_image_pixminimax')).toHaveLength(4);
 for(const j of m.jobs)expect(j.jobId).toMatch(/^[a-f\d-]{36}$/);
});
it('preserves every RGBA pixel of all 35 selected AI frames, with fixed native canvas',()=>{
 let total=0;
 for(const c of Object.values(m.clips)){
  const sheet=rgbaPng(root+'/'+c.sheet);expect([sheet.width,sheet.height]).toEqual([128*c.frameCount,128]);
  for(const [i,f]of c.frames.entries()){
   const bytes=readFileSync(root+'/'+f.file),original=rgbaPng(root+'/'+f.file),packed=Buffer.alloc(128*128*4);
   expect(hash(bytes)).toBe(f.sha256);expect(hash(original.pixels)).toBe(f.pixelSHA256);
   for(let y=0;y<128;y++)sheet.pixels.copy(packed,y*512,(y*sheet.width+i*128)*4,(y*sheet.width+(i+1)*128)*4);
   expect(packed.equals(original.pixels),f.file).toBe(true);total++;
  }
  const input=rgbaPng(root+'/'+c.frames[0]!.file),model=rgbaPng(`${root}/raw/${c.model}/00.png`);
  for(let k=0;k<model.pixels.length;k+=4)if(model.pixels[k+3]!==input.pixels[k+3]||(model.pixels[k+3]&&model.pixels.subarray(k,k+4).some((v,n)=>v!==input.pixels[k+n])))throw Error('Input appearance changed');
 }
 expect(total).toBe(35);
});
it('leaves the shield centre open, keeps selected animations inside their canvas and fades fully',()=>{
 for(const c of Object.values(m.clips))for(const f of c.frames)expect(f.edge,f.file).toBe(0);
 for(const id of ['arcane-shield-loop','arcane-shield-fade'])for(const f of m.clips[id]!.frames)expect(f.center).toBe(0);
 expect(m.clips['arcane-shield-fade']!.frames.at(-1)!.visible).toBe(0);
 const nova=m.clips['frost-nova-burst-compact']!;expect(nova.frameCount).toBe(17);expect(nova.frames.at(-1)!.visible).toBe(0);
 expect(Math.max(...nova.frames.map(f=>f.visible))).toBeGreaterThan(nova.frames[0]!.visible*2);
 expect(Math.max(...nova.frames.map(f=>f.visible))).toBeLessThan(128*128/4);
});
it('exports independent native GIF and Aseprite animations with explicit preview timings',()=>{
 for(const c of Object.values(m.clips)){
  expect(c.playbackIndices).toEqual(c.loop?[1,2,3,4,5,6,7,8]:Array.from({length:c.frameCount},(_,i)=>i));
  const gif=readFileSync(root+'/'+c.gif);expect(gif.toString('ascii',0,6)).toMatch(/^GIF8[79]a$/);expect([gif.readUInt16LE(6),gif.readUInt16LE(8)]).toEqual([128,128]);expect(existsSync(root+'/'+c.gif.replace('.gif','.aseprite'))).toBe(true);
 }
 expect(m.clips['arcane-shield-loop']!.durationsMs.reduce((a,b)=>a+b,0)).toBe(720);
 expect(m.clips['arcane-shield-fade']!.durationsMs.reduce((a,b)=>a+b,0)).toBe(540);
 expect(m.clips['frost-nova-burst-compact']!.durationsMs.reduce((a,b)=>a+b,0)).toBe(1200);
});
