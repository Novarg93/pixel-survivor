import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {rgbaPng} from '../helpers/rgbaPng';
interface Clip{id:string;type:string;atlas:string;frames:Record<string,string[]>;durationsMs:number[]}
const root='art/generated/miniboss-animation-demo-v1';
const m=JSON.parse(readFileSync(root+'/manifest.json','utf8')) as {runtimeIntegration:boolean;counts:{currentClips:number;currentFrames:number;archiveClips:number;archiveFrames:number};atlases:Record<string,{image:string;frames:Record<string,{frame:{x:number;y:number;w:number;h:number}}> ;downloads:Record<string,{file:string;dataUrl:string}>}>;bosses:{id:string;clips:Clip[];archive:Clip[]}[];sources:Record<string,{sha256:string;copy?:string}>};
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
it('catalogues all301 current and216 archived atlas frames with no invented current hurt/death clips',()=>{
 expect(m.runtimeIntegration).toBe(false);expect(m.counts).toEqual({currentClips:22,currentFrames:301,archiveClips:32,archiveFrames:216});expect(m.bosses.map(b=>b.id)).toEqual(['charger','sorcerer','eclipse']);
 for(const [id,a]of Object.entries(m.atlases)){
  const used=new Set(m.bosses.flatMap(b=>[...b.clips,...b.archive].filter(c=>c.atlas===id).flatMap(c=>Object.values(c.frames).flat())));expect([...used].sort()).toEqual(Object.keys(a.frames).sort());
 }
 for(const b of m.bosses){expect(b.clips.some(c=>c.id==='idle')).toBe(true);expect(b.clips.some(c=>c.id==='walk')).toBe(true);expect(b.clips.some(c=>c.id==='death'||c.id==='hurt')).toBe(false);expect(b.archive.some(c=>c.id==='1-death')).toBe(true);}
});
it('copies runtime images without changing bytes and retains exact frame rectangles',()=>{
 for(const [file,s]of Object.entries(m.sources)){expect(hash(readFileSync(file)),file).toBe(s.sha256);if(s.copy)expect(readFileSync(root+'/'+s.copy).equals(readFileSync(file)),file).toBe(true);}
 for(const [id,a]of Object.entries(m.atlases)){
  const path=id==='archive'?'public/assets/hd/bosses.json':`public/assets/hd/${id}-v1/atlas.json`;expect(a.frames).toEqual(JSON.parse(readFileSync(path,'utf8')).frames);const atlas=rgbaPng(root+'/'+a.image);
  for(const [name,f]of Object.entries(a.frames)){const d=a.downloads[name]!,bytes=readFileSync(root+'/'+d.file),frame=rgbaPng(root+'/'+d.file),r=f.frame,pixels=Buffer.alloc(r.w*r.h*4);expect(d.dataUrl).toBe('data:image/png;base64,'+bytes.toString('base64'));for(let y=0;y<r.h;y++)atlas.pixels.copy(pixels,y*r.w*4,((r.y+y)*atlas.width+r.x)*4,((r.y+y)*atlas.width+r.x+r.w)*4);expect(pixels.equals(frame.pixels),name).toBe(true);}
 }
});
it('retains source timing, two facing directions, static idle aliases and the separate spell states',()=>{
 for(const b of m.bosses)for(const c of [...b.clips,...b.archive]){
  expect(c.durationsMs.length).toBeGreaterThan(0);expect(c.durationsMs.every(ms=>ms>0&&Number.isFinite(ms))).toBe(true);
  for(const facing of ['left','right'])expect(c.frames[facing]).toHaveLength(c.durationsMs.length);
 }
 const rune=m.bosses[1]!,astral=m.bosses[2]!;
 for(const b of [rune,astral])expect(b.clips.find(c=>c.id==='idle')!.frames.left[0]).toBe(b.clips.find(c=>c.id==='walk')!.frames.left[0]);
 expect(rune.clips.find(c=>c.id==='cast')!.durationsMs).toEqual(Array(12).fill(150));expect(astral.clips.find(c=>c.id==='cast')!.durationsMs).toEqual(Array(16).fill(150));
 for(const id of ['flame-appear','flame-idle','flame-spawn','volley-flight','volley-impact','volley-static'])expect(astral.clips.some(c=>c.id===id)).toBe(true);
});
