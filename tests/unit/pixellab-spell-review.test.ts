import {expect,it} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {rgbaPng} from '../helpers/rgbaPng';
const root='art/generated/mage-spells-pixellab-ai-v1';
interface Clip{sheet:string;gif:string;model:string;sourceJobId:string;frameCount:number;generatedFrames:number;playbackIndices:number[];loop:boolean;frameMs:number;inputVisiblePixelsIdentical:boolean;frames:{file:string;sha256:string;pixelSHA256:string;visible:number;energy:number}[]}
const m=JSON.parse(readFileSync(root+'/manifest.json','utf8')) as {runtimeIntegration:boolean;chargedGenerations:number;provider:string;nativeCanvas:number;jobs:{id:string;tool:string;jobId:string;chargedGenerations:number}[];clips:Record<string,Clip>;preparation:string[]};
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
it('records actual PixelLab AI jobs for models and motion, including the retained impact candidate',()=>{
 expect(m.runtimeIntegration).toBe(true);expect(m.provider).toBe('PixelLab');expect(m.nativeCanvas).toBe(128);expect(m.jobs).toHaveLength(9);expect(m.chargedGenerations).toBe(25);
 expect(m.jobs.filter(j=>j.tool==='create_image_pro_flash')).toHaveLength(3);expect(m.jobs.filter(j=>j.tool==='animate_image_pixminimax')).toHaveLength(5);expect(m.jobs.filter(j=>j.tool==='animate_image')).toHaveLength(1);
 for(const job of m.jobs){expect(job.jobId).toMatch(/^[a-f\d-]{36}$/);expect(job.chargedGenerations).toBeGreaterThan(0);}
 expect(m.clips['meteor-impact']!.sourceJobId).not.toBe(m.clips['meteor-impact-first']!.sourceJobId);
});
it('packs all 54 original native frames without altering a visible or hidden pixel',()=>{
 let count=0;
 for(const clip of Object.values(m.clips)){
  const sheet=rgbaPng(root+'/'+clip.sheet);expect([sheet.width,sheet.height]).toEqual([1152,128]);expect(clip.frameCount).toBe(9);expect(clip.generatedFrames).toBe(8);
  for(const [i,f]of clip.frames.entries()){
   const bytes=readFileSync(root+'/'+f.file),original=rgbaPng(root+'/'+f.file),packed=Buffer.alloc(128*128*4);expect(hash(bytes)).toBe(f.sha256);expect(hash(original.pixels)).toBe(f.pixelSHA256);
   for(let y=0;y<128;y++)sheet.pixels.copy(packed,y*512,(y*1152+i*128)*4,(y*1152+(i+1)*128)*4);
   expect(packed.equals(original.pixels),f.file).toBe(true);count++;
  }
 }
 expect(count).toBe(54);
});
it('keeps native input appearance, transparent spells and the intentional black light pass',()=>{
 for(const [id,c]of Object.entries(m.clips)){
  const model=rgbaPng(`${root}/raw/${c.model}/00.png`),input=rgbaPng(root+'/'+c.frames[0]!.file);expect(c.inputVisiblePixelsIdentical).toBe(true);
  for(let k=0;k<model.pixels.length;k+=4){if(model.pixels[k+3]!==input.pixels[k+3]||(model.pixels[k+3]&&model.pixels.subarray(k,k+4).some((v,n)=>v!==input.pixels[k+n])))throw Error('Input appearance changed: '+id);}
  if(id!=='landing-light-fade')expect(c.frames[0]!.visible).toBeLessThan(128*128/2);
 }
 const light=m.clips['landing-light-fade']!;expect(light.frames[0]!.energy).toBeGreaterThan(light.frames[8]!.energy);
 // PixelLab approximated the black pin by a uniform RGB(3,2,2); preserve it.
 const end=rgbaPng(root+'/'+light.frames[8]!.file);for(let i=0;i<end.pixels.length;i+=4)if(!end.pixels.subarray(i,i+4).equals(Buffer.from([3,2,2,255])))throw Error('Unexpected lighting endpoint');
});
it('exports separate GIF/Aseprite assets and uses only generated loop frames for playback',()=>{
 for(const c of Object.values(m.clips)){
  expect(c.playbackIndices).toEqual(c.loop?[1,2,3,4,5,6,7,8]:[0,1,2,3,4,5,6,7,8]);expect(c.frameMs).toBeGreaterThan(0);
  const gif=readFileSync(root+'/'+c.gif);expect(gif.toString('ascii',0,6)).toMatch(/^GIF8[79]a$/);expect([gif.readUInt16LE(6),gif.readUInt16LE(8)]).toEqual([128,128]);expect(existsSync(root+'/'+c.gif.replace('.gif','.aseprite'))).toBe(true);
 }
});
