import {it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {rgbaPng} from '../helpers/rgbaPng';
interface Clip{variant:string;id:string;method:string;sheet:string;frameCount:number;loop:boolean;playbackIndices:number[];durationsMs:number[];pivot:number[];gif?:string;aseprite?:string;opacityFade?:boolean;frames:{file:string;sha256:string;pixelSHA256:string;visible:number;edge:number;centre:number}[]}
const root='art/generated/rune-warden-vfx-review-v1';
const m=JSON.parse(readFileSync(root+'/manifest.json','utf8')) as {runtimeIntegration:boolean;palette:string[];jobs:{id:string;tool:string;jobId:string;chargedGenerations:number;selected:boolean}[];chargedGenerations:number;clips:Record<string,Clip>};
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
it('separates original code-art, current assets and genuine PixelLab generation, retaining rejected candidates',()=>{
 expect(m.runtimeIntegration).toBe(true);expect(m.jobs).toHaveLength(9);expect(m.chargedGenerations).toBe(22);expect(m.jobs.filter(j=>!j.selected)).toHaveLength(4);
 expect(m.jobs.filter(j=>j.tool==='create_image_pro_flash')).toHaveLength(2);expect(m.jobs.filter(j=>j.tool==='animate_image_pixminimax')).toHaveLength(4);expect(m.jobs.filter(j=>j.tool==='animate_image')).toHaveLength(3);
 for(const j of m.jobs)expect(j.jobId).toMatch(/^[a-f\d-]{36}$/);expect(Object.keys(m.clips)).toHaveLength(12);
 expect(m.clips['code-projectile-flight']!.method).toBe('Original local code pixel art');expect(m.clips['ai-projectile-flight']!.method).toBe('PixelLab AI');
});
it('preserves all93 selected source frames exactly in fixed native128pixel sheets',()=>{
 let count=0;for(const c of Object.values(m.clips)){const sheet=rgbaPng(root+'/'+c.sheet);expect([sheet.width,sheet.height]).toEqual([128*c.frameCount,128]);
  for(const [i,f]of c.frames.entries()){const raw=rgbaPng(root+'/'+f.file),packed=Buffer.alloc(128*128*4);expect(hash(readFileSync(root+'/'+f.file))).toBe(f.sha256);expect(hash(raw.pixels)).toBe(f.pixelSHA256);for(let y=0;y<128;y++)sheet.pixels.copy(packed,y*512,(y*sheet.width+i*128)*4,(y*sheet.width+(i+1)*128)*4);expect(packed.equals(raw.pixels),f.file).toBe(true);count++;}
 }expect(count).toBe(93);
});
it('keeps local pixel art on a2pixel grid and keeps new runes hollow, endings transparent and selected AI free of cyan flashes',()=>{
 for(const [key,c]of Object.entries(m.clips)){
  if(c.variant==='current')continue;
  for(const f of c.frames){expect(f.edge,f.file).toBe(0);if(c.id.startsWith('blink'))expect(f.centre,f.file).toBe(0);const p=rgbaPng(root+'/'+f.file).pixels;
   if(c.variant==='code')for(let y=0;y<128;y+=2)for(let x=0;x<128;x+=2){const at=(y*128+x)*4;for(const offset of [4,512,516])if(!p.subarray(at,at+4).equals(p.subarray(at+offset,at+offset+4)))throw Error('Broken coarse pixel grid');}
   if(c.variant==='ai')for(let k=0;k<p.length;k+=4)if(p[k+3]&&p[k+1]!>p[k]!+30&&p[k+2]!>p[k]!+20)throw Error('Unexpected cyan flash '+key);
  }
  if((c.id==='projectile-impact'||c.id==='blink-fade')&&!c.opacityFade)expect(c.frames.at(-1)!.visible).toBe(0);
 }
 expect(m.clips['current-blink-idle']!.frames[0]!.centre).toBeGreaterThan(0);
});
it('exports individual GIF/Aseprite clips and skips only the AI input frame in live loops',()=>{
 for(const c of Object.values(m.clips)){expect(c.playbackIndices.length).toBe(c.durationsMs.length);expect(c.durationsMs.every(ms=>ms>0)).toBe(true);if(c.variant==='ai'&&!c.opacityFade)expect(c.playbackIndices).toEqual(c.loop?[1,2,3,4,5,6,7,8]:[0,1,2,3,4,5,6,7,8]);if(c.variant==='current'||c.opacityFade)continue;
  expect(existsSync(root+'/'+c.aseprite)).toBe(true);const gif=readFileSync(root+'/'+c.gif);expect(gif.toString('ascii',0,6)).toMatch(/^GIF8[79]a$/);expect([gif.readUInt16LE(6),gif.readUInt16LE(8)]).toEqual([128,128]);
 }
 expect(m.clips['code-blink-fade']!.durationsMs.reduce((a,b)=>a+b,0)).toBe(360);expect(m.clips['ai-blink-fade']!.durationsMs.reduce((a,b)=>a+b,0)).toBe(360);
});
