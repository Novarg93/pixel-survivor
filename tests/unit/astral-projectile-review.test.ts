import {warriorSoundsIntegration} from '../helpers/approvedWardenIntegration';
import {warriorUltimatesIntegration} from '../helpers/approvedWardenIntegration';
import {warriorBuffsIntegration} from '../helpers/approvedWardenIntegration';
import {warriorCleaveIntegration} from '../helpers/approvedWardenIntegration';
import {warriorSkillsIntegration} from '../helpers/approvedWardenIntegration';
import {warriorCombatIntegration} from '../helpers/approvedWardenIntegration';
import {warriorHeroIntegration} from '../helpers/approvedWardenIntegration';
import {visualCleanupIntegration,minibossAssetsIntegration,wardenIntegration,wardenApprovedHash,mageSfxIntegration,musicRuntimeIntegration,mageUploadedIntegration,wardenSoundsIntegration,arcaneShieldIntegration,frostNovaIntegration,fireUltimateIntegration,frostUltimateIntegration} from '../helpers/approvedWardenIntegration';
import {it,expect} from 'vitest';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {rgbaPng} from '../helpers/rgbaPng';
interface Clip{variant:string;id:string;method:string;sheet:string;frameCount:number;loop:boolean;playbackIndices:number[];durationsMs:number[];launchHold?:number;pivot:number[];size:number;gif:string;aseprite:string;frames:{file:string;sha256:string;pixelSHA256:string;visible:number;edge:number}[]}
const root='art/generated/astral-projectile-review-v1',m=JSON.parse(readFileSync(root+'/manifest.json','utf8')) as{runtimeIntegration:boolean;palette:string[];chargedGenerations:number;jobs:{id:string;tool:string;jobId:string;selected:boolean}[];clips:Record<string,Clip>};
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
function gifDuration(b:Buffer){let total=0,i=13+((b[10]!&128)?3*2**((b[10]!&7)+1):0);const skip=()=>{let n;while((n=b[i++]))i+=n;};while(i<b.length){const tag=b[i++];if(tag===0x3b)break;if(tag===0x21){const label=b[i++];if(label===0xf9)total+=b.readUInt16LE(i+2)*10;skip();}else if(tag===0x2c){const flags=b[i+8]!;i+=9;if(flags&128)i+=3*2**((flags&7)+1);i++;skip();}else throw Error('Unexpected GIF block');}return total;}
it('keeps two independent new variants, actual AI provenance and the rejected ring attempt, outside gameplay',()=>{
 expect(m.runtimeIntegration).toBe(true);expect(m.jobs).toHaveLength(4);expect(m.chargedGenerations).toBe(10);expect(m.jobs.filter(j=>!j.selected).map(j=>j.id)).toEqual(['projectile-impact']);
 expect(m.jobs.map(j=>j.tool)).toEqual(['create_image_pro_flash','animate_image_pixminimax','animate_image_pixminimax','animate_image']);for(const j of m.jobs)expect(j.jobId).toMatch(/^[a-f\d-]{36}$/);
 expect(Object.keys(m.clips)).toHaveLength(6);expect(m.clips['code-flight']!.method).toBe('Original local code pixel art');expect(m.clips['ai-flight']!.method).toBe('PixelLab AI');
});
it('packs all55 fixed128px source cels pixel-for-pixel, including AI hidden RGB, with no clipped new frames',()=>{
 let count=0;for(const c of Object.values(m.clips)){const s=rgbaPng(root+'/'+c.sheet);expect([s.width,s.height]).toEqual([128*c.frameCount,128]);
  for(const [i,f]of c.frames.entries()){const raw=rgbaPng(root+'/'+f.file),p=Buffer.alloc(65536);expect(hash(readFileSync(root+'/'+f.file))).toBe(f.sha256);expect(hash(raw.pixels)).toBe(f.pixelSHA256);for(let y=0;y<128;y++)s.pixels.copy(p,y*512,(y*s.width+i*128)*4,(y*s.width+(i+1)*128)*4);expect(p.equals(raw.pixels),f.file).toBe(true);if(c.variant!=='current')expect(f.edge,f.file).toBe(0);count++;}
 }expect(count).toBe(55);
});
it('preserves the local2px grid, stable pivots, generated AI loop, transparent endings and individual export files',()=>{
 const palette=new Set(m.palette.map(h=>h.toLowerCase()));
 for(const c of Object.values(m.clips)){
  expect(c.playbackIndices.length).toBe(c.durationsMs.length);expect(c.durationsMs.every(t=>t>0)).toBe(true);expect(c.pivot).toEqual(c.variant==='ai'?[75,62]:c.variant==='code'?[96,64]:[100,64]);
  if(c.variant==='code')for(const f of c.frames){const p=rgbaPng(root+'/'+f.file).pixels;for(let y=0;y<128;y+=2)for(let x=0;x<128;x+=2){const k=(y*128+x)*4;for(const offset of [4,512,516])if(!p.subarray(k,k+4).equals(p.subarray(k+offset,k+offset+4)))throw Error('Broken coarse pixel grid');if(p[k+3])expect(palette.has('#'+[...p.subarray(k,k+3)].map(v=>v.toString(16).padStart(2,'0')).join(''))).toBe(true);}}
  if(c.variant!=='current'&&c.id==='impact'){expect(c.durationsMs.reduce((a,b)=>a+b,0)).toBe(360);expect(c.frames.at(-1)!.visible).toBe(0);}
  expect(existsSync(root+'/'+c.aseprite)).toBe(true);const gif=readFileSync(root+'/'+c.gif);expect(gif.toString('ascii',0,6)).toMatch(/^GIF8[79]a$/);expect([gif.readUInt16LE(6),gif.readUInt16LE(8)]).toEqual([128,128]);expect(gifDuration(gif),c.gif).toBe(c.durationsMs.reduce((a,b)=>a+b,0)+(c.launchHold??0));
 }
 expect(m.clips['ai-flight']!.playbackIndices).toEqual([1,2,3,4,5,6,7,8]);expect(m.clips['current-impact']!.playbackIndices).toEqual([5,6,7]);
});
it('retains the initial preview proof and verifies the subsequently approved narrow integration scope',()=>{
 const baseline=JSON.parse(readFileSync(root+'/source/runtime-baseline.json','utf8')) as Record<string,string>;
 const walk=(d:string):string[]=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${d}/${e.name}`):[`${d}/${e.name}`]);
 const report=JSON.parse(readFileSync('art/generated/astral-projectile-runtime-v1/integration-verification.json','utf8')) as{changed:string[];added:string[];currentSHA256:Record<string,string>};
 const flame=JSON.parse(readFileSync('art/generated/astral-flame-runtime-v1/integration-verification.json','utf8')) as typeof report;expect(flame.changed).toHaveLength(2);expect(flame.added).toHaveLength(4);
 expect(Object.keys(baseline)).toHaveLength(337);expect(report.changed).toHaveLength(4);expect(report.added).toHaveLength(4);expect([...walk('src'),...walk('public')].sort()).toEqual([...Object.keys(baseline),...report.added,...flame.added,...wardenIntegration.added,...mageSfxIntegration.added,...musicRuntimeIntegration.added,...mageUploadedIntegration.added,...wardenSoundsIntegration.added,...arcaneShieldIntegration.added,...frostNovaIntegration.added,...fireUltimateIntegration.added,...frostUltimateIntegration.added,...minibossAssetsIntegration.added,...visualCleanupIntegration.added,...warriorHeroIntegration.added,...warriorCombatIntegration.added,...warriorSkillsIntegration.added,...warriorCleaveIntegration.added,...warriorBuffsIntegration.added,...warriorUltimatesIntegration.added,...warriorSoundsIntegration.added].sort());for(const [file,sha]of Object.entries(baseline))expect(hash(readFileSync(file)),file).toBe(wardenApprovedHash(file,flame.changed.includes(file)?flame.currentSHA256[file]!:report.changed.includes(file)?report.currentSHA256[file]!:sha));
 expect(JSON.parse(readFileSync(root+'/source/runtime-verification.json','utf8'))).toEqual({protectedFiles:337,changed:[],inventoryUnchanged:true,runtimeIntegration:false});
});
